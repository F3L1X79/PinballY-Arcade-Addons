// ============================================================
// Profile Reset menus: the list of every Profile (Guest and the active one
// included), then one confirmation naming the chosen Profile, cursor on
// "No"; "Yes" resets it through the Profile store, then a one-line message
// with "OK" tells whether it worked (the cause of a failure goes to the log
// only). Opened from PinballY's Exit menu, so every menu opens directly, not
// through the wheel dialog module: the player asked for them. Listens to
// "command".
// ============================================================

import lang from "./i18n.js";
import { displayNameOf } from "./profile_name.js";
import { logHandlerError, safeHandler } from "./safe_handler.js";

const SCRIPT_NAME = "ProfileReset";
const LIST_MENU_ID = "profileResetList";
const CONFIRM_MENU_ID = "profileResetConfirm";
const OUTCOME_MENU_ID = "profileResetOutcome";

export function createProfileResetMenu(host, profileStore) {
    const { profileReset: TEXT } = lang;
    const yesCommand = host.allocateCommand("profileResetYes");
    const cancelCommand = host.getBuiltInCommand("MenuReturn");
    // One command per line of the list, by position, allocated on demand:
    // the household can grow while PinballY runs.
    const profileCommands = [];
    // The Profiles of the list on screen, then the one the confirmation names.
    let listedProfiles = [];
    let profileToReset = null;

    function getProfileCommand(index) {
        while (profileCommands.length <= index) {
            profileCommands.push(host.allocateCommand(`profileResetProfile${profileCommands.length}`));
        }
        return profileCommands[index];
    }

    function open() {
        listedProfiles = profileStore.listProfiles();
        host.showMenu(LIST_MENU_ID, [
            { title: TEXT.listTitle, cmd: -1 },
            { cmd: -1 },
            ...listedProfiles.map((profile, index) => ({ title: displayNameOf(profile), cmd: getProfileCommand(index) })),
            { cmd: -1 },
            { title: TEXT.cancel, cmd: cancelCommand },
        ]);
    }

    function confirm(profile) {
        profileToReset = profile;
        host.showMenu(CONFIRM_MENU_ID, [
            { title: TEXT.confirm(displayNameOf(profile)), cmd: -1 },
            { cmd: -1 },
            { title: TEXT.yes, cmd: yesCommand },
            { title: TEXT.no, cmd: cancelCommand, selected: true },
        ], { dialogStyle: true });
    }

    // Resets the Profile, then shows the outcome: a failure is caught here,
    // not by safeHandler, for the player to see it; its cause goes to the log.
    function resetAndReport(profile) {
        const shownName = displayNameOf(profile);
        let message;
        try {
            profileStore.resetProfile(profile.name);
            message = TEXT.done(shownName);
        } catch (error) {
            logHandlerError(SCRIPT_NAME, error);
            message = TEXT.failed(shownName);
        }
        host.showMenu(OUTCOME_MENU_ID, [
            { title: message, cmd: -1 },
            { cmd: -1 },
            { title: TEXT.ok, cmd: cancelCommand, selected: true },
        ], { dialogStyle: true });
    }

    // Fires on every command: a Profile of the list asks for confirmation,
    // "Yes" resets it and shows the outcome.
    host.on("command", safeHandler(SCRIPT_NAME, ev => {
        const index = profileCommands.indexOf(ev.id);
        if (index >= 0 && index < listedProfiles.length) {
            confirm(listedProfiles[index]);
        } else if (ev.id === yesCommand && profileToReset) {
            const profile = profileToReset;
            profileToReset = null;
            resetAndReport(profile);
        }
    }));

    return { open };
}

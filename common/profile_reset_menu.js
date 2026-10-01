// ============================================================
// Profile Reset menus: the list of every Profile (Guest and the active one
// included), then one confirmation naming the chosen Profile, cursor on
// "No"; "Yes" resets it through the Profile store. Opened from PinballY's
// Exit menu, so both menus open directly, not through the wheel dialog
// module: the player asked for them. Listens to "command".
// ============================================================

import lang from "./i18n.js";
import { displayNameOf } from "./profile_name.js";
import { safeHandler } from "./safe_handler.js";

const SCRIPT_NAME = "ProfileReset";
const LIST_MENU_ID = "profileResetList";
const CONFIRM_MENU_ID = "profileResetConfirm";

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

    // Fires on every command: a Profile of the list asks for confirmation,
    // "Yes" resets it.
    host.on("command", safeHandler(SCRIPT_NAME, ev => {
        const index = profileCommands.indexOf(ev.id);
        if (index >= 0 && index < listedProfiles.length) {
            confirm(listedProfiles[index]);
        } else if (ev.id === yesCommand && profileToReset) {
            const { name } = profileToReset;
            profileToReset = null;
            profileStore.resetProfile(name);
        }
    }));

    return { open };
}

// ============================================================
// Profile store: the only module that knows the Profiles folder
// (Scripts\profiles). Each Profile is a sub-folder named after it, with its
// Avatar and its profile.json; cabinet.json, next to them, holds what the
// household shares: the active Profile and the Period Table locks. Files
// are read at startup and on each switch, kept in memory, and rewritten
// whole on every change (tmp, backup, rename). A broken file comes back
// from its backup, or is set aside under a dated name when the backup is
// broken too; every such problem is logged to logfile.log. A Profile's
// marks (isAdmin), set by hand in its profile.json, are read and kept
// through every rewrite, never written.
// Listens to "gamestarted" / "gameover" to record every finished game for
// the Profile active when it started; at startup, creates the Guest folder
// and writes cabinet.json when they are missing. Tells its listeners of
// every switch (onSwitch) and every saved change of a Profile's data
// (onUpdate).
// ============================================================

import { safeHandler, logHandlerError } from "./safe_handler.js";
import { createPinballYHost } from "./pinbally_host.js";

const SCRIPT_NAME = "ProfileStore";

// Also the folder name; any letter case is Guest.
const GUEST_NAME = "guest";
// Bumped when a shape change needs an older file migrated; a new domain or
// session stat needs no bump, since a missing one is read as empty.
const PROFILE_VERSION = 1;
const CABINET_VERSION = 1;
// Still images only: PinballY keeps an animated image locked while it shows it.
const AVATAR_FILES = ["avatar.png", "avatar.jpg"];

const isGuestName = name => name.toLowerCase() === GUEST_NAME;
// A player parks or hides a Profile by renaming its folder.
const isIgnoredFolder = name => name.startsWith(".") || name.startsWith("_");
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();
const pad = number => String(number).padStart(2, "0");

// Local time, readable in the file: "2026-09-24T21:10:00".
function toLocalIsoString(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
        + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// For a file name, where ":" is not allowed: "2026-09-24_21-10-00".
const toFileDate = date => toLocalIsoString(date).replace("T", "_").replace(/:/g, "-");

// The session stats: shortestSeconds stays 0 until a first timed game.
const emptySessions = () => ({
    longestSeconds: 0,
    shortestSeconds: 0,
    rageQuit: false,
    grandReturn: false,
    dayManufacturers: { day: "", list: [] },
    mostManufacturersInADay: 0,
});
const emptyProfileData = () => ({
    version: PROFILE_VERSION, plays: {}, streaks: {}, randomGames: 0, sessions: emptySessions(), notified: [],
});
const NO_PLAY = Object.freeze({ count: 0, seconds: 0, lastPlayed: "" });

export function createProfileStore(host) {
    const scriptsFolder = `${host.getProgramFolder().replace(/\\+$/, "")}\\Scripts`;
    const profilesFolder = `${scriptsFolder}\\profiles`;
    const defaultAvatarPath = `${scriptsFolder}\\assets\\default_avatar.png`;
    const files = host.files;
    const switchListeners = [];
    const updateListeners = [];
    const log = text => host.log(`[${SCRIPT_NAME}] ${text}`);
    // Logged once per session: the picker lists the Profiles on every opening.
    const loggedUnreadableAvatars = new Set();
    // Logged once per session too: the menus check the marks on every opening.
    const loggedMarkProblems = new Set();

    // The first readable one of the Profile's own Avatars, otherwise the default Avatar.
    function avatarPathOf(folder) {
        for (const path of AVATAR_FILES.map(name => `${folder}\\${name}`)) {
            if (!files.fileExists(path)) continue;
            if (files.isImageReadable(path)) return path;
            if (!loggedUnreadableAvatars.has(path)) {
                loggedUnreadableAvatars.add(path);
                log(`${path} is not a readable PNG or JPEG image; showing the default Avatar.`);
            }
        }
        return defaultAvatarPath;
    }

    function profileAt(folderName) {
        const folder = `${profilesFolder}\\${folderName}`;
        return { name: folderName, isGuest: isGuestName(folderName), folder, avatarPath: avatarPathOf(folder) };
    }

    // Guest first, then the others alphabetically. Re-read on every call, so a folder added while
    // PinballY runs shows up.
    function listProfileNames() {
        const folderNames = files.listFolders(profilesFolder).filter(name => !isIgnoredFolder(name));
        const others = folderNames.filter(name => !isGuestName(name)).sort((a, b) => a.localeCompare(b));
        return [folderNames.find(isGuestName) || GUEST_NAME, ...others];
    }
    const listProfileRecords = () => listProfileNames().map(profileAt);

    // Only the found Profile's Avatar is checked: each check draws a probe layer.
    function findProfile(name) {
        const folderName = listProfileNames().find(folder => sameName(folder, name));
        return folderName === undefined ? null : profileAt(folderName);
    }

    // The file's data, or null when it is missing, not JSON or not an object;
    // the cause of an unreadable file is logged here, its outcome by the caller.
    function tryReadJson(path) {
        if (!files.fileExists(path)) return null;
        try {
            const data = JSON.parse(files.readText(path));
            if (isRecord(data)) return data;
            log(`${path} does not hold a JSON object.`);
        } catch (error) {
            log(`${path} cannot be read: ${error.message}`);
        }
        return null;
    }

    // Renames a broken file to "<name>.broken-<date>.json" next to it, for
    // the player to repair; returns the new file name.
    function setAside(folder, name) {
        const baseName = `${name}.broken-${toFileDate(host.now())}`;
        let asideName = `${baseName}.json`;
        for (let copy = 2; files.fileExists(`${folder}\\${asideName}`); copy++) asideName = `${baseName}-${copy}.json`;
        files.renameFile(`${folder}\\${name}.json`, `${folder}\\${asideName}`);
        return asideName;
    }

    // The saved data, or null for a file never saved. A missing or broken
    // file comes back from its readable backup; when the backup is broken
    // too, both are set aside and the file starts from zero (null). A
    // broken file is set aside, never deleted: it may hold a hand edit.
    function loadJson(folder, baseName, label) {
        const path = `${folder}\\${baseName}.json`;
        const backupPath = `${folder}\\${baseName}.bak.json`;
        const data = tryReadJson(path);
        if (data) return data;
        const hasFile = files.fileExists(path);
        if (!hasFile && !files.fileExists(backupPath)) return null;

        const brokenFile = hasFile ? setAside(folder, baseName) : null;
        const backup = tryReadJson(backupPath);
        if (backup) {
            saveJson(folder, baseName, backup);
            log(`${label} is missing or unreadable; restored from its backup`
                + `${brokenFile ? ` (broken file kept as ${brokenFile})` : ""}.`);
            return backup;
        }
        const asideFiles = brokenFile ? [brokenFile] : [];
        if (files.fileExists(backupPath)) asideFiles.push(setAside(folder, `${baseName}.bak`));
        log(`${label} and its backup are unreadable; kept aside as ${asideFiles.join(" and ")}, starting from zero.`);
        return null;
    }

    // Writes "<name>.tmp.json", renames the current file to "<name>.bak.json"
    // (replacing the older backup), then renames the tmp file into place: a
    // crash at any point leaves a readable file or its backup.
    function saveJson(folder, baseName, data) {
        const path = `${folder}\\${baseName}.json`;
        const tmpPath = `${folder}\\${baseName}.tmp.json`;
        const backupPath = `${folder}\\${baseName}.bak.json`;
        files.createFolder(profilesFolder);
        files.createFolder(folder);
        files.writeText(tmpPath, JSON.stringify(data, null, 2));
        if (files.fileExists(path)) {
            if (files.fileExists(backupPath)) files.deleteFile(backupPath);
            files.renameFile(path, backupPath);
        }
        files.renameFile(tmpPath, path);
    }

    // A file saved before a domain or a session stat existed gets it empty.
    function readProfileData(profile) {
        const saved = loadJson(profile.folder, "profile", `${profile.name}\\profile.json`) || {};
        return { ...emptyProfileData(), ...saved, sessions: { ...emptySessions(), ...saved.sessions } };
    }
    const saveProfileData = (profile, data) => saveJson(profile.folder, "profile", data);
    const saveCabinet = () => saveJson(profilesFolder, "cabinet", cabinet);

    // Guest always exists: its folder ships with the add-ons and comes back
    // at startup if a player deleted it.
    files.createFolder(profilesFolder);
    files.createFolder(findProfile(GUEST_NAME).folder);

    const savedCabinet = loadJson(profilesFolder, "cabinet", "cabinet.json");
    const cabinet = savedCabinet || { version: CABINET_VERSION, activeProfile: GUEST_NAME };
    let activeProfile = typeof cabinet.activeProfile === "string" ? findProfile(cabinet.activeProfile) : null;
    const activeFolderMissing = !activeProfile;
    if (activeFolderMissing) {
        log(`The active Profile "${cabinet.activeProfile}" has no folder in ${profilesFolder}; Guest is active.`);
        activeProfile = findProfile(GUEST_NAME);
        cabinet.activeProfile = activeProfile.name;
    }
    let activeData = readProfileData(activeProfile);
    if (!savedCabinet || activeFolderMissing) saveCabinet();

    const publicProfile = ({ name, isGuest, avatarPath }) => ({ name, isGuest, avatarPath });

    // The named Profile and its data: the active one's from memory, another
    // one's read afresh from its file.
    function profileWithData(profileName) {
        if (sameName(profileName, activeProfile.name)) return { profile: activeProfile, data: activeData };
        const profile = findProfile(profileName);
        if (!profile) throw new Error(`No Profile named "${profileName}".`);
        return { profile, data: readProfileData(profile) };
    }

    // Changes the data of the named Profile (the active one by default) and
    // saves it.
    function updateProfileData(change, profileName = activeProfile.name) {
        const { profile, data } = profileWithData(profileName);
        change(data);
        saveProfileData(profile, data);
        // Saved already: one failing listener must not keep the others
        // from hearing of it.
        for (const listener of updateListeners) {
            try {
                listener(profile.name);
            } catch (error) {
                logHandlerError(SCRIPT_NAME, error);
            }
        }
    }

    function logMarkProblemOnce(problemLine) {
        if (loggedMarkProblems.has(problemLine)) return;
        loggedMarkProblems.add(problemLine);
        log(problemLine);
    }

    // A mark set by hand (ADR 0006) counts only when it is true on a Profile
    // other than Guest; any other value is logged and read as false, but kept
    // in the file for the player to fix. A key that differs from the mark by
    // its letter case or spaces only is a typo: logged too, never read.
    function markOf(profile, data, markName) {
        const looseName = markName.toLowerCase();
        for (const key of Object.keys(data)) {
            if (key !== markName && key.replace(/\s/g, "").toLowerCase() === looseName) {
                logMarkProblemOnce(`${profile.name}\\profile.json: ${JSON.stringify(key)} is ignored; did you mean "${markName}"?`);
            }
        }
        const value = data[markName];
        if (value === undefined || value === false) return false;
        let problem = null;
        if (profile.isGuest) problem = `Guest is never marked "${markName}"`;
        else if (typeof value !== "boolean") problem = `"${markName}" must be true or false, not ${JSON.stringify(value)}`;
        if (!problem) return true;
        logMarkProblemOnce(`${profile.name}\\profile.json: ${problem}; read as false.`);
        return false;
    }

    const isAdmin = (profileName = activeProfile.name) => {
        const { profile, data } = profileWithData(profileName);
        return markOf(profile, data, "isAdmin");
    };

    function switchTo(name) {
        const profile = findProfile(name);
        if (!profile) throw new Error(`No Profile named "${name}".`);
        const data = readProfileData(profile);
        activeProfile = profile;
        activeData = data;
        cabinet.activeProfile = profile.name;
        saveCabinet();
        // The switch is already saved: one failing listener must not keep
        // the others from hearing of it.
        for (const listener of switchListeners) {
            try {
                listener(publicProfile(activeProfile));
            } catch (error) {
                logHandlerError(SCRIPT_NAME, error);
            }
        }
    }

    // The Profile active at "gamestarted" and when the game started, by table.
    const runningGames = new Map();

    // Fires on table launch.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, ev => {
        runningGames.set(ev.game.configId, { profileName: activeProfile.name, startMs: host.now().getTime() });
    }));

    // Fires on table exit: one play, and its seconds when its start is
    // known, as PinballY counts them.
    host.on("gameover", safeHandler(SCRIPT_NAME, ev => {
        const { configId } = ev.game;
        const now = host.now();
        const running = runningGames.get(configId);
        runningGames.delete(configId);
        const seconds = running ? Math.round((now.getTime() - running.startMs) / 1000) : 0;

        updateProfileData(data => {
            const play = data.plays[configId] || NO_PLAY;
            data.plays[configId] = {
                count: play.count + 1,
                seconds: play.seconds + seconds,
                lastPlayed: toLocalIsoString(now),
            };
        }, running ? running.profileName : activeProfile.name);
    }));

    return {
        listProfiles: () => listProfileRecords().map(publicProfile),
        // The same Profiles by name only, without checking their Avatars.
        listProfileNames,
        getActiveProfile: () => ({ ...publicProfile(activeProfile), data: activeData }),
        switchTo,
        getProfileData: () => activeData,
        // The active Profile's play record of a table, all zero when never played.
        getPlay: (configId) => activeData.plays[configId] || NO_PLAY,
        hasPlayed: (configId) => (activeData.plays[configId] || NO_PLAY).count > 0,
        // Every play record of the named Profile, by table.
        getPlaysOf: (profileName) => profileWithData(profileName).data.plays,
        // The IDs of the Achievements the named Profile was Notified of.
        getNotifiedOf: (profileName) => profileWithData(profileName).data.notified,
        updateProfileData,
        // Whether the named Profile (the active one by default) is an Admin Profile.
        isAdmin,
        // Whether any Profile is an Admin Profile; re-read on every call, so a hand edit shows up.
        // Guest is skipped since it never counts: reading it would only log its mark on every menu opening.
        hasAdminProfile: () => listProfileNames().filter(name => !isGuestName(name)).some(isAdmin),
        getCabinetData: () => cabinet,
        updateCabinetData: (change) => {
            change(cabinet);
            saveCabinet();
        },
        onSwitch: (listener) => { switchListeners.push(listener); },
        // listener(profileName): after any change of a Profile's data is saved.
        onUpdate: (listener) => { updateListeners.push(listener); },
    };
}

let sharedProfileStore = null;

// One store for every Add-on, so they all see the same active Profile.
export function getProfileStore() {
    if (!sharedProfileStore) sharedProfileStore = createProfileStore(createPinballYHost());
    return sharedProfileStore;
}

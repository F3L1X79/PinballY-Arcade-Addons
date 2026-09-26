// ============================================================
// Player settings for the PinballY scripts in this project, with neutral
// defaults. Each player overrides them in a git-ignored .env.local at the
// project root (copy .env.example), read synchronously at load time; the
// overridden keys and any invalid line are written to the PinballY log.
// ============================================================

import { applyEnvOverrides } from "./env_overrides.js";

const DEFAULTS = {
    // --- Set these for your setup ---

    // Interface language: "en", "fr", "de", "es", "it" or "pt".
    language: "en",
    // ABSOLUTE path to the sound played when a table launches. Empty = no sound.
    launchSoundFile: "",
    // ABSOLUTE path to the sound played with each Achievement Toast. Empty = no sound.
    achievementSoundFile: "",
    // ABSOLUTE path to the sound played with each Profile Greeting. Empty = no sound.
    profileGreetingSoundFile: "",
    // Manufacturer name you gave fictional/community VPX tables in PinballY.
    // Used by the status line and the "Original Tables" filter.
    communityTablesManufacturer: "VPX Community",

    // --- Optional preferences ---

    // true = the random game jumps straight to the table, without the wheel animation.
    skipRandomGameAnimation: false,
    // Total play time (in minutes) on a table before you're asked to rate it.
    askToRateAfterMinutesPlayed: 60,
    // Seconds an Achievement Toast stays fully visible (above 0, at most 60).
    achievementToastSeconds: 4,
    // Size of an Achievement Toast: 1 = the original card, 2 = twice as large (from 0.5 to 3).
    achievementToastScale: 1.0,

    // --- Add-ons ---

    // Set any Add-on to false to keep it from starting.
    addOns: {
        uiTranslation: true,
        statusLineInfo: true,
        startupChoicePrompt: true,
        forceBackglass: true,
        customMenuCommands: true,
        customFilter: true,
        hallOfFame: true,
        sessionStatsTracker: true,
        achievements: true,
        seamlessLaunchOverlay: true,
        playLaunchSound: true,
        ratingPrompt: true,
        profilePicker: true,
        clock: true,
        challenges: true,
    },
};

const LOG_PREFIX = "[Config]";
const ADODB_TEXT_TYPE = 2;
const ADODB_READ_ALL = -1;

// Returns the text of .env.local, or null when there is none. Read through
// COM (not an async API) because modules read the configuration while they
// load; ADODB.Stream decodes UTF-8, so accented paths survive.
function readEnvLocal() {
    const folder = systemInfo.programDir.replace(/\\+$/, "");
    const path = `${folder}\\Scripts\\.env.local`;

    const fileSystem = createAutomationObject("Scripting.FileSystemObject");
    if (!fileSystem.FileExists(path)) return null;

    const stream = createAutomationObject("ADODB.Stream");
    stream.Type = ADODB_TEXT_TYPE;
    stream.Charset = "utf-8";
    stream.Open();
    try {
        stream.LoadFromFile(path);
        return stream.ReadText(ADODB_READ_ALL);
    } finally {
        stream.Close();
    }
}

function loadConfig() {
    // Under Node (tests) there is no COM: the defaults apply.
    if (typeof createAutomationObject !== "function") return DEFAULTS;

    let text;
    try {
        text = readEnvLocal();
    } catch (error) {
        logfile.log(`${LOG_PREFIX} ERROR reading .env.local, using defaults: ${error.message}`);
        return DEFAULTS;
    }
    if (text === null) {
        logfile.log(`${LOG_PREFIX} No .env.local found; using defaults.`);
        return DEFAULTS;
    }

    const { config, overridden, problems } = applyEnvOverrides(DEFAULTS, text);
    logfile.log(`${LOG_PREFIX} .env.local overrides: ${overridden.length > 0 ? overridden.join(", ") : "none"}.`);
    for (const problem of problems) {
        logfile.log(`${LOG_PREFIX} .env.local ${problem}; ignored.`);
    }
    return config;
}

export default loadConfig();

// ============================================================
// Confetti Shower tests' scenario: main.js on the fake globals, 26 Williams
// tables of the 1990s, 25 played by Guest. Playing the last one unlocks
// three Platinums at once (collection, Williams, 1990s). Reads the confetti
// layers. Never loaded by PinballY.
// ============================================================

import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import { CONFETTI_Z_INDEX } from "../common/confetti_shower.js";
import config from "../common/config.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);
const GUEST_PROFILE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\guest\\profile.json";
const TABLE_COUNT = 26;
// Longer than a Play's minimum.
const GAME_MS = 2 * 60 * 1000;

export const TABLES = Array.from({ length: TABLE_COUNT }, (_, index) => ({
    id: index + 1, configId: `Table ${index + 1} (Williams 1995)`, title: `Table ${index + 1}`,
    manufacturer: "Williams", year: 1995, categories: [],
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
}));
export const LAST_TABLE = TABLES[TABLE_COUNT - 1];

// The main-window layers of the Confetti Shower.
export const confettiLayers = fake => fake.drawingLayers().filter(layer => layer.zIndex === CONFETTI_Z_INDEX);
export const visibleConfettiCount = fake => confettiLayers(fake).filter(layer => layer.alpha > 0).length;
export const showerStartLogs = fake => fake.logLines().filter(line => line.startsWith("[ConfettiShower] Started"));

// confetti: the CONFETTI setting.
export async function startScenario({ confetti = true } = {}) {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    const plays = Object.fromEntries(TABLES.slice(0, TABLE_COUNT - 1).map(table =>
        [table.configId, { count: 1, seconds: 600, lastPlayed: "2026-09-01T20:00:00" }]));
    fake.addFile(GUEST_PROFILE_FILE, JSON.stringify({ version: 1, plays, notified: [] }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "achievements";
    config.language = "en";
    config.confetti = confetti;

    await import("../main.js");
    await settle();
    return fake;
}

// Advances by steps of stepMs, calling onStep after each, until it returns
// true (then returns the elapsed ms) or maxMs runs out (then returns null).
export function advanceUntil(fake, { stepMs, maxMs }, onStep) {
    for (let elapsedMs = stepMs; elapsedMs <= maxMs; elapsedMs += stepMs) {
        fake.advanceTime(stepMs);
        if (onStep(elapsedMs)) return elapsedMs;
    }
    return null;
}

// Plays the last table for a whole Play and returns to the wheel; the
// Platinum Achievements are checked once the deferred check has run.
// duringGame runs while the game is on, after its time has passed.
export async function playLastTable(fake, duringGame = () => {}) {
    fake.playGame(LAST_TABLE);
    fake.gameStarted(LAST_TABLE);
    await settle();
    fake.advanceTime(GAME_MS);
    duringGame();
    fake.gameOver(LAST_TABLE);
    await settle();
}

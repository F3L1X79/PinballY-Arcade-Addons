// ============================================================
// CONFETTI=false, through main.js on the fake PinballY globals: the toasts
// of the Platinum Achievements still show, but no confetti layer is ever
// prepared or drawn.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { toastDrawings } from "./achievement_toast_reader.js";
import { startScenario, playLastTable, confettiLayers } from "./confetti_shower_scenario.js";

// Drawing ahead and every toast, rise, hold and fade.
const ALL_TOASTS_MS = 30000;

test("CONFETTI=false: the Platinum toasts show, with no confetti layer", async () => {
    const fake = await startScenario({ confetti: false });
    fake.advanceTime(ALL_TOASTS_MS);
    const startupToastCount = toastDrawings(fake).length;

    await playLastTable(fake);
    fake.advanceTime(ALL_TOASTS_MS);

    assert.ok(toastDrawings(fake).length - startupToastCount >= 3, "the Platinum toasts still show");
    assert.deepEqual(confettiLayers(fake), [], "no confetti layer prepared or drawn");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});

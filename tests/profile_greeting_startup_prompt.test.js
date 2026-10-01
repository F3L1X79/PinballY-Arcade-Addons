// ============================================================
// Startup Profile Greeting, through main.js on the fake PinballY globals,
// with the startup prompt on: the prompt already greets the Profile by
// name, so no greeting shows at startup, neither over the prompt nor after
// it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const PICKER_Z = 6500;

const pickerTexts = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex === PICKER_Z && layer.alpha > 0)
    .flatMap(layer => layer.texts());

test("with the startup prompt on, no greeting shows at startup", async () => {
    const fake = createFakePinballYHost();
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "profilePicker" || key === "startupChoicePrompt";
    }
    config.language = "en";

    await import("../main.js");
    await settle();
    fake.advanceTime(1000);
    assert.equal(fake.currentMenu().id, "startupChoicePrompt");
    assert.deepEqual(pickerTexts(fake), [], "never over the startup prompt");

    fake.closeMenu();
    await settle();
    fake.advanceTime(1000);
    assert.deepEqual(pickerTexts(fake), [], "nor after it");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});

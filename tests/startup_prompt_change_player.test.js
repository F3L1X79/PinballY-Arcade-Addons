// ============================================================
// Startup prompt with the Profile picker on, through main.js on the fake
// PinballY globals: "Change Player" is its second choice, right under
// "Stay", and opens the carousel on the active Profile; picking a Profile
// there switches to it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
// The carousel's background, its Avatars, then the gold frame and names.
const PICKER_Z_RANGE = [6500, 6502];
const GLIDE_OVER_MS = 500;

const pickerTexts = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex >= PICKER_Z_RANGE[0] && layer.zIndex <= PICKER_Z_RANGE[1] && layer.alpha > 0)
    .flatMap(layer => layer.texts());
const press = (fake, buttonCommand) => fake.fire("commandbuttondown", { command: buttonCommand, repeat: false });

test("the startup prompt offers Change Player second, which opens the carousel", async () => {
    const fake = createFakePinballYHost();
    for (const name of ["Alice", "Bob"]) fake.addFolder(`${PROFILES_FOLDER}\\${name}`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "startupChoicePrompt" || key === "profilePicker";
    }
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    await import("../main.js");
    await settle();

    const prompt = fake.currentMenu();
    assert.equal(prompt.id, "startupChoicePrompt");
    const choices = prompt.items.filter(item => item.cmd !== -1).map(item => item.title);
    assert.deepEqual(choices.slice(0, 2), [lang.startupPrompt.stayOnLastPlayed, lang.profiles.menuEntry]);

    fake.selectMenuItem(lang.profiles.menuEntry);
    await settle();
    assert.ok(pickerTexts(fake).includes("Bob"), "the carousel opens on the active Profile");

    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Select");
    assert.equal(getProfileStore().getActiveProfile().name, "Alice");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});

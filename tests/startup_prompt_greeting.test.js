// ============================================================
// Startup prompt, through main.js on the fake PinballY globals: its
// message greets the active Profile by name.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

test("the startup prompt greets the active Profile by name", async () => {
    const fake = createFakePinballYHost();
    fake.addFolder(`${PROFILES_FOLDER}\\Chloé`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Chloé" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "fr";

    await import("../main.js");
    await settle();

    const prompt = fake.currentMenu();
    assert.equal(prompt.id, "startupChoicePrompt");
    assert.match(prompt.items[0].title, /Chloé/);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});

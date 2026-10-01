// ============================================================
// Profile picker turned off in addOns, through main.js on the fake
// PinballY globals: neither the main menu nor the startup prompt has a
// "Change player" entry, and cabinet.json is not rewritten when Guest is
// already active.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\profiles";

test("turning the Profile picker off removes its main-menu and startup prompt entries", async () => {
    const fake = createFakePinballYHost();
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "guest" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    // Not the Challenges Add-on either: it locks the week's Challenge in
    // cabinet.json at startup, for Guest too.
    for (const key of Object.keys(config.addOns)) config.addOns[key] = !["profilePicker", "challenges"].includes(key);
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    await import("../main.js");
    await settle();

    assert.equal(fake.currentMenu().id, "startupChoicePrompt");
    const promptTitles = fake.currentMenu().items.map(item => item.title);
    assert.ok(!promptTitles.includes(lang.profiles.menuEntry));

    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    const titles = fake.currentMenu().items.map(item => item.title);
    assert.ok(titles.length > 1, "the other Add-ons' entries are there");
    assert.ok(!titles.includes(lang.profiles.menuEntry));

    // Guest was already active: no switch to save.
    const cabinetWrites = fake.fileOperations().filter(({ path }) => path.startsWith(`${PROFILES_FOLDER}\\cabinet`));
    assert.deepEqual(cabinetWrites, []);
});

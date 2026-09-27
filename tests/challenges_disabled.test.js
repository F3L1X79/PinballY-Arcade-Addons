// ============================================================
// With the Challenges Add-on turned off in addOns, main.js draws no
// Challenge (nothing in cabinet.json) and no Challenge Card, and neither
// the Challenges Achievement Family nor the Profile Stats line exists.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\profiles";
const TABLES = [
    { id: 1, configId: "Medieval Madness", title: "Medieval Madness", manufacturer: "Williams", year: 1997 },
    { id: 2, configId: "Attack from Mars", title: "Attack from Mars", manufacturer: "Bally", year: 1995 },
];

test("no Challenge, Challenge Card, Challenges family or Profile Stats line when the Challenges Add-on is off", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: TABLES });
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key !== "challenges";
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    await import("../main.js");
    await settle();

    assert.equal(JSON.parse(fake.readFile(`${PROFILES_FOLDER}\\cabinet.json`)).challenge, undefined);
    fake.gameStarted(TABLES[0]);
    fake.advanceTime(2 * 60 * 1000);
    fake.gameOver(TABLES[0]);
    assert.equal(JSON.parse(fake.readFile(`${PROFILES_FOLDER}\\Alice\\profile.json`)).challenge, undefined);
    assert.ok(fake.logLines().some(line => line.includes('"challenges" skipped')));

    const openMainMenu = () => fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    openMainMenu();
    fake.selectMenuItem(lang.achievementList.menuEntry);
    const families = fake.currentMenu().items.map(item => item.title || "");
    assert.ok(families.length > 2, "the families are shown");
    assert.ok(!families.some(title => title.startsWith(lang.achievementList.families.challenges)), families.join(", "));
    fake.selectMenuItem(lang.achievementList.back);

    openMainMenu();
    fake.selectMenuItem(lang.profileStats.menuEntry);
    const statsLines = fake.currentMenu().items.map(item => item.title);
    assert.ok(statsLines.length > 2, "the Profile Stats are shown");
    assert.ok(!statsLines.includes(lang.profileStats.challengesCompleted(0, 0)), statsLines.join(" / "));
    // The fake has no backglass window for the Force Backglass Add-on.
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR") && !line.startsWith("[ForceBackglass]")), []);
});

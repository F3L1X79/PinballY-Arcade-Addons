// ============================================================
// With the Challenges Add-on turned off in addOns, main.js draws no
// Challenge (nothing in cabinet.json) and no Challenge Card.
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

test("no Challenge and no Challenge Card when the Challenges Add-on is off", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: TABLES });
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key !== "challenges";
    config.language = "en";

    await import("../main.js");
    await settle();

    assert.equal(JSON.parse(fake.readFile(`${PROFILES_FOLDER}\\cabinet.json`)).challenge, undefined);
    fake.gameStarted(TABLES[0]);
    fake.advanceTime(2 * 60 * 1000);
    fake.gameOver(TABLES[0]);
    assert.equal(JSON.parse(fake.readFile(`${PROFILES_FOLDER}\\Alice\\profile.json`)).challenge, undefined);
    assert.ok(fake.logLines().some(line => line.includes('"challenges" skipped')));
});

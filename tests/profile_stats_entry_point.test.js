// ============================================================
// The Profile Stats, started through main.js on the fake PinballY globals:
// its main menu entry sits right after the Achievement List entry, the
// screen names Guest and shows Guest's own plays, its Achievements line
// agrees with the real Achievement List and opens it, and a game under a
// minute leaves a never played table never played.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { chromeTexts, pressAndGlide } from "./achievement_list_reader.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);

function table(id, title, manufacturer, year, isHidden = false) {
    return {
        id, configId: `${title} (${manufacturer} ${year})`, title, manufacturer, year, categories: [],
        playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden, isConfigured: true,
    };
}

const TABLES = [
    table(1, "Medieval Madness", "Williams", 1997),
    table(2, "Attack from Mars", "Bally", 1995),
    table(3, "Space Shuttle", "Zaccaria", 1987, true),
];

// Guest's own plays; PinballY's shared play stats above stay at zero.
const GUEST_PROFILE_FILE = "C:\\PinballY\\Scripts\\profiles\\guest\\profile.json";
const GUEST_PLAYS = {
    [TABLES[0].configId]: { count: 3, seconds: 5400, lastPlayed: "2026-09-20T20:00:00" },
    [TABLES[2].configId]: { count: 1, seconds: 600, lastPlayed: "2026-09-21T20:00:00" },
};

const ADD_ONS_UNDER_TEST = ["customMenuCommands", "achievements"];

// A separator has no title.
const SEPARATOR = undefined;

test("the Profile Stats entry follows the Achievement List and shows Guest's own numbers", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    fake.addFile(GUEST_PROFILE_FILE, JSON.stringify({ version: 1, plays: GUEST_PLAYS, notified: [] }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    }
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const TEXT = lang.profileStats;
    const MENU_LABELS = lang.customMenuLabels;
    await import("../main.js");
    await settle();

    const openMainMenu = () =>
        fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }, { title: "Exit", cmd: 99 }]);
    openMainMenu();
    assert.deepEqual(fake.currentMenu().items.map(item => item.title), [
        "Play",
        MENU_LABELS.tableSetup,
        MENU_LABELS.tableOfTheDay,
        MENU_LABELS.tableOfTheWeek,
        MENU_LABELS.randomGame,
        SEPARATOR,
        lang.achievementList.menuEntry,
        TEXT.menuEntry,
        SEPARATOR,
        "Exit",
    ]);

    // The Achievement List's own total, read from its header.
    const readListTotalLine = () => chromeTexts(fake).find(text => /^\d+ \/ \d+ /.test(text));
    fake.selectMenuItem(lang.achievementList.menuEntry);
    const listTotalLine = readListTotalLine();
    pressAndGlide(fake, "Exit");

    openMainMenu();
    fake.selectMenuItem(TEXT.menuEntry);
    const shown = fake.currentMenu().items.map(item => item.title);
    assert.equal(shown[0], TEXT.title(lang.profiles.guestName));
    assert.equal(shown[2], TEXT.gamesPlayed(4));
    assert.equal(shown[3], TEXT.totalTime(1, 40));
    assert.equal(shown[4], TEXT.collection(1, 2, 50));

    const achievementsLine = shown[5];
    fake.selectMenuItem(achievementsLine);
    assert.equal(readListTotalLine(), listTotalLine);
    const [unlocked, total] = listTotalLine.match(/\d+/g).map(Number);
    assert.equal(achievementsLine, TEXT.achievements(unlocked, total));
    pressAndGlide(fake, "Exit");

    // Attack from Mars, never played, launched by mistake: not a Play.
    fake.gameStarted(TABLES[1]);
    await settle();
    fake.advanceTime(59 * 1000);
    fake.gameOver(TABLES[1]);
    await settle();
    openMainMenu();
    fake.selectMenuItem(TEXT.menuEntry);
    const shownAfter = fake.currentMenu().items.map(item => item.title);
    assert.equal(shownAfter[2], TEXT.gamesPlayed(4));
    assert.equal(shownAfter[4], TEXT.collection(1, 2, 50));
    assert.ok(shownAfter.includes(TEXT.neverPlayedTables(1)), shownAfter.join("\n"));

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});

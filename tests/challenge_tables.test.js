// ============================================================
// Challenge Tables, through the Challenge module, the main menu and the
// Challenge Tables filter on the fake PinballY host, with a real Profile
// store, real Period Tables and a real Random Game module: the main menu
// entry is shown only for the templates where it makes sense, while the
// active Profile's Challenge is not completed, and choosing it puts on the
// wheel the visible tables that would move the Challenge forward.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { createProfileStore } from "../common/profile_store.js";
import { createPeriodTable, TABLE_OF_THE_DAY, TABLE_OF_THE_WEEK } from "../common/period_table.js";
import { createRandomGame } from "../common/random_game.js";
import { createChallenges } from "../common/challenge.js";
import { createChallengeTables } from "../common/challenge_tables.js";
import { createMainMenu } from "../common/main_menu.js";
import { createAchievementToasts } from "../common/achievement_toast.js";
import lang from "../common/i18n.js";

// Monday 21 September 2026, 20:00; its week is keyed "2026-09-21".
const MONDAY = new Date(2026, 8, 21, 20, 0, 0);
const TUESDAY = new Date(2026, 8, 22, 20, 0, 0);
const WEEK = "2026-09-21";

const PROFILES = "C:\\PinballY\\Scripts\\profiles";
const ENTRY = lang.customMenuLabels.challengeTables;

const table = (id, manufacturer, year, isHidden = false) =>
    ({ id, configId: `Table ${id}`, title: `Table ${id}`, manufacturer, year, isHidden });
// Tables 1 to 6, the 4th hidden.
const TABLES = [
    table(1, "Stern", 2016), table(2, "Stern", 2020), table(3, "Williams", 1992),
    table(4, "Stern", 2021, true), table(5, "Stern", 1995), table(6, "Bally", 1993),
];
const played = lastPlayed => ({ count: 1, seconds: 600, lastPlayed });
const RECENTLY = played("2026-09-13T20:00:00");
// More than six months before MONDAY.
const LONG_AGO = played("2026-03-21T20:00:00");

const challengeOf = (template, param = null, target = 3) => ({ week: WEEK, template, param, target });

// challenge: the week's Challenge, already locked in cabinet.json and
// followed by Alice; plays: Alice's play records.
function setUp({ challenge, active = "Alice", plays = {}, now = MONDAY } = {}) {
    const fake = createFakePinballYHost({ now, tables: TABLES });
    fake.installGlobals();
    fake.addFolder(`${PROFILES}\\Alice`);
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({
        plays,
        challenge: { firstWeek: WEEK, week: WEEK, games: [], completed: false, completedCount: 0, judgedWeek: "", history: [] },
    }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({
        version: 1, activeProfile: active, challenge: challenge && { current: challenge, previous: null },
    }));
    const store = createProfileStore(fake);
    const tableOfTheDay = createPeriodTable(fake, TABLE_OF_THE_DAY, store);
    const tableOfTheWeek = createPeriodTable(fake, TABLE_OF_THE_WEEK, store);
    const randomGame = createRandomGame(fake, store, { animateTo: async () => {}, skipAnimation: true });
    const challenges = createChallenges(fake, store,
        { tableOfTheDay, tableOfTheWeek, randomGame, toasts: createAchievementToasts(fake) });
    createChallengeTables(fake, challenges, createMainMenu(fake));
    return { fake, store, tableOfTheDay, tableOfTheWeek };
}

const PLAY = { title: "Play", cmd: 1 };
function openMainMenu(fake) {
    fake.openMenu("main", [PLAY, { title: "Exit", cmd: 99 }]);
    return fake.currentMenu().items.map(item => item.title);
}
const entryShown = fake => {
    const shown = openMainMenu(fake).includes(ENTRY);
    fake.closeMenu();
    return shown;
};
// Chooses the entry in the main menu; the wheel's tables.
async function chooseEntry(fake) {
    openMainMenu(fake);
    fake.selectMenuItem(ENTRY);
    await Promise.resolve();
    return fake.getWheelTables().map(game => game.configId);
}

function play(fake, game, seconds = 90) {
    fake.gameStarted(game);
    fake.advanceTime(seconds * 1000);
    fake.gameOver(game);
}

test("manufacturerTables: the manufacturer's visible tables, leaving out those already counted", async () => {
    const { fake } = setUp({ challenge: challengeOf("manufacturerTables", "Stern") });

    assert.ok(entryShown(fake));
    assert.deepEqual(await chooseEntry(fake), ["Table 1", "Table 2", "Table 5"]);

    play(fake, TABLES[1]);
    play(fake, TABLES[2]);
    assert.deepEqual(await chooseEntry(fake), ["Table 1", "Table 5"]);
});

test("decadeTables: the decade's visible tables, leaving out those already counted", async () => {
    const { fake } = setUp({ challenge: challengeOf("decadeTables", 1990) });

    assert.deepEqual(await chooseEntry(fake), ["Table 3", "Table 5", "Table 6"]);

    play(fake, TABLES[4]);
    assert.deepEqual(await chooseEntry(fake), ["Table 3", "Table 6"], "chosen again while already on the wheel");
});

test("neverPlayedTables: the visible tables the Profile never played", async () => {
    const { fake } = setUp({ challenge: challengeOf("neverPlayedTables"), plays: { "Table 1": RECENTLY, "Table 3": LONG_AGO } });

    assert.deepEqual(await chooseEntry(fake), ["Table 2", "Table 5", "Table 6"]);

    play(fake, TABLES[5]);
    assert.deepEqual(await chooseEntry(fake), ["Table 2", "Table 5"]);
});

test("dustyTables: the visible tables the Profile last played more than six months ago", async () => {
    const { fake } = setUp({
        challenge: challengeOf("dustyTables"),
        plays: { "Table 1": RECENTLY, "Table 2": LONG_AGO, "Table 3": LONG_AGO, "Table 4": LONG_AGO },
    });

    assert.deepEqual(await chooseEntry(fake), ["Table 2", "Table 3"]);

    play(fake, TABLES[1]);
    assert.deepEqual(await chooseEntry(fake), ["Table 3"]);
});

test("tableOfTheDayDays: the Table of the Day, until it counted today", async () => {
    const { fake, tableOfTheDay } = setUp({ challenge: challengeOf("tableOfTheDayDays") });
    const mondayTable = tableOfTheDay.getTable();

    assert.deepEqual(await chooseEntry(fake), [mondayTable.configId]);

    play(fake, mondayTable);
    assert.ok(!entryShown(fake), "today already counted");

    fake.setNow(TUESDAY);
    fake.fire("wheelmode");
    assert.deepEqual(await chooseEntry(fake), [tableOfTheDay.getTable().configId]);
});

test("tableOfTheWeekGames: the Table of the Week, even once played", async () => {
    const { fake, tableOfTheWeek } = setUp({ challenge: challengeOf("tableOfTheWeekGames") });
    const weekTable = tableOfTheWeek.getTable();

    assert.deepEqual(await chooseEntry(fake), [weekTable.configId]);
    play(fake, weekTable);
    assert.deepEqual(await chooseEntry(fake), [weekTable.configId]);
});

test("the entry is hidden for the other templates", () => {
    for (const template of ["differentTables", "differentManufacturers", "differentDecades", "activeDays",
        "endurance", "marathon", "randomGames", "sameTableGames"]) {
        const { fake } = setUp({ challenge: challengeOf(template) });
        assert.ok(!entryShown(fake), template);
    }
});

test("the entry is hidden for Guest, with no Challenge, and once the Challenge is completed", () => {
    assert.ok(!entryShown(setUp({ challenge: challengeOf("manufacturerTables", "Stern"), active: "guest" }).fake), "Guest");
    assert.ok(!entryShown(setUp({ challenge: { week: WEEK, template: "", param: null, target: 0 } }).fake), "no Challenge");

    const { fake } = setUp({ challenge: challengeOf("manufacturerTables", "Stern", 2) });
    play(fake, TABLES[0]);
    assert.ok(entryShown(fake));
    play(fake, TABLES[1]);
    assert.ok(!entryShown(fake), "completed");
});

test("the Challenge Tables filter is listed in no filter menu", () => {
    const { fake } = setUp({ challenge: challengeOf("manufacturerTables", "Stern") });

    assert.equal(fake.scriptFilters().length, 1);
    assert.equal(fake.scriptFilters()[0].group, undefined);
});

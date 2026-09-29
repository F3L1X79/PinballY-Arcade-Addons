// ============================================================
// Profile Stats module tests: over the fake PinballY host with a real
// Profile store, real Period Tables and a real Achievement List, checks
// what the player sees (title naming the active Profile, games played,
// total time, collection completion, Achievements, both Streaks,
// favourite manufacturer and decade, the most played and never played
// tables lists), that the Achievements line opens the Achievement List and
// Exit there comes back, that a listed table puts the wheel on it
// (switching to all tables when the current filter hides it), that Back
// from a list returns to its entry, and that every number is read again
// each time the screen opens.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { createProfileStats } from "../common/profile_stats.js";
import { createProfileStore } from "../common/profile_store.js";
import { createPeriodTable, TABLE_OF_THE_DAY, TABLE_OF_THE_WEEK } from "../common/period_table.js";
import { createAchievementList } from "../common/achievement_list.js";
import { ACHIEVEMENT_FAMILY, ACHIEVEMENT_RANK } from "../common/achievements.js";
import lang from "../common/i18n.js";
import { chromeTexts, pressAndGlide } from "./achievement_list_reader.js";

const TEXT = lang.profileStats;
const LIST_TEXT = lang.achievementList;

// Wednesday: its week started on Monday 21 September.
const NOW = new Date(2026, 8, 23, 10, 0, 0);
const PROFILES = "C:\\PinballY\\Scripts\\profiles";
const profileFile = name => `${PROFILES}\\${name}\\profile.json`;

function table(id, title, { isHidden = false, manufacturer = "Williams", year = 1990 } = {}) {
    return { id, configId: `${title} (${manufacturer} ${year})`, title, manufacturer, year, isHidden, isConfigured: true };
}

const MEDIEVAL = table(1, "Medieval Madness");
const ATTACK = table(2, "Attack from Mars");
const GODZILLA = table(3, "Godzilla");
const SHUTTLE = table(4, "Space Shuttle", { isHidden: true });
const TABLES = [MEDIEVAL, ATTACK, GODZILLA, SHUTTLE];

const play = (count, seconds) => ({ count, seconds, lastPlayed: "2026-09-20T20:00:00" });

// Guest played two visible tables, a hidden one and a table no longer in
// PinballY's list: 3 of 3 visible tables would need Godzilla too.
const GUEST_PLAYS = {
    [MEDIEVAL.configId]: play(4, 2 * 3600),
    [ATTACK.configId]: play(1, 900),
    [SHUTTLE.configId]: play(2, 1800),
    "Removed Table (Bally 1980)": play(3, 600),
};

function fakeAchievement(id, unlocked) {
    return {
        id, family: ACHIEVEMENT_FAMILY.COLLECTION, rank: ACHIEVEMENT_RANK.BRONZE, unlocked,
        getTitle: () => id, getDescription: () => id, checkUnlocked() { return this.unlocked; },
    };
}

function setUp({ guest = { plays: GUEST_PLAYS }, others = {}, tables = TABLES } = {}) {
    const fake = createFakePinballYHost({ now: NOW, tables });
    fake.addFile(profileFile("guest"), JSON.stringify({ version: 1, ...guest }));
    for (const [name, data] of Object.entries(others)) {
        fake.addFile(profileFile(name), JSON.stringify({ version: 1, ...data }));
    }
    const profileStore = createProfileStore(fake);
    const achievements = [fakeAchievement("a", true), fakeAchievement("b", false), fakeAchievement("c", true)];
    const achievementList = createAchievementList(fake, { getAchievements: () => achievements, profileStore });
    const profileStats = createProfileStats(fake, {
        profileStore,
        achievementList,
        tableOfTheDay: createPeriodTable(fake, TABLE_OF_THE_DAY, profileStore),
        tableOfTheWeek: createPeriodTable(fake, TABLE_OF_THE_WEEK, profileStore),
    });
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    profileStats.open();
    return { fake, profileStore, profileStats, achievements };
}

const titles = menu => menu.items.map(item => item.title);

test("the screen names the active Profile and shows its numbers, then Back", () => {
    const { fake } = setUp();

    // 10 games and 2 h 55 over every table played, hidden and removed ones
    // included; completion counts the visible tables only.
    assert.deepEqual(fake.currentMenu().items, [
        { title: TEXT.title(lang.profiles.guestName), cmd: -1 },
        { cmd: -1 },
        { title: TEXT.gamesPlayed(10), cmd: -1 },
        { title: TEXT.totalTime(2, 55), cmd: -1 },
        { title: TEXT.collection(2, 3, 67), cmd: -1 },
        { title: TEXT.achievements(2, 3), cmd: fake.currentMenu().items[5].cmd },
        { title: TEXT.tableOfTheDayStreak(0, 0), cmd: -1 },
        { title: TEXT.tableOfTheWeekStreak(0, 0), cmd: -1 },
        { title: TEXT.favouriteManufacturer("Williams", 2, 15), cmd: -1 },
        { title: TEXT.favouriteDecade(1990, 2, 15), cmd: -1 },
        { cmd: -1 },
        { title: TEXT.mostPlayedTables(2), cmd: fake.currentMenu().items[11].cmd },
        { title: TEXT.neverPlayedTables(1), cmd: fake.currentMenu().items[12].cmd },
        { cmd: -1 },
        { title: TEXT.back, cmd: fake.getBuiltInCommand("MenuReturn") },
    ]);
    assert.ok(fake.currentMenu().items[5].cmd > 0, "the Achievements line can be selected");
    assert.ok(fake.currentMenu().items[11].cmd > 0, "the most played list can be opened");
    assert.ok(fake.currentMenu().items[12].cmd > 0, "the never played list can be opened");
});

test("a new Profile shows 0 games, 0 time and nothing completed", () => {
    const { fake } = setUp({ guest: {} });

    const shown = titles(fake.currentMenu());
    assert.equal(shown[2], TEXT.gamesPlayed(0));
    assert.equal(shown[3], TEXT.totalTime(0, 0));
    assert.equal(shown[4], TEXT.collection(0, 3, 0));
    assert.equal(shown[8], TEXT.noFavouriteManufacturer);
    assert.equal(shown[9], TEXT.noFavouriteDecade);
    assert.ok(!shown.includes(TEXT.mostPlayedTables(0)), "no most played list before any play");
    assert.equal(shown[11], TEXT.neverPlayedTables(3));
});

test("the favourite manufacturer and decade are the ones with the most time on visible tables", () => {
    const tables = [
        table(1, "Twilight Zone", { manufacturer: "Bally", year: 1993 }),
        table(2, "Addams Family", { manufacturer: "Bally", year: 1992 }),
        table(3, "Pirates", { manufacturer: "Stern", year: 1981 }),
        // Hidden: its hours never make Gottlieb or the 1970s the favourite.
        table(4, "Hidden Gem", { manufacturer: "Gottlieb", year: 1975, isHidden: true }),
        // No manufacturer, no year: left out of both favourites.
        table(5, "Home Made", { manufacturer: "", year: 0 }),
    ];
    const plays = {
        [tables[0].configId]: play(1, 1800),
        [tables[1].configId]: play(1, 1800),
        [tables[2].configId]: play(5, 2 * 3600 + 60),
        [tables[3].configId]: play(9, 10 * 3600),
        [tables[4].configId]: play(9, 10 * 3600),
    };
    const { fake } = setUp({ guest: { plays }, tables });

    const shown = titles(fake.currentMenu());
    assert.equal(shown[8], TEXT.favouriteManufacturer("Stern", 2, 1));
    assert.equal(shown[9], TEXT.favouriteDecade(1980, 2, 1));
});

test("a tie on time goes to the most games, then to alphabetical order", () => {
    const tables = [
        table(1, "Eight Ball", { manufacturer: "Bally", year: 1977 }),
        table(2, "Firepower", { manufacturer: "Williams", year: 1980 }),
        table(3, "Cyclone", { manufacturer: "Gottlieb", year: 1988 }),
        table(4, "Orbitor", { manufacturer: "Stern", year: 1982 }),
    ];
    const { fake } = setUp({
        tables,
        guest: {
            plays: {
                // Same hour each: Williams wins on games played.
                [tables[0].configId]: play(2, 3600),
                [tables[1].configId]: play(3, 3600),
                // 1980s: Firepower, Cyclone and Orbitor. 1970s: Eight Ball.
                [tables[2].configId]: play(1, 0),
            },
        },
    });
    let shown = titles(fake.currentMenu());
    assert.equal(shown[8], TEXT.favouriteManufacturer("Williams", 1, 0));
    assert.equal(shown[9], TEXT.favouriteDecade(1980, 1, 0));

    const { fake: tied } = setUp({
        tables,
        guest: {
            plays: {
                // Same hour and same games: Bally comes first alphabetically,
                // and the 1970s before the 1980s.
                [tables[0].configId]: play(2, 3600),
                [tables[1].configId]: play(2, 3600),
            },
        },
    });
    shown = titles(tied.currentMenu());
    assert.equal(shown[8], TEXT.favouriteManufacturer("Bally", 1, 0));
    assert.equal(shown[9], TEXT.favouriteDecade(1970, 1, 0));
});

test("the Achievements line matches the Achievement List and opens it", () => {
    const { fake, profileStats, achievements } = setUp();
    fake.selectMenuItem(TEXT.back);
    achievements[1].unlocked = true;

    profileStats.open();
    fake.selectMenuItem(TEXT.achievements(3, 3));

    assert.ok(chromeTexts(fake).includes(LIST_TEXT.totalLine(3, 3, 100)), "the list shows the same counts");
    pressAndGlide(fake, "Exit");
    assert.deepEqual(chromeTexts(fake), [], "Exit closes the list");
    assert.equal(fake.currentMenu().items[0].title, TEXT.title(lang.profiles.guestName), "and shows the Profile Stats again");
});

test("both Streaks show the current Streak, 0 once broken, and the longest one", () => {
    const { fake } = setUp({
        guest: {
            plays: {},
            streaks: {
                // Broken: last played on the 20th, two days ago.
                tableOfTheDay: { current: 5, longest: 12, lastPeriod: "2026-09-20", periodsPlayed: 40 },
                // Still running: played last week.
                tableOfTheWeek: { current: 2, longest: 3, lastPeriod: "2026-09-14", periodsPlayed: 9 },
            },
        },
    });

    const shown = titles(fake.currentMenu());
    assert.equal(shown[6], TEXT.tableOfTheDayStreak(0, 12));
    assert.equal(shown[7], TEXT.tableOfTheWeekStreak(2, 3));
});

test("the numbers follow a Profile switch and a finished game the next time the screen opens", () => {
    const { fake, profileStore, profileStats } = setUp({
        others: { Alice: { plays: { [GODZILLA.configId]: play(1, 60) } } },
    });
    fake.selectMenuItem(TEXT.back);

    profileStore.switchTo("Alice");
    profileStats.open();
    let shown = titles(fake.currentMenu());
    assert.equal(shown[0], TEXT.title("Alice"));
    assert.equal(shown[2], TEXT.gamesPlayed(1));
    assert.equal(shown[4], TEXT.collection(1, 3, 33));
    fake.selectMenuItem(TEXT.back);

    fake.gameStarted(MEDIEVAL);
    fake.advanceTime(30 * 60 * 1000);
    fake.gameOver(MEDIEVAL);
    profileStats.open();
    shown = titles(fake.currentMenu());
    assert.equal(shown[2], TEXT.gamesPlayed(2));
    assert.equal(shown[3], TEXT.totalTime(0, 31));
    assert.equal(shown[4], TEXT.collection(2, 3, 67));
});

// The table titles of an open list, between its paging items and its Back.
const listedTitles = menu => menu.items.map(item => item.title).filter(title => title !== undefined && title !== TEXT.back);

test("the most played tables are the Hall of Fame of the active Profile", () => {
    const tables = [
        table(1, "Theatre of Magic"),
        table(2, "Cirqus Voltaire"),
        table(3, "Monster Bash"),
        table(4, "Scared Stiff", { isHidden: true }),
        table(5, "White Water"),
        table(6, "Black Knight"),
    ];
    const { fake } = setUp({
        tables,
        guest: {
            plays: {
                [tables[0].configId]: play(1, 3600),
                // Same time as Theatre of Magic, more games: ranked first.
                [tables[1].configId]: play(3, 3600),
                [tables[2].configId]: play(9, 7200),
                // Hidden: never in the Hall of Fame.
                [tables[3].configId]: play(9, 99 * 3600),
                // Started but no time recorded: not in the Hall of Fame.
                [tables[4].configId]: play(1, 0),
            },
        },
    });

    fake.selectMenuItem(TEXT.mostPlayedTables(3));

    assert.deepEqual(listedTitles(fake.currentMenu()), ["Monster Bash", "Cirqus Voltaire", "Theatre of Magic"]);
});

test("the never played tables are the visible tables without a play, by title", () => {
    const tables = [
        table(1, "Whirlwind"),
        table(2, "Addams Family"),
        table(3, "Scared Stiff", { isHidden: true }),
        table(4, "Monster Bash"),
        table(5, "Earthshaker"),
    ];
    const { fake } = setUp({ tables, guest: { plays: { [tables[3].configId]: play(1, 60) } } });

    fake.selectMenuItem(TEXT.neverPlayedTables(3));

    assert.deepEqual(listedTitles(fake.currentMenu()), ["Addams Family", "Earthshaker", "Whirlwind"]);
});

test("the never played list and its count leave out unconfigured tables", () => {
    const tables = [...TABLES, { ...table(5, "Whirlwind"), isConfigured: false }];
    const { fake } = setUp({ tables });

    assert.ok(titles(fake.currentMenu()).includes(TEXT.neverPlayedTables(1)));
    fake.selectMenuItem(TEXT.neverPlayedTables(1));

    assert.deepEqual(listedTitles(fake.currentMenu()), ["Godzilla"]);
});

test("selecting a listed table closes the menu and puts the wheel on it, in the current filter", () => {
    const { fake } = setUp();
    fake.setWheelTables([GODZILLA.configId, MEDIEVAL.configId, ATTACK.configId], { filterId: "Favorites" });

    fake.selectMenuItem(TEXT.mostPlayedTables(2));
    fake.selectMenuItem("Attack from Mars");

    assert.equal(fake.getUIMode(), "wheel");
    assert.equal(fake.currentFilterId(), "Favorites");
    assert.deepEqual(fake.getWheelTables().map(game => game.title), ["Attack from Mars", "Godzilla", "Medieval Madness"]);
    assert.deepEqual(fake.launches(), [], "the player launches it with Play");
});

test("a listed table outside the current filter switches the wheel to all tables first", () => {
    const { fake } = setUp();
    fake.setWheelTables([MEDIEVAL.configId, ATTACK.configId], { filterId: "Favorites" });

    fake.selectMenuItem(TEXT.neverPlayedTables(1));
    fake.selectMenuItem("Godzilla");

    assert.equal(fake.getUIMode(), "wheel");
    assert.equal(fake.currentFilterId(), "All");
    assert.equal(fake.getWheelTables()[0].title, "Godzilla");
});

test("a list entry is left out when every visible table was played", () => {
    const plays = Object.fromEntries([MEDIEVAL, ATTACK, GODZILLA].map(game => [game.configId, play(1, 60)]));
    const { fake } = setUp({ guest: { plays } });

    const shown = titles(fake.currentMenu());
    assert.equal(shown[11], TEXT.mostPlayedTables(3));
    assert.ok(!shown.includes(TEXT.neverPlayedTables(0)), "no never played list once everything was played");
});

test("Back from a list returns to the Profile Stats with the cursor on its entry", () => {
    const { fake } = setUp();

    for (const entry of [TEXT.mostPlayedTables(2), TEXT.neverPlayedTables(1)]) {
        fake.selectMenuItem(entry);
        fake.selectMenuItem(TEXT.back);

        const menu = fake.currentMenu();
        assert.equal(menu.items[0].title, TEXT.title(lang.profiles.guestName));
        assert.deepEqual(menu.items.filter(item => item.selected).map(item => item.title), [entry]);
    }
});

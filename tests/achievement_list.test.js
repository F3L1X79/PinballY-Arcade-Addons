// ============================================================
// Achievement List module tests: over the fake PinballY host with fake
// Achievements, checks what the player sees at each level (total line,
// Achievement Families with their counts, a family's Achievements, Unlocked
// ones first and checked, an Achievement's card) and the Back navigation.
// Unlocked is computed live each time a level opens, and so is the
// Achievement Progress a missing Achievement shows.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { createAchievementList } from "../common/achievement_list.js";
import { ACHIEVEMENT_FAMILY, PROGRESS_UNIT } from "../common/achievements.js";
import lang from "../common/i18n.js";

const TEXT = lang.achievementList;

// The families level: total line, separator, families, separator, Back.
const FAMILY_ITEMS_START = 2;

function fakeAchievement(id, family, unlocked = false, progress = undefined) {
    const achievement = {
        id,
        family,
        unlocked,
        progress,
        getTitle: () => `${id} title`,
        getDescription: () => `${id} description`,
        checkUnlocked: () => achievement.unlocked,
    };
    if (progress !== undefined) achievement.getProgress = () => achievement.progress;
    return achievement;
}

// Given in the reverse of the family order, to show the list sorts them itself.
function sampleAchievements() {
    return [
        fakeAchievement("bally", ACHIEVEMENT_FAMILY.MANUFACTURERS, false),
        fakeAchievement("stern", ACHIEVEMENT_FAMILY.MANUFACTURERS, true),
        fakeAchievement("williams", ACHIEVEMENT_FAMILY.MANUFACTURERS, true),
        fakeAchievement("rageQuit", ACHIEVEMENT_FAMILY.SESSIONS, true),
        fakeAchievement("streak3", ACHIEVEMENT_FAMILY.PERIOD_TABLES, false),
        fakeAchievement("oneHour", ACHIEVEMENT_FAMILY.PLAY_TIME, true),
        fakeAchievement("firstTable", ACHIEVEMENT_FAMILY.COLLECTION, true),
        fakeAchievement("tenPercent", ACHIEVEMENT_FAMILY.COLLECTION, false),
    ];
}

function setUp(achievements = sampleAchievements()) {
    const fake = createFakePinballYHost();
    const list = createAchievementList(fake, () => achievements);
    // The Achievement List opens from the main menu.
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    list.open();
    return { fake, list, achievements };
}

const titles = menu => menu.items.map(item => item.title);
const familyTitle = (family, unlocked, total) => TEXT.familyLine(TEXT.families[family], unlocked, total);

function familyItems(menu) {
    return menu.items.slice(FAMILY_ITEMS_START, -2);
}

test("the families level shows the total line, then the non-empty families in the fixed order with their counts", () => {
    const { fake } = setUp();
    const menu = fake.currentMenu();

    assert.deepEqual(menu.items[0], { title: TEXT.totalLine(5, 8), cmd: -1 });
    assert.deepEqual(menu.items[1], { cmd: -1 });
    assert.deepEqual(familyItems(menu).map(item => item.title), [
        familyTitle(ACHIEVEMENT_FAMILY.COLLECTION, 1, 2),
        familyTitle(ACHIEVEMENT_FAMILY.PLAY_TIME, 1, 1),
        familyTitle(ACHIEVEMENT_FAMILY.PERIOD_TABLES, 0, 1),
        familyTitle(ACHIEVEMENT_FAMILY.SESSIONS, 1, 1),
        familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 2, 3),
    ]);
    assert.ok(familyItems(menu).every(item => item.cmd > 0), "every family can be selected");
    assert.deepEqual(menu.items.slice(-2), [{ cmd: -1 }, { title: TEXT.back, cmd: fake.getBuiltInCommand("MenuReturn") }]);
});

test("the families come in the fixed order: Collection, Play Time, Period Tables, Sessions, Random Game, Manufacturers, Decades, Categories, Challenges", () => {
    const families = [
        ACHIEVEMENT_FAMILY.CHALLENGES,
        ACHIEVEMENT_FAMILY.CATEGORIES,
        ACHIEVEMENT_FAMILY.DECADES,
        ACHIEVEMENT_FAMILY.MANUFACTURERS,
        ACHIEVEMENT_FAMILY.RANDOM_GAME,
        ACHIEVEMENT_FAMILY.SESSIONS,
        ACHIEVEMENT_FAMILY.PERIOD_TABLES,
        ACHIEVEMENT_FAMILY.PLAY_TIME,
        ACHIEVEMENT_FAMILY.COLLECTION,
    ];
    const { fake } = setUp(families.map(family => fakeAchievement(family, family)));

    assert.deepEqual(familyItems(fake.currentMenu()).map(item => item.title), [
        "collection", "playTime", "periodTables", "sessions", "randomGame", "manufacturers", "decades", "categories", "challenges",
    ].map(family => familyTitle(family, 0, 1)));
});

test("every family has a label in every language", async () => {
    for (const code of ["en", "fr", "de", "es", "it", "pt"]) {
        const { default: texts } = await import(`../lang/${code}.js`);
        for (const family of Object.values(ACHIEVEMENT_FAMILY)) {
            assert.equal(typeof texts.achievementList.families[family], "string", `${code}: ${family}`);
        }
    }
});

test("a family lists its Unlocked Achievements first, checked, then the missing ones, in a paged section", () => {
    const { fake } = setUp();

    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 2, 3));
    const menu = fake.currentMenu();

    assert.deepEqual(menu.items[0], { cmd: fake.getBuiltInCommand("MenuPageUp") });
    const achievementItems = menu.items.slice(1, 4);
    assert.deepEqual(achievementItems.map(({ title, checked }) => ({ title, checked })), [
        { title: "stern title", checked: true },
        { title: "williams title", checked: true },
        { title: "bally title", checked: false },
    ]);
    assert.deepEqual(menu.items[4], { cmd: fake.getBuiltInCommand("MenuPageDown") });
    assert.deepEqual(menu.items[5], { cmd: -1 });
    assert.equal(menu.items[6].title, TEXT.back);
    assert.equal(menu.items.length, 7);
});

function cardItems(fake, title, description, status) {
    return [
        { title: TEXT.cardMessage(title, description, status), cmd: -1 },
        { cmd: -1 },
        { title: TEXT.back, cmd: fake.currentMenu().items[2].cmd },
    ];
}

test("selecting an Unlocked Achievement opens its card as a dialog-style menu", () => {
    const { fake } = setUp();
    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 2, 3));

    fake.selectMenuItem("williams title");

    const menu = fake.currentMenu();
    assert.deepEqual(menu.items, cardItems(fake, "williams title", "williams description", TEXT.unlocked));
    assert.ok(menu.items[2].cmd > 0, "Back can be selected");
    assert.deepEqual(menu.options, { dialogStyle: true });
    assert.equal(fake.getUIMode(), "menu");
});

test("selecting a missing Achievement opens its card with the not-unlocked status", () => {
    const { fake } = setUp();
    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 2, 3));

    fake.selectMenuItem("bally title");

    assert.deepEqual(fake.currentMenu().items,
        cardItems(fake, "bally title", "bally description", TEXT.notUnlocked));
});

test("a surprise Achievement shows its card like the others", () => {
    const { fake } = setUp();
    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.SESSIONS, 1, 1));

    fake.selectMenuItem("rageQuit title");

    assert.deepEqual(fake.currentMenu().items,
        cardItems(fake, "rageQuit title", "rageQuit description", TEXT.unlocked));
});

test("the card shows the live status of its Achievement", () => {
    const { fake, achievements } = setUp();
    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 2, 3));
    achievements.find(achievement => achievement.id === "stern").unlocked = false;

    fake.selectMenuItem("stern title");

    assert.equal(fake.currentMenu().items[0].title,
        TEXT.cardMessage("stern title", "stern description", TEXT.notUnlocked));
});

test("Back on a card reopens its family with that Achievement selected", () => {
    const { fake } = setUp();
    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 2, 3));
    fake.selectMenuItem("bally title");

    fake.selectMenuItem(TEXT.back);

    const menu = fake.currentMenu();
    assert.deepEqual(menu.items.slice(1, 4).map(item => item.title), ["stern title", "williams title", "bally title"]);
    assert.deepEqual(menu.items.filter(item => item.selected).map(item => item.title), ["bally title"]);

    fake.selectMenuItem(TEXT.back);
    assert.deepEqual(fake.currentMenu().items.filter(item => item.selected).map(item => item.title),
        [familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 2, 3)]);
});

test("Back on a card finds its Achievement again when the Achievements are rebuilt at each read", () => {
    const fake = createFakePinballYHost();
    const list = createAchievementList(fake, sampleAchievements);
    list.open();
    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 2, 3));
    fake.selectMenuItem("williams title");

    fake.selectMenuItem(TEXT.back);

    assert.deepEqual(fake.currentMenu().items.filter(item => item.selected).map(item => item.title), ["williams title"]);
});

test("every card label has a text in every language", async () => {
    for (const code of ["en", "fr", "de", "es", "it", "pt"]) {
        const { default: texts } = await import(`../lang/${code}.js`);
        assert.equal(typeof texts.achievementList.cardMessage, "function", `${code}: cardMessage`);
        assert.equal(typeof texts.achievementList.unlocked, "string", `${code}: unlocked`);
        assert.equal(typeof texts.achievementList.notUnlocked, "string", `${code}: notUnlocked`);
    }
});

test("Back in a family goes up to the families, on that family", () => {
    const { fake } = setUp();
    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.SESSIONS, 1, 1));

    fake.selectMenuItem(TEXT.back);

    const menu = fake.currentMenu();
    assert.equal(menu.items[0].title, TEXT.totalLine(5, 8));
    const selected = menu.items.filter(item => item.selected);
    assert.deepEqual(selected.map(item => item.title), [familyTitle(ACHIEVEMENT_FAMILY.SESSIONS, 1, 1)]);
});

test("Back on the families returns to the wheel", () => {
    const { fake } = setUp();

    fake.selectMenuItem(TEXT.back);

    assert.equal(fake.currentMenu(), null);
    assert.equal(fake.getUIMode(), "wheel");
});

test("Unlocked is computed each time a level opens: an Achievement that lost its condition shows as missing", () => {
    const { fake, achievements } = setUp();
    const williams = achievements.find(achievement => achievement.id === "williams");
    williams.unlocked = false;

    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 2, 3));
    assert.deepEqual(fake.currentMenu().items.slice(1, 4).map(({ title, checked }) => ({ title, checked })), [
        { title: "stern title", checked: true },
        { title: "bally title", checked: false },
        { title: "williams title", checked: false },
    ]);

    fake.selectMenuItem(TEXT.back);
    const menu = fake.currentMenu();
    assert.equal(menu.items[0].title, TEXT.totalLine(4, 8));
    assert.ok(titles(menu).includes(familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 1, 3)));
});

test("the Achievements are read again at each open, so a family that became empty disappears", () => {
    const achievements = sampleAchievements();
    const { fake, list } = setUp(achievements);
    fake.selectMenuItem(TEXT.back);

    achievements.splice(0, achievements.length, fakeAchievement("oneHour", ACHIEVEMENT_FAMILY.PLAY_TIME, false));
    list.open();

    const menu = fake.currentMenu();
    assert.equal(menu.items[0].title, TEXT.totalLine(0, 1));
    assert.deepEqual(familyItems(menu).map(item => item.title), [familyTitle(ACHIEVEMENT_FAMILY.PLAY_TIME, 0, 1)]);
});

// Williams: missing, 7 of 12 tables. Bally: Unlocked, with a progress still
// given. Stern: missing, its progress says none. Gottlieb: no progress at all.
function progressAchievements() {
    const tables = (current, target) => ({ current, target, unit: PROGRESS_UNIT.TABLES });
    return [
        fakeAchievement("williams", ACHIEVEMENT_FAMILY.MANUFACTURERS, false, tables(7, 12)),
        fakeAchievement("bally", ACHIEVEMENT_FAMILY.MANUFACTURERS, true, tables(12, 12)),
        fakeAchievement("stern", ACHIEVEMENT_FAMILY.MANUFACTURERS, false, null),
        fakeAchievement("gottlieb", ACHIEVEMENT_FAMILY.MANUFACTURERS, false),
    ];
}

const tablesProgress = TEXT.progressUnits[PROGRESS_UNIT.TABLES];

test("a missing Achievement with an Achievement Progress shows it after its title, the others show their bare title, order unchanged", () => {
    const { fake } = setUp(progressAchievements());

    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 1, 4));

    assert.deepEqual(fake.currentMenu().items.slice(1, 5).map(({ title, checked }) => ({ title, checked })), [
        { title: "bally title", checked: true },
        { title: TEXT.titleWithProgress("williams title", tablesProgress.short(7, 12)), checked: false },
        { title: "stern title", checked: false },
        { title: "gottlieb title", checked: false },
    ]);
});

test("the card of a missing Achievement shows its Achievement Progress between the description and the status", () => {
    const { fake } = setUp(progressAchievements());
    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 1, 4));

    fake.selectMenuItem(TEXT.titleWithProgress("williams title", tablesProgress.short(7, 12)));

    assert.equal(fake.currentMenu().items[0].title, TEXT.cardMessage("williams title", "williams description",
        TEXT.notUnlocked, TEXT.progressLine(tablesProgress.long(7, 12))));
});

test("the card of an Unlocked Achievement or of one without an Achievement Progress shows none", () => {
    const { fake } = setUp(progressAchievements());
    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 1, 4));

    fake.selectMenuItem("bally title");
    assert.equal(fake.currentMenu().items[0].title,
        TEXT.cardMessage("bally title", "bally description", TEXT.unlocked));

    fake.selectMenuItem(TEXT.back);
    fake.selectMenuItem("stern title");
    assert.equal(fake.currentMenu().items[0].title,
        TEXT.cardMessage("stern title", "stern description", TEXT.notUnlocked));
});

test("the Achievement Progress is read again each time a level opens", () => {
    const achievements = progressAchievements();
    const { fake } = setUp(achievements);
    achievements[0].progress = { current: 8, target: 12, unit: PROGRESS_UNIT.TABLES };

    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.MANUFACTURERS, 1, 4));

    assert.ok(fake.currentMenu().items.some(item => item.title === TEXT.titleWithProgress("williams title", tablesProgress.short(8, 12))));
});

test("an Achievement Progress in an unknown unit is an error, not a blank", () => {
    const { fake } = setUp([fakeAchievement("odd", ACHIEVEMENT_FAMILY.SESSIONS, false, { current: 1, target: 2, unit: "parsecs" })]);
    // The error reaches PinballY's log file through the command handler.
    fake.installGlobals();

    fake.selectMenuItem(familyTitle(ACHIEVEMENT_FAMILY.SESSIONS, 0, 1));

    assert.equal(fake.logLines().filter(line => line.includes("parsecs")).length, 1);
});

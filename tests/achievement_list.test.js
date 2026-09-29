// ============================================================
// Achievement List module tests: over the fake PinballY host with fake
// Achievements and a real Profile store, drives the drawn list the way the
// player does (open it, press buttons through "commandbuttondown", let
// the glide run) and checks what the player sees: the header, the two
// sections in their order (a waiting toast first, then the most recently
// Notified, then the missing ones), the highlighted line moving, skipping
// the section headers and wrapping, the buttons swallowed only while it is
// open, Exit and attract mode closing it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { createAchievementList } from "../common/achievement_list.js";
import { createProfileStore } from "../common/profile_store.js";
import { ACHIEVEMENT_FAMILY, PROGRESS_UNIT } from "../common/achievements.js";
import lang from "../common/i18n.js";
import {
    press, pressAndGlide, chromeTexts, isListOpen, shownItems, highlightedTexts, readSections, readRows,
} from "./achievement_list_reader.js";

const TEXT = lang.achievementList;
const PROFILES = "C:\\PinballY\\Scripts\\profiles";
const upper = text => text.toLocaleUpperCase();

function fakeAchievement(id, unlocked = false, progress = undefined) {
    const achievement = {
        id,
        family: ACHIEVEMENT_FAMILY.COLLECTION,
        unlocked,
        progress,
        getTitle: () => `${id} title`,
        getDescription: () => `${id} description`,
        checkUnlocked: () => achievement.unlocked,
    };
    if (progress !== undefined) achievement.getProgress = () => achievement.progress;
    return achievement;
}

// Unlocked: alpha, beta, gamma, delta; missing: epsilon, zeta.
function sampleAchievements() {
    return [
        fakeAchievement("alpha", true),
        fakeAchievement("epsilon", false),
        fakeAchievement("beta", true),
        fakeAchievement("gamma", true),
        fakeAchievement("zeta", false),
        fakeAchievement("delta", true),
    ];
}

// Alice is active. She was Notified of gamma, then alpha, then delta; the
// toast of beta still waits.
function setUp({ achievements = sampleAchievements(), notified = ["gamma", "alpha", "delta"] } = {}) {
    const fake = createFakePinballYHost();
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({ version: 1, notified }));
    const profileStore = createProfileStore(fake);
    const list = createAchievementList(fake, { getAchievements: () => achievements, profileStore });
    // Opened from the main menu, as the player does.
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    const exits = [];
    list.open(() => exits.push("exit"));
    return { fake, list, achievements, profileStore, exits };
}

const rowTexts = id => [`${id} title`, `${id} description`];

test("the list opens over the menu with the Profile's header, both sections and the footer", () => {
    const { fake } = setUp();

    assert.ok(fake.executedCommands().includes(fake.getBuiltInCommand("MenuReturn")), "the main menu is closed first");
    const chrome = chromeTexts(fake);
    for (const text of [upper(TEXT.title), "Alice", TEXT.totalLine(4, 6, 67),
        upper(TEXT.keyCaps.next), upper(TEXT.keyCaps.prev), upper(TEXT.keyCaps.exit), upper(TEXT.browse), upper(TEXT.back)]) {
        assert.ok(chrome.includes(text), `"${text}" is shown in ${JSON.stringify(chrome)}`);
    }
    assert.deepEqual(readSections(fake, TEXT), [
        {
            header: [upper(TEXT.unlockedSection), TEXT.sectionCount(4)],
            // The waiting toast first, then from the most recently Notified.
            rows: [rowTexts("beta"), rowTexts("delta"), rowTexts("alpha"), rowTexts("gamma")],
        },
        {
            header: [upper(TEXT.missingSection), TEXT.sectionCount(2)],
            // In the natural order of the definitions.
            rows: [rowTexts("epsilon"), rowTexts("zeta")],
        },
    ]);
});

test("the list always opens at the top, on the first Achievement", () => {
    const { fake, list } = setUp();
    pressAndGlide(fake, "Next");
    pressAndGlide(fake, "Next");
    pressAndGlide(fake, "Exit");

    list.open();

    assert.deepEqual(highlightedTexts(fake), rowTexts("beta"));
    assert.deepEqual(shownItems(fake)[0].texts, [upper(TEXT.unlockedSection), TEXT.sectionCount(4)]);
});

test("Next and Prev move the highlight one Achievement at a time, skip the section headers and wrap", () => {
    const { fake } = setUp();
    const highlightedTitle = () => highlightedTexts(fake)[0];

    assert.equal(highlightedTitle(), "beta title");
    for (const title of ["delta title", "alpha title", "gamma title", "epsilon title", "zeta title", "beta title"]) {
        pressAndGlide(fake, "Next");
        assert.equal(highlightedTitle(), title);
    }
    pressAndGlide(fake, "Prev");
    assert.equal(highlightedTitle(), "zeta title", "Prev wraps to the last Achievement");
    pressAndGlide(fake, "Prev");
    assert.equal(highlightedTitle(), "epsilon title");
    pressAndGlide(fake, "Prev");
    assert.equal(highlightedTitle(), "gamma title", "the missing section's header is skipped");
});

test("the other lines are dimmed, and the highlight glides to its next line", () => {
    const { fake } = setUp();

    for (const item of shownItems(fake)) {
        if (item.texts[0] !== "beta title") assert.ok(item.alpha < 1 && item.alpha >= 0.6, `${item.texts[0]} is dimmed`);
    }
    press(fake, "Next");
    fake.advanceTime(16);
    const [beta, delta] = ["beta title", "delta title"].map(title => shownItems(fake).find(item => item.texts[0] === title));
    assert.ok(beta.alpha < 1 && delta.alpha < 1, "halfway, neither line is fully lit");
    fake.advanceTime(1000);
    assert.equal(highlightedTexts(fake)[0], "delta title");
});

test("only the items inside the rows area are shown, and the list scrolls to keep the highlight in view", () => {
    const achievements = Array.from({ length: 30 }, (_, index) => fakeAchievement(`a${index}`, false));
    const { fake } = setUp({ achievements, notified: [] });
    const shownTitles = () => shownItems(fake).map(item => item.texts[0]);

    assert.ok(shownTitles().length < 10, `only a few items fit: ${shownTitles().join(", ")}`);
    assert.ok(!shownTitles().includes("a29 title"));
    for (let press = 0; press < 29; press++) pressAndGlide(fake, "Next");
    assert.equal(highlightedTexts(fake)[0], "a29 title");
    assert.ok(!shownTitles().includes("a0 title"), "the top of the list has scrolled out");
    assert.equal(readRows(fake, TEXT).length, 30);
});

test("every button is swallowed while the list is open, Select does nothing, and none once it is closed", () => {
    const { fake, exits } = setUp();

    for (const buttonCommand of ["Next", "Prev", "Select", "Launch", "Information", "Exit"]) {
        assert.equal(press(fake, buttonCommand).defaultPrevented, true, `${buttonCommand} is swallowed`);
        if (buttonCommand === "Select") assert.ok(isListOpen(fake), "Select leaves the list open");
    }
    assert.equal(isListOpen(fake), false, "Exit closed it");
    assert.deepEqual(exits, ["exit"]);
    for (const buttonCommand of ["Next", "Select", "Exit"]) {
        assert.equal(press(fake, buttonCommand).defaultPrevented, false, `${buttonCommand} reaches PinballY again`);
    }
    assert.deepEqual(shownItems(fake), [], "no row stays on screen");
    assert.deepEqual(exits, ["exit"]);
});

test("attract mode closes the list without going back anywhere", () => {
    const { fake, exits } = setUp();

    fake.fire("attractmodestart");

    assert.equal(isListOpen(fake), false);
    assert.deepEqual(shownItems(fake), []);
    assert.deepEqual(exits, []);
    assert.equal(press(fake, "Next").defaultPrevented, false);
});

test("the list shows no native menu", () => {
    const fake = createFakePinballYHost();
    const list = createAchievementList(fake, { getAchievements: sampleAchievements, profileStore: createProfileStore(fake) });

    list.open();
    pressAndGlide(fake, "Next");
    pressAndGlide(fake, "Select");
    pressAndGlide(fake, "Exit");

    assert.deepEqual(fake.shownMenus(), []);
});

test("an empty section keeps its header with a count of 0", () => {
    const { fake } = setUp({ achievements: [fakeAchievement("alpha", false), fakeAchievement("beta", false)], notified: [] });

    assert.deepEqual(readSections(fake, TEXT), [
        { header: [upper(TEXT.unlockedSection), TEXT.sectionCount(0)], rows: [] },
        { header: [upper(TEXT.missingSection), TEXT.sectionCount(2)], rows: [rowTexts("alpha"), rowTexts("beta")] },
    ]);
    assert.deepEqual(highlightedTexts(fake), rowTexts("alpha"));
    assert.ok(chromeTexts(fake).includes(TEXT.totalLine(0, 2, 0)));
});

test("Unlocked, the order and the counts are read again on each opening", () => {
    const { fake, list, achievements, profileStore } = setUp();
    pressAndGlide(fake, "Exit");
    achievements.find(achievement => achievement.id === "zeta").unlocked = true;
    profileStore.updateProfileData(data => { data.notified.push("beta"); });

    list.open();

    const [unlocked, missing] = readSections(fake, TEXT);
    assert.deepEqual(unlocked.rows.map(texts => texts[0]), ["zeta title", "beta title", "delta title", "alpha title", "gamma title"]);
    assert.deepEqual(missing.rows.map(texts => texts[0]), ["epsilon title"]);
    assert.ok(chromeTexts(fake).includes(TEXT.totalLine(5, 6, 83)));
    assert.deepEqual(list.countAll(), { unlocked: 5, total: 6 });
});

test("the list follows the active Profile: its name and its own Notified order", () => {
    const { fake, list, profileStore } = setUp();
    pressAndGlide(fake, "Exit");
    profileStore.switchTo("guest");

    list.open();

    assert.ok(chromeTexts(fake).includes(lang.profiles.guestName));
    // Guest was Notified of nothing: every Unlocked one waits for its toast.
    assert.deepEqual(readSections(fake, TEXT)[0].rows.map(texts => texts[0]), ["alpha title", "beta title", "gamma title", "delta title"]);
});

test("a missing Achievement shows its Achievement Progress; an Unlocked one or one without shows none", () => {
    const tables = (current, target) => ({ current, target, unit: PROGRESS_UNIT.TABLES });
    const { fake } = setUp({
        achievements: [
            fakeAchievement("williams", false, tables(7, 12)),
            fakeAchievement("bally", true, tables(12, 12)),
            fakeAchievement("stern", false, null),
            fakeAchievement("gottlieb", false),
        ],
        notified: ["bally"],
    });

    assert.deepEqual(readRows(fake, TEXT).map(({ title, progress }) => [title, progress]), [
        ["bally title", null],
        ["williams title", TEXT.progressUnits[PROGRESS_UNIT.TABLES].short(7, 12)],
        ["stern title", null],
        ["gottlieb title", null],
    ]);
});

test("an Achievement Progress in an unknown unit is an error, not a blank", () => {
    const fake = createFakePinballYHost();
    const achievements = [fakeAchievement("odd", false, { current: 1, target: 2, unit: "parsecs" })];
    const list = createAchievementList(fake, { getAchievements: () => achievements, profileStore: createProfileStore(fake) });

    assert.throws(() => list.open(), /parsecs/);
});

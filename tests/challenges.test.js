// ============================================================
// Challenges, through the Challenge module and the Challenge Card
// on the fake PinballY host, with a real Profile store, real Period
// Tables, a real Random Game module and a scripted random source: the
// week's draw locked in cabinet.json, the games that count in each
// Profile's profile.json, what the card shows (and when it lights up), the
// Challenge Toast on completion and the verdict on the previous Challenge.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { createProfileStore } from "../common/profile_store.js";
import { createPeriodTable, TABLE_OF_THE_DAY, TABLE_OF_THE_WEEK } from "../common/period_table.js";
import { createRandomGame } from "../common/random_game.js";
import { createChallenges, CHALLENGE_TEMPLATE_IDS } from "../common/challenge.js";
import { createChallengeCard, CHALLENGE_CARD_Z_INDEX, CHALLENGE_VERDICT_MS } from "../common/challenge_card.js";
import { createAchievementToasts } from "../common/achievement_toast.js";
import lang from "../common/i18n.js";

// Monday 21 September 2026, 20:00; its week is keyed "2026-09-21".
const MONDAY = new Date(2026, 8, 21, 20, 0, 0);
const SUNDAY_NIGHT = new Date(2026, 8, 27, 23, 59, 0);
const NEXT_MONDAY = new Date(2026, 8, 28, 20, 0, 0);
const WEEK = "2026-09-21";
const NEXT_WEEK = "2026-09-28";
const MINUTE_MS = 60 * 1000;
const HIGHLIGHT_OVER_MS = 5000;
// Longer than a toast's whole life (rise, hold, fade).
const ONE_TOAST_MS = 6000;

const PROFILES = "C:\\PinballY\\Scripts\\profiles";
const CABINET_FILE = `${PROFILES}\\cabinet.json`;
const profileFile = name => `${PROFILES}\\${name}\\profile.json`;

const table = (id, manufacturer, year) =>
    ({ id, configId: `Table ${id}`, title: `Table ${id}`, manufacturer, year, isHidden: false });
const TABLES = [table(1, "Williams", 1992), table(2, "Bally", 1995), table(3, "Stern", 2016), table(4, "Gottlieb", 1978)];
const TEXT = lang.challenges;

// A random source that returns these values in turn, then 0.
const scripted = values => () => (values.length > 0 ? values.shift() : 0);

// saved: the week's lock already in cabinet.json and each Profile's
// "challenge" record already in its profile.json.
function setUp({ now = MONDAY, tables = TABLES, active = "Alice", randoms = [], saved = {} } = {}) {
    const fake = createFakePinballYHost({ now, tables, layoutSize: { width: 1080, height: 1920 } });
    fake.installGlobals();
    for (const name of ["Alice", "Bob"]) {
        fake.addFolder(`${PROFILES}\\${name}`);
        if (saved[name]) fake.addFile(profileFile(name), JSON.stringify({ challenge: saved[name] }));
    }
    fake.addFile(CABINET_FILE, JSON.stringify({ version: 1, activeProfile: active, challenge: saved.cabinet }));
    const store = createProfileStore(fake);
    const tableOfTheDay = createPeriodTable(fake, TABLE_OF_THE_DAY, store);
    const tableOfTheWeek = createPeriodTable(fake, TABLE_OF_THE_WEEK, store);
    const randomGame = createRandomGame(fake, store, { animateTo: async () => {}, skipAnimation: true });
    const toasts = createAchievementToasts(fake);
    const challenges = createChallenges(fake, store,
        { tableOfTheDay, tableOfTheWeek, randomGame, toasts, random: scripted([...randoms]) });
    createChallengeCard(fake, challenges, store);
    return { fake, store, toasts };
}

const readJson = (fake, path) => JSON.parse(fake.readFile(path));
const cabinetChallenge = fake => readJson(fake, CABINET_FILE).challenge;
const profileChallenge = (fake, name) => readJson(fake, profileFile(name)).challenge;

function card(fake) {
    const layers = fake.drawingLayers().filter(layer => layer.zIndex === CHALLENGE_CARD_Z_INDEX);
    assert.equal(layers.length, 1, "one Challenge Card layer");
    return layers[0];
}
const cardShown = fake => card(fake).alpha > 0 && card(fake).texts().length > 0;
const cardShows = (fake, text) => cardShown(fake) && card(fake).texts().includes(text);
// The highlight glows around the card: frames the resting card doesn't have.
const restingFrames = fake => {
    fake.advanceTime(HIGHLIGHT_OVER_MS);
    return card(fake).frames().length;
};

// Every toast drawn so far, its texts joined: header | title | description.
const toastsDrawn = fake => fake.drawings()
    .filter(drawing => drawing.zIndex !== CHALLENGE_CARD_Z_INDEX)
    .map(drawing => drawing.texts.join(" | "));

function play(fake, game, seconds) {
    fake.gameStarted(game);
    fake.advanceTime(seconds * 1000);
    fake.gameOver(game);
}

test("the week's Challenge is drawn once, locked in cabinet.json and shown on the card", () => {
    // Template, option, then the highest target: min(5, 4 visible tables).
    const { fake } = setUp({ randoms: [0, 0, 0.99] });

    assert.deepEqual(cabinetChallenge(fake), {
        current: { week: WEEK, template: "differentTables", param: null, target: 4 },
        previous: null,
    });
    assert.ok(cardShows(fake, TEXT.titles.differentTables(4)));
    assert.ok(cardShows(fake, TEXT.progress(0, 4, TEXT.daysLeft(7))));
    assert.ok(cardShows(fake, TEXT.cardHeader.toLocaleUpperCase()));
});

test("the Challenge stays the same all week, even when tables are hidden or added", () => {
    const { fake } = setUp({ randoms: [0, 0, 0.99] });
    const drawn = cabinetChallenge(fake);

    fake.setNow(SUNDAY_NIGHT);
    fake.setTables([...TABLES.slice(0, 1), table(5, "Stern", 2020), table(6, "Stern", 2021)]);
    fake.fire("wheelmode");

    assert.deepEqual(cabinetChallenge(fake), drawn);
    assert.ok(cardShows(fake, TEXT.progress(0, 4, TEXT.lastDay)));
});

test("the target stays between 2 and the number of visible tables, at most 5", () => {
    const low = setUp({ randoms: [0, 0, 0] });
    assert.equal(cabinetChallenge(low.fake).current.target, 2);

    const eightTables = [...TABLES, table(5, "Stern", 2020), table(6, "Stern", 2021), table(7, "Data East", 1990), table(8, "Bally", 1980)];
    const high = setUp({ tables: eightTables, randoms: [0, 0, 0.99] });
    assert.equal(cabinetChallenge(high.fake).current.target, 5);
});

test("with fewer than 2 visible tables there is no Challenge and no card", () => {
    const { fake } = setUp({ tables: [table(1, "Williams", 1992), { ...table(2, "Bally", 1995), isHidden: true }] });

    assert.deepEqual(cabinetChallenge(fake).current, { week: WEEK, template: "", param: null, target: 0 });
    assert.ok(!cardShown(fake));
});

test("a new week draws a new Challenge, never with the previous template", () => {
    const { fake } = setUp({ randoms: [0, 0, 0.99] });
    const lastWeek = cabinetChallenge(fake).current;

    fake.setNow(NEXT_MONDAY);
    fake.fire("wheelmode");

    // The first candidate left once differentTables is out: the 1990s,
    // the only decade with 2 visible tables.
    assert.deepEqual(cabinetChallenge(fake), {
        current: { week: "2026-09-28", template: "decadeTables", param: 1990, target: 2 },
        previous: lastWeek,
    });
    fake.advanceTime(CHALLENGE_VERDICT_MS);
    assert.ok(cardShows(fake, TEXT.titles.decadeTables(2, 1990)));
});

test("a game counts from 60 seconds on a visible table, and progress counts distinct tables", () => {
    const { fake } = setUp({ randoms: [0, 0, 0.99] });

    play(fake, TABLES[0], 59);
    assert.ok(cardShows(fake, TEXT.progress(0, 4, TEXT.daysLeft(7))), "a game under a minute doesn't count");

    play(fake, TABLES[0], 60);
    assert.ok(cardShows(fake, TEXT.progress(1, 4, TEXT.daysLeft(7))));

    play(fake, TABLES[0], 5 * 60);
    assert.ok(cardShows(fake, TEXT.progress(1, 4, TEXT.daysLeft(7))), "the same table again adds nothing");

    fake.gameStarted(TABLES[1]);
    fake.advanceTime(2 * MINUTE_MS);
    fake.setTables([TABLES[0], { ...TABLES[1], isHidden: true }, TABLES[2], TABLES[3]]);
    fake.gameOver(TABLES[1]);
    assert.ok(cardShows(fake, TEXT.progress(1, 4, TEXT.daysLeft(7))), "a table hidden by the end doesn't count");

    play(fake, TABLES[2], 90);
    assert.ok(cardShows(fake, TEXT.progress(2, 4, TEXT.daysLeft(7))));

    const games = profileChallenge(fake, "Alice").games;
    assert.deepEqual(games.map(game => [game.configId, game.seconds]), [["Table 1", 60], ["Table 1", 300], ["Table 3", 90]]);
});

test("with Guest active nothing is drawn, until another Profile shows up", () => {
    const { fake, store } = setUp({ active: "guest", randoms: [0, 0, 0.99] });
    assert.equal(cabinetChallenge(fake), undefined);
    assert.ok(!cardShown(fake));

    store.switchTo("Alice");
    assert.equal(cabinetChallenge(fake).current.template, "differentTables");
    assert.ok(cardShown(fake));
});

test("each Profile has its own progress, and Guest has no Challenge", () => {
    const { fake, store } = setUp({ randoms: [0, 0, 0.99] });
    play(fake, TABLES[0], 90);

    store.switchTo("Bob");
    assert.ok(cardShows(fake, TEXT.progress(0, 4, TEXT.daysLeft(7))), "Bob starts from zero");

    store.switchTo("guest");
    assert.ok(!cardShown(fake), "no card for Guest");
    play(fake, TABLES[1], 90);
    assert.equal(readJson(fake, profileFile("guest")).challenge, undefined, "nothing counted for Guest");

    store.switchTo("Alice");
    assert.ok(cardShows(fake, TEXT.progress(1, 4, TEXT.daysLeft(7))));
});

test("a game started on Sunday night counts for the week it started in", () => {
    const { fake } = setUp({ now: SUNDAY_NIGHT, randoms: [0, 0, 0.99] });

    fake.gameStarted(TABLES[0]);
    fake.advanceTime(5 * MINUTE_MS);
    // "gameover" alone: the Profile has not shown up on the new week's wheel yet.
    fake.fire("gameover", { game: TABLES[0] });

    const challenge = profileChallenge(fake, "Alice");
    assert.equal(challenge.week, WEEK);
    assert.deepEqual(challenge.games.map(game => [game.configId, game.day]), [["Table 1", "2026-09-27"]]);
});

test("a game started in a week whose Challenge the Profile doesn't follow doesn't count", () => {
    const { fake } = setUp({ now: SUNDAY_NIGHT, randoms: [0, 0, 0.99] });
    fake.setNow(NEXT_MONDAY);

    // Still following last week's Challenge: nobody showed up on the wheel since.
    fake.gameStarted(TABLES[0]);
    fake.advanceTime(5 * MINUTE_MS);
    fake.fire("gameover", { game: TABLES[0] });
    assert.equal(profileChallenge(fake, "Alice").week, WEEK);
    assert.deepEqual(profileChallenge(fake, "Alice").games, []);
});

test("the card hides while a game runs and comes back on the wheel", () => {
    const { fake } = setUp({ randoms: [0, 0, 0.99] });

    fake.gameStarted(TABLES[0]);
    assert.equal(card(fake).alpha, 0);
    fake.advanceTime(30 * 1000);
    fake.gameOver(TABLES[0]);
    assert.ok(cardShown(fake));
});

test("the card lights up once on a new Challenge, a Profile switch and progress after a game", () => {
    const { fake, store } = setUp({ randoms: [0, 0, 0.99] });
    const lit = card(fake).frames().length;
    const resting = restingFrames(fake);
    assert.ok(lit > resting, "lit up for the new Challenge, then back to rest");

    store.switchTo("Bob");
    assert.equal(card(fake).frames().length, lit, "lit up for the Profile switch");
    restingFrames(fake);

    play(fake, TABLES[0], 90);
    assert.equal(card(fake).frames().length, lit, "lit up after a game that moved the Challenge forward");
    restingFrames(fake);

    play(fake, TABLES[0], 90);
    assert.equal(card(fake).frames().length, resting, "the same table again: nothing new");

    fake.fire("wheelmode");
    assert.equal(card(fake).frames().length, resting, "back on the wheel with nothing new");
});

test("the card keeps its size and sits under the Profile badge", () => {
    const { fake, store } = setUp({ randoms: [0, 0, 0.99] });
    const size = card(fake).canvasSize();
    store.switchTo("Bob");
    play(fake, TABLES[0], 90);

    assert.deepEqual(card(fake).canvasSize(), size);
    assert.equal(card(fake).position().align, "top right");
    assert.ok(card(fake).position().y < 0, "moved down, below the badge");
    assert.equal(Object.keys(card(fake).scale()).length, 1, "only one span set: it keeps its proportions");
});

test("reaching the target completes the Challenge once: completed count, Challenge Toast, completed card", () => {
    // Target 2.
    const { fake } = setUp({ randoms: [0, 0, 0] });
    const title = TEXT.titles.differentTables(2);

    play(fake, TABLES[0], 90);
    assert.equal(profileChallenge(fake, "Alice").completed, false);
    play(fake, TABLES[1], 90);

    const challenge = profileChallenge(fake, "Alice");
    assert.equal(challenge.completed, true);
    assert.equal(challenge.completedCount, 1);
    assert.deepEqual(toastsDrawn(fake), [[TEXT.toastHeader.toLocaleUpperCase(), title, TEXT.toastDescription(1)].join(" | ")]);
    assert.ok(cardShows(fake, TEXT.completed));

    play(fake, TABLES[2], 90);
    fake.advanceTime(ONE_TOAST_MS);
    assert.equal(profileChallenge(fake, "Alice").completedCount, 1, "completed once");
    assert.equal(toastsDrawn(fake).length, 1, "one Challenge Toast");
});

test("the card shows the Challenge completed until the end of the week", () => {
    const { fake, store } = setUp({ randoms: [0, 0, 0] });
    play(fake, TABLES[0], 90);
    play(fake, TABLES[1], 90);

    store.switchTo("Bob");
    assert.ok(cardShows(fake, TEXT.progress(0, 2, TEXT.daysLeft(7))), "Bob has not completed it");
    store.switchTo("Alice");
    fake.setNow(SUNDAY_NIGHT);
    fake.fire("wheelmode");
    assert.ok(cardShows(fake, TEXT.completed));
});

test("each Profile completes the Challenge on its own", () => {
    const { fake, store } = setUp({ randoms: [0, 0, 0] });
    play(fake, TABLES[0], 90);
    play(fake, TABLES[1], 90);
    store.switchTo("Bob");
    play(fake, TABLES[2], 90);
    play(fake, TABLES[3], 90);

    assert.equal(profileChallenge(fake, "Alice").completedCount, 1);
    assert.equal(profileChallenge(fake, "Bob").completedCount, 1);
    fake.advanceTime(ONE_TOAST_MS);
    assert.equal(toastsDrawn(fake).length, 2);
});

test("a game started on Sunday night completes that week's Challenge", () => {
    const { fake } = setUp({ now: new Date(2026, 8, 27, 22, 0, 0), randoms: [0, 0, 0] });
    play(fake, TABLES[0], 90);

    fake.setNow(SUNDAY_NIGHT);
    fake.gameStarted(TABLES[1]);
    fake.advanceTime(5 * MINUTE_MS);
    fake.gameOver(TABLES[1]);

    assert.equal(profileChallenge(fake, "Alice").completedCount, 1);
    assert.equal(toastsDrawn(fake).length, 1);
});

// Last week's Challenge (target 2) and this week's (target 3), already drawn.
const TWO_WEEKS_LOCKED = {
    current: { week: NEXT_WEEK, template: "differentTables", param: null, target: 3 },
    previous: { week: WEEK, template: "differentTables", param: null, target: 2 },
};
const followed = (week, games = [], more = {}) => ({
    firstWeek: week, week, games, completed: false, completedCount: 0, judgedWeek: "", history: [], ...more,
});
const countedGame = (configId, day) => ({
    configId, manufacturer: "Williams", decade: 1990, day, seconds: 90, randomGame: false,
    isTableOfTheDay: false, isTableOfTheWeek: false, wasNeverPlayed: true, wasDusty: false,
});
const verdictHeader = TEXT.verdictHeader.toLocaleUpperCase();

test("a missed Challenge gets its verdict once, on the card, with the value reached and no toast", () => {
    const { fake } = setUp({ randoms: [0, 0, 0] });
    play(fake, TABLES[0], 90);

    fake.setNow(NEXT_MONDAY);
    fake.fire("wheelmode");

    const challenge = profileChallenge(fake, "Alice");
    assert.deepEqual(challenge.history, [{ week: WEEK, template: "differentTables", param: null, target: 2, reached: 1, completed: false }]);
    assert.equal(challenge.judgedWeek, WEEK);
    assert.ok(cardShows(fake, verdictHeader));
    assert.ok(cardShows(fake, TEXT.titles.differentTables(2)));
    assert.ok(cardShows(fake, TEXT.missed(1, 2)));

    fake.advanceTime(CHALLENGE_VERDICT_MS + ONE_TOAST_MS);
    assert.deepEqual(toastsDrawn(fake), [], "no toast for a missed Challenge");
    assert.ok(cardShows(fake, TEXT.titles.decadeTables(2, 1990)), "the verdict gives way to this week's Challenge");

    fake.fire("wheelmode");
    assert.ok(!cardShows(fake, verdictHeader), "the verdict is shown once");
    assert.equal(profileChallenge(fake, "Alice").history.length, 1);
});

test("a completed Challenge gets its verdict, then the new Challenge lights up", () => {
    const games = [countedGame("Table 1", "2026-09-22"), countedGame("Table 2", "2026-09-23")];
    const { fake } = setUp({
        now: NEXT_MONDAY,
        saved: { cabinet: TWO_WEEKS_LOCKED, Alice: followed(WEEK, games, { completed: true, completedCount: 1 }) },
    });

    assert.ok(cardShows(fake, verdictHeader));
    assert.ok(cardShows(fake, TEXT.completed));
    assert.deepEqual(profileChallenge(fake, "Alice").history,
        [{ week: WEEK, template: "differentTables", param: null, target: 2, reached: 2, completed: true }]);

    fake.advanceTime(CHALLENGE_VERDICT_MS);
    assert.ok(cardShows(fake, TEXT.cardHeader.toLocaleUpperCase()));
    assert.ok(cardShows(fake, TEXT.progress(0, 3, TEXT.daysLeft(7))));
    const lit = card(fake).frames().length;
    assert.ok(lit > restingFrames(fake), "the new Challenge lights up");

    const challenge = profileChallenge(fake, "Alice");
    assert.equal(challenge.week, NEXT_WEEK);
    assert.equal(challenge.completedCount, 1);
    assert.equal(challenge.firstWeek, WEEK);
});

test("a Profile that didn't play the previous week gets a verdict with 0", () => {
    // Bob last followed a Challenge three weeks ago, and was judged on it.
    const old = followed("2026-09-07", [countedGame("Table 1", "2026-09-08")], { judgedWeek: "2026-08-31" });
    const { fake } = setUp({ now: NEXT_MONDAY, active: "Bob", saved: { cabinet: TWO_WEEKS_LOCKED, Bob: old } });

    assert.ok(cardShows(fake, TEXT.missed(0, 2)));
    assert.deepEqual(profileChallenge(fake, "Bob").history,
        [{ week: WEEK, template: "differentTables", param: null, target: 2, reached: 0, completed: false }],
        "only the last Challenge is judged: the weeks in between leave no trace");
});

test("a Profile that never saw the previous Challenge gets no verdict", () => {
    const { fake, store } = setUp({
        now: NEXT_MONDAY,
        saved: { cabinet: TWO_WEEKS_LOCKED, Alice: followed(WEEK), Bob: followed(NEXT_WEEK) },
    });
    fake.advanceTime(CHALLENGE_VERDICT_MS);

    // Bob first saw a Challenge this week.
    store.switchTo("Bob");
    assert.ok(!cardShows(fake, verdictHeader));
    assert.deepEqual(profileChallenge(fake, "Bob").history, []);

    fake.addFolder(`${PROFILES}\\Carol`);
    store.switchTo("Carol");
    assert.ok(!cardShows(fake, verdictHeader), "a Profile created after the previous Challenge");
    assert.ok(cardShows(fake, TEXT.progress(0, 3, TEXT.daysLeft(7))));
    assert.deepEqual(profileChallenge(fake, "Carol").history, []);
    assert.equal(profileChallenge(fake, "Carol").firstWeek, NEXT_WEEK);
});

test("a game across Monday midnight completes the old week's Challenge: the toast and the verdict both show", () => {
    const { fake } = setUp({ now: new Date(2026, 8, 27, 22, 0, 0), randoms: [0, 0, 0] });
    play(fake, TABLES[0], 90);

    fake.setNow(SUNDAY_NIGHT);
    fake.gameStarted(TABLES[1]);
    fake.setNow(NEXT_MONDAY);
    fake.gameOver(TABLES[1]);

    const challenge = profileChallenge(fake, "Alice");
    assert.equal(challenge.completedCount, 1);
    assert.deepEqual(challenge.history,
        [{ week: WEEK, template: "differentTables", param: null, target: 2, reached: 2, completed: true }]);
    assert.ok(cardShows(fake, verdictHeader));
    assert.ok(cardShows(fake, TEXT.completed));
    fake.advanceTime(ONE_TOAST_MS);
    assert.equal(toastsDrawn(fake).length, 1);
});

test("a menu or a dialog closing over the verdict shows it again, in full, then the new Challenge lights up", () => {
    const { fake } = setUp({
        now: NEXT_MONDAY,
        saved: { cabinet: TWO_WEEKS_LOCKED, Alice: followed(WEEK) },
    });
    fake.advanceTime(CHALLENGE_VERDICT_MS - 1000);

    fake.fire("wheelmode");
    fake.advanceTime(CHALLENGE_VERDICT_MS - 1000);
    assert.ok(cardShows(fake, TEXT.missed(0, 2)), "still the verdict");
    fake.advanceTime(1000);
    assert.ok(cardShows(fake, TEXT.progress(0, 3, TEXT.daysLeft(7))));
    const lit = card(fake).frames().length;
    assert.ok(lit > restingFrames(fake), "the new Challenge lights up");
    assert.equal(profileChallenge(fake, "Alice").history.length, 1);

    fake.fire("wheelmode");
    assert.ok(!cardShows(fake, verdictHeader), "once seen, the verdict is gone");

    // A Profile switch drops a verdict still on screen.
    const withVerdict = setUp({ now: NEXT_MONDAY, saved: { cabinet: TWO_WEEKS_LOCKED, Alice: followed(WEEK) } });
    withVerdict.store.switchTo("Bob");
    assert.ok(!cardShows(withVerdict.fake, verdictHeader));
});

test("a previous week without a Challenge gets no verdict", () => {
    const { fake } = setUp({
        now: NEXT_MONDAY,
        saved: {
            cabinet: {
                current: TWO_WEEKS_LOCKED.current,
                previous: { week: WEEK, template: "", param: null, target: 0 },
            },
            Alice: followed("2026-09-14"),
        },
    });

    assert.ok(!cardShows(fake, verdictHeader));
    assert.ok(cardShows(fake, TEXT.progress(0, 3, TEXT.daysLeft(7))));
    assert.deepEqual(profileChallenge(fake, "Alice").history, []);
});

// Every Challenge a draw can give on this collection, as "template:param:target"
// for the lowest and highest target, by walking the random source through
// each template and option.
function drawable(tables) {
    const steps = Array.from({ length: 20 }, (_, index) => index / 20);
    const drawn = new Set();
    for (const templateRandom of steps) {
        for (const optionRandom of steps) {
            for (const targetRandom of [0, 0.99]) {
                const { fake } = setUp({ tables, randoms: [templateRandom, optionRandom, targetRandom] });
                const { template, param, target } = cabinetChallenge(fake).current;
                drawn.add(`${template}:${param}:${target}`);
            }
        }
    }
    return [...drawn].sort();
}
const drawableTemplates = tables =>
    drawable(tables).map(key => key.split(":")[0]).filter((id, index, ids) => ids.indexOf(id) === index);
const drawnOf = (tables, template) => drawable(tables).filter(key => key.startsWith(`${template}:`));

// Draws this template's option at this index, among options, with this target.
function setUpDrawn(tables, template, { option = 0, options = 1, target = 0 } = {}) {
    const templates = drawableTemplates(tables);
    const ordered = CHALLENGE_TEMPLATE_IDS.filter(id => templates.includes(id));
    const randoms = [(ordered.indexOf(template) + 0.5) / ordered.length, (option + 0.5) / options, target];
    const set = setUp({ tables, randoms });
    assert.equal(cabinetChallenge(set.fake).current.template, template);
    return set;
}

// Community tables first: were they an option, they would come first.
const MANUFACTURER_TABLES = [
    table(11, "VPX Community", 2021), table(12, "VPX Community", 2022), table(13, "VPX Community", 2023),
    table(14, "Stern", 2016), table(15, "Stern", 2020), table(16, "Stern", 2021), { ...table(17, "Stern", 2022), isHidden: true },
    table(18, "Williams", 1992), table(19, "Williams", 1993),
    table(20, "Bally", 1980), table(21, "", 1995), table(22, "", 1996),
];

test("manufacturerTables: one option per manufacturer with 2 visible tables, never the community tables' one", () => {
    assert.deepEqual(drawnOf(MANUFACTURER_TABLES, "manufacturerTables"), [
        "manufacturerTables:Stern:2", "manufacturerTables:Stern:3",
        "manufacturerTables:Williams:2",
    ]);

    // Only the community tables' manufacturer has 2 tables: no option.
    const communityOnly = [table(11, "VPX Community", 2021), table(12, "VPX Community", 2022), table(18, "Williams", 1992)];
    assert.deepEqual(drawnOf(communityOnly, "manufacturerTables"), []);
});

test("manufacturerTables counts the manufacturer's distinct tables", () => {
    const { fake } = setUpDrawn(MANUFACTURER_TABLES, "manufacturerTables", { option: 0, options: 2, target: 0.99 });
    assert.deepEqual(cabinetChallenge(fake).current, { week: WEEK, template: "manufacturerTables", param: "Stern", target: 3 });
    assert.ok(cardShows(fake, TEXT.titles.manufacturerTables(3, "Stern")));

    play(fake, MANUFACTURER_TABLES[3], 90);
    play(fake, MANUFACTURER_TABLES[3], 90);
    play(fake, MANUFACTURER_TABLES[7], 90);
    play(fake, MANUFACTURER_TABLES[0], 90);
    assert.ok(cardShows(fake, TEXT.progress(1, 3, TEXT.daysLeft(7))), "the same table twice, other manufacturers: 1");

    play(fake, MANUFACTURER_TABLES[4], 90);
    play(fake, MANUFACTURER_TABLES[5], 90);
    assert.equal(profileChallenge(fake, "Alice").completed, true);
});

test("decadeTables: one option per decade with 2 visible tables, counting its distinct tables", () => {
    assert.deepEqual(drawnOf(MANUFACTURER_TABLES, "decadeTables"), [
        "decadeTables:1990:2", "decadeTables:1990:4",
        "decadeTables:2020:2", "decadeTables:2020:5",
    ]);

    const { fake } = setUpDrawn(MANUFACTURER_TABLES, "decadeTables", { option: 1, options: 2, target: 0 });
    assert.deepEqual(cabinetChallenge(fake).current, { week: WEEK, template: "decadeTables", param: 1990, target: 2 });
    assert.ok(cardShows(fake, TEXT.titles.decadeTables(2, 1990)));

    play(fake, MANUFACTURER_TABLES[7], 90);
    play(fake, MANUFACTURER_TABLES[7], 90);
    play(fake, MANUFACTURER_TABLES[9], 90);
    assert.ok(cardShows(fake, TEXT.progress(1, 2, TEXT.daysLeft(7))));
    play(fake, MANUFACTURER_TABLES[10], 90);
    assert.equal(profileChallenge(fake, "Alice").completed, true);
});

test("differentManufacturers: up to the visible tables' distinct manufacturers, counting distinct manufacturers played", () => {
    // Stern, Williams and Bally: target 2 or 3.
    const tables = [table(1, "Stern", 2016), table(2, "Stern", 2020), table(3, "Williams", 1992), table(4, "Bally", 1995),
        table(5, "", 1996), { ...table(6, "Gottlieb", 1978), isHidden: true }];
    assert.deepEqual(drawnOf(tables, "differentManufacturers"), ["differentManufacturers:null:2", "differentManufacturers:null:3"]);

    const { fake } = setUpDrawn(tables, "differentManufacturers", { target: 0.99 });
    assert.ok(cardShows(fake, TEXT.titles.differentManufacturers(3)));
    play(fake, tables[0], 90);
    play(fake, tables[1], 90);
    play(fake, tables[4], 90);
    assert.ok(cardShows(fake, TEXT.progress(1, 3, TEXT.daysLeft(7))), "two Stern tables and one without a manufacturer: 1");
    play(fake, tables[2], 90);
    play(fake, tables[3], 90);
    assert.equal(profileChallenge(fake, "Alice").completed, true);
});

test("differentDecades: up to the visible tables' distinct decades, counting distinct decades played", () => {
    // The 2010s, 1990s and 1970s: target 2 or 3.
    const tables = [table(1, "Stern", 2016), table(2, "Stern", 2017), table(3, "Williams", 1992), table(4, "Bally", 1978),
        table(5, "Gottlieb", 0), { ...table(6, "Gottlieb", 1965), isHidden: true }];
    assert.deepEqual(drawnOf(tables, "differentDecades"), ["differentDecades:null:2", "differentDecades:null:3"]);

    const { fake } = setUpDrawn(tables, "differentDecades", { target: 0 });
    assert.ok(cardShows(fake, TEXT.titles.differentDecades(2)));
    play(fake, tables[0], 90);
    play(fake, tables[1], 90);
    play(fake, tables[4], 90);
    assert.ok(cardShows(fake, TEXT.progress(1, 2, TEXT.daysLeft(7))), "two 2010s tables and one without a year: 1");
    play(fake, tables[2], 90);
    assert.equal(profileChallenge(fake, "Alice").completed, true);
});

test("a manufacturer or decade template is never drawn when its max is below 2", () => {
    // One manufacturer, one decade, each table its own.
    const oneEach = [table(1, "Stern", 2016), table(2, "Williams", 1992)];
    assert.deepEqual(drawableTemplates(oneEach),
        ["differentDecades", "differentManufacturers", "differentTables"]);

    const sameEra = [table(1, "Stern", 2016), table(2, "Stern", 2017)];
    assert.deepEqual(drawableTemplates(sameEra),
        ["decadeTables", "differentTables", "manufacturerTables"]);
});

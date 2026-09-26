// ============================================================
// Challenges, through the Challenge module and the Challenge Card
// on the fake PinballY host, with a real Profile store, real Period
// Tables, a real Random Game module and a scripted random source: the
// week's draw locked in cabinet.json, the games that count in each
// Profile's profile.json, and what the card shows (and when it lights up).
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { createProfileStore } from "../common/profile_store.js";
import { createPeriodTable, TABLE_OF_THE_DAY, TABLE_OF_THE_WEEK } from "../common/period_table.js";
import { createRandomGame } from "../common/random_game.js";
import { createChallenges } from "../common/challenge.js";
import { createChallengeCard, CHALLENGE_CARD_Z_INDEX } from "../common/challenge_card.js";
import lang from "../common/i18n.js";

// Monday 21 September 2026, 20:00; its week is keyed "2026-09-21".
const MONDAY = new Date(2026, 8, 21, 20, 0, 0);
const SUNDAY_NIGHT = new Date(2026, 8, 27, 23, 59, 0);
const NEXT_MONDAY = new Date(2026, 8, 28, 20, 0, 0);
const WEEK = "2026-09-21";
const MINUTE_MS = 60 * 1000;
const HIGHLIGHT_OVER_MS = 5000;

const PROFILES = "C:\\PinballY\\Scripts\\profiles";
const CABINET_FILE = `${PROFILES}\\cabinet.json`;
const profileFile = name => `${PROFILES}\\${name}\\profile.json`;

const table = (id, manufacturer, year) =>
    ({ id, configId: `Table ${id}`, title: `Table ${id}`, manufacturer, year, isHidden: false });
const TABLES = [table(1, "Williams", 1992), table(2, "Bally", 1995), table(3, "Stern", 2016), table(4, "Gottlieb", 1978)];
const TEXT = lang.challenges;

// A random source that returns these values in turn, then 0.
const scripted = values => () => (values.length > 0 ? values.shift() : 0);

function setUp({ now = MONDAY, tables = TABLES, active = "Alice", randoms = [] } = {}) {
    const fake = createFakePinballYHost({ now, tables, layoutSize: { width: 1080, height: 1920 } });
    for (const name of ["Alice", "Bob"]) fake.addFolder(`${PROFILES}\\${name}`);
    fake.addFile(CABINET_FILE, JSON.stringify({ version: 1, activeProfile: active }));
    const store = createProfileStore(fake);
    const tableOfTheDay = createPeriodTable(fake, TABLE_OF_THE_DAY, store);
    const tableOfTheWeek = createPeriodTable(fake, TABLE_OF_THE_WEEK, store);
    const randomGame = createRandomGame(fake, store, { animateTo: async () => {}, skipAnimation: true });
    const challenges = createChallenges(fake, store,
        { tableOfTheDay, tableOfTheWeek, randomGame, random: scripted([...randoms]) });
    createChallengeCard(fake, challenges, store);
    return { fake, store };
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

    // differentTables is the only template yet: nothing left to draw.
    assert.deepEqual(cabinetChallenge(fake), {
        current: { week: "2026-09-28", template: "", param: null, target: 0 },
        previous: lastWeek,
    });
    assert.ok(!cardShown(fake));
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

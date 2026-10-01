// ============================================================
// Challenge module: owns the Challenges' state model. The week's
// Challenge is drawn the first time it is needed in a week, among the
// feasible templates other than the previous Challenge's (tables of a
// manufacturer or decade, different tables, manufacturers or decades,
// never the community tables' manufacturer as an option; tables never
// played or not played for six months, reachable by every Profile that
// sets the bar; the Table of the Day on different days or days played, never
// more than the days left; games on the Table of the Week, on the same
// table or launched as Random Games; minutes on one table or in total),
// and locked in cabinet.json with the previous one; each Profile, Guest
// included, follows it in its own profile.json ("challenge"), where the
// games that count are kept with their facts, progress being recomputed
// from them. The game
// that first reaches the target completes the Challenge: the Profile's
// completed count goes up and a Challenge Toast is submitted. When a
// Profile first shows up in a later week, the previous Challenge is judged
// once and the verdict kept in its history. It also selects the Challenge
// Tables among the tables the active Profile can see, for the templates
// where some tables move the Challenge forward, and reads a Profile's
// record of completed Challenges.
// Created from the PinballY host, the Profile store, the Period Tables, the
// Random Game module, the Achievement Toast module and a random source; the
// Add-ons share one instance through getChallenges(). Listens to "gamestarted" /
// "gameover" to count games.
// ============================================================

import { safeHandler } from "./safe_handler.js";
import { createPinballYHost } from "./pinbally_host.js";
import { getProfileStore, MIN_PLAY_SECONDS } from "./profile_store.js";
import { getTableOfTheDay, getTableOfTheWeek, formatDateKey, getWeekKey } from "./period_table.js";
import { getRandomGame } from "./random_game.js";
import { getDecadeStartYear } from "./decade.js";
import { isVisibleTo, tablesVisibleTo } from "./visible_tables.js";
import { getAchievementToasts, TOAST_KIND } from "./achievement_toast.js";
import config from "./config.js";
import lang from "./i18n.js";

const SCRIPT_NAME = "Challenges";

const COUNT_RANGE = Object.freeze({ min: 2, max: 5 });
const ENDURANCE_MINUTES = Object.freeze({ min: 15, max: 30 });
const MARATHON_MINUTES = Object.freeze({ min: 40, max: 80 });
const DUSTY_DAYS = 183;
const DAY_MS = 24 * 60 * 60 * 1000;

// Players' saved data: the cabinet.json key and the week's lock when no
// template was feasible.
const CABINET_KEY = "challenge";
const NO_TEMPLATE = "";

// Today included: 7 on Monday, 1 on Sunday.
const daysLeftInWeek = date => 7 - (date.getDay() + 6) % 7;

const NO_PLAY = Object.freeze({ count: 0, lastPlayed: "" });
const wasNeverPlayed = play => play.count === 0;
// A never played table has no last play: it is never dusty.
const wasDusty = (play, date) =>
    play.count > 0 && date.getTime() - new Date(play.lastPlayed).getTime() > DUSTY_DAYS * DAY_MS;

const distinct = values => new Set(values).size;
const distinctTables = games => distinct(games.map(game => game.configId));
const onlyTable = (tables, periodTable) =>
    tables.filter(table => periodTable && table.configId === periodTable.configId);
const notCounted = (tables, games) => tables.filter(table => !games.some(game => game.configId === table.configId));
const distinctDays = games => distinct(games.map(game => game.day));
const totalSeconds = games => games.reduce((sum, game) => sum + game.seconds, 0);
// The highest of totalOf over each table's games, 0 without any.
function bestTableTotal(games, totalOf) {
    const byTable = new Map();
    for (const game of games) byTable.set(game.configId, [...(byTable.get(game.configId) || []), game]);
    return Math.max(0, ...[...byTable.values()].map(totalOf));
}
// Applied to summed seconds, so that no game's last partial minute is lost.
const wholeMinutes = seconds => Math.floor(seconds / 60);
// A table without a manufacturer or a year has no value to count.
const isKnown = value => value !== "" && value !== null;
const distinctKnown = values => distinct(values.filter(isKnown));
const manufacturerOf = table => table.manufacturer || "";
const decadeOf = table => getDecadeStartYear(table.year);
const countTarget = max => Math.min(COUNT_RANGE.max, max);
// One option without a parameter, its target up to max (at most 5), or
// none when fewer than 2 would be reachable.
const countOption = max => (max >= COUNT_RANGE.min ? [{ param: null, max: countTarget(max) }] : []);
// Without a visible table there is no Period Table and no game that counts.
const isPlayable = context => context.visibleTables.length > 0;
const countOptionWhenPlayable = (context, max) => countOption(isPlayable(context) ? max : 0);
const minutesOptionWhenPlayable = (context, range) => (isPlayable(context) ? [{ param: null, ...range }] : []);

// One option per value of keyOf shared by at least 2 tables, its target up
// to that value's table count.
function groupOptions(tables, keyOf) {
    const counts = new Map();
    for (const table of tables) {
        const key = keyOf(table);
        if (isKnown(key)) counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts]
        .filter(([, count]) => count >= COUNT_RANGE.min)
        .map(([param, count]) => ({ param, max: countTarget(count) }));
}

// The least, across the Profiles that set the bar, of visible tables whose
// play record matches: a target each of them can reach.
function leastAcrossProfiles(context, matches) {
    const { visibleTables, profilePlays } = context;
    return Math.min(...profilePlays.map(plays =>
        visibleTables.filter(table => matches(plays[table.configId] || NO_PLAY)).length));
}

// Template ids are players' saved data (cabinet.json, history): never rename one.
// options(context): the feasible { param, min?, max } choices, none when infeasible.
// Targets are counts, or minutes for endurance and marathon.
// progress(games, param): the value compared with the target.
// tablesToPlay(context): the Challenge Tables, visible tables that would move
// the Challenge forward; only for the templates where that makes sense.
// differentTables stays first: a scripted draw of 0 picks it.
const TEMPLATES = Object.freeze({
    differentTables: {
        options: context => countOption(context.visibleTables.length),
        progress: games => distinctTables(games),
    },
    manufacturerTables: {
        // The community tables' manufacturer is not a real one.
        options: context => groupOptions(
            context.visibleTables.filter(table => manufacturerOf(table) !== config.communityTablesManufacturer), manufacturerOf),
        progress: (games, manufacturer) => distinctTables(games.filter(game => game.manufacturer === manufacturer)),
        tablesToPlay: ({ visibleTables, games, param }) =>
            notCounted(visibleTables.filter(table => manufacturerOf(table) === param), games),
    },
    decadeTables: {
        options: context => groupOptions(context.visibleTables, decadeOf),
        progress: (games, decade) => distinctTables(games.filter(game => game.decade === decade)),
        tablesToPlay: ({ visibleTables, games, param }) =>
            notCounted(visibleTables.filter(table => decadeOf(table) === param), games),
    },
    differentManufacturers: {
        options: context => countOption(distinctKnown(context.visibleTables.map(manufacturerOf))),
        progress: games => distinctKnown(games.map(game => game.manufacturer)),
    },
    differentDecades: {
        options: context => countOption(distinctKnown(context.visibleTables.map(decadeOf))),
        progress: games => distinctKnown(games.map(game => game.decade)),
    },
    neverPlayedTables: {
        options: context => countOption(leastAcrossProfiles(context, wasNeverPlayed)),
        progress: games => distinctTables(games.filter(game => game.wasNeverPlayed)),
        tablesToPlay: ({ visibleTables, playOf }) => visibleTables.filter(table => wasNeverPlayed(playOf(table))),
    },
    dustyTables: {
        options: context => countOption(leastAcrossProfiles(context, play => wasDusty(play, context.now))),
        progress: games => distinctTables(games.filter(game => game.wasDusty)),
        tablesToPlay: ({ visibleTables, playOf, now }) => visibleTables.filter(table => wasDusty(playOf(table), now)),
    },
    tableOfTheDayDays: {
        options: context => countOptionWhenPlayable(context, context.daysLeft),
        progress: games => distinctDays(games.filter(game => game.isTableOfTheDay)),
        tablesToPlay: ({ visibleTables, games, now, getDayTable }) => {
            const today = formatDateKey(now);
            if (games.some(game => game.isTableOfTheDay && game.day === today)) return [];
            return onlyTable(visibleTables, getDayTable());
        },
    },
    tableOfTheWeekGames: {
        options: context => countOptionWhenPlayable(context, COUNT_RANGE.max),
        progress: games => games.filter(game => game.isTableOfTheWeek).length,
        tablesToPlay: ({ visibleTables, getWeekTable }) => onlyTable(visibleTables, getWeekTable()),
    },
    activeDays: {
        options: context => countOptionWhenPlayable(context, context.daysLeft),
        progress: games => distinctDays(games),
    },
    // The table of the player's choice: the one with the most minutes.
    endurance: {
        options: context => minutesOptionWhenPlayable(context, ENDURANCE_MINUTES),
        progress: games => wholeMinutes(bestTableTotal(games, totalSeconds)),
    },
    marathon: {
        options: context => minutesOptionWhenPlayable(context, MARATHON_MINUTES),
        progress: games => wholeMinutes(totalSeconds(games)),
    },
    randomGames: {
        options: context => countOptionWhenPlayable(context, COUNT_RANGE.max),
        progress: games => games.filter(game => game.randomGame).length,
    },
    // The table of the player's choice: the one with the most games.
    sameTableGames: {
        options: context => countOptionWhenPlayable(context, COUNT_RANGE.max),
        progress: games => bestTableTotal(games, tableGames => tableGames.length),
    },
});
export const CHALLENGE_TEMPLATE_IDS = Object.freeze(Object.keys(TEMPLATES));

const NO_CHALLENGE = Object.freeze({ current: null, previous: null });
const emptyProfileChallenge = () => ({
    firstWeek: "", week: "", games: [], completed: false, completedCount: 0, judgedWeek: "", history: [],
});

export function createChallenges(host, profileStore, { tableOfTheDay, tableOfTheWeek, randomGame, toasts, random = Math.random }) {
    const randomIndex = length => Math.floor(random() * length);
    const randomInt = (min, max) => min + randomIndex(max - min + 1);
    const log = text => host.log(`[${SCRIPT_NAME}] ${text}`);

    const getLocks = () => ({ ...NO_CHALLENGE, ...profileStore.getCabinetData()[CABINET_KEY] });
    const isChallenge = challenge => Boolean(challenge && challenge.template in TEMPLATES);
    const progressOf = (challenge, games) => TEMPLATES[challenge.template].progress(games, challenge.param);

    // Every template but the previous Challenge's with a feasible option;
    // one of them, then one of its options, then a target in its range.
    function draw(week, previous) {
        const profiles = profileStore.listProfiles();
        // Guest is the visitors' seat and may draw a target it cannot reach,
        // unless it is the only one playing: no other Profile, or no picker
        // to switch away from it.
        const guestSetsTheBar = profiles.every(profile => profile.isGuest) || config.addOns.profilePicker === false;
        const profilePlays = profiles
            .filter(profile => guestSetsTheBar || !profile.isGuest)
            .map(profile => profileStore.getPlaysOf(profile.name));
        const now = host.now();
        const context = { visibleTables: host.getVisibleTables(), profilePlays, now, daysLeft: daysLeftInWeek(now) };
        const candidates = Object.entries(TEMPLATES)
            .filter(([id]) => !previous || previous.template !== id)
            .map(([id, template]) => ({ id, options: template.options(context) }))
            .filter(candidate => candidate.options.length > 0);
        if (candidates.length === 0) return { week, template: NO_TEMPLATE, param: null, target: 0 };
        const { id, options } = candidates[randomIndex(candidates.length)];
        const option = options[randomIndex(options.length)];
        return { week, template: id, param: option.param, target: randomInt(option.min || COUNT_RANGE.min, option.max) };
    }

    // The week's Challenge, drawn on its first need in the week; null when
    // no template was feasible that week.
    function getCurrent() {
        const week = getWeekKey(host.now());
        const locks = getLocks();
        if (!locks.current || locks.current.week !== week) {
            const current = draw(week, locks.current);
            profileStore.updateCabinetData(cabinet => {
                cabinet[CABINET_KEY] = { current, previous: locks.current };
            });
            log(`Week ${week}: ${current.template ? `"${current.template}" drawn, target ${current.target}` : "no feasible Challenge"}.`);
            return isChallenge(current) ? current : null;
        }
        return isChallenge(locks.current) ? locks.current : null;
    }

    const readProfileChallenge = data => ({ ...emptyProfileChallenge(), ...data.challenge });
    // Set by a counted game that moved the Challenge forward, until its
    // Profile shows up on the wheel.
    let progressedProfile = null;

    // The previous Challenge's verdict for this Profile record, or null when
    // it gets none: no previous Challenge, already judged, or drawn before
    // the Profile first saw a Challenge.
    function judge(state, previous) {
        if (!isChallenge(previous) || !state.firstWeek || previous.week < state.firstWeek) return null;
        if (state.judgedWeek === previous.week) return null;
        const followed = state.week === previous.week;
        return {
            challenge: previous,
            reached: followed ? Math.min(previous.target, progressOf(previous, state.games)) : 0,
            completed: followed && state.completed,
        };
    }

    // When the active Profile shows up on the wheel (startup, Profile
    // switch, back from a game): draws the week's Challenge if needed, judges
    // the previous one once and starts following the week's. Returns whether
    // the card has something new, and the verdict to show first, if any.
    function showUp({ switched = false } = {}) {
        const profile = profileStore.getActiveProfile();
        const progressed = progressedProfile === profile.name;
        progressedProfile = null;
        const current = getCurrent();
        const state = readProfileChallenge(profile.data);
        // Only the last Challenge before the week's is ever judged: after an
        // absence, the weeks in between leave no trace.
        const verdict = judge(state, getLocks().previous);
        const follows = !current || state.week === current.week;
        if (!verdict && follows) return { hasNews: Boolean(current) && (switched || progressed), verdict: null };

        profileStore.updateProfileData(data => {
            const next = { ...state };
            if (verdict) {
                const { week, template, param, target } = verdict.challenge;
                next.history = [...state.history, { week, template, param, target, reached: verdict.reached, completed: verdict.completed }];
                next.judgedWeek = week;
            }
            if (!follows) Object.assign(next, { firstWeek: state.firstWeek || current.week, week: current.week, games: [], completed: false });
            data.challenge = next;
        });
        if (verdict) log(`${profile.name}: week ${verdict.challenge.week} Challenge ${verdict.completed ? "completed" : "missed"} (${verdict.reached}/${verdict.challenge.target}).`);
        return { hasNews: Boolean(current), verdict };
    }

    // The active Profile's view of the week's Challenge, or null when it
    // has none to show (no Challenge, not followed yet).
    function getActiveView() {
        const profile = profileStore.getActiveProfile();
        const current = getCurrent();
        if (!current) return null;
        const state = readProfileChallenge(profile.data);
        if (state.week !== current.week) return null;
        return {
            challenge: current,
            value: Math.min(current.target, progressOf(current, state.games)),
            daysLeft: daysLeftInWeek(host.now()),
            completed: state.completed,
        };
    }

    // The active Profile's completed Challenges out of every Challenge it
    // completed or missed. Read from the completed count,
    // not the verdicts, so it agrees with the Challenges Achievements and
    // counts this week's Challenge as soon as it is completed.
    function getRecord() {
        const state = readProfileChallenge(profileStore.getActiveProfile().data);
        const missed = state.history.filter(verdict => !verdict.completed).length;
        return { completed: state.completedCount, total: state.completedCount + missed };
    }

    // The active Profile's Challenge Tables, in collection order; none
    // without a Challenge to follow, once it is completed, or for
    // the templates that have none.
    function getTablesToPlay() {
        const view = getActiveView();
        if (!view || view.completed) return [];
        const { tablesToPlay } = TEMPLATES[view.challenge.template];
        if (!tablesToPlay) return [];
        return tablesToPlay({
            visibleTables: tablesVisibleTo(host.getVisibleTables(), profileStore),
            games: readProfileChallenge(profileStore.getActiveProfile().data).games,
            param: view.challenge.param,
            playOf: table => profileStore.getPlay(table.configId),
            now: host.now(),
            // Only when needed: getTable() locks a new period's table in cabinet.json.
            getDayTable: () => tableOfTheDay.getTable(),
            getWeekTable: () => tableOfTheWeek.getTable(),
        });
    }

    // The started game's facts, noted before the Profile store records the
    // play at "gameover" (a never played table stops being one), for the
    // Profile active then; by table, like the store.
    const startedGames = new Map();

    function factsOf(game, start) {
        const play = profileStore.getPlay(game.configId);
        const dayTable = tableOfTheDay.getTable();
        const weekTable = tableOfTheWeek.getTable();
        return {
            configId: game.configId,
            manufacturer: manufacturerOf(game),
            decade: decadeOf(game),
            day: formatDateKey(start),
            seconds: 0,
            randomGame: randomGame.isStartedGameRandom(),
            isTableOfTheDay: Boolean(dayTable && dayTable.configId === game.configId),
            isTableOfTheWeek: Boolean(weekTable && weekTable.configId === game.configId),
            wasNeverPlayed: wasNeverPlayed(play),
            wasDusty: wasDusty(play, start),
        };
    }

    // Fires on table launch.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, ev => {
        const profile = profileStore.getActiveProfile();
        if (!ev.game) return;
        const start = host.now();
        startedGames.set(ev.game.configId, { profileName: profile.name, start, facts: factsOf(ev.game, start) });
    }));

    // Fires on table exit: the game counts when it lasted long enough, on a
    // table the Profile can still see, for a Profile following the Challenge
    // of the week the game started in; the first one to reach the target
    // completes it.
    host.on("gameover", safeHandler(SCRIPT_NAME, ev => {
        const started = ev.game && startedGames.get(ev.game.configId);
        if (!started) return;
        startedGames.delete(ev.game.configId);
        const seconds = Math.round((host.now().getTime() - started.start.getTime()) / 1000);
        const table = host.getGameInfo(ev.game.configId);
        if (seconds < MIN_PLAY_SECONDS || !table || !isVisibleTo(table, profileStore, started.profileName)) return;

        const week = getWeekKey(started.start);
        const { current, previous } = getLocks();
        const challenge = [current, previous].find(candidate => isChallenge(candidate) && candidate.week === week);
        if (!challenge) return;
        let completedCount = 0;
        profileStore.updateProfileData(data => {
            const state = readProfileChallenge(data);
            if (state.week !== week || state.judgedWeek === week) return;
            const before = progressOf(challenge, state.games);
            const games = [...state.games, { ...started.facts, seconds }];
            const progress = progressOf(challenge, games);
            data.challenge = { ...state, games };
            if (progress > before) progressedProfile = started.profileName;
            if (!state.completed && progress >= challenge.target) {
                completedCount = state.completedCount + 1;
                data.challenge = { ...data.challenge, completed: true, completedCount };
            }
        }, started.profileName);
        if (completedCount === 0) return;
        log(`${started.profileName} completed the week ${week} Challenge.`);
        toasts.submit({
            kind: TOAST_KIND.CHALLENGE,
            title: lang.challenges.titles[challenge.template](challenge.target, challenge.param),
            description: lang.challenges.toastDescription(completedCount),
            onShown() {},
        });
    }));

    return { getCurrent, showUp, getActiveView, getTablesToPlay, getRecord };
}

let sharedChallenges = null;

// One instance for every Add-on, sharing the Achievement Toasts' queue.
// The Random Game module is created first, so its "gamestarted" listener
// has settled whether the game is a Random Game before this one notes it.
export function getChallenges() {
    if (!sharedChallenges) {
        const randomGame = getRandomGame();
        sharedChallenges = createChallenges(createPinballYHost(), getProfileStore(),
            { tableOfTheDay: getTableOfTheDay(), tableOfTheWeek: getTableOfTheWeek(), randomGame,
                toasts: getAchievementToasts() });
    }
    return sharedChallenges;
}

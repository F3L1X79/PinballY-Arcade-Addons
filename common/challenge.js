// ============================================================
// Challenge module: owns the Challenges' state model. The week's
// Challenge is drawn the first time it is needed in a week, among the
// feasible templates other than the previous Challenge's, and locked in
// cabinet.json with the previous one; each non-Guest Profile follows it
// in its own profile.json ("challenge"), where the games that count are
// kept with their facts, progress being recomputed from them. Created from
// the PinballY host, the Profile store, the Period Tables, the Random Game
// module and a random source; the Add-ons share one instance through
// getChallenges(). Listens to "gamestarted" / "gameover" to count games.
// ============================================================

import { safeHandler } from "./safe_handler.js";
import { createPinballYHost } from "./pinbally_host.js";
import { getProfileStore } from "./profile_store.js";
import { getTableOfTheDay, getTableOfTheWeek, formatDateKey, getWeekKey } from "./period_table.js";
import { getRandomGame } from "./random_game.js";
import { getDecadeStartYear } from "./decade.js";

const SCRIPT_NAME = "Challenges";

// A shorter game never counts: launching and quitting a table is not playing it.
const MIN_GAME_SECONDS = 60;
const COUNT_RANGE = Object.freeze({ min: 2, max: 5 });
const DUSTY_DAYS = 183;
const DAY_MS = 24 * 60 * 60 * 1000;

// Players' saved data: the cabinet.json key and the week's lock when no
// template was feasible.
const CABINET_KEY = "challenge";
const NO_TEMPLATE = "";

// Today included: 7 on Monday, 1 on Sunday.
const daysLeftInWeek = date => 7 - (date.getDay() + 6) % 7;

const distinct = values => new Set(values).size;
const distinctTables = games => distinct(games.map(game => game.configId));
// One option without a parameter, its target up to max (at most 5), or
// none when fewer than 2 would be reachable.
const countOption = max => (max >= COUNT_RANGE.min ? [{ param: null, max: Math.min(COUNT_RANGE.max, max) }] : []);

// Template ids are players' saved data (cabinet.json, history): never rename one.
// options(context): the feasible { param, min?, max } choices, none when infeasible.
// progress(games, param): the value compared with the target.
const TEMPLATES = Object.freeze({
    differentTables: {
        options: context => countOption(context.visibleTables.length),
        progress: games => distinctTables(games),
    },
});

const NO_CHALLENGE = Object.freeze({ current: null, previous: null });
const emptyProfileChallenge = () => ({
    firstWeek: "", week: "", games: [], completed: false, completedCount: 0, judgedWeek: "", history: [],
});

export function createChallenges(host, profileStore, { tableOfTheDay, tableOfTheWeek, randomGame, random = Math.random }) {
    const randomIndex = length => Math.floor(random() * length);
    const randomInt = (min, max) => min + randomIndex(max - min + 1);
    const log = text => host.log(`[${SCRIPT_NAME}] ${text}`);

    const getLocks = () => ({ ...NO_CHALLENGE, ...profileStore.getCabinetData()[CABINET_KEY] });
    const isChallenge = challenge => Boolean(challenge && challenge.template in TEMPLATES);
    const progressOf = (challenge, games) => TEMPLATES[challenge.template].progress(games, challenge.param);

    // Every template but the previous Challenge's with a feasible option;
    // one of them, then one of its options, then a target in its range.
    function draw(week, previous) {
        const context = { visibleTables: host.getVisibleTables() };
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

    // When the active Profile shows up on the wheel (startup, Profile
    // switch, back from a game): draws the week's Challenge if needed and
    // starts following it. Returns whether the card has something new.
    // Guest needs no Challenge: none is drawn for it.
    function showUp({ switched = false } = {}) {
        const profile = profileStore.getActiveProfile();
        const progressed = progressedProfile === profile.name;
        progressedProfile = null;
        if (profile.isGuest) return { hasNews: false };
        const current = getCurrent();
        if (!current) return { hasNews: false };

        const state = readProfileChallenge(profile.data);
        if (state.week === current.week) return { hasNews: switched || progressed };
        profileStore.updateProfileData(data => {
            data.challenge = { ...state, firstWeek: state.firstWeek || current.week, week: current.week, games: [], completed: false };
        });
        return { hasNews: true };
    }

    // The active Profile's view of the week's Challenge, or null when it
    // has none to show (Guest, no Challenge, not followed yet).
    function getActiveView() {
        const profile = profileStore.getActiveProfile();
        if (profile.isGuest) return null;
        const current = getCurrent();
        if (!current) return null;
        const state = readProfileChallenge(profile.data);
        if (state.week !== current.week) return null;
        return {
            challenge: current,
            value: Math.min(current.target, progressOf(current, state.games)),
            daysLeft: daysLeftInWeek(host.now()),
        };
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
            manufacturer: game.manufacturer || "",
            decade: getDecadeStartYear(game.year),
            day: formatDateKey(start),
            seconds: 0,
            randomGame: randomGame.isStartedGameRandom(),
            isTableOfTheDay: Boolean(dayTable && dayTable.configId === game.configId),
            isTableOfTheWeek: Boolean(weekTable && weekTable.configId === game.configId),
            wasNeverPlayed: play.count === 0,
            wasDusty: play.count > 0 && start.getTime() - new Date(play.lastPlayed).getTime() > DUSTY_DAYS * DAY_MS,
        };
    }

    // Fires on table launch; Guest's games are never noted.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, ev => {
        const profile = profileStore.getActiveProfile();
        if (!ev.game || profile.isGuest) return;
        const start = host.now();
        startedGames.set(ev.game.configId, { profileName: profile.name, start, facts: factsOf(ev.game, start) });
    }));

    // Fires on table exit: the game counts when it lasted long enough, on
    // a table still visible, for a Profile following the Challenge of the
    // week the game started in.
    host.on("gameover", safeHandler(SCRIPT_NAME, ev => {
        const started = ev.game && startedGames.get(ev.game.configId);
        if (!started) return;
        startedGames.delete(ev.game.configId);
        const seconds = Math.round((host.now().getTime() - started.start.getTime()) / 1000);
        const table = host.getGameInfo(ev.game.configId);
        if (seconds < MIN_GAME_SECONDS || !table || table.isHidden) return;

        const week = getWeekKey(started.start);
        const { current, previous } = getLocks();
        const challenge = [current, previous].find(candidate => isChallenge(candidate) && candidate.week === week);
        if (!challenge) return;
        profileStore.updateProfileData(data => {
            const state = readProfileChallenge(data);
            if (state.week !== week || state.judgedWeek === week) return;
            const before = progressOf(challenge, state.games);
            const games = [...state.games, { ...started.facts, seconds }];
            data.challenge = { ...state, games };
            if (progressOf(challenge, games) > before) progressedProfile = started.profileName;
        }, started.profileName);
    }));

    return { getCurrent, showUp, getActiveView };
}

let sharedChallenges = null;

// One instance for every Add-on. The Random Game module is created first,
// so its "gamestarted" listener has settled whether the game is a Random
// Game before this one notes it.
export function getChallenges() {
    if (!sharedChallenges) {
        const randomGame = getRandomGame();
        sharedChallenges = createChallenges(createPinballYHost(), getProfileStore(),
            { tableOfTheDay: getTableOfTheDay(), tableOfTheWeek: getTableOfTheWeek(), randomGame });
    }
    return sharedChallenges;
}

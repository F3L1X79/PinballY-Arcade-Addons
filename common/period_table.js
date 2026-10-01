// ============================================================
// Period Table module: picks a table once per Period and keeps it for the
// whole Period, launches it, and keeps its Streak and its Periods Played.
// Created from the PinballY host, a Period definition (TABLE_OF_THE_DAY,
// TABLE_OF_THE_WEEK) and the Profile store; the add-ons share one instance
// of each through getTableOfTheDay() and getTableOfTheWeek(). The table is
// the same for the whole household and locked in cabinet.json; the Streak
// and Periods Played belong to the active Profile (its profile.json). A
// Period counts when its table starts playing ("gamestarted"), however it
// was launched, for the Profile active then. While the table is an Adult
// Table, it is not offered to a Child Profile, and cabinet.json keeps that
// Period next to the lock so the child's Streak goes on across it.
// ============================================================

import { safeHandler } from "./safe_handler.js";
import { createPinballYHost } from "./pinbally_host.js";
import { getProfileStore } from "./profile_store.js";
import { isAdultTable } from "./adult_tables.js";

const SCRIPT_NAME = "PeriodTable";

// Also the Challenges' day key: saved in profile.json, it must never change.
export function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function shiftDateKey(dateKey, days) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return formatDateKey(new Date(year, month - 1, day + days));
}

// A week runs Monday to Sunday and is keyed by its Monday's date; the
// Challenges share it.
export function getWeekKey(date) {
    const dayOfWeek = date.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    return formatDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday));
}

function pickPurelyRandom(tables) {
    return tables[Math.floor(Math.random() * tables.length)];
}

function pickNeverPlayedOrOldest(tables) {
    const neverPlayed = tables.filter(game => !game.lastPlayed);
    if (neverPlayed.length > 0) {
        return pickPurelyRandom(neverPlayed);
    }

    return tables.reduce((oldest, game) =>
        game.lastPlayed < oldest.lastPlayed ? game : oldest
    );
}

// The name keys the lock in cabinet.json and the Streak in profile.json:
// it is players' saved progress and must never change.
export const TABLE_OF_THE_DAY = {
    name: "tableOfTheDay",
    getPeriodKey: formatDateKey,
    getPreviousPeriodKey: dayKey => shiftDateKey(dayKey, -1),
    pickTable: pickNeverPlayedOrOldest,
};

export const TABLE_OF_THE_WEEK = {
    name: "tableOfTheWeek",
    getPeriodKey: getWeekKey,
    getPreviousPeriodKey: weekKey => shiftDateKey(weekKey, -7),
    pickTable: pickPurelyRandom,
};

const NO_LOCK = Object.freeze({ configId: "", period: "", adultPeriods: [] });
// A Child Profile's Streak only skips the adult Periods since its last
// play: two months of days, or more than a year of weeks, is more than
// any realistic gap.
const MAX_ADULT_PERIODS = 60;
const NO_STREAK = Object.freeze({ current: 0, longest: 0, lastPeriod: "", periodsPlayed: 0 });

export function createPeriodTable(host, definition, profileStore) {
    const { name, getPeriodKey, getPreviousPeriodKey, pickTable } = definition;

    // A record missing a field (hand-edited file) gets it empty, never NaN.
    const getLock = () => {
        const lock = { ...NO_LOCK, ...profileStore.getCabinetData()[name] };
        return Array.isArray(lock.adultPeriods) ? lock : { ...lock, adultPeriods: [] };
    };
    const getStreakRecord = () => ({ ...NO_STREAK, ...profileStore.getProfileData().streaks[name] });

    // Also keeps the Period among the adult Periods exactly while its table
    // is an Adult Table, which follows a table tagged or untagged mid-Period.
    function getTable() {
        const currentPeriod = getPeriodKey(host.now());
        const game = getLockedTable(currentPeriod) || pickNewTable(currentPeriod);
        markAdultPeriod(currentPeriod, game !== null && isAdultTable(game));
        return game;
    }

    function getLockedTable(currentPeriod) {
        const { period: lockedPeriod, configId: lockedConfigId } = getLock();
        if (lockedPeriod !== currentPeriod || !lockedConfigId) return null;
        const lockedGame = host.getGameInfo(lockedConfigId);
        return lockedGame && !lockedGame.isHidden ? lockedGame : null;
    }

    function pickNewTable(currentPeriod) {
        const { period: lockedPeriod, configId: lockedConfigId, adultPeriods } = getLock();

        // A new Period never repeats the previous Period's table, unless it
        // is the only visible one. The pick reads PinballY's own play stats,
        // the household's history, whoever is active.
        const excludeConfigId = lockedPeriod !== currentPeriod ? lockedConfigId : "";
        const visibleTables = host.getVisibleTables();
        if (visibleTables.length === 0) return null;
        const otherTables = visibleTables.filter(game => game.configId !== excludeConfigId);
        const newPick = pickTable(otherTables.length > 0 ? otherTables : visibleTables);

        profileStore.updateCabinetData(cabinet => {
            cabinet[name] = withAdultPeriods({ configId: newPick.configId, period: currentPeriod }, adultPeriods);
        });
        return newPick;
    }

    // The key is left out of the lock until there is a Period to keep.
    const withAdultPeriods = (lock, adultPeriods) => (adultPeriods.length > 0 ? { ...lock, adultPeriods } : lock);

    function markAdultPeriod(period, isAdult) {
        const { adultPeriods } = getLock();
        if (adultPeriods.includes(period) === isAdult) return;
        const updated = isAdult
            ? [...adultPeriods, period].slice(-MAX_ADULT_PERIODS)
            : adultPeriods.filter(adultPeriod => adultPeriod !== period);
        profileStore.updateCabinetData(cabinet => {
            const { adultPeriods: _, ...lock } = cabinet[name];
            cabinet[name] = withAdultPeriods(lock, updated);
        });
    }

    // Not offered to a Child Profile while it is an Adult Table. Like
    // getTable(), it may pick this Period's table and lock it.
    const isKeptFromChild = game => game !== null && isAdultTable(game) && profileStore.isChild();
    const isOffered = () => !isKeptFromChild(getTable());
    // This Period's table, or null when it is not offered to the active Profile.
    function getOfferedTable() {
        const game = getTable();
        return isKeptFromChild(game) ? null : game;
    }

    // Whether currentPeriod follows lastPeriod in a Streak: for a Child
    // Profile, the adult Periods between them are skipped, not missed.
    function followsInStreak(lastPeriod, currentPeriod) {
        const skipped = profileStore.isChild() ? getLock().adultPeriods : [];
        let period = getPreviousPeriodKey(currentPeriod);
        while (period !== lastPeriod && skipped.includes(period)) period = getPreviousPeriodKey(period);
        return period === lastPeriod;
    }

    function launch() {
        const game = getTable();
        if (game) host.playGame(game);
    }

    const getLongestStreak = () => getStreakRecord().longest;
    const getPeriodsPlayed = () => getStreakRecord().periodsPlayed;

    function recordPeriodPlayed(currentPeriod) {
        const { current, longest, lastPeriod, periodsPlayed } = getStreakRecord();
        if (lastPeriod === currentPeriod) return;

        const newStreak = followsInStreak(lastPeriod, currentPeriod) ? current + 1 : 1;
        profileStore.updateProfileData(data => {
            data.streaks[name] = {
                current: newStreak,
                longest: Math.max(longest, newStreak),
                lastPeriod: currentPeriod,
                periodsPlayed: periodsPlayed + 1,
            };
        });
    }

    function getStreak() {
        const currentPeriod = getPeriodKey(host.now());
        const { current, lastPeriod } = getStreakRecord();

        // The stored counter is only reset on the next play, so a Streak whose
        // last Period is older than the previous one is already broken.
        if (lastPeriod !== currentPeriod && !followsInStreak(lastPeriod, currentPeriod)) return 0;
        return current;
    }

    // Fires when a launched table's first window opens (never after a failed
    // launch). Picks this Period's table if nobody asked for it yet (e.g.
    // PinballY left open past midnight), so a table picked by hand on the
    // wheel is compared with this Period's table, never a stale pick.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, ev => {
        const periodTable = getTable();
        if (!ev.game || !periodTable || ev.game.configId !== periodTable.configId) return;
        recordPeriodPlayed(getPeriodKey(host.now()));
    }));

    return { getTable, isOffered, getOfferedTable, launch, getStreak, getLongestStreak, getPeriodsPlayed };
}

let sharedTableOfTheDay = null;
let sharedTableOfTheWeek = null;

// One instance of each for every add-on, so the Streak is recorded once per
// play and the startup prompt, the main menu and the achievements agree.
// The first call starts listening for plays, so the Streak is only recorded
// while at least one of those add-ons is enabled.
export function getTableOfTheDay() {
    if (!sharedTableOfTheDay) sharedTableOfTheDay = createPeriodTable(createPinballYHost(), TABLE_OF_THE_DAY, getProfileStore());
    return sharedTableOfTheDay;
}

export function getTableOfTheWeek() {
    if (!sharedTableOfTheWeek) sharedTableOfTheWeek = createPeriodTable(createPinballYHost(), TABLE_OF_THE_WEEK, getProfileStore());
    return sharedTableOfTheWeek;
}

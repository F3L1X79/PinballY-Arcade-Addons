// ============================================================
// Period Table module: picks a table once per Period and keeps it for the
// whole Period, launches it, and keeps its Streak and its Periods Played.
// Created from the PinballY host, a Period definition (TABLE_OF_THE_DAY,
// TABLE_OF_THE_WEEK) and the Profile store; the add-ons share one instance
// of each through getTableOfTheDay() and getTableOfTheWeek(). The table is
// the same for the whole household and locked in cabinet.json; the Streak
// and Periods Played belong to the active Profile (its profile.json). A
// Period counts when its table starts playing ("gamestarted"), however it
// was launched, for the Profile active then.
// ============================================================

import { safeHandler } from "./safe_handler.js";
import { createPinballYHost } from "./pinbally_host.js";
import { getProfileStore } from "./profile_store.js";

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

const NO_LOCK = Object.freeze({ configId: "", period: "" });
const NO_STREAK = Object.freeze({ current: 0, longest: 0, lastPeriod: "", periodsPlayed: 0 });

export function createPeriodTable(host, definition, profileStore) {
    const { name, getPeriodKey, getPreviousPeriodKey, pickTable } = definition;

    // A record missing a field (hand-edited file) gets it empty, never NaN.
    const getLock = () => ({ ...NO_LOCK, ...profileStore.getCabinetData()[name] });
    const getStreakRecord = () => ({ ...NO_STREAK, ...profileStore.getProfileData().streaks[name] });

    function getTable() {
        const currentPeriod = getPeriodKey(host.now());
        const { period: lockedPeriod, configId: lockedConfigId } = getLock();

        if (lockedPeriod === currentPeriod && lockedConfigId) {
            const lockedGame = host.getGameInfo(lockedConfigId);
            if (lockedGame && !lockedGame.isHidden) return lockedGame;
        }

        // A new Period never repeats the previous Period's table, unless it
        // is the only visible one. The pick reads PinballY's own play stats,
        // the household's history, whoever is active.
        const excludeConfigId = lockedPeriod !== currentPeriod ? lockedConfigId : "";
        const visibleTables = host.getVisibleTables();
        if (visibleTables.length === 0) return null;
        const otherTables = visibleTables.filter(game => game.configId !== excludeConfigId);
        const newPick = pickTable(otherTables.length > 0 ? otherTables : visibleTables);

        profileStore.updateCabinetData(cabinet => {
            cabinet[name] = { configId: newPick.configId, period: currentPeriod };
        });
        return newPick;
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

        const newStreak = lastPeriod === getPreviousPeriodKey(currentPeriod) ? current + 1 : 1;
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
        if (lastPeriod !== currentPeriod && lastPeriod !== getPreviousPeriodKey(currentPeriod)) return 0;
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

    return { getTable, launch, getStreak, getLongestStreak, getPeriodsPlayed };
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

// ============================================================
// Adds a "Hall of Fame" filter to PinballY's main menu, after the
// Challenge Tables and right before the Favorite Tables: the wheel then
// shows the active Profile's Hall of Fame tables in rank order, each table
// its own Next/Previous Page stop.
// Registered once at init; the ranking is recomputed each time the filter
// is activated, and on a Profile switch while the filter is on the wheel.
// ============================================================

import lang from "../common/i18n.js";
import { getHallOfFame } from "../common/hall_of_fame.js";
import { safeHandler } from "../common/safe_handler.js";
import { getProfileStore } from "../common/profile_store.js";

const SCRIPT_NAME = "HallOfFame";
const FILTER_ID = "project.HallOfFame";
// PinballY prefixes a script filter's id.
const FULL_FILTER_ID = `User.${FILTER_ID}`;

// Challenge Tables has sort key "5000" and PinballY's "Favorites" filter
// "7000" in the [Top] group.
const BEFORE_FAVORITES_SORT_KEY = "6000";

export default function init() {
    const { hallOfFameFilter: FILTER_TITLE } = lang.customMenuLabels;
    const profileStore = getProfileStore();

    // Rank (from 1) of each Hall of Fame table, by game id. Kept after the
    // scan: PinballY sorts and pages the wheel with it once select() is done.
    let ranks = new Map();

    gameList.createFilter({
        id: FILTER_ID,
        title: FILTER_TITLE,
        group: "[Top]",
        sortKey: BEFORE_FAVORITES_SORT_KEY,
        // Fires each time the filter is activated, before PinballY scans the tables.
        before: safeHandler(SCRIPT_NAME, () => {
            const hallOfFame = getHallOfFame(gameList.getAllGames(), profileStore.getPlay);
            ranks = new Map(hallOfFame.map((game, index) => [game.id, index + 1]));
        }),
        select: game => ranks.has(game.id),
        compareForSort: (a, b) => ranks.get(a.id) - ranks.get(b.id),
        // Group 0 would make the wheel skip the table, so ranks start at 1.
        pageGroup: game => ranks.get(game.id),
    });

    // refreshFilter() runs the filter again, so its before() ranks the new
    // Profile's tables.
    profileStore.onSwitch(safeHandler(SCRIPT_NAME, () => {
        if (gameList.getCurFilter().id === FULL_FILTER_ID) gameList.refreshFilter();
    }));
}

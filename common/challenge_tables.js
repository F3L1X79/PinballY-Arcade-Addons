// ============================================================
// Challenge Tables: a main menu entry, shown only while the active
// Profile's Challenge has tables that would move it forward (see
// common/challenge.js), that switches the wheel to the Challenge Tables
// script filter. The filter has no group, so it is listed in no filter
// menu; its tables are selected again each time it runs.
// ============================================================

import { safeHandler } from "./safe_handler.js";
import { MAIN_MENU_POSITION } from "./main_menu.js";
import lang from "./i18n.js";

const SCRIPT_NAME = "ChallengeTables";
const FILTER_ID = "project.ChallengeTables";
// PinballY prefixes a script filter's id.
const FULL_FILTER_ID = `User.${FILTER_ID}`;

export function createChallengeTables(host, challenges, mainMenu) {
    const { challengeTables: title } = lang.customMenuLabels;
    // Kept after the scan, like PinballY keeps the filter's selection.
    let configIds = new Set();

    host.createFilter({
        id: FILTER_ID,
        title,
        // Fires each time the filter runs, before PinballY scans the tables.
        before: safeHandler(SCRIPT_NAME, () => {
            configIds = new Set(challenges.getTablesToPlay().map(table => table.configId));
        }),
        select: game => configIds.has(game.configId),
    });

    mainMenu.add({
        name: "challengeTables",
        label: title,
        position: MAIN_MENU_POSITION.CHALLENGE_TABLES,
        shownWhen: () => challenges.getTablesToPlay().length > 0,
        // Setting the filter already shown might not run it again: tables
        // counted since would stay on the wheel.
        action: () => {
            if (host.getCurrentFilterId() === FULL_FILTER_ID) host.refreshFilter();
            else host.setCurrentFilter(FULL_FILTER_ID);
        },
    });
}

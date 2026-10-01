// ============================================================
// World Tour tracker: keeps in memory only the tables the player selected
// on PinballY's "All Tables" filter, in wheel mode, the table selected when
// the tour starts counting as seen. Listens to the game list's
// "gameselect", which the add-ons' own wheel moves (setWheelGame) never
// fire. When every table of the wheel the active Profile sees (at least
// two) has been seen, sets that Profile's worldTour flag in its
// profile.json and calls onCompleted, once per tour.
// ============================================================

import { safeHandler } from "./safe_handler.js";
import { ALL_TABLES_FILTER } from "./pinbally_host.js";

const SCRIPT_NAME = "WorldTour";
// A single table is no tour.
const MIN_WHEEL_TABLES = 2;

export function createWorldTour(host, profileStore, { onCompleted }) {
    const seenConfigIds = new Set();
    let isCompleted = false;

    const isOnAllTablesWheel = () => host.getCurrentFilterId() === ALL_TABLES_FILTER && host.getUIMode() === "wheel";

    function recordSelection(game) {
        if (isCompleted || !game || !isOnAllTablesWheel()) return;
        seenConfigIds.add(game.configId);
        // Read afresh: the metafilters keep Hidden tables, and Adult Tables
        // for a Child Profile, off this wheel.
        const wheel = host.getWheelTables();
        if (wheel.length < MIN_WHEEL_TABLES || !wheel.every(table => seenConfigIds.has(table.configId))) return;
        isCompleted = true;
        profileStore.updateProfileData(data => { data.worldTour = true; });
        onCompleted();
    }

    recordSelection(host.getWheelTables()[0]);

    // Fires after the player moved the wheel to another table.
    host.onGameListEvent("gameselect", safeHandler(SCRIPT_NAME, ev => recordSelection(ev.game)));
}

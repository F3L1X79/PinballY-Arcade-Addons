// ============================================================
// Fills PinballY's lower status line with rotating info about the selected
// table: its alphabetical position within the active filter, release year,
// manufacturer, and the active Profile's play count and total play time.
// The player's own messages from PinballY's options stay first: the table
// info is added after them, never in their place.
// Refreshes on "gameselect", "filterselect", "wheelmode" (back from a game)
// and on a Profile switch.
// ============================================================

import lang from "../common/i18n.js";
import config from "../common/config.js";
import { safeHandler } from "../common/safe_handler.js";
import { getProfileStore } from "../common/profile_store.js";

const SCRIPT_NAME = "StatusLineInfo";
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export default function init() {
    const STATUS_LINE_TEXT = lang.tableInfoStatusLines;
    const COMMUNITY_MANUFACTURER_NAME = config.communityTablesManufacturer;
    const profileStore = getProfileStore();

    // PinballY's [Game.PlayCount] and [Game.PlayTime] would show its own
    // figures, shared by every Profile: the active Profile's are written out.
    const STATUS_LINE_BUILDERS = [
        position => STATUS_LINE_TEXT.year(position),
        (position, game) => game && game.manufacturer === COMMUNITY_MANUFACTURER_NAME
            ? STATUS_LINE_TEXT.manufacturerFictional(position)
            : STATUS_LINE_TEXT.manufacturer(position),
        (position, _game, play) => STATUS_LINE_TEXT.playCount(position, play.count),
        (position, _game, play) => {
            const totalMinutes = Math.floor(play.seconds / SECONDS_PER_MINUTE);
            return STATUS_LINE_TEXT.playTime(position,
                Math.floor(totalMinutes / MINUTES_PER_HOUR), totalMinutes % MINUTES_PER_HOUR);
        },
    ];

    // Cache of the CURRENTLY FILTERED wheel titles, sorted alphabetically once
    // and reused to compute the current table's rank without re-sorting on
    // every selection. Invalidated whenever the active filter changes (see the
    // "filterselect" listener below), since a filter change swaps out which
    // games gameList.getWheelGame()/getWheelCount() return entirely.
    let cachedSortedTitles = null;

    function buildSortedTitles() {
        const wheelCount = gameList.getWheelCount();
        const titles = [];

        for (let i = 0; i < wheelCount; i++) {
            const game = gameList.getWheelGame(i);
            if (game) titles.push(String(game.title ?? ""));
        }

        titles.sort((a, b) => a.localeCompare(b));
        cachedSortedTitles = titles;
        return cachedSortedTitles;
    }

    function findTitleIndex(sortedTitles, title) {
        let low = 0;
        let high = sortedTitles.length - 1;

        while (low <= high) {
            const mid = (low + high) >> 1;
            const comparison = sortedTitles[mid].localeCompare(title);
            if (comparison === 0) return mid;
            if (comparison < 0) low = mid + 1;
            else high = mid - 1;
        }

        return -1;
    }

    // The 1-based alphabetical rank of the selected table within the active filter.
    function getCurrentTablePosition(currentTitle) {
        if (gameList.getWheelCount() === 0 || !currentTitle) return 0;

        let sortedTitles = cachedSortedTitles || buildSortedTitles();
        let titleIndex = findTitleIndex(sortedTitles, currentTitle);

        // Extra self-healing safety net: if a title is somehow missing (e.g. the
        // game list itself changed, not just the filter), rebuild once.
        if (titleIndex < 0) {
            sortedTitles = buildSortedTitles();
            titleIndex = findTitleIndex(sortedTitles, currentTitle);
        }

        return titleIndex >= 0 ? titleIndex + 1 : 0;
    }

    // The non-temporary entries on the line at start-up are the player's own
    // messages from PinballY's options; the table info is written after them.
    // PinballY's show() inserts a temporary entry just after the current one
    // and removes it once shown, which shifts the indexes: the table info's
    // slots are counted among the non-temporary entries only.
    const statusLine = mainWindow.statusLines.lower;
    const firstTableInfoSlot = statusLine.getText().filter(entry => !entry.isTemp).length;
    for (let i = 0; i < STATUS_LINE_BUILDERS.length; i++) {
        statusLine.add("");
    }

    function findTableInfoSlotIndexes() {
        return statusLine.getText()
            .map((entry, index) => (entry.isTemp ? -1 : index))
            .filter(index => index >= 0)
            .slice(firstTableInfoSlot, firstTableInfoSlot + STATUS_LINE_BUILDERS.length);
    }

    function refreshStatusLine() {
        const currentGame = gameList.getWheelGame(0);
        const currentTitle = currentGame ? currentGame.title : null;
        const position = getCurrentTablePosition(currentTitle);
        const play = profileStore.getPlay(currentGame ? currentGame.configId : "");

        const slotIndexes = findTableInfoSlotIndexes();
        STATUS_LINE_BUILDERS.forEach((buildText, i) => {
            statusLine.setText(slotIndexes[i], buildText(position, currentGame, play));
        });
    }

    // A filter change (category, manufacturer, era, etc.) swaps out the entire
    // set of games the wheel shows. The filterselect event fires slightly
    // BEFORE PinballY's internal wheel data actually reflects the new filter,
    // so querying gameList synchronously here would still see the old list —
    // deferring by one tick lets the switch complete first.
    // The deferred callback runs outside the listener's call stack, so it is
    // guarded separately from the listener itself.
    gameList.on("filterselect", safeHandler(SCRIPT_NAME, () => {
        setTimeout(safeHandler(SCRIPT_NAME, () => {
            buildSortedTitles();
            refreshStatusLine();
        }), 0);
    }));

    gameList.on("gameselect", safeHandler(SCRIPT_NAME, refreshStatusLine));
    // Back on the wheel after a game, whose play the Profile store recorded on "gameover".
    mainWindow.on("wheelmode", safeHandler(SCRIPT_NAME, refreshStatusLine));
    // Deferred and rebuilt like a filter change: a switch can re-run the
    // Hall of Fame filter, which then shows other tables.
    profileStore.onSwitch(safeHandler(SCRIPT_NAME, () => {
        setTimeout(safeHandler(SCRIPT_NAME, () => {
            buildSortedTitles();
            refreshStatusLine();
        }), 0);
    }));

    refreshStatusLine();
}
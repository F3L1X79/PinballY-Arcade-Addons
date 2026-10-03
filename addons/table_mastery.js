// ============================================================
// Table Mastery: shows the Mastery Bar of the selected table for the
// active Profile, computed from the Profile store's table totals (no data
// of its own). The bar sits under the Challenge Card when the card shows,
// in its place otherwise, and under the Profile badge when the Profile
// picker is on. Follows "gameselect", hides on "gamestarted", comes back
// on "wheelmode" and follows Profile switches. After a Play that moved a
// table's bar forward (onPlay, ADR 0008), lights it up once on the return
// to the wheel.
// ============================================================

import { createPinballYHost } from "../common/pinbally_host.js";
import { getProfileStore } from "../common/profile_store.js";
import { getDrawingAhead } from "../common/drawing_ahead.js";
import { getChallenges } from "../common/challenge.js";
import { BADGE_HEIGHT, CHALLENGE_CARD_CANVAS_HEIGHT } from "../common/challenge_card.js";
import { createMasteryBar } from "../common/mastery_bar.js";
import { masteryOf, movedByPlay } from "../common/table_mastery.js";
import { safeHandler } from "../common/safe_handler.js";
import config from "../common/config.js";

const SCRIPT_NAME = "TableMastery";

export default function init() {
    const host = createPinballYHost();
    const store = getProfileStore();
    const underBadge = config.addOns.profilePicker !== false;
    const withChallenges = config.addOns.challenges !== false;

    // What the Challenge Card draws from: the card has already followed the
    // same events, since the Challenges Add-on starts before this one.
    const cardShown = () => withChallenges && getChallenges().getActiveView() !== null;
    const topOf = () => (underBadge ? BADGE_HEIGHT : 0) + (cardShown() ? CHALLENGE_CARD_CANVAS_HEIGHT : 0);
    const bar = createMasteryBar(host, getDrawingAhead(), { topOf });
    let gameRunning = false;
    // The Play that moved its table's bar forward, until the next return
    // to the wheel: { profileName, configId }.
    let movedTable = null;

    function showTable(game) {
        if (gameRunning || !game) {
            bar.hide();
            return;
        }
        bar.show(masteryOf(store.getPlay(game.configId)));
    }

    const showCurrent = () => showTable(host.getCurrentTable());

    // Lit up only when the wheel comes back on the very table that moved,
    // for the Profile that played it.
    function showOnReturn() {
        const moved = movedTable;
        movedTable = null;
        const game = host.getCurrentTable();
        if (moved && game && game.configId === moved.configId && store.getActiveProfile().name === moved.profileName) {
            bar.lightUp(masteryOf(store.getPlay(game.configId)));
        } else {
            showTable(game);
        }
    }

    // The totals already count the Play when it is announced.
    store.onPlay(safeHandler(SCRIPT_NAME, ({ profileName, configId, seconds }) => {
        if (movedByPlay(store.getPlaysOf(profileName)[configId], seconds)) movedTable = { profileName, configId };
    }));

    // Fires on every wheel move, the player's and attract mode's alike.
    host.onGameListEvent("gameselect", safeHandler(SCRIPT_NAME, ev => showTable(ev.game)));
    // Never over a game, like the Challenge Card.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, () => {
        gameRunning = true;
        bar.hide();
    }));
    // Back on the wheel after a game, a menu or a dialog.
    host.on("wheelmode", safeHandler(SCRIPT_NAME, () => {
        gameRunning = false;
        showOnReturn();
    }));
    store.onSwitch(safeHandler(SCRIPT_NAME, showCurrent));

    showCurrent();
}

// ============================================================
// Table Mastery: shows the Mastery Bar of the selected table for the
// active Profile, computed from the Profile store's table totals (no data
// of its own). The bar sits under the Challenge Card when the card shows,
// in its place otherwise, and under the Profile badge when the Profile
// picker is on. Follows "gameselect", hides on "gamestarted", comes back
// on "wheelmode" and follows Profile switches.
// ============================================================

import { createPinballYHost } from "../common/pinbally_host.js";
import { getProfileStore } from "../common/profile_store.js";
import { getDrawingAhead } from "../common/drawing_ahead.js";
import { getChallenges } from "../common/challenge.js";
import { BADGE_HEIGHT, CHALLENGE_CARD_CANVAS_HEIGHT } from "../common/challenge_card.js";
import { createMasteryBar } from "../common/mastery_bar.js";
import { masteryOf } from "../common/table_mastery.js";
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

    function showTable(game) {
        if (gameRunning || !game) {
            bar.hide();
            return;
        }
        bar.show(masteryOf(store.getPlay(game.configId)));
    }

    const showCurrent = () => showTable(host.getCurrentTable());

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
        showCurrent();
    }));
    store.onSwitch(safeHandler(SCRIPT_NAME, showCurrent));

    showCurrent();
}

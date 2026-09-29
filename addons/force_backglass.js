// ============================================================
// Forces the backglass window visible at startup, hides it while a table is
// running (VPX renders its own backglass), and shows it again once back at
// the wheel. Listens to "gamestarted" and "gameover". On a single screen it
// does nothing: the backglass has no monitor of its own there, and showing
// it covers the whole playfield.
// ============================================================

import { safeHandler } from "../common/safe_handler.js";
import { createPinballYHost } from "../common/pinbally_host.js";

const SCRIPT_NAME = "ForceBackglass";

export default function init() {
    const host = createPinballYHost();
    // Checked on every change, since a screen can be plugged in or out
    // while PinballY runs.
    const showBackglass = visible => {
        if (host.countMonitors() > 1) host.showBackglass(visible);
    };

    // Hiding the backglass during play can end up saved as
    // "BackglassWindow.Visible = 0" if the settings are written while a game
    // runs, and PinballY then hides it again at startup. Deferred until
    // main.js has finished so the show wins over that startup setting.
    host.setTimeout(safeHandler(SCRIPT_NAME, () => showBackglass(true)), 0);
    host.on("gamestarted", safeHandler(SCRIPT_NAME, () => showBackglass(false)));
    host.on("gameover", safeHandler(SCRIPT_NAME, () => showBackglass(true)));
}

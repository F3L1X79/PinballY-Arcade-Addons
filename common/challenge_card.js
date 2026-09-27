// ============================================================
// Challenge Card: the week's Challenge and the active Profile's progress
// (title, bar, value / target, days left), always in view under the
// Profile badge at the top right of the wheel screen, on its own drawing
// layer (see docs/adr/0003). Always the same size; hidden for Guest, when
// there is no Challenge and while a game runs. When there is something new
// (a Challenge to follow, a Profile switch, progress after a game) its
// content changes in place and it lights up once. Once the Challenge is
// completed, it says so until the end of the week. The first time a
// Profile shows up in a later week, it first shows the verdict on the
// previous Challenge for a few seconds. Redrawn at startup, on every
// Profile switch and on "wheelmode".
// ============================================================

import lang from "./i18n.js";
import { safeHandler } from "./safe_handler.js";

const SCRIPT_NAME = "ChallengeCard";

// Like the badge: above the wheel and the game info box, under popups and menus.
export const CHALLENGE_CARD_Z_INDEX = 4500;
// Its own canvas pinned to the top right corner, right under the badge's
// canvas, for the same reason as the badge: a canvas drawn at startup,
// before the window is laid out, would be stretched out of shape. Sizes
// are on the cabinet's 1920 px high playfield; the card's right edge lines
// up with the badge's Avatar, and the canvas leaves room for the glow.
const CARD_REFERENCE_HEIGHT = 1920;
const BADGE_HEIGHT = 170;
const CANVAS = Object.freeze({ width: 400, height: 124 });
const CARD = Object.freeze({ x: 10, y: 8, width: 360, height: 106, padding: 14, border: 1, accentHeight: 3 });
const HEADER = Object.freeze({ y: 14, size: 11 });
const TITLE = Object.freeze({ y: 34, size: 16 });
const BAR = Object.freeze({ y: 66, height: 6 });
const PROGRESS = Object.freeze({ y: 78, size: 12 });
const FONT = "Segoe UI";
// Also the Challenge Toast's accent.
export const CHALLENGE_ACCENT_COLOR = 0xFF4FD1B0;
const HIGHLIGHT = Object.freeze({ ms: 1200, glowRings: 8, glowMaxAlpha: 0x60 });
// How long the verdict stays before the week's Challenge replaces it.
export const CHALLENGE_VERDICT_MS = 5000;
const COLORS = Object.freeze({
    background: 0xEB141C28,
    border: 0xFF3E4C60,
    accent: CHALLENGE_ACCENT_COLOR,
    accentLit: 0xFFB8FFF0,
    barTrack: 0xFF273246,
    title: 0xFFFFFFFF,
    text: 0xFFA9B4C2,
    transparent: 0x00000000,
});

function drawText(host, dc, text, { y, size, weight = 400, color }) {
    const styled = host.createStyledText({ textStyle: { font: FONT, size, weight, color } });
    styled.add(text);
    const width = CARD.width - 2 * CARD.padding;
    styled.draw(dc, { x: CARD.x + CARD.padding, y: CARD.y + y, width, height: styled.measure(width).height });
}

// Fading one-pixel frames around the card, widening outwards.
function drawGlow(dc) {
    const accentRgb = COLORS.accent & 0xFFFFFF;
    for (let ring = HIGHLIGHT.glowRings; ring >= 1; ring--) {
        const alpha = Math.round(HIGHLIGHT.glowMaxAlpha * (1 - ring / (HIGHLIGHT.glowRings + 1)));
        dc.frameRect(CARD.x - ring, CARD.y - ring, CARD.width + 2 * ring, CARD.height + 2 * ring, 1, alpha * 2 ** 24 + accentRgb);
    }
}

// What the card shows: the week's Challenge or the previous one's verdict.
function currentFace({ challenge, value, daysLeft, completed }) {
    const TEXT = lang.challenges;
    const daysText = daysLeft === 1 ? TEXT.lastDay : TEXT.daysLeft(daysLeft);
    return {
        header: TEXT.cardHeader, challenge, value, completed,
        status: completed ? TEXT.completed : TEXT.progress(value, challenge.target, daysText),
    };
}

function verdictFace({ challenge, reached, completed }) {
    const TEXT = lang.challenges;
    return {
        header: TEXT.verdictHeader, challenge, value: reached, completed,
        status: completed ? TEXT.completed : TEXT.missed(reached, challenge.target),
    };
}

function drawCard(host, dc, face, lit) {
    const { header, challenge, value, completed, status } = face;
    if (lit) drawGlow(dc);
    dc.fillRect(CARD.x, CARD.y, CARD.width, CARD.height, COLORS.background);
    dc.frameRect(CARD.x, CARD.y, CARD.width, CARD.height, CARD.border, COLORS.border);
    dc.fillRect(CARD.x, CARD.y, CARD.width, CARD.accentHeight, COLORS.accent);

    drawText(host, dc, header.toLocaleUpperCase(), { ...HEADER, weight: 600, color: COLORS.accent });
    drawText(host, dc, lang.challenges.titles[challenge.template](challenge.target, challenge.param),
        { ...TITLE, weight: 600, color: COLORS.title });

    const barX = CARD.x + CARD.padding;
    const barWidth = CARD.width - 2 * CARD.padding;
    dc.fillRect(barX, CARD.y + BAR.y, barWidth, BAR.height, COLORS.barTrack);
    const filled = Math.round(barWidth * value / challenge.target);
    if (filled > 0) dc.fillRect(barX, CARD.y + BAR.y, filled, BAR.height, lit ? COLORS.accentLit : COLORS.accent);

    drawText(host, dc, status,
        { ...PROGRESS, weight: completed ? 600 : 400, color: completed ? COLORS.accent : COLORS.text });
}

export function createChallengeCard(host, challenges, profileStore) {
    const layer = host.createDrawingLayer(CHALLENGE_CARD_Z_INDEX);
    layer.setScale({ ySpan: CANVAS.height / CARD_REFERENCE_HEIGHT });
    layer.setPos(0, -BADGE_HEIGHT / CARD_REFERENCE_HEIGHT, "top right");
    let timer = null;

    function stopTimer() {
        host.clearTimeout(timer);
        timer = null;
    }

    // The card's one pending step: a new one replaces it.
    function scheduleNext(ms, callback) {
        timer = host.setTimeout(safeHandler(SCRIPT_NAME, () => {
            timer = null;
            callback();
        }), ms);
    }

    function draw(face, lit) {
        layer.clear(COLORS.transparent);
        if (!face) {
            layer.alpha = 0;
            return;
        }
        layer.alpha = 1;
        layer.draw(dc => drawCard(host, dc, face, lit), CANVAS.width, CANVAS.height);
    }

    const drawCurrent = lit => {
        const view = challenges.getActiveView();
        draw(view && currentFace(view), lit);
    };

    // Lit up, then resting after the highlight, then whatever comes next.
    function lightUp(drawFace, next = () => {}) {
        drawFace(true);
        scheduleNext(HIGHLIGHT.ms, () => {
            drawFace(false);
            next();
        });
    }

    // The verdict until it has stayed its full time: it is saved as shown
    // as soon as it is judged, so a menu or a dialog closing over it (at
    // startup, the Period Table announcements) shows it again rather than
    // losing it. A Profile switch drops it.
    let unseenVerdict = null;

    // The verdict first, and the week's Challenge lit up once it is gone;
    // otherwise the week's Challenge, lit up when there is something new.
    function refresh(options = {}) {
        stopTimer();
        const { hasNews, verdict } = challenges.showUp(options);
        if (verdict) unseenVerdict = verdictFace(verdict);
        else if (options.switched) unseenVerdict = null;
        if (unseenVerdict) {
            const face = unseenVerdict;
            lightUp(lit => draw(face, lit), () => scheduleNext(CHALLENGE_VERDICT_MS - HIGHLIGHT.ms, () => {
                unseenVerdict = null;
                lightUp(drawCurrent);
            }));
        } else if (hasNews) {
            lightUp(drawCurrent);
        } else {
            drawCurrent(false);
        }
    }

    // Never over a game.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, () => {
        stopTimer();
        layer.alpha = 0;
    }));
    // Fires back on the wheel, after a game, a menu or a dialog.
    host.on("wheelmode", safeHandler(SCRIPT_NAME, () => refresh()));
    profileStore.onSwitch(safeHandler(SCRIPT_NAME, () => refresh({ switched: true })));

    refresh();
}

// ============================================================
// Achievement List painter: draws the pieces of the drawn Achievement List
// (the dimmed backdrop and panel, the header and footer, a section header,
// an Achievement row) into a drawing layer's context, in the Steamball look
// validated with the prototype. It only draws what it is given: it holds no
// state, reads no Achievement and listens to no event. Sizes are in layout
// pixels, fonts in points.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "./steamball_palette.js";

// The wheel shows dimmed through it.
const OVERLAY_COLOR = 0xD0080A0E;
// The footer's gradient top, a step lighter than the panel.
const FOOTER_TOP_COLOR = 0xFF1C2330;
const HEADER_BOTTOM_COLOR = 0xFF222B3A;

export const LIST_LOOK = Object.freeze({
    panelRatio: 0.75,
    headerHeight: 180,
    footerHeight: 112,
    rowHeight: 100,
    sectionHeight: 52,
    // Between two items of the list.
    itemGap: 8,
    // Between the panel's sides and the rows.
    rowsInset: 16,
    padding: 24,
    avatarSize: 104,
    gaugeHeight: 7,
    gaugeTipRadius: 10,
    rankEdgeWidth: 4,
    textLeft: 32,
    // Kept free on the right of a row's texts for the Unlock Rate.
    ownersWidth: 220,
});

function mixColors(from, to, ratio) {
    let color = 0;
    for (const shift of [24, 16, 8, 0]) {
        const start = (from >>> shift) & 0xFF;
        const end = (to >>> shift) & 0xFF;
        color += Math.round(start + (end - start) * ratio) * 2 ** shift;
    }
    return color;
}

// In 4-pixel bands: the drawing context has no gradient fill, and bands
// keep a tall gradient cheap.
function fillGradient(dc, x, y, width, height, topColor, bottomColor) {
    for (let row = 0; row < height; row += 4) {
        const ratio = row / Math.max(1, height - 1);
        dc.fillRect(x, y + row, width, Math.min(4, height - row), mixColors(topColor, bottomColor, ratio));
    }
}

// A diamond centred on (centerX, centerY), drawn as stacked lines.
function fillDiamond(dc, centerX, centerY, radius, color) {
    for (let dy = -radius; dy <= radius; dy++) {
        const half = radius - Math.abs(dy);
        dc.fillRect(Math.round(centerX - half), Math.round(centerY + dy), 2 * half + 1, 1, color);
    }
}

function drawText(host, dc, runs, { x, y, width, font = FONTS.body, size, weight, color }) {
    const text = host.createStyledText({ textStyle: { font, size, weight, color } });
    for (const run of runs) text.add(run);
    const measured = text.measure(width);
    text.draw(dc, { x, y, width, height: measured.height });
    return measured;
}

// Where the panel, the header, the rows area and the footer sit in a
// window of this size.
export function computeGeometry({ width, height }) {
    const look = LIST_LOOK;
    const panelWidth = Math.round(width * look.panelRatio);
    const panelHeight = Math.round(height * look.panelRatio);
    const x = Math.round((width - panelWidth) / 2);
    const y = Math.round((height - panelHeight) / 2);
    return {
        width, height, x, y, panelWidth, panelHeight,
        areaTop: y + look.headerHeight,
        areaHeight: panelHeight - look.headerHeight - look.footerHeight,
        rowX: x + look.rowsInset,
        rowWidth: panelWidth - 2 * look.rowsInset,
    };
}

// The whole window: the dimmed wheel, then the panel.
export function drawBackdrop(dc, g) {
    dc.fillRect(0, 0, g.width, g.height, OVERLAY_COLOR);
    dc.fillRect(g.x, g.y, g.panelWidth, g.panelHeight, COLORS.panel);
    dc.frameRect(g.x, g.y, g.panelWidth, g.panelHeight, 1, COLORS.border);
}

// The Avatar in a double gold frame, the title, the Profile's name, the
// total line and its gauge, with a diamond at the gauge's tip.
function drawHeader(host, dc, g, header) {
    const look = LIST_LOOK;
    const { x, y, panelWidth: width } = g;
    fillGradient(dc, x, y, width, look.headerHeight, COLORS.panelTop, HEADER_BOTTOM_COLOR);
    const avatar = look.avatarSize;
    const avatarX = x + look.padding;
    const avatarY = y + (look.headerHeight - avatar) / 2;
    dc.fillRect(avatarX - 7, avatarY - 7, avatar + 14, avatar + 14, COLORS.gold);
    dc.fillRect(avatarX - 4, avatarY - 4, avatar + 8, avatar + 8, COLORS.tile);
    dc.frameRect(avatarX - 2, avatarY - 2, avatar + 4, avatar + 4, 1, COLORS.gold);
    dc.drawImage(header.avatarPath, avatarX, avatarY, avatar, avatar);

    const textX = avatarX + avatar + 28;
    const textWidth = width - (textX - x) - look.padding - 8;
    drawText(host, dc, [
        { size: 11, weight: 600, color: COLORS.gold, text: `${header.title}\n` },
        { size: 20, weight: 600, color: COLORS.title, text: `${header.profileName}\n` },
        header.totalLine,
    ], { x: textX, y: avatarY + 2, width: textWidth, size: 12, color: COLORS.description });

    // The empty part as tall as the filled one, so the gauge reads as one bar.
    const gaugeY = avatarY + avatar - 10;
    const filled = Math.round(textWidth * header.ratio);
    dc.fillRect(textX, gaugeY, textWidth, look.gaugeHeight, COLORS.track);
    dc.fillRect(textX, gaugeY, filled, look.gaugeHeight, COLORS.gold);
    dc.fillRect(textX, gaugeY, filled, 1, mixColors(COLORS.gold, COLORS.title, 0.5));
    const tipY = gaugeY + Math.floor(look.gaugeHeight / 2);
    fillDiamond(dc, textX + filled, tipY, look.gaugeTipRadius, COLORS.gold);
    fillDiamond(dc, textX + filled, tipY, 4, COLORS.title);
    dc.fillRect(x, y + look.headerHeight - 1, width, 1, COLORS.border);
}

// Centred like a console's hints: key caps, then what they do.
function drawFooter(host, dc, g, footer) {
    const look = LIST_LOOK;
    const { x, panelWidth: width } = g;
    const y = g.y + g.panelHeight - look.footerHeight;
    fillGradient(dc, x, y, width, look.footerHeight, FOOTER_TOP_COLOR, COLORS.panel);
    dc.fillRect(x, y, width, 1, COLORS.border);

    const keyCap = () => host.createStyledText({
        backgroundColor: COLORS.keyCap, cornerRadius: 6, padding: 8,
        textStyle: { font: FONTS.display, size: 15, weight: 700, color: COLORS.title },
    });
    const label = () => host.createStyledText({ textStyle: { font: FONTS.display, size: 18, weight: 600, color: COLORS.description } });
    const pieces = [
        { key: footer.prevKey }, { gap: 8 }, { key: footer.nextKey }, { gap: 12 }, { label: footer.browse },
        { gap: 48 },
        { key: footer.exitKey }, { gap: 12 }, { label: footer.back },
    ].map(piece => {
        if (piece.gap) return piece;
        const text = piece.key === undefined ? label() : keyCap();
        text.add(piece.key === undefined ? piece.label : piece.key);
        const size = text.measure(width);
        return { text, width: size.width, height: size.height };
    });
    const total = pieces.reduce((sum, piece) => sum + (piece.gap || piece.width), 0);
    let pieceX = x + (width - total) / 2;
    for (const piece of pieces) {
        if (piece.gap) {
            pieceX += piece.gap;
            continue;
        }
        // A little wider than measured, so the last letter never wraps.
        piece.text.draw(dc, { x: pieceX, y: y + (look.footerHeight - piece.height) / 2, width: piece.width + 2, height: piece.height });
        pieceX += piece.width;
    }
}

// The whole window, transparent between the header and the footer, so a
// row sliding out of the rows area hides under them.
export function drawMask(host, dc, g, { header, footer }) {
    drawHeader(host, dc, g, header);
    drawFooter(host, dc, g, footer);
}

// Its title in gold, the count beside it, and a rule to the right edge.
export function drawSectionHeader(host, dc, width, { title, count }) {
    const style = { font: FONTS.display, size: 17 };
    const textY = LIST_LOOK.sectionHeight - 8 - host.createStyledText({ textStyle: style }).measure(width).height;
    const titleSize = drawText(host, dc, [title], { ...style, x: 6, y: textY, width, weight: 700, color: COLORS.gold });
    const countX = 6 + titleSize.width + 10;
    const countSize = drawText(host, dc, [count], { ...style, x: countX, y: textY, width: width - countX, weight: 400, color: COLORS.description });
    const ruleX = countX + countSize.width + 16;
    dc.fillRect(ruleX, textY + titleSize.height / 2, Math.max(0, width - ruleX - 6), 1, COLORS.border);
}

// An Achievement's row: its background, a gold left edge when Unlocked,
// its title and description, and the short text of its Achievement
// Progress when it has one.
export function drawRow(host, dc, width, { title, description, unlocked, progress }) {
    const look = LIST_LOOK;
    dc.fillRect(0, 0, width, look.rowHeight, unlocked ? COLORS.rowUnlocked : COLORS.rowMissing);
    if (unlocked) dc.fillRect(0, 0, look.rankEdgeWidth, look.rowHeight, COLORS.gold);
    const textWidth = width - look.textLeft - look.ownersWidth;
    const reserved = progress ? 18 : 0;
    const text = host.createStyledText({ textStyle: { font: FONTS.body, size: 11, color: unlocked ? COLORS.description : COLORS.dim } });
    text.add({ size: 13, weight: 600, color: unlocked ? COLORS.title : COLORS.description, text: `${title}\n` });
    text.add(description);
    const height = text.measure(textWidth).height;
    const textY = (look.rowHeight - height - reserved) / 2;
    text.draw(dc, { x: look.textLeft, y: textY, width: textWidth, height });
    if (progress) {
        drawText(host, dc, [progress], { x: look.textLeft, y: textY + height + 2, width: textWidth, size: 10, color: COLORS.description });
    }
}

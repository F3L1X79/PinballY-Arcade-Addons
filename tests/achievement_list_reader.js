// ============================================================
// Reads the drawn Achievement List the way the player sees it, on the fake
// PinballY host: the texts of its header and footer, the items shown in
// the rows area from top to bottom, the highlighted one (the only one not
// dimmed), and the whole list, walked with Next as a player would.
// Never loaded by PinballY.
// ============================================================

import assert from "node:assert/strict";
import { ACHIEVEMENT_LIST_Z_INDEX } from "../common/achievement_list.js";

// Past the glide from one line to the next.
export const GLIDE_OVER_MS = 400;

const isShown = layer => layer.alpha > 0 && layer.texts().length > 0;

export const press = (fake, buttonCommand) => fake.fire("commandbuttondown", { command: buttonCommand, repeat: false });

// Presses the button and lets the glide end.
export function pressAndGlide(fake, buttonCommand) {
    const ev = press(fake, buttonCommand);
    fake.advanceTime(GLIDE_OVER_MS);
    return ev;
}

// The texts of the header and the footer; none when the list is closed.
export const chromeTexts = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex === ACHIEVEMENT_LIST_Z_INDEX.mask && isShown(layer))
    .flatMap(layer => layer.texts());

export const isListOpen = fake => chromeTexts(fake).length > 0;

function shownItemLayers(fake) {
    return fake.drawingLayers()
        .filter(layer => layer.zIndex === ACHIEVEMENT_LIST_Z_INDEX.items && isShown(layer))
        // Positions go up the window: the highest first.
        .sort((a, b) => b.position().y - a.position().y);
}

// The items shown in the rows area, from top to bottom: their texts and alpha.
export const shownItems = fake => shownItemLayers(fake).map(layer => ({ texts: layer.texts(), alpha: layer.alpha }));

function highlightedLayer(fake) {
    const lit = shownItemLayers(fake).filter(layer => layer.alpha === 1);
    assert.equal(lit.length, 1, "exactly one line is not dimmed");
    return lit[0];
}

// The texts of the highlighted line.
export const highlightedTexts = fake => highlightedLayer(fake).texts();

// Every item of the open list from top to bottom, section headers
// included, as their texts: read while pressing Next until the highlight
// comes back to where it was.
export function readWholeList(fake) {
    const order = [];
    // The shown items always follow each other in the list, so each new one
    // goes right after the shown item above it.
    function merge() {
        let insertAt = 0;
        for (const layer of shownItemLayers(fake)) {
            const index = order.indexOf(layer);
            if (index === -1) order.splice(insertAt++, 0, layer);
            else insertAt = index + 1;
        }
    }
    merge();
    const start = highlightedLayer(fake);
    for (let guard = 0; guard < 1000; guard++) {
        pressAndGlide(fake, "Next");
        merge();
        if (highlightedLayer(fake) === start) return order.map(layer => layer.texts());
    }
    throw new Error("The highlight never came back to where it was.");
}

// The whole list split under its two section headers: each section's
// header texts and its rows' texts.
export function readSections(fake, TEXT) {
    const sectionTitles = [TEXT.unlockedSection, TEXT.missingSection].map(title => title.toLocaleUpperCase());
    const sections = [];
    for (const texts of readWholeList(fake)) {
        if (sectionTitles.includes(texts[0])) sections.push({ header: texts, rows: [] });
        else sections.at(-1).rows.push(texts);
    }
    return sections;
}

// The rows of the whole list, each with its title, description, the
// short text of its Achievement Progress (null when it shows none) and
// whether it sits in the Unlocked section.
export function readRows(fake, TEXT) {
    const [unlocked, missing] = readSections(fake, TEXT);
    const toRow = isUnlocked => ([title, description, progress = null]) => ({ title, description, progress, unlocked: isUnlocked });
    return [...unlocked.rows.map(toRow(true)), ...missing.rows.map(toRow(false))];
}

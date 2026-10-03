// ============================================================
// Achievement Toast module on the fake host: a batch stacks with the
// newest card lowest, at most five cards on screen, the others arriving as
// the oldest ones leave, on drawing layers reused from a pool. A card holds
// for the configured duration (4 s when out of range, with a log line), the
// configured scale enlarges the whole card (1 when out of range, logged)
// and the configured sound plays once per card, a failing one only logged.
// A Challenge Toast shares the queue, with its own header and target icon.
// A celebrated toast starts the Confetti Shower, unless it went stale.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { createAchievementToasts, TOAST_KIND } from "../common/achievement_toast.js";
import lang from "../common/i18n.js";

const ARRIVAL_GAP_MS = 350;
const MAX_CARDS = 5;
const SOUND_FILE = "C:\\Sounds\\achievement.wav";
// Enough for a card to rise into place, shorter than any hold.
const SETTLE_MS = 1000;

// Titles of the cards on screen, oldest (highest) first.
function cardsOnScreen(fake) {
    return fake.drawingLayers()
        .filter(layer => layer.texts().length > 0)
        .sort((a, b) => b.position().y - a.position().y)
        .map(layer => layer.texts()[1]);
}

function submitOne(toasts, title) {
    toasts.submit({ title, description: "", onShown() {} });
}

test("a batch of Achievement Toasts stacks, five at most, and the oldest leaves first", () => {
    const fake = createFakePinballYHost();
    fake.installGlobals();
    const toasts = createAchievementToasts(fake);
    const titles = ["1", "2", "3", "4", "5", "6", "7"];
    for (const title of titles) submitOne(toasts, title);

    fake.advanceTime(10 * ARRIVAL_GAP_MS);
    assert.deepEqual(cardsOnScreen(fake), ["1", "2", "3", "4", "5"], "the newest card lowest, five at most");

    let maxOnScreen = 0;
    for (let elapsedMs = 0; fake.drawings().length < titles.length || cardsOnScreen(fake).length > 0; elapsedMs += 100) {
        assert.ok(elapsedMs < 60000, "every toast leaves");
        const before = cardsOnScreen(fake);
        fake.advanceTime(100);
        const after = cardsOnScreen(fake);
        maxOnScreen = Math.max(maxOnScreen, after.length);
        const gone = before.filter(title => !after.includes(title));
        assert.deepEqual(gone, before.slice(0, gone.length), "the oldest card leaves first");
    }
    assert.equal(maxOnScreen, MAX_CARDS);
    assert.equal(fake.drawingLayers().length, MAX_CARDS, "layers reused from a pool");
});

test("a card holds for the configured duration, 4 s when the setting is out of range", () => {
    const fake = createFakePinballYHost();
    fake.installGlobals();
    const tenSeconds = createAchievementToasts(fake, { toastSeconds: 10 });
    submitOne(tenSeconds, "ten");
    fake.advanceTime(9900);
    assert.deepEqual(cardsOnScreen(fake), ["ten"]);
    fake.advanceTime(SETTLE_MS);
    assert.deepEqual(cardsOnScreen(fake), []);

    assert.deepEqual(fake.logLines(), []);
    const outOfRange = createAchievementToasts(fake, { toastSeconds: 0 });
    assert.equal(fake.logLines().filter(line => line.includes("achievementToastSeconds")).length, 1);
    submitOne(outOfRange, "default");
    fake.advanceTime(3900);
    assert.deepEqual(cardsOnScreen(fake), ["default"]);
    fake.advanceTime(SETTLE_MS);
    assert.deepEqual(cardsOnScreen(fake), []);
});

// The card's outer frame (the widest) and the trophy tile's frame (the narrowest).
function cardAndTileWidths(scale) {
    const fake = createFakePinballYHost();
    fake.installGlobals();
    submitOne(createAchievementToasts(fake, { scale }), "scaled");
    const widths = fake.drawingLayers()[0].frames().map(frame => frame.width);
    return { card: Math.max(...widths), tile: Math.min(...widths), logLines: fake.logLines() };
}

test("the configured scale enlarges the whole card, 1 when the setting is out of range", () => {
    const normal = cardAndTileWidths(1);
    const doubled = cardAndTileWidths(2);
    assert.equal(doubled.card, 2 * normal.card);
    assert.equal(doubled.tile, 2 * normal.tile);
    assert.deepEqual(doubled.logLines, []);

    const outOfRange = cardAndTileWidths(0);
    assert.equal(outOfRange.card, cardAndTileWidths(1).card);
    assert.equal(outOfRange.logLines.filter(line => line.includes("achievementToastScale")).length, 1);
    assert.equal(cardAndTileWidths(undefined).card, cardAndTileWidths(1).card, "1 by default");
});

test("the configured sound plays once per card, and a failing one never stops the card", () => {
    const fake = createFakePinballYHost();
    fake.installGlobals();
    fake.addFile(SOUND_FILE);
    const toasts = createAchievementToasts(fake, { soundFile: SOUND_FILE });
    submitOne(toasts, "1");
    submitOne(toasts, "2");
    fake.advanceTime(SETTLE_MS);
    assert.deepEqual(fake.soundsPlayed(), [SOUND_FILE, SOUND_FILE]);

    fake.playSound = () => { throw new Error("Windows Media Player unavailable"); };
    let shown = false;
    toasts.submit({ title: "3", description: "", onShown() { shown = true; } });
    fake.advanceTime(SETTLE_MS);
    assert.ok(shown, "the card still starts");
    assert.ok(cardsOnScreen(fake).includes("3"));
    assert.equal(fake.logLines().filter(line => line.includes("Windows Media Player unavailable")).length, 1);
});

test("a Challenge Toast shares the queue with the Achievement Toasts, with its own header and icon from the pack's assets", () => {
    const fake = createFakePinballYHost();
    fake.installGlobals();
    const toasts = createAchievementToasts(fake);
    submitOne(toasts, "achievement");
    toasts.submit({ kind: TOAST_KIND.CHALLENGE, title: "challenge", description: "", onShown() {} });
    fake.advanceTime(SETTLE_MS);

    assert.deepEqual(cardsOnScreen(fake), ["achievement", "challenge"], "both show, in order");
    const byTitle = title => fake.drawingLayers().find(layer => layer.texts()[1] === title);
    assert.equal(byTitle("achievement").texts()[0], lang.achievements.toastHeader.toLocaleUpperCase());
    assert.equal(byTitle("challenge").texts()[0], lang.challenges.toastHeader.toLocaleUpperCase());
    const [trophy] = byTitle("achievement").images();
    const [target] = byTitle("challenge").images();
    assert.equal(trophy, "C:\\PinballY\\Scripts\\ExpansionPack\\assets\\achievement_trophy.png");
    assert.equal(target, "C:\\PinballY\\Scripts\\ExpansionPack\\assets\\challenge_target.png");
});

test("a celebrated toast starts the Confetti Shower when it starts, never when it went stale", () => {
    const fake = createFakePinballYHost();
    fake.installGlobals();
    const starts = [];
    const toasts = createAchievementToasts(fake, { confettiShower: { start: () => starts.push(fake.now().getTime()) } });
    submitOne(toasts, "plain");
    toasts.submit({ title: "stale", description: "", celebrate: true, isStale: () => true, onShown() {} });
    toasts.submit({ title: "celebrated", description: "", celebrate: true, onShown() {} });
    assert.deepEqual(starts, [], "not before its turn");

    fake.advanceTime(SETTLE_MS);
    assert.deepEqual(cardsOnScreen(fake), ["plain", "celebrated"]);
    assert.deepEqual(starts, [fake.now().getTime() - SETTLE_MS + ARRIVAL_GAP_MS], "once, when its card arrives");
});

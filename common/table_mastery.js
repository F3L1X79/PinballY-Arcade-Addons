// ============================================================
// Table Mastery: the Mastery Level a Profile has reached on a table,
// computed from that Profile's table totals (the time and number of its
// Plays, ADR 0008), and the metal each level shows in. No data of its own
// and no side effect: a Profile Reset starts mastery over with the totals.
// ============================================================

import { ACHIEVEMENT_RANK } from "./achievements.js";
import { RANK_COLORS } from "./steamball_palette.js";

// The fill toward the next level moves in steps of 5 % (ADR 0010).
export const MASTERY_STEPS = 20;
// The Play seconds each level needs, in all, from level 1 (a first Play) to 10.
const LEVEL_SECONDS = [0, 1800, 3600, 6300, 9000, 12600, 18000, 23400, 32400, 43200];
export const MAX_MASTERY_LEVEL = LEVEL_SECONDS.length;
const LEVELS_PER_TIER = 3;
const TIERS = [ACHIEVEMENT_RANK.BRONZE, ACHIEVEMENT_RANK.SILVER, ACHIEVEMENT_RANK.GOLD, ACHIEVEMENT_RANK.PLATINUM];
export const METAL_TIER_COUNT = TIERS.length;
export const WHITE = 0xFFFFFFFF;

// { level, step } from a table's totals, step being the fill toward the
// next level (full at level 10); null for a table never played.
export function masteryOf(play) {
    if (!play || !(play.count > 0)) return null;
    let level = 1;
    while (level < MAX_MASTERY_LEVEL && play.seconds >= LEVEL_SECONDS[level]) level++;
    if (level === MAX_MASTERY_LEVEL) return { level, step: MASTERY_STEPS };
    const from = LEVEL_SECONDS[level - 1];
    const to = LEVEL_SECONDS[level];
    return { level, step: Math.floor(MASTERY_STEPS * (play.seconds - from) / (to - from)) };
}

// Whether a Play of these seconds, already in the table's totals, moved
// its bar forward: to a higher level, or a higher step on the same one.
export function movedByPlay(play, seconds) {
    const before = masteryOf({ count: play.count - 1, seconds: play.seconds - seconds });
    const after = masteryOf(play);
    return !before || after.level > before.level || (after.level === before.level && after.step > before.step);
}

// Bronze 1-3, silver 4-6, gold 7-9, platinum 10.
export const tierOf = level => Math.min(METAL_TIER_COUNT - 1, Math.floor((level - 1) / LEVELS_PER_TIER));

function channel(color, shift) { return (color >>> shift) & 0xFF; }

// Opaque ARGB, from color toward other by t (0 to 1).
export function mix(color, other, t) {
    const part = shift => Math.round(channel(color, shift) + (channel(other, shift) - channel(color, shift)) * t);
    return 0xFF * 2 ** 24 + (part(16) << 16) + (part(8) << 8) + part(0);
}

// Multiplied rather than shifted: a shift by 24 would turn the colour negative.
export const withAlpha = (color, alpha) => alpha * 2 ** 24 + (color & 0xFFFFFF);

// The level's metal, lighter from one level to the next within its tier.
export function metalOf(level) {
    const base = RANK_COLORS[TIERS[tierOf(level)]];
    const rise = level === MAX_MASTERY_LEVEL ? 0.25 : ((level - 1) % LEVELS_PER_TIER) * 0.14;
    return mix(base, WHITE, rise);
}

// The metal of a tier's bar fill: its first level's.
export const tierMetalOf = tier => metalOf(tier * LEVELS_PER_TIER + 1);

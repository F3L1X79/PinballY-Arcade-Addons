// ============================================================
// Every language file carries the same Achievement, Achievement List and
// Profile keys as English, down to each threshold of the thresholded
// titles, so no player sees an English fallback there. Reads the language
// files only.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import en from "../lang/en.js";

const LANGUAGE_CODES = ["fr", "de", "es", "it", "pt"];
const CHECKED_SECTIONS = ["achievements", "achievementList", "profiles", "clock", "challenges"];

function keyPaths(section, prefix) {
    return Object.entries(section).flatMap(([key, value]) => {
        const path = `${prefix}.${key}`;
        return typeof value === "object" && value !== null ? keyPaths(value, path) : [path];
    }).sort();
}

for (const code of LANGUAGE_CODES) {
    test(`${code} has every Achievement text key English has, and no other`, async () => {
        const { default: texts } = await import(`../lang/${code}.js`);
        for (const section of CHECKED_SECTIONS) {
            assert.deepEqual(keyPaths(texts[section], section), keyPaths(en[section], section));
        }
    });
}

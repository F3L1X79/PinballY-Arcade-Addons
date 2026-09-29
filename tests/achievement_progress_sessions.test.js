// ============================================================
// Achievement Progress of the marathon, Random Game and Day's Manufacturers
// Achievements, through main.js on the fake PinballY globals: a marathon
// shows the longest session in whole minutes rounded down and unlocks as
// it reaches its target; Random Games and the Day's Manufacturers record
// show their counts; rage quit and grand return show none.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, table, PROFILES_FOLDER } from "./achievement_progress_scenario.js";

const MEDIEVAL = table(1, "Medieval Madness", "Williams", 1997);

// 29 min 50 s: must read 29 minutes.
const LONGEST_SECONDS = 30 * 60 - 10;

test("marathons show whole minutes, Random Games and Day's Manufacturers their counts", async () => {
    const { fake, lang, play, familyTitles, cardText, withProgress, progressCard } = await startScenario({
        now: new Date(2026, 8, 23, 10, 0, 0),
        tables: [MEDIEVAL],
        files: {
            [`${PROFILES_FOLDER}\\guest\\profile.json`]: {
                version: 1, notified: [], plays: {}, randomGames: 7,
                sessions: { longestSeconds: LONGEST_SECONDS, mostManufacturersInADay: 2 },
            },
        },
    });
    const ACHIEVEMENT = lang.achievements;
    const halfHour = ACHIEVEMENT.marathonTitles[30];

    assert.deepEqual(familyTitles("sessions"), [
        withProgress(halfHour, "minutes", 29, 30),
        withProgress(ACHIEVEMENT.marathonTitles[60], "minutes", 29, 60),
        ACHIEVEMENT.rageQuitTitle(),
        ACHIEVEMENT.grandReturnTitle(),
    ]);
    assert.equal(cardText("sessions", withProgress(halfHour, "minutes", 29, 30)),
        progressCard(halfHour, ACHIEVEMENT.marathonDescription(30), "minutes", 29, 30));
    assert.deepEqual(familyTitles("randomGame"),
        [10, 25, 50, 100].map(count => withProgress(ACHIEVEMENT.randomGamesTitles[count], "randomGames", 7, count)));
    const dayManufacturers = [3, 5, 8, 10].map(count => withProgress(ACHIEVEMENT.dayManufacturersTitles[count], "manufacturers", 2, count));
    assert.deepEqual(familyTitles("manufacturers").filter(title => dayManufacturers.includes(title)), dayManufacturers);

    // A half-hour session reaches the target exactly: the marathon unlocks.
    await play(MEDIEVAL, 30 * 60);
    assert.deepEqual(familyTitles("sessions").slice(0, 2), [
        halfHour,
        withProgress(ACHIEVEMENT.marathonTitles[60], "minutes", 30, 60),
    ]);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});

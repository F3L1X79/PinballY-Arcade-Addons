// ============================================================
// Achievement Progress of the Period Tables Achievements, through main.js
// on the fake PinballY globals: a Streak Achievement the record reached
// stays Unlocked when the Streak breaks; a missing one follows the current
// Streak (0 after a break, then 1 on the next play), never the record;
// Periods Played Achievements count every Period, for the day and the
// week; the first-play Achievements (a target of 1) show none.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, table, PROFILES_FOLDER } from "./achievement_progress_scenario.js";

const TABLE_OF_THE_DAY = table(1, "Medieval Madness", "Williams", 1997);
const TABLE_OF_THE_WEEK = table(2, "Attack from Mars", "Bally", 1995);

test("Streak Achievements stay Unlocked after a break, missing ones show the current Streak", async () => {
    const { fake, lang, play, familyTitles, cardText, withProgress, progressCard } = await startScenario({
        // Wednesday: its week started on Monday 21 September.
        now: new Date(2026, 8, 23, 10, 0, 0),
        tables: [TABLE_OF_THE_DAY, TABLE_OF_THE_WEEK],
        files: {
            [`${PROFILES_FOLDER}\\cabinet.json`]: {
                version: 1, activeProfile: "guest",
                tableOfTheDay: { configId: TABLE_OF_THE_DAY.configId, period: "2026-09-23" },
                tableOfTheWeek: { configId: TABLE_OF_THE_WEEK.configId, period: "2026-09-21" },
            },
            // The day Streak broke on the 21st, after a 12-day record; the
            // week Streak still runs from last week.
            [`${PROFILES_FOLDER}\\guest\\profile.json`]: {
                version: 1, notified: [], plays: {},
                streaks: {
                    tableOfTheDay: { current: 5, longest: 12, lastPeriod: "2026-09-20", periodsPlayed: 40 },
                    tableOfTheWeek: { current: 2, longest: 2, lastPeriod: "2026-09-14", periodsPlayed: 9 },
                },
            },
        },
    });
    const ACHIEVEMENT = lang.achievements;
    const streakOfThirty = ACHIEVEMENT.dailyStreakTitles[30];

    const beforePlay = familyTitles("periodTables");
    assert.ok(beforePlay.includes(ACHIEVEMENT.dailyStreakTitles[7]), "the 12-day record keeps 7 days in a row Unlocked");
    assert.ok(beforePlay.includes(withProgress(streakOfThirty, "daysInARow", 0, 30)),
        "a broken Streak is back to 0 for a missing Achievement, whatever the record");

    await play(TABLE_OF_THE_DAY);
    assert.deepEqual(familyTitles("periodTables"), [
        ACHIEVEMENT.dailyFirstPlayTitle(),
        ACHIEVEMENT.weeklyFirstPlayTitle(),
        ACHIEVEMENT.dailyPeriodsPlayedTitles[10],
        ACHIEVEMENT.dailyPeriodsPlayedTitles[25],
        ACHIEVEMENT.weeklyPeriodsPlayedTitles[4],
        ACHIEVEMENT.dailyStreakTitles[3],
        ACHIEVEMENT.dailyStreakTitles[7],
        withProgress(ACHIEVEMENT.dailyPeriodsPlayedTitles[50], "daysPlayed", 41, 50),
        withProgress(ACHIEVEMENT.dailyPeriodsPlayedTitles[100], "daysPlayed", 41, 100),
        withProgress(ACHIEVEMENT.weeklyPeriodsPlayedTitles[10], "weeksPlayed", 9, 10),
        withProgress(ACHIEVEMENT.weeklyPeriodsPlayedTitles[26], "weeksPlayed", 9, 26),
        withProgress(ACHIEVEMENT.weeklyPeriodsPlayedTitles[52], "weeksPlayed", 9, 52),
        withProgress(ACHIEVEMENT.dailyStreakTitles[14], "daysInARow", 1, 14),
        withProgress(streakOfThirty, "daysInARow", 1, 30),
        withProgress(ACHIEVEMENT.weeklyStreakTitles[4], "weeksInARow", 2, 4),
        withProgress(ACHIEVEMENT.weeklyStreakTitles[12], "weeksInARow", 2, 12),
    ]);
    assert.equal(cardText("periodTables", withProgress(streakOfThirty, "daysInARow", 1, 30)),
        progressCard(streakOfThirty, ACHIEVEMENT.dailyStreakDescription(30), "daysInARow", 1, 30));

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});

// ============================================================
// Period Tables family: Achievements for playing the Table of the Day / the
// Table of the Week. First play (once during its Period), Periods Played
// (10, 50 and 100 days; 10, 26 and 52 weeks, consecutive or not) and
// Streaks (3, 7 and 30 consecutive days; 4 and 12 consecutive weeks).
// Periods Played and Streaks show those counters as Achievement Progress,
// the current Streak for a Streak; a Streak Achievement is unlocked by the
// longest Streak, so a broken Streak never takes it back. Reads the
// counters kept by common/period_table.js; writes nothing.
// ============================================================

import { ACHIEVEMENT_FAMILY, countedAchievement, PROGRESS_UNIT, standaloneAchievement } from "../common/achievements.js";
import lang from "../common/i18n.js";
import { getTableOfTheDay, getTableOfTheWeek } from "../common/period_table.js";

export function buildPeriodTableAchievements() {
    const { achievements: TEXT } = lang;
    const tableOfTheDay = getTableOfTheDay();
    const tableOfTheWeek = getTableOfTheWeek();

    // Each threshold also needs its title in every lang/ file. Each list is
    // its own ladder of Achievement Ranks.
    const dailyPeriodsPlayedThresholds = [10, 50, 100];
    const weeklyPeriodsPlayedThresholds = [10, 26, 52];
    const dailyStreakThresholds = [3, 7, 30];
    const weeklyStreakThresholds = [4, 12];

    const achievements = [
        standaloneAchievement({
            id: "tableOfTheDayFirstPlay",
            family: ACHIEVEMENT_FAMILY.PERIOD_TABLES,
            getTitle: () => TEXT.dailyFirstPlayTitle(),
            getDescription: () => TEXT.dailyFirstPlayDescription(),
            checkUnlocked: () => tableOfTheDay.getLongestStreak() >= 1,
        }),
        standaloneAchievement({
            id: "tableOfTheWeekFirstPlay",
            family: ACHIEVEMENT_FAMILY.PERIOD_TABLES,
            getTitle: () => TEXT.weeklyFirstPlayTitle(),
            getDescription: () => TEXT.weeklyFirstPlayDescription(),
            checkUnlocked: () => tableOfTheWeek.getLongestStreak() >= 1,
        }),
    ];

    for (const days of dailyPeriodsPlayedThresholds) {
        achievements.push(countedAchievement({
            id: `tableOfTheDayPeriodsPlayed:${days}`,
            family: ACHIEVEMENT_FAMILY.PERIOD_TABLES,
            getTitle: () => TEXT.dailyPeriodsPlayedTitles[days],
            getDescription: () => TEXT.dailyPeriodsPlayedDescription(days),
            target: days,
            ladder: dailyPeriodsPlayedThresholds,
            unit: PROGRESS_UNIT.DAYS_PLAYED,
            getCurrent: tableOfTheDay.getPeriodsPlayed,
        }));
    }

    for (const weeks of weeklyPeriodsPlayedThresholds) {
        achievements.push(countedAchievement({
            id: `tableOfTheWeekPeriodsPlayed:${weeks}`,
            family: ACHIEVEMENT_FAMILY.PERIOD_TABLES,
            getTitle: () => TEXT.weeklyPeriodsPlayedTitles[weeks],
            getDescription: () => TEXT.weeklyPeriodsPlayedDescription(weeks),
            target: weeks,
            ladder: weeklyPeriodsPlayedThresholds,
            unit: PROGRESS_UNIT.WEEKS_PLAYED,
            getCurrent: tableOfTheWeek.getPeriodsPlayed,
        }));
    }

    for (const days of dailyStreakThresholds) {
        achievements.push(countedAchievement({
            id: `tableOfTheDayStreak:${days}`,
            family: ACHIEVEMENT_FAMILY.PERIOD_TABLES,
            getTitle: () => TEXT.dailyStreakTitles[days],
            getDescription: () => TEXT.dailyStreakDescription(days),
            target: days,
            ladder: dailyStreakThresholds,
            unit: PROGRESS_UNIT.DAYS_IN_A_ROW,
            getCurrent: tableOfTheDay.getStreak,
            getRecord: tableOfTheDay.getLongestStreak,
        }));
    }

    for (const weeks of weeklyStreakThresholds) {
        achievements.push(countedAchievement({
            id: `tableOfTheWeekStreak:${weeks}`,
            family: ACHIEVEMENT_FAMILY.PERIOD_TABLES,
            getTitle: () => TEXT.weeklyStreakTitles[weeks],
            getDescription: () => TEXT.weeklyStreakDescription(weeks),
            target: weeks,
            ladder: weeklyStreakThresholds,
            unit: PROGRESS_UNIT.WEEKS_IN_A_ROW,
            getCurrent: tableOfTheWeek.getStreak,
            getRecord: tableOfTheWeek.getLongestStreak,
        }));
    }

    return achievements;
}

// ============================================================
// Challenges family: Achievements for completing 1, 5, 10, 25, 50 and 100
// Challenges. Reads the active Profile's completed count from the
// Challenge module, also shown as Achievement Progress; writes nothing.
// None for Guest, which has no Challenge; achievements_engine.js leaves the
// family out when the Challenges Add-on is disabled.
// ============================================================

import { ACHIEVEMENT_FAMILY, countedAchievement, PROGRESS_UNIT } from "../common/achievements.js";
import lang from "../common/i18n.js";

// Each value is part of an Achievement ID: changing one would announce the
// Achievement again to players who already earned it. Each one also needs
// its title in every lang/ file.
const CHALLENGE_THRESHOLDS = [1, 5, 10, 25, 50, 100];

export function buildChallengeAchievements(challenges) {
    if (challenges.getRecord() === null) return [];

    const { achievements: TEXT } = lang;
    // The list is rebuilt at each check, but a Profile switch may still
    // come between building and reading.
    const getCompletedCount = () => (challenges.getRecord() || { completed: 0 }).completed;

    return CHALLENGE_THRESHOLDS.map(count => countedAchievement({
        id: `challengesCompleted:${count}`,
        family: ACHIEVEMENT_FAMILY.CHALLENGES,
        getTitle: () => TEXT.challengesCompletedTitles[count],
        getDescription: () => TEXT.challengesCompletedDescription(count),
        target: count,
        unit: PROGRESS_UNIT.CHALLENGES,
        getCurrent: getCompletedCount,
    }));
}

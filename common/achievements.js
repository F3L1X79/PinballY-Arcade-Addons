// ============================================================
// Generic achievement evaluation. An achievement is a plain object:
//   { id, family, getTitle(), getDescription(), checkUnlocked(), getProgress() }
// where family is one of ACHIEVEMENT_FAMILY and the optional getProgress()
// returns its Achievement Progress, { current, target, unit } with unit one
// of PROGRESS_UNIT, or null. countedAchievement() builds both from one value
// (or from a value and its record, for a Streak).
// "Unlocked" is computed live from the active Profile's progress; only the
// fact that a Profile was Notified is persisted (its profile.json
// "notified" list), so each Achievement is announced once per Profile.
// The caller marks an achievement Notified when its toast starts.
// ============================================================

// Listed in the order the Achievement List shows them.
export const ACHIEVEMENT_FAMILY = Object.freeze({
    COLLECTION: "collection",
    PLAY_TIME: "playTime",
    PERIOD_TABLES: "periodTables",
    SESSIONS: "sessions",
    RANDOM_GAME: "randomGame",
    MANUFACTURERS: "manufacturers",
    DECADES: "decades",
    CATEGORIES: "categories",
    CHALLENGES: "challenges",
});

// What an Achievement Progress counts; each one has its texts in the
// Achievement List's progressUnits of every lang/ file.
export const PROGRESS_UNIT = Object.freeze({
    TABLES: "tables",
    HOURS: "hours",
    DAYS_IN_A_ROW: "daysInARow",
    WEEKS_IN_A_ROW: "weeksInARow",
    DAYS_PLAYED: "daysPlayed",
    WEEKS_PLAYED: "weeksPlayed",
    MINUTES: "minutes",
    RANDOM_GAMES: "randomGames",
    MANUFACTURERS: "manufacturers",
    CHALLENGES: "challenges",
});

// Below this target, an Achievement Progress would only ever read "0/1".
const MIN_PROGRESS_TARGET = 2;

// An Achievement unlocked once getCurrent() reaches target, with that same
// value as its Achievement Progress: the two can never disagree. With
// getRecord (the best value ever reached, never below getCurrent()), the
// record unlocks it instead, so it stays Unlocked when the value drops
// again, while a missing one still shows the value.
export function countedAchievement({ id, family, getTitle, getDescription, target, unit, getCurrent, getRecord = getCurrent }) {
    return {
        id,
        family,
        getTitle,
        getDescription,
        checkUnlocked: () => getRecord() >= target,
        getProgress: () => (target >= MIN_PROGRESS_TARGET ? { current: getCurrent(), target, unit } : null),
    };
}

// Records in the named Profile, which may no longer be the active one, that
// it was Notified of the achievement.
export function markNotified(profileStore, profileName, id) {
    profileStore.updateProfileData(data => {
        if (!data.notified.includes(id)) data.notified.push(id);
    }, profileName);
}

// Calls onNewlyUnlocked(achievement) for each achievement the active
// Profile unlocked and was not yet Notified of.
export function evaluateAchievements(achievements, profileStore, onNewlyUnlocked) {
    const notified = new Set(profileStore.getProfileData().notified);
    for (const achievement of achievements) {
        if (achievement.checkUnlocked() && !notified.has(achievement.id)) {
            onNewlyUnlocked(achievement);
        }
    }
}
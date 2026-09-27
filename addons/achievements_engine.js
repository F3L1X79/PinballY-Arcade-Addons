// ============================================================
// Checks all registered achievements for the active Profile at startup,
// after every "gamestarted" and "gameover" event and on every Profile
// switch, and hands each newly unlocked one to the Achievement Toast
// module, which announces it with a card in the bottom-right corner once no
// game is running; an Achievement becomes Notified, for the Profile that
// unlocked it, when its toast starts.
// Also adds the Achievement List entry to the main menu, right after "Play",
// and the Profile Stats entry right after it. The Challenges family and the
// Profile Stats line on completed Challenges exist only while the
// Challenges Add-on is enabled.
// ============================================================

import { evaluateAchievements, markNotified } from "../common/achievements.js";
import { buildDayManufacturersAchievements } from "../achievements/day_manufacturers.js";
import { buildManufacturerCompletionAchievements } from "../achievements/manufacturer_completion.js";
import { buildCollectionCompletionAchievements } from "../achievements/collection_completion.js";
import { buildPlayTimeTotalAchievements } from "../achievements/play_time_totals.js";
import { buildPeriodTableAchievements } from "../achievements/period_tables.js";
import { buildDecadeCompletionAchievements } from "../achievements/decade_completion.js";
import { buildCategoryCompletionAchievements } from "../achievements/category_completion.js";
import { buildSessionMilestoneAchievements } from "../achievements/session_milestones.js";
import { buildRandomGameFanAchievements } from "../achievements/random_game_fans.js";
import { buildChallengeAchievements } from "../achievements/challenges.js";
import { getAchievementToasts } from "../common/achievement_toast.js";
import { getMainMenu, MAIN_MENU_POSITION } from "../common/main_menu.js";
import { createAchievementList } from "../common/achievement_list.js";
import { createProfileStats } from "../common/profile_stats.js";
import { getTableOfTheDay, getTableOfTheWeek } from "../common/period_table.js";
import { createPinballYHost } from "../common/pinbally_host.js";
import { getProfileStore } from "../common/profile_store.js";
import { getChallenges } from "../common/challenge.js";
import config from "../common/config.js";
import lang from "../common/i18n.js";
import { safeHandler } from "../common/safe_handler.js";

const SCRIPT_NAME = "AchievementsEngine";

// Null when the Challenges Add-on is disabled: then neither the Challenges
// family nor the Profile Stats line exists.
const getEnabledChallenges = () => (config.addOns.challenges === false ? null : getChallenges());

function getAllAchievements() {
    const challenges = getEnabledChallenges();
    return [
        ...buildDayManufacturersAchievements(),
        ...buildManufacturerCompletionAchievements(),
        ...buildCollectionCompletionAchievements(),
        ...buildPlayTimeTotalAchievements(),
        ...buildPeriodTableAchievements(),
        ...buildDecadeCompletionAchievements(),
        ...buildCategoryCompletionAchievements(),
        ...buildSessionMilestoneAchievements(),
        ...buildRandomGameFanAchievements(),
        ...(challenges ? buildChallengeAchievements(challenges) : []),
    ];
}

export default function init() {
    const achievementToasts = getAchievementToasts();
    const profileStore = getProfileStore();

    const achievementList = createAchievementList(createPinballYHost(), getAllAchievements);
    getMainMenu().add({
        name: "achievementList",
        label: lang.achievementList.menuEntry,
        position: MAIN_MENU_POSITION.ACHIEVEMENT_LIST,
        action: achievementList.open,
    });
    const profileStats = createProfileStats(createPinballYHost(), {
        profileStore,
        achievementList,
        tableOfTheDay: getTableOfTheDay(),
        tableOfTheWeek: getTableOfTheWeek(),
        challenges: getEnabledChallenges(),
    });
    getMainMenu().add({
        name: "profileStats",
        label: lang.profileStats.menuEntry,
        position: MAIN_MENU_POSITION.PROFILE_STATS,
        action: profileStats.open,
    });
    // Achievements handed to the Achievement Toast module, by Profile name
    // in lower case (Profile names ignore case). They are not Notified until
    // their toast starts, so later checks find the waiting ones again.
    const submittedIdsByProfile = new Map();

    function checkForNewAchievements() {
        // A toast may start after a switch: it is credited to the Profile
        // active when it was unlocked.
        const profileName = profileStore.getActiveProfile().name;
        const profileKey = profileName.toLowerCase();
        if (!submittedIdsByProfile.has(profileKey)) submittedIdsByProfile.set(profileKey, new Set());
        const submittedIds = submittedIdsByProfile.get(profileKey);
        evaluateAchievements(getAllAchievements(), profileStore, (achievement) => {
            if (submittedIds.has(achievement.id)) return;
            submittedIds.add(achievement.id);
            achievementToasts.submit({
                title: achievement.getTitle(),
                description: achievement.getDescription(),
                onShown: () => markNotified(profileStore, profileName, achievement.id),
            });
        });
    }

    // The timer callback runs outside the event handler's call stack, so it
    // needs its own guard.
    const safeCheckForNewAchievements = safeHandler(SCRIPT_NAME, checkForNewAchievements);

    // Fire on table launch and exit (the launch check catches the "grand
    // return" flag set at launch). Deferred by one tick so the stats trackers'
    // handlers for the same event run first.
    mainWindow.on("gamestarted", safeHandler(SCRIPT_NAME, () => {
        setTimeout(safeCheckForNewAchievements, 0);
    }));

    mainWindow.on("gameover", safeHandler(SCRIPT_NAME, () => {
        setTimeout(safeCheckForNewAchievements, 0);
    }));

    // Fires on every Profile switch: announces what the new Profile has
    // unlocked but was never announced (for example after an update).
    profileStore.onSwitch(safeCheckForNewAchievements);

    // Startup check: its toasts show alongside the startup prompt.
    checkForNewAchievements();
}

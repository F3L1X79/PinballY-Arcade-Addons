// ============================================================
// English labels for UI elements added or translated by this project.
// ============================================================

// The active Profile's play time of a table, as PinballY writes its own.
const formatPlayTime = (hours, minutes) => (hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")} hours`
    : `${minutes} minute${minutes === 1 ? "" : "s"}`);

// Hours of play with one decimal, as an Achievement Progress shows them.
const formatHours = hours => hours.toFixed(1);

export default {
    // Already in English natively.
    nativeMenuLabels: {},
    mediaCaptureItemLabels: {},
    mediaCaptureActionLabels: {},

    // Status text shown in PinballY's launch overlay, keyed by the
    // language-independent event id (see the "launchoverlaymessage" event).
    launchOverlayMessages: {
        "after": "",
        "capturing": "Capturing...",
        "gameover": "Game Over",
        "init": "",
        "launching": "Loading...",
        "running": "Launching table...",
        "terminating": "Returning to game list...",
    },

    // Functions that build translated titles for PinballY's dynamically
    // generated menu text (category names, star ratings, etc.).
    dynamicLabelBuilders: {
        captureInstructions: (seconds) => {
            const plural = seconds === "1" ? "" : "s";
            return `Select the items you'd like to capture, then select Begin Capture. This will launch your game, capture screen images, and automatically exit the game when done. The process will take about ${seconds} second${plural}. (!) means that an existing item will be replaced.`;
        },
        captureInstructionsOneMinute: () =>
            "Select the items you'd like to capture, then select Begin Capture. This will launch your game, capture screen images, and automatically exit the game when done. The process will take about 1 minute. (!) means that an existing item will be replaced.",
        captureItemAction: (item, action) => `${item}: ${action}`,
        decadeTables: (decade) => `${decade}s Tables`,
        genericTables: (name) => `${name} Tables`,
        mediaGameMismatchWarning: (draggedGame, currentGame) =>
            `It looks like some of the media files you're adding might be intended for a different game, "${draggedGame}". Media files are always added to the game selected on the wheel, currently "${currentGame}". Do you want to add these media items to the current game?`,
        mediaGameMismatchWarningMultiple: (gameList, currentGame) =>
            `It looks like some of the media files you're adding might be intended for other games: ${gameList}. Media files are always added to the game selected on the wheel, currently "${currentGame}". Do you want to add these media items to the current game?`,
        mediaReadyToAdd: (gameName) =>
            `The following media items are ready to be added for ${gameName}. Choose the items you'd like to add or replace.`,
        starTables: (count) => `${count}-Star Tables`,
        startDelay: (seconds) => `Adjust Start Delay (${seconds} sec)`,
        unratedTables: () => "Unrated Tables",
    },

    ratingPrompt: {
        message: (tableTitle, minutes) =>
            `You've played "${tableTitle}" for over ${minutes} minutes! Would you like to rate it now?`,
        rateNow: "Rate Now",
        notNow: "Not Now",
    },

    startupPrompt: {
        introWithPicks: (playerName, dayTitle, weekTitle) => {
            const lines = [`Hi, ${playerName}! How would you like to start?`];
            if (dayTitle) lines.push(`Table of the Day: ${dayTitle}`);
            if (weekTitle) lines.push(`Table of the Week: ${weekTitle}`);
            return lines.join("\n");
        },
        stayOnLastPlayed: "Stay on Last Played Table",
        tableOfTheDay: "Launch Table of the Day",
        tableOfTheWeek: "Launch Table of the Week",
        randomTable: "Launch a Random Table",
    },

    // Lower status line text for the currently selected table.
    // [Filter.Count], [Game.Year], etc. are PinballY placeholders — keep them as-is.
    tableInfoStatusLines: {
        manufacturer: (position) => `Table ${position}/[Filter.Count] - made by [Game.Manuf].`,
        manufacturerFictional: (position) => `Table ${position}/[Filter.Count] - fictional pinball table.`,
        playCount: (position, count) => `Table ${position}/[Filter.Count] - launched ${count} times.`,
        playTime: (position, hours, minutes) => `Table ${position}/[Filter.Count] - played for ${formatPlayTime(hours, minutes)}.`,
        year: (position) => `Table ${position}/[Filter.Count] - released in [Game.Year].`,
    },

    // Labels for menu items this project adds itself (see custom_menu_commands.js, custom_filter.js and hall_of_fame.js).
    customMenuLabels: {
        hallOfFameFilter: "Hall of Fame",
        originalTablesFilter: "Original Tables",
        randomGame: "Start Random Game",
        tableOfTheDay: "Launch Table of the Day",
        tableOfTheWeek: "Launch Table of the Week",
        tableSetup: "Table Setup",
    },

    // Thresholded titles are keyed by their threshold, which is part of the
    // Achievement ID (see achievements/).
    achievements: {
        dailyFirstPlayTitle: () => "Hello, Table of the Day!",
        dailyFirstPlayDescription: () => "Launch the table of the day for the first time.",
        weeklyFirstPlayTitle: () => "Weekly Date",
        weeklyFirstPlayDescription: () => "Launch the table of the week for the first time.",
        dailyPeriodsPlayedTitles: {
            10: "Sunday Explorer",
            50: "Seasoned Explorer",
            100: "Indiana Flippers",
        },
        dailyPeriodsPlayedDescription: (days) => `Launch the table of the day on ${days} different days.`,
        weeklyPeriodsPlayedTitles: {
            10: "Weekly Regular",
            26: "Six Months of Loyalty",
            52: "A Year Without a Wrinkle",
        },
        weeklyPeriodsPlayedDescription: (weeks) => `Launch the table of the week in ${weeks} different weeks.`,
        dailyStreakTitles: {
            3: "Third Time's the Charm",
            7: "Perfect Week",
            30: "Pinball Monk",
        },
        dailyStreakDescription: (days) => `Launch the table of the day ${days} days in a row.`,
        weeklyStreakTitles: {
            4: "A Flawless Month",
            12: "Loyal Subscriber",
        },
        weeklyStreakDescription: (weeks) => `Launch the table of the week ${weeks} weeks in a row.`,
        manufacturerCompletionTitle: (manufacturer) => `Die-Hard ${manufacturer} Fan`,
        manufacturerCompletionDescription: (manufacturer, count) => `Play all ${count} ${manufacturer} tables at least once.`,
        firstTableTitle: () => "First Steps",
        firstTableDescription: () => "Play your very first table.",
        collectionPercentTitles: {
            10: "A Taste of Metal",
            25: "Budding Collector",
            50: "Halftime",
            75: "Seen Almost Everything",
            100: "Nothing Escapes Me",
        },
        collectionPercentDescription: (percent, playedCount, totalCount) => `Play ${playedCount} of your ${totalCount} tables (${percent}% of your collection).`,
        playTimeMilestoneTitles: {
            1: "Warming Up",
            5: "Getting Serious",
            10: "Hooked on Pinball",
            50: "Pinball in the Blood",
            100: "Tilt Legend",
        },
        playTimeMilestoneDescription: (hours) => `Play for more than ${hours} hour${hours > 1 ? "s" : ""} in total.`,
        decadeCompletionTitle: (decadeStartYear) => `A Trip Back to the ${decadeStartYear}s`,
        decadeCompletionDescription: (decadeStartYear, count) => `Play all ${count} tables from the ${decadeStartYear}s at least once.`,
        categoryCompletionTitle: (category) => `${category} Master`,
        categoryCompletionDescription: (category, count) => `Play all ${count} "${category}" tables at least once.`,
        marathonTitles: {
            30: "Mini Marathon",
            60: "Marathoner",
        },
        marathonDescription: (minutes) => `Play a single session lasting over ${minutes} minutes.`,
        rageQuitTitle: () => "Rage Quit?!",
        rageQuitDescription: (minSeconds, maxSeconds) => `Quit a table after only ${minSeconds} to ${maxSeconds} seconds...`,
        grandReturnTitle: () => "The Grand Comeback",
        grandReturnDescription: (days) => `Replay a table after ${days} or more days away.`,
        randomGamesTitles: {
            10: "Why Not?",
            50: "Dice Roller",
            100: "I Looooove Chance",
        },
        randomGamesDescription: (count) => `Play ${count} Random Games.`,
        dayManufacturersTitles: {
            3: "Express World Tour",
            5: "Pinball Butterfly",
            8: "Serial Unfaithful",
        },
        dayManufacturersDescription: (count) => `Play tables from ${count} different manufacturers on the same day.`,
        // Header of the Achievement Toast card.
        toastHeader: "Achievement unlocked",
    },

    // The Achievement List screen (see common/achievement_list.js).
    achievementList: {
        menuEntry: "Achievement List",
        totalLine: (unlockedCount, totalCount) => `Total: ${unlockedCount}/${totalCount}`,
        familyLine: (family, unlockedCount, totalCount) => `${family} (${unlockedCount}/${totalCount})`,
        back: "Back",
        // The Achievement Progress line, when there is one, sits between the
        // description and the status.
        cardMessage: (title, description, status, progress) => (progress === undefined
            ? `${title}\n${description}\n\n${status}`
            : `${title}\n${description}\n\n${progress}\n${status}`),
        unlocked: "Unlocked",
        notUnlocked: "Not unlocked yet",
        // A missing Achievement's Achievement Progress: short after its title
        // in a family's list, long on its card.
        titleWithProgress: (title, progress) => `${title} (${progress})`,
        progressLine: progress => `Progress: ${progress}`,
        progressUnits: {
            tables: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} of ${target} tables`,
            },
            hours: {
                short: (current, target) => `${formatHours(current)}/${target} h`,
                long: (current, target) => `${formatHours(current)} of ${target} hours`,
            },
            daysInARow: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} of ${target} days in a row`,
            },
            weeksInARow: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} of ${target} weeks in a row`,
            },
            daysPlayed: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} of ${target} days played`,
            },
            weeksPlayed: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} of ${target} weeks played`,
            },
            minutes: {
                short: (current, target) => `${current}/${target} min`,
                long: (current, target) => `${current} of ${target} minutes`,
            },
            randomGames: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} of ${target} Random Games`,
            },
            manufacturers: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} of ${target} manufacturers`,
            },
        },
        families: {
            collection: "Collection",
            playTime: "Play Time",
            periodTables: "Tables of the Day and Week",
            sessions: "Sessions",
            randomGame: "Random Game",
            manufacturers: "Manufacturers",
            decades: "Decades",
            categories: "Categories",
        },
    },

    profileStats: {
        menuEntry: "Statistics",
        title: (name) => `${name}'s stats`,
        gamesPlayed: (count) => `Games played: ${count}`,
        // Minutes on two digits: "42 h 05".
        totalTime: (hours, minutes) => `Total time: ${hours} h ${String(minutes).padStart(2, "0")}`,
        collection: (played, total, percent) => `Collection: ${played}/${total} tables (${percent}%)`,
        achievements: (unlocked, total) => `Achievements: ${unlocked}/${total}`,
        tableOfTheDayStreak: (count, longest) => `Daily streak: ${count} (best ${longest})`,
        tableOfTheWeekStreak: (count, longest) => `Weekly streak: ${count} (best ${longest})`,
        // Most time spent, with that time; "—" before any play.
        favouriteManufacturer: (name, hours, minutes) => `Manufacturer: ${name} (${hours} h ${String(minutes).padStart(2, "0")})`,
        noFavouriteManufacturer: "Manufacturer: —",
        favouriteDecade: (decadeStartYear, hours, minutes) => `Decade: ${decadeStartYear}s (${hours} h ${String(minutes).padStart(2, "0")})`,
        noFavouriteDecade: "Decade: —",
        // Sub-menu entries, with how many tables each list holds.
        mostPlayedTables: (count) => `Most played tables (${count})`,
        neverPlayedTables: (count) => `Never played tables (${count})`,
        back: "Back",
    },

    // Profiles. Guest's folder name is never shown: this is its name.
    profiles: {
        menuEntry: "Change Player",
        pickerTitle: "Who's playing?",
        pickerHint: "Flippers: browse · Start: choose · Exit: cancel",
        guestName: "Guest",
        greeting: name => `Hi ${name}!`,
    },

    // The clock at the top left of the wheel screen.
    clock: {
        time: (hours, minutes) => `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`,
    },

    // The Challenge Card, under the Profile badge (see common/challenge_card.js).
    challenges: {
        cardHeader: "Challenge of the week",
        // One title per Challenge template, from its target and parameter.
        titles: {
            differentTables: (target) => `Play ${target} different tables`,
        },
        progress: (value, target, daysText) => `${value}/${target} · ${daysText}`,
        daysLeft: (days) => `${days} days left`,
        lastDay: "last day",
    },
};
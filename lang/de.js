// ============================================================
// German translations for PinballY's UI.
// Save this file as UTF-8 with BOM so accented characters display correctly.
// ============================================================

// The active Profile's play time of a table, as PinballY writes its own.
const formatPlayTime = (hours, minutes) => (hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")} Stunden`
    : `${minutes} Minute${minutes === 1 ? "" : "n"}`);

// Hours of play with one decimal, as an Achievement Progress shows them.
const formatHours = hours => hours.toFixed(1).replace(".", ",");

export default {
    // Direct translations of PinballY's native menu titles.
    nativeMenuLabels: {
        "About PinballY": "Über PinballY",
        "Add Media": "Medien hinzufügen",
        "Add to Favorites": "Zu den Favoriten hinzufügen",
        "Adjust Audio Volume": "Lautstärke einstellen",
        "All Games": "Alle Tische",
        "All Tables": "Alle Tische",
        "Batch Capture": "Stapelaufnahme",
        "Batch Capture lets you capture screen shot images and videos for multiple games.  Step 1: select which games to include in the capture process:": "Mit der Stapelaufnahme können Sie Screenshots und Videos für mehrere Tische aufnehmen. Schritt 1: Wählen Sie die Tische aus, die in den Aufnahmevorgang einbezogen werden sollen:",
        "Begin Capture": "Aufnahme starten",
        "Cancel": "Abbrechen",
        "Capture images & videos": "Bilder und Videos aufnehmen",
        "Confirm Power Off": "Ausschalten bestätigen",
        "Delete game details": "Tischdetails löschen",
        "Edit category names...": "Kategorienamen bearbeiten...",
        "Edit game details...": "Tischdetails bearbeiten...",
        "Enable Videos": "Videos aktivieren",
        "Exit": "Beenden",
        "Exit PinballY": "PinballY beenden",
        "Favorites": "Favoriten",
        "Filter by Category": "Nach Kategorie filtern",
        "Filter by Date Added": "Nach Hinzufügedatum filtern",
        "Filter by Era": "Nach Epoche filtern",
        "Filter by Last Played": "Nach zuletzt gespielt filtern",
        "Filter by Manufacturer": "Nach Hersteller filtern",
        "Filter by Rating": "Nach Bewertung filtern",
        "Filter by System": "Nach System filtern",
        "Find game media online": "Spielemedien online suchen",
        "Games marked for batch capture": "Für die Stapelaufnahme markierte Tische",
        "Game Setup": "Tischkonfiguration",
        "Help": "Hilfe",
        "Hide this game": "Diesen Tisch ausblenden",
        "High Scores": "Highscores",
        "In Favorites": "In den Favoriten",
        "Information": "Informationen",
        "Instruction Card": "Anleitungskarte",
        "Mark for Batch Capture": "Für die Stapelaufnahme markieren",
        "Marked for Batch Capture": "Für die Stapelaufnahme markiert",
        "Mute Attract Mode": "Ton im Attraktionsmodus ausschalten",
        "Mute Buttons": "Tastentöne ausschalten",
        "Mute Table Audio": "Tischton ausschalten",
        "Mute Videos": "Videoton ausschalten",
        "Operator Menu": "Betreibermenü",
        "Options": "Optionen",
        "PinballY Options...": "Optionen...",
        "Play": "Spielen",
        "Play Game": "Spiel starten",
        "Power Off": "Computer ausschalten",
        "Proceed": "Fortfahren",
        "Rate Table": "Tisch bewerten",
        "Reset Coins/Credits": "Münzen/Guthaben zurücksetzen",
        "Resume Game": "Spiel fortsetzen",
        "Return": "Zurück",
        "Save": "Speichern",
        "Search": "Suchen",
        "Select categories": "Kategorien auswählen",
        "Show Hidden Games": "Ausgeblendete Tische anzeigen",
        "Show Media Files": "Mediendateien anzeigen",
        "Show Unconfigured Games": "Nicht konfigurierte Tische anzeigen",
        "Skip this message next time": "Diese Meldung beim nächsten Mal nicht mehr anzeigen",
        "Terminate Game": "Spiel beenden",
        "The capture process records the exact same areas of the screen where your PinballY windows are located.  Before proceeding, make sure that your PinballY window layout matches the screen layout of the game you're about to record.  For example, if the game's playfield is full-screen, make sure PinballY's playfield window is full-screen.": "Der Aufnahmevorgang zeichnet genau die Bereiche des Bildschirms auf, in denen sich Ihre PinballY-Fenster befinden. Bevor Sie fortfahren, stellen Sie sicher, dass die Anordnung Ihrer PinballY-Fenster der Bildschirmaufteilung des Spiels entspricht, das Sie aufnehmen möchten. Wenn beispielsweise das Spielfeld des Spiels den gesamten Bildschirm ausfüllt, stellen Sie sicher, dass auch das Spielfeldfenster von PinballY den gesamten Bildschirm ausfüllt.",
        "This will launch a Web browser window to search for media files for this game.  Look for a \"HyperPin Media Pack\" file.  Download the file and drag it onto this window to install it.\n\nNote that you can drop a Media Pack file onto this window at any time to install media for the currently selected game.  This menu step isn't required to install media; it's just a convenience for launching a Web search.": "Dies öffnet ein Webbrowser-Fenster, um Mediendateien für diesen Tisch zu suchen. Suchen Sie nach einer Datei mit dem Namen \"HyperPin Media Pack\". Laden Sie die Datei herunter und ziehen Sie sie auf dieses Fenster, um sie zu installieren.\n\nBeachten Sie, dass Sie jederzeit eine Media-Pack-Datei auf dieses Fenster ziehen können, um Medien für den aktuell ausgewählten Tisch zu installieren. Dieser Menüpunkt ist nicht erforderlich, um Medien zu installieren; er dient lediglich als praktische Möglichkeit, eine Websuche zu starten.",
        "Uncategorized": "Nicht kategorisiert",
        "Yes, add to current game": "Ja, zum aktuellen Tisch hinzufügen",
        "You must enter the game's bibliographic information (title, system, etc.) before adding media files for the game.  The game information is used to determine the folder locations and file names for the game's media files, so it has to be entered before media files can be added to the game.": "Sie müssen die bibliografischen Informationen des Tisches (Titel, System usw.) eingeben, bevor Sie Mediendateien für den Tisch hinzufügen können. Diese Informationen werden verwendet, um die Ordnerpfade und Dateinamen für die Mediendateien des Tisches zu bestimmen, daher müssen sie eingegeben werden, bevor Mediendateien hinzugefügt werden können.",
    },

    // Labels for the media-capture screen's "Item: Action" lines
    // (e.g. "Playfield Image: Skip"), combined via dynamicLabelBuilders.captureItemAction.
    mediaCaptureItemLabels: {
        "Backglass Image": "Backglass-Bild",
        "Backglass Video": "Backglass-Video",
        "Flyer Image": "Flyer-Bild",
        "Instruction Card": "Anleitungskarte",
        "Playfield Image": "Spielfeldbild",
        "Playfield Video": "Spielfeldvideo",
        "Table Audio": "Tischaudio",
        "Wheel Image": "Wheel-Bild",
    },
    mediaCaptureActionLabels: {
        "Add": "Hinzufügen",
        "Capture": "Aufnehmen",
        "Capture Silent": "Ohne Ton aufnehmen",
        "Capture w/Audio": "Mit Audio aufnehmen",
        "Keep Existing": "Vorhandenes behalten",
        "Replace Existing": "Vorhandenes ersetzen",
        "Skip": "Überspringen",
    },

    // Status text shown in PinballY's launch overlay, keyed by the
    // language-independent event id (see the "launchoverlaymessage" event).
    launchOverlayMessages: {
        "after": "",
        "capturing": "Aufnahme läuft...",
        "gameover": "Game Over",
        "init": "",
        "launching": "Wird geladen...",
        "running": "Tisch wird gestartet...",
        "terminating": "Zurück zur Spieleliste...",
    },

    // Functions that build translated titles for PinballY's dynamically
    // generated menu text (category names, star ratings, etc.).
    dynamicLabelBuilders: {
        captureInstructions: (seconds) => {
            const plural = seconds === "1" ? "" : "en";
            return `Wählen Sie die aufzunehmenden Elemente aus und klicken Sie dann auf Aufnahme starten. Dadurch wird Ihr Spiel gestartet, die Bildschirmaufnahmen werden erstellt und das Spiel wird nach Abschluss automatisch beendet. Der Vorgang dauert etwa ${seconds} Sekunde${plural}. (!) bedeutet, dass ein vorhandenes Element ersetzt wird.`;
        },
        captureInstructionsOneMinute: () =>
            "Wählen Sie die aufzunehmenden Elemente aus und klicken Sie dann auf Aufnahme starten. Dadurch wird Ihr Spiel gestartet, die Bildschirmaufnahmen werden erstellt und das Spiel wird nach Abschluss automatisch beendet. Der Vorgang dauert etwa 1 Minute. (!) bedeutet, dass ein vorhandenes Element ersetzt wird.",
        captureItemAction: (item, action) => `${item}: ${action}`,
        decadeTables: (decade) => `Tische der ${decade}er-Jahre`,
        genericTables: (name) => `Tische ${name}`,
        mediaGameMismatchWarning: (draggedGame, currentGame) =>
            `Es sieht so aus, als wären einige der Mediendateien, die Sie hinzufügen, für einen anderen Tisch bestimmt: "${draggedGame}". Mediendateien werden immer dem auf dem Wheel ausgewählten Tisch hinzugefügt, aktuell "${currentGame}". Möchten Sie diese Medienelemente trotzdem dem aktuellen Tisch hinzufügen?`,
        mediaGameMismatchWarningMultiple: (gameList, currentGame) =>
            `Es sieht so aus, als wären einige der Mediendateien, die Sie hinzufügen, für andere Tische bestimmt: ${gameList}. Mediendateien werden immer dem auf dem Wheel ausgewählten Tisch hinzugefügt, aktuell "${currentGame}". Möchten Sie diese Medienelemente trotzdem dem aktuellen Tisch hinzufügen?`,
        mediaReadyToAdd: (gameName) =>
            `Die folgenden Medienelemente sind bereit, für ${gameName} hinzugefügt zu werden. Wählen Sie die Elemente aus, die Sie hinzufügen oder ersetzen möchten.`,
        starTables: (count) => `Tische mit ${count} Stern${count > 1 ? "en" : ""}`,
        startDelay: (seconds) => `Startverzögerung einstellen (${seconds} Sek.)`,
        unratedTables: () => "Nicht bewertete Tische",
    },

    ratingPrompt: {
        message: (tableTitle, minutes) =>
            `Sie haben "${tableTitle}" seit über ${minutes} Minuten gespielt! Möchten Sie ihn jetzt bewerten?`,
        rateNow: "Jetzt bewerten",
        notNow: "Später",
    },

    startupPrompt: {
        introWithPicks: (playerName, dayTitle, weekTitle) => {
            const lines = [`Hallo, ${playerName}! Wie möchten Sie starten?`];
            if (dayTitle) lines.push(`Tisch des Tages: ${dayTitle}`);
            if (weekTitle) lines.push(`Tisch der Woche: ${weekTitle}`);
            return lines.join("\n");
        },
        stayOnLastPlayed: "Beim zuletzt gespielten Tisch bleiben",
        tableOfTheDay: "Tisch des Tages starten",
        tableOfTheWeek: "Tisch der Woche starten",
        randomTable: "Zufälligen Tisch starten",
    },

    // Lower status line text for the currently selected table.
    // [Filter.Count], [Game.Year], etc. are PinballY placeholders — keep them as-is.
    tableInfoStatusLines: {
        manufacturer: (position) => `Tisch ${position}/[Filter.Count] - hergestellt von [Game.Manuf].`,
        manufacturerFictional: (position) => `Tisch ${position}/[Filter.Count] - Fiktiver Flipper.`,
        playCount: (position, count) => `Tisch ${position}/[Filter.Count] - ${count}-mal gestartet.`,
        playTime: (position, hours, minutes) => `Tisch ${position}/[Filter.Count] - ${formatPlayTime(hours, minutes)} lang gespielt.`,
        year: (position) => `Tisch ${position}/[Filter.Count] - veröffentlicht im Jahr [Game.Year].`,
    },

    // Labels for menu items this project adds itself (see custom_menu_commands.js, custom_filter.js and hall_of_fame.js).
    customMenuLabels: {
        hallOfFameFilter: "Hall of Fame",
        originalTablesFilter: "Original-Tische",
        randomGame: "Zufälligen Tisch starten",
        tableOfTheDay: "Tisch des Tages starten",
        tableOfTheWeek: "Tisch der Woche starten",
        tableSetup: "Tischkonfiguration",
    },

    achievements: {
        dailyFirstPlayTitle: () => "Hallo, Tisch des Tages!",
        dailyFirstPlayDescription: () => "Den Tisch des Tages zum ersten Mal starten.",
        weeklyFirstPlayTitle: () => "Wöchentliches Rendezvous",
        weeklyFirstPlayDescription: () => "Den Tisch der Woche zum ersten Mal starten.",
        dailyPeriodsPlayedTitles: {
            10: "Sonntagsentdecker",
            50: "Erfahrener Entdecker",
            100: "Indiana Flippers",
        },
        dailyPeriodsPlayedDescription: (days) => `Den Tisch des Tages an ${days} verschiedenen Tagen starten.`,
        weeklyPeriodsPlayedTitles: {
            10: "Stammgast der Woche",
            26: "Sechs Monate Treue",
            52: "Ein Jahr und keine Falte",
        },
        weeklyPeriodsPlayedDescription: (weeks) => `Den Tisch der Woche in ${weeks} verschiedenen Wochen starten.`,
        dailyStreakTitles: {
            3: "Aller guten Dinge sind drei",
            7: "Perfekte Woche",
            30: "Flipper-Mönch",
        },
        dailyStreakDescription: (days) => `Den Tisch des Tages ${days} Tage in Folge starten.`,
        weeklyStreakTitles: {
            4: "Ein Monat ohne Fehler",
            12: "Treuer Abonnent",
        },
        weeklyStreakDescription: (weeks) => `Den Tisch der Woche ${weeks} Wochen in Folge starten.`,
        manufacturerCompletionTitle: (manufacturer) => `Absoluter ${manufacturer}-Fan`,
        manufacturerCompletionDescription: (manufacturer, count) => `Alle ${count} Tische von ${manufacturer} mindestens einmal spielen.`,
        firstTableTitle: () => "Erste Schritte",
        firstTableDescription: () => "Den allerersten Tisch spielen.",
        collectionPercentTitles: {
            10: "Der Geschmack von Metall",
            25: "Angehender Sammler",
            50: "Halbzeit",
            75: "Fast alles gesehen",
            100: "Mir entgeht nichts",
        },
        collectionPercentDescription: (percent, playedCount, totalCount) => `${playedCount} von ${totalCount} Tischen spielen (${percent} % der Sammlung).`,
        playTimeMilestoneTitles: {
            1: "Aufwärmen",
            5: "Jetzt wird's ernst",
            10: "Flippersüchtig",
            50: "Flippern im Blut",
            100: "Tilt-Legende",
        },
        playTimeMilestoneDescription: (hours) => `Insgesamt mehr als ${hours} Stunde${hours > 1 ? "n" : ""} spielen.`,
        decadeCompletionTitle: (decadeStartYear) => `Reise in die ${decadeStartYear}er`,
        decadeCompletionDescription: (decadeStartYear, count) => `Alle ${count} Tische der ${decadeStartYear}er mindestens einmal spielen.`,
        categoryCompletionTitle: (category) => `${category}-Meister`,
        categoryCompletionDescription: (category, count) => `Alle ${count} Tische der Kategorie "${category}" mindestens einmal spielen.`,
        marathonTitles: {
            30: "Kleiner Marathon",
            60: "Marathonläufer",
        },
        marathonDescription: (minutes) => `Eine einzige Session von über ${minutes} Minuten spielen.`,
        rageQuitTitle: () => "Wutausstieg?!",
        rageQuitDescription: (minSeconds, maxSeconds) => `Einen Tisch nach nur ${minSeconds} bis ${maxSeconds} Sekunden verlassen...`,
        grandReturnTitle: () => "Die große Rückkehr",
        grandReturnDescription: (days) => `Einen Tisch nach ${days} oder mehr Tagen Pause wieder spielen.`,
        randomGamesTitles: {
            10: "Warum nicht?",
            50: "Würfelspieler",
            100: "Ich liiiiebe den Zufall",
        },
        randomGamesDescription: (count) => `${count} zufällige Tische spielen.`,
        dayManufacturersTitles: {
            3: "Weltreise im Eiltempo",
            5: "Flipper-Schmetterling",
            8: "Serien-Untreuer",
        },
        dayManufacturersDescription: (count) => `Am selben Tag Tische von ${count} verschiedenen Herstellern spielen.`,
        // Header of the Achievement Toast card.
        toastHeader: "Erfolg freigeschaltet",
    },

    achievementList: {
        menuEntry: "Erfolgsliste",
        totalLine: (unlockedCount, totalCount) => `Gesamt: ${unlockedCount}/${totalCount}`,
        familyLine: (family, unlockedCount, totalCount) => `${family} (${unlockedCount}/${totalCount})`,
        back: "Zurück",
        // The Achievement Progress line, when there is one, sits between the
        // description and the status.
        cardMessage: (title, description, status, progress) => (progress === undefined
            ? `${title}\n${description}\n\n${status}`
            : `${title}\n${description}\n\n${progress}\n${status}`),
        unlocked: "Freigeschaltet",
        notUnlocked: "Noch nicht freigeschaltet",
        // A missing Achievement's Achievement Progress: short after its title
        // in a family's list, long on its card.
        titleWithProgress: (title, progress) => `${title} (${progress})`,
        progressLine: progress => `Fortschritt: ${progress}`,
        progressUnits: {
            tables: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} von ${target} Tischen`,
            },
            hours: {
                short: (current, target) => `${formatHours(current)}/${target} h`,
                long: (current, target) => `${formatHours(current)} von ${target} Stunden`,
            },
            daysInARow: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} von ${target} Tagen in Folge`,
            },
            weeksInARow: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} von ${target} Wochen in Folge`,
            },
            daysPlayed: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} von ${target} gespielten Tagen`,
            },
            weeksPlayed: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} von ${target} gespielten Wochen`,
            },
            minutes: {
                short: (current, target) => `${current}/${target} min`,
                long: (current, target) => `${current} von ${target} Minuten`,
            },
            randomGames: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} von ${target} zufälligen Tischen`,
            },
            manufacturers: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} von ${target} Herstellern`,
            },
        },
        families: {
            collection: "Sammlung",
            playTime: "Spielzeit",
            periodTables: "Tisch des Tages und der Woche",
            sessions: "Sitzungen",
            randomGame: "Zufallsspiel",
            manufacturers: "Hersteller",
            decades: "Jahrzehnte",
            categories: "Kategorien",
        },
    },

    profileStats: {
        menuEntry: "Statistiken",
        title: (name) => `Statistiken von ${name}`,
        gamesPlayed: (count) => `Gespielte Partien: ${count}`,
        // Minutes on two digits: "42 h 05".
        totalTime: (hours, minutes) => `Gesamtzeit: ${hours} Std. ${String(minutes).padStart(2, "0")}`,
        collection: (played, total, percent) => `Sammlung: ${played}/${total} Tische (${percent} %)`,
        achievements: (unlocked, total) => `Erfolge: ${unlocked}/${total}`,
        tableOfTheDayStreak: (count, longest) => `Tagesserie: ${count} (Rekord ${longest})`,
        tableOfTheWeekStreak: (count, longest) => `Wochenserie: ${count} (Rekord ${longest})`,
        // Most time spent, with that time; "—" before any play.
        favouriteManufacturer: (name, hours, minutes) => `Hersteller: ${name} (${hours} Std. ${String(minutes).padStart(2, "0")})`,
        noFavouriteManufacturer: "Hersteller: —",
        favouriteDecade: (decadeStartYear, hours, minutes) => `Jahrzehnt: ${decadeStartYear}er (${hours} Std. ${String(minutes).padStart(2, "0")})`,
        noFavouriteDecade: "Jahrzehnt: —",
        // Sub-menu entries, with how many tables each list holds.
        mostPlayedTables: (count) => `Meistgespielte Tische (${count})`,
        neverPlayedTables: (count) => `Nie gespielte Tische (${count})`,
        back: "Zurück",
    },

    // Profiles. Guest's folder name is never shown: this is its name.
    profiles: {
        menuEntry: "Spieler wechseln",
        pickerTitle: "Wer spielt?",
        pickerHint: "Flipper: blättern · Start: wählen · Exit: abbrechen",
        guestName: "Gast",
        greeting: name => `Hallo ${name}!`,
    },

    // The clock at the top left of the wheel screen.
    clock: {
        time: (hours, minutes) => `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    },

    // The Challenge Card, under the Profile badge (see common/challenge_card.js).
    challenges: {
        cardHeader: "Herausforderung der Woche",
        titles: {
            differentTables: (target) => `${target} verschiedene Tische spielen`,
        },
        progress: (value, target, daysText) => `${value}/${target} · ${daysText}`,
        daysLeft: (days) => `noch ${days} Tage`,
        lastDay: "letzter Tag",
    },
};
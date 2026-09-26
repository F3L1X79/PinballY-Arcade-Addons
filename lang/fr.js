// ============================================================
// French translations for PinballY's UI.
// Save this file as UTF-8 with BOM so accented characters display correctly.
// ============================================================

// The active Profile's play time of a table, as PinballY writes its own.
const formatPlayTime = (hours, minutes) => (hours > 0
    ? `${hours} h ${String(minutes).padStart(2, "0")}`
    : `${minutes} minute${minutes > 1 ? "s" : ""}`);

// Hours of play with one decimal, as an Achievement Progress shows them.
const formatHours = hours => hours.toFixed(1).replace(".", ",");

export default {
    // Direct translations of PinballY's native menu titles.
    nativeMenuLabels: {
        "About PinballY": "À propos",
        "Add Media": "Ajouter des médias",
        "Add to Favorites": "Ajouter aux favoris",
        "Adjust Audio Volume": "Régler le volume audio",
        "All Games": "Toutes les tables",
        "All Tables": "Toutes les tables",
        "Batch Capture": "Capture par lot",
        "Batch Capture lets you capture screen shot images and videos for multiple games.  Step 1: select which games to include in the capture process:": "La capture par lot vous permet de capturer des captures d'écran et des vidéos pour plusieurs tables. Étape 1 : sélectionnez les tables à inclure dans le processus de capture :",
        "Begin Capture": "Démarrer la capture",
        "Cancel": "Annuler",
        "Capture images & videos": "Capturer images et vidéos",
        "Confirm Power Off": "Confirmer l'arrêt",
        "Delete game details": "Supprimer les détails de la table",
        "Edit category names...": "Modifier les noms de catégories...",
        "Edit game details...": "Modifier les détails de la table...",
        "Enable Videos": "Activer les vidéos",
        "Exit": "Quitter",
        "Exit PinballY": "Quitter",
        "Favorites": "Favoris",
        "Filter by Category": "Filtrer par catégorie",
        "Filter by Date Added": "Filtrer par date d'ajout",
        "Filter by Era": "Filtrer par époque",
        "Filter by Last Played": "Filtrer par dernière partie",
        "Filter by Manufacturer": "Filtrer par fabricant",
        "Filter by Rating": "Filtrer par note",
        "Filter by System": "Filtrer par système",
        "Find game media online": "Rechercher les médias en ligne",
        "Game Setup": "Configuration de la table",
        "Games marked for batch capture": "Tables marquées pour la capture par lot",
        "Help": "Aide",
        "Hide this game": "Masquer cette table",
        "High Scores": "Meilleurs scores",
        "In Favorites": "Dans les favoris",
        "Information": "Informations",
        "Instruction Card": "Carte d'instructions",
        "Mark for Batch Capture": "Marquer pour capture par lot",
        "Marked for Batch Capture": "Marquée pour capture par lot",
        "Mute Attract Mode": "Couper le son du mode attraction",
        "Mute Buttons": "Couper le son des boutons",
        "Mute Table Audio": "Couper l'audio de la table",
        "Mute Videos": "Couper le son des vidéos",
        "Operator Menu": "Menu opérateur",
        "Options": "Options",
        "PinballY Options...": "Options...",
        "Play": "Jouer",
        "Play Game": "Lancer la partie",
        "Power Off": "Éteindre l'ordinateur",
        "Proceed": "Continuer",
        "Rate Table": "Noter la table",
        "Reset Coins/Credits": "Réinitialiser pièces/crédits",
        "Resume Game": "Reprendre la partie",
        "Return": "Retour",
        "Save": "Enregistrer",
        "Search": "Rechercher",
        "Select categories": "Sélectionner les catégories",
        "Show Hidden Games": "Afficher les tables masquées",
        "Show Media Files": "Afficher les fichiers médias",
        "Show Unconfigured Games": "Afficher les tables non configurées",
        "Skip this message next time": "Ne plus afficher ce message",
        "Terminate Game": "Arrêter la partie",
        "The capture process records the exact same areas of the screen where your PinballY windows are located.  Before proceeding, make sure that your PinballY window layout matches the screen layout of the game you're about to record.  For example, if the game's playfield is full-screen, make sure PinballY's playfield window is full-screen.": "Le processus de capture enregistre exactement les mêmes zones de l'écran où sont situées vos fenêtres PinballY. Avant de continuer, assurez-vous que la disposition de vos fenêtres PinballY correspond à celle du jeu que vous allez enregistrer. Par exemple, si le plateau du jeu est en plein écran, assurez-vous que la fenêtre de plateau de PinballY l'est aussi.",
        "This will launch a Web browser window to search for media files for this game.  Look for a \"HyperPin Media Pack\" file.  Download the file and drag it onto this window to install it.\n\nNote that you can drop a Media Pack file onto this window at any time to install media for the currently selected game.  This menu step isn't required to install media; it's just a convenience for launching a Web search.": "Ceci va ouvrir une fenêtre de navigateur Web pour rechercher des fichiers médias pour cette table. Cherchez un fichier \"HyperPin Media Pack\". Téléchargez le fichier et déposez-le sur cette fenêtre pour l'installer.\n\nNotez que vous pouvez déposer un fichier Media Pack sur cette fenêtre à tout moment pour installer des médias pour la table actuellement sélectionnée. Cette étape du menu n'est pas obligatoire pour installer des médias ; c'est juste un raccourci pour lancer une recherche Web.",
        "Uncategorized": "Non catégorisées",
        "Yes, add to current game": "Oui, ajouter à la table actuelle",
        "You must enter the game's bibliographic information (title, system, etc.) before adding media files for the game.  The game information is used to determine the folder locations and file names for the game's media files, so it has to be entered before media files can be added to the game.": "Vous devez saisir les informations bibliographiques de la table (titre, système, etc.) avant d'ajouter des fichiers médias pour cette table. Ces informations sont utilisées pour déterminer les emplacements des dossiers et les noms de fichiers des médias de la table ; elles doivent donc être renseignées avant de pouvoir ajouter des fichiers médias.",
    },

    // Labels for the media-capture screen's "Item: Action" lines
    // (e.g. "Playfield Image: Skip"), combined via dynamicLabelBuilders.captureItemAction.
    mediaCaptureItemLabels: {
        "Backglass Image": "Image du backglass",
        "Backglass Video": "Vidéo du backglass",
        "Flyer Image": "Image de l'affiche",
        "Instruction Card": "Carte d'instructions",
        "Playfield Image": "Image du plateau",
        "Playfield Video": "Vidéo du plateau",
        "Table Audio": "Audio de la table",
        "Wheel Image": "Image de la roue",
    },
    mediaCaptureActionLabels: {
        "Add": "Ajouter",
        "Capture": "Capturer",
        "Capture Silent": "Capturer sans son",
        "Capture w/Audio": "Capturer avec audio",
        "Keep Existing": "Conserver l'existant",
        "Replace Existing": "Remplacer l'existant",
        "Skip": "Ignorer",
    },

    // Status text shown in PinballY's launch overlay, keyed by the
    // language-independent event id (see the "launchoverlaymessage" event).
    launchOverlayMessages: {
        "after": "",
        "capturing": "Capture en cours...",
        "gameover": "Game Over",
        "init": "",
        "launching": "Chargement en cours...",
        "running": "Lancement de la table...",
        "terminating": "Retour à la liste des jeux...",
    },

    // Functions that build translated titles for PinballY's dynamically
    // generated menu text (category names, star ratings, etc.).
    dynamicLabelBuilders: {
        captureInstructions: (seconds) => {
            const plural = seconds === "1" ? "" : "s";
            return `Sélectionnez les éléments à capturer, puis cliquez sur Démarrer la capture. Cela va lancer votre jeu, capturer les images de l'écran, et quitter automatiquement le jeu une fois terminé. Le processus prendra environ ${seconds} seconde${plural}. (!) signifie qu'un élément existant sera remplacé.`;
        },
        captureInstructionsOneMinute: () =>
            "Sélectionnez les éléments à capturer, puis cliquez sur Démarrer la capture. Cela va lancer votre jeu, capturer les images de l'écran, et quitter automatiquement le jeu une fois terminé. Le processus prendra environ 1 minute. (!) signifie qu'un élément existant sera remplacé.",
        captureItemAction: (item, action) => `${item} : ${action}`,
        decadeTables: (decade) => `Tables années ${decade}`,
        genericTables: (name) => `Tables ${name}`,
        mediaGameMismatchWarning: (draggedGame, currentGame) =>
            `Il semblerait que certains fichiers médias que vous ajoutez soient destinés à une autre table, "${draggedGame}". Les fichiers médias sont toujours ajoutés à la table sélectionnée sur la roue, actuellement "${currentGame}". Voulez-vous ajouter ces éléments à la table actuelle ?`,
        mediaGameMismatchWarningMultiple: (gameList, currentGame) =>
            `Il semblerait que certains fichiers médias que vous ajoutez soient destinés à d'autres tables : ${gameList}. Les fichiers médias sont toujours ajoutés à la table sélectionnée sur la roue, actuellement "${currentGame}". Voulez-vous ajouter ces éléments à la table actuelle ?`,
        mediaReadyToAdd: (gameName) =>
            `Les éléments médias suivants sont prêts à être ajoutés pour ${gameName}. Choisissez les éléments que vous souhaitez ajouter ou remplacer.`,
        starTables: (count) => `Tables ${count} étoile${count > 1 ? "s" : ""}`,
        startDelay: (seconds) => `Ajuster le délai de démarrage (${seconds} sec)`,
        unratedTables: () => "Tables non notées",
    },

    ratingPrompt: {
        message: (tableTitle, minutes) =>
            `Eh beh mon chocho ! T'as totalisé plus de ${minutes} minutes de jeu sur la table "${tableTitle}" ! Est-ce que ce serait pas le moment de lui mettre une petite note ?`,
        rateNow: "Allez, go !",
        notNow: "Nan, flemme...",
    },

    startupPrompt: {
        introWithPicks: (playerName, dayTitle, weekTitle) => {
            const lines = [`Salut à toi, ${playerName} !`];
            lines.push('');
            lines.push('Choisis une option parmi celles-ci pour pouvoir démarrer ton pèlerinage de Geek.');
            lines.push('---');
            if (dayTitle) lines.push(`Table du jour : ${dayTitle}`);
            lines.push('---');
            if (weekTitle) lines.push(`Table de la semaine : ${weekTitle}`);
            return lines.join("\n");
        },
        stayOnLastPlayed: "Rester sur la dernière table jouée",
        tableOfTheDay: "Lancer la table du jour",
        tableOfTheWeek: "Lancer la table de la semaine",
        randomTable: "Lancer une table au pif !",
    },

    // Lower status line text for the currently selected table.
    // [Filter.Count], [Game.Year], etc. are PinballY placeholders — keep them as-is.
    tableInfoStatusLines: {
        manufacturer: (position) => `Table ${position}/[Filter.Count] - fabriqué par [Game.Manuf].`,
        manufacturerFictional: (position) => `Table ${position}/[Filter.Count] - Flipper fictif.`,
        playCount: (position, count) => `Table ${position}/[Filter.Count] - lancé ${count} fois.`,
        playTime: (position, hours, minutes) => `Table ${position}/[Filter.Count] - joué pendant ${formatPlayTime(hours, minutes)}.`,
        year: (position) => `Table ${position}/[Filter.Count] - sorti en [Game.Year].`,
    },

    // Labels for menu items this project adds itself (see custom_menu_commands.js, custom_filter.js and hall_of_fame.js).
    customMenuLabels: {
        hallOfFameFilter: "Hall of Fame",
        originalTablesFilter: "Tables Originales",
        randomGame: "Lancer une table au hasard",
        tableOfTheDay: "Lancer la table du jour",
        tableOfTheWeek: "Lancer la table de la semaine",
        tableSetup: "Configuration de la table",
    },

    achievements: {
        dailyFirstPlayTitle: () => "Bonjour, table du jour !",
        dailyFirstPlayDescription: () => "Lancer la table du jour pour la première fois.",
        weeklyFirstPlayTitle: () => "Rendez-vous hebdo",
        weeklyFirstPlayDescription: () => "Lancer la table de la semaine pour la première fois.",
        dailyPeriodsPlayedTitles: {
            10: "Explorateur du dimanche",
            50: "Explorateur chevronné",
            100: "Indiana Flippers",
        },
        dailyPeriodsPlayedDescription: (days) => `Lancer la table du jour ${days} jours différents.`,
        weeklyPeriodsPlayedTitles: {
            10: "Habitué de la semaine",
            26: "Six mois de fidélité",
            52: "Un an, pas une ride",
        },
        weeklyPeriodsPlayedDescription: (weeks) => `Lancer la table de la semaine ${weeks} semaines différentes.`,
        dailyStreakTitles: {
            3: "Jamais deux sans trois",
            7: "Semaine parfaite",
            30: "Moine du flipper",
        },
        dailyStreakDescription: (days) => `Lancer la table du jour ${days} jours d'affilée.`,
        weeklyStreakTitles: {
            4: "Un mois sans faute",
            12: "Abonné fidèle",
        },
        weeklyStreakDescription: (weeks) => `Lancer la table de la semaine ${weeks} semaines d'affilée.`,
        decadeCompletionTitle: (decadeStartYear) => `Voyage dans les années ${decadeStartYear}`,
        manufacturerCompletionTitle: (manufacturer) => `Fan absolu de ${manufacturer}`,
        manufacturerCompletionDescription: (manufacturer, count) => `Jouer au moins une fois aux ${count} tables ${manufacturer}.`,
        firstTableTitle: () => "Premiers pas",
        firstTableDescription: () => "Jouer une toute première table.",
        collectionPercentTitles: {
            10: "Le goût du métal",
            25: "Collectionneur en herbe",
            50: "Mi-temps",
            75: "Presque tout vu",
            100: "Rien ne m'échappe",
        },
        collectionPercentDescription: (percent, playedCount, totalCount) => `Jouer à ${playedCount} tables sur ${totalCount} (${percent} % de votre collection).`,
        playTimeMilestoneTitles: {
            1: "Mise en jambes",
            5: "Ça devient sérieux",
            10: "Accro aux flippers",
            50: "Flipper dans le sang",
            100: "Légende du tilt",
        },
        playTimeMilestoneDescription: (hours) => `Cumuler plus de ${hours} heure${hours > 1 ? "s" : ""} de jeu.`,
        decadeCompletionDescription: (decadeStartYear, count) => `Jouer au moins une fois aux ${count} tables des années ${decadeStartYear}.`,
        categoryCompletionTitle: (category) => `Maître ${category}`,
        categoryCompletionDescription: (category, count) => `Jouer au moins une fois aux ${count} tables "${category}".`,
        marathonTitles: {
            30: "Semi-marathonien",
            60: "Marathonien errant",
        },
        marathonDescription: (minutes) => `Jouer une session de plus de ${minutes} minutes d'affilée.`,
        rageQuitTitle: () => "Rage quit ?!",
        rageQuitDescription: (minSeconds, maxSeconds) => `Quitter une table au bout de ${minSeconds} à ${maxSeconds} secondes...`,
        grandReturnTitle: () => "Le grand retour",
        grandReturnDescription: (days) => `Rejouer une table après ${days} jours d'absence ou plus.`,
        randomGamesTitles: {
            10: "Et pourquoi pas ?",
            50: "Joueur de dés",
            100: "J'adooooore le hasard !!",
        },
        randomGamesDescription: (count) => `Lancer ${count} tables au hasard.`,
        dayManufacturersTitles: {
            3: "Tour du monde express",
            5: "Papillon du flipper",
            8: "Infidèle en série",
        },
        dayManufacturersDescription: (count) => `Jouer des tables de ${count} fabricants différents le même jour.`,
        // Header of the Achievement Toast card.
        toastHeader: "Succès débloqué",
    },

    achievementList: {
        menuEntry: "Succès personnels",
        totalLine: (unlockedCount, totalCount) => `Total : ${unlockedCount}/${totalCount}`,
        familyLine: (family, unlockedCount, totalCount) => `${family} (${unlockedCount}/${totalCount})`,
        back: "Retour",
        // The Achievement Progress line, when there is one, sits between the
        // description and the status.
        cardMessage: (title, description, status, progress) => (progress === undefined
            ? `${title}\n${description}\n\n${status}`
            : `${title}\n${description}\n\n${progress}\n${status}`),
        unlocked: "Débloqué",
        notUnlocked: "Pas encore débloqué",
        // A missing Achievement's Achievement Progress: short after its title
        // in a family's list, long on its card.
        titleWithProgress: (title, progress) => `${title} (${progress})`,
        progressLine: progress => `Progression : ${progress}`,
        progressUnits: {
            tables: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} table${current > 1 ? "s" : ""} sur ${target}`,
            },
            hours: {
                short: (current, target) => `${formatHours(current)}/${target} h`,
                long: (current, target) => `${formatHours(current)} h sur ${target} h`,
            },
            daysInARow: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} jour${current > 1 ? "s" : ""} d'affilée sur ${target}`,
            },
            weeksInARow: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} semaine${current > 1 ? "s" : ""} d'affilée sur ${target}`,
            },
            daysPlayed: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} ${current > 1 ? "jours joués" : "jour joué"} sur ${target}`,
            },
            weeksPlayed: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} ${current > 1 ? "semaines jouées" : "semaine jouée"} sur ${target}`,
            },
            minutes: {
                short: (current, target) => `${current}/${target} min`,
                long: (current, target) => `${current} min sur ${target} min`,
            },
            randomGames: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} table${current > 1 ? "s" : ""} au hasard sur ${target}`,
            },
            manufacturers: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} fabricant${current > 1 ? "s" : ""} sur ${target}`,
            },
        },
        families: {
            collection: "Collection",
            playTime: "Temps de jeu",
            periodTables: "Tables du jour et de la semaine",
            sessions: "Sessions",
            randomGame: "Table au hasard",
            manufacturers: "Fabricants",
            decades: "Décennies",
            categories: "Catégories",
        },
    },

    profileStats: {
        menuEntry: "Statistiques",
        title: (name) => `Statistiques de ${name}`,
        gamesPlayed: (count) => `Parties jouées : ${count}`,
        // Minutes on two digits: "42 h 05".
        totalTime: (hours, minutes) => `Temps total : ${hours} h ${String(minutes).padStart(2, "0")}`,
        collection: (played, total, percent) => `Collection : ${played}/${total} tables (${percent} %)`,
        achievements: (unlocked, total) => `Succès : ${unlocked}/${total}`,
        tableOfTheDayStreak: (count, longest) => `Série du jour : ${count} (record ${longest})`,
        tableOfTheWeekStreak: (count, longest) => `Série hebdo : ${count} (record ${longest})`,
        // Most time spent, with that time; "—" before any play.
        favouriteManufacturer: (name, hours, minutes) => `Marque : ${name} (${hours} h ${String(minutes).padStart(2, "0")})`,
        noFavouriteManufacturer: "Marque : —",
        favouriteDecade: (decadeStartYear, hours, minutes) => `Décennie : ${decadeStartYear} (${hours} h ${String(minutes).padStart(2, "0")})`,
        noFavouriteDecade: "Décennie : —",
        // Sub-menu entries, with how many tables each list holds.
        mostPlayedTables: (count) => `Tables les plus jouées (${count})`,
        neverPlayedTables: (count) => `Tables jamais jouées (${count})`,
        back: "Retour",
    },

    // Profiles. Guest's folder name is never shown: this is its name.
    profiles: {
        menuEntry: "Changer de joueur",
        pickerTitle: "Qui joue ?",
        pickerHint: "Flippers : changer · Start : choisir · Exit : annuler",
        guestName: "Invité",
        greeting: name => `Salut ${name} !`,
    },

    // The clock at the top left of the wheel screen.
    clock: {
        time: (hours, minutes) => `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    },

    // The Challenge Card, under the Profile badge (see common/challenge_card.js).
    challenges: {
        cardHeader: "Défi de la semaine",
        titles: {
            differentTables: (target) => `Jouer ${target} tables différentes`,
        },
        progress: (value, target, daysText) => `${value}/${target} · ${daysText}`,
        daysLeft: (days) => `encore ${days} jours`,
        lastDay: "dernier jour",
    },
};
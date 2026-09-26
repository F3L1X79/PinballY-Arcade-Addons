// ============================================================
// Italian translations for PinballY's UI.
// Save this file as UTF-8 with BOM so accented characters display correctly.
// ============================================================

// The active Profile's play time of a table, as PinballY writes its own.
const formatPlayTime = (hours, minutes) => (hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")} ore`
    : `${minutes} minut${minutes === 1 ? "o" : "i"}`);

// Hours of play with one decimal, as an Achievement Progress shows them.
const formatHours = hours => hours.toFixed(1).replace(".", ",");

export default {
    // Direct translations of PinballY's native menu titles.
    nativeMenuLabels: {
        "About PinballY": "Informazioni su PinballY",
        "Add Media": "Aggiungi contenuti multimediali",
        "Add to Favorites": "Aggiungi ai preferiti",
        "Adjust Audio Volume": "Regola volume audio",
        "All Games": "Tutti i tavoli",
        "All Tables": "Tutti i tavoli",
        "Batch Capture": "Acquisizione in batch",
        "Batch Capture lets you capture screen shot images and videos for multiple games.  Step 1: select which games to include in the capture process:": "L'acquisizione in batch ti permette di acquisire screenshot e video per più tavoli. Passaggio 1: seleziona i tavoli da includere nel processo di acquisizione:",
        "Begin Capture": "Avvia acquisizione",
        "Cancel": "Annulla",
        "Capture images & videos": "Acquisisci immagini e video",
        "Confirm Power Off": "Conferma spegnimento",
        "Delete game details": "Elimina dettagli del tavolo",
        "Edit category names...": "Modifica nomi categorie...",
        "Edit game details...": "Modifica dettagli del tavolo...",
        "Enable Videos": "Abilita video",
        "Exit": "Esci",
        "Exit PinballY": "Esci da PinballY",
        "Favorites": "Preferiti",
        "Filter by Category": "Filtra per categoria",
        "Filter by Date Added": "Filtra per data di aggiunta",
        "Filter by Era": "Filtra per epoca",
        "Filter by Last Played": "Filtra per ultima partita",
        "Filter by Manufacturer": "Filtra per produttore",
        "Filter by Rating": "Filtra per valutazione",
        "Filter by System": "Filtra per sistema",
        "Find game media online": "Cerca contenuti multimediali online",
        "Games marked for batch capture": "Tavoli contrassegnati per l'acquisizione in batch",
        "Game Setup": "Configurazione del tavolo",
        "Help": "Aiuto",
        "Hide this game": "Nascondi questo tavolo",
        "High Scores": "Punteggi migliori",
        "In Favorites": "Nei preferiti",
        "Information": "Informazioni",
        "Instruction Card": "Scheda istruzioni",
        "Mark for Batch Capture": "Segna per acquisizione in batch",
        "Marked for Batch Capture": "Segnato per acquisizione in batch",
        "Mute Attract Mode": "Disattiva audio della modalità attrazione",
        "Mute Buttons": "Disattiva audio dei pulsanti",
        "Mute Table Audio": "Disattiva audio del tavolo",
        "Mute Videos": "Disattiva audio dei video",
        "Operator Menu": "Menu operatore",
        "Options": "Opzioni",
        "PinballY Options...": "Opzioni...",
        "Play": "Gioca",
        "Play Game": "Avvia partita",
        "Power Off": "Spegni il computer",
        "Proceed": "Continua",
        "Rate Table": "Valuta il tavolo",
        "Reset Coins/Credits": "Reimposta monete/crediti",
        "Resume Game": "Riprendi partita",
        "Return": "Indietro",
        "Save": "Salva",
        "Search": "Cerca",
        "Select categories": "Seleziona categorie",
        "Show Hidden Games": "Mostra tavoli nascosti",
        "Show Media Files": "Mostra file multimediali",
        "Show Unconfigured Games": "Mostra tavoli non configurati",
        "Skip this message next time": "Non mostrare più questo messaggio",
        "Terminate Game": "Termina partita",
        "The capture process records the exact same areas of the screen where your PinballY windows are located.  Before proceeding, make sure that your PinballY window layout matches the screen layout of the game you're about to record.  For example, if the game's playfield is full-screen, make sure PinballY's playfield window is full-screen.": "Il processo di acquisizione registra esattamente le stesse aree dello schermo in cui si trovano le finestre di PinballY. Prima di procedere, assicurati che la disposizione delle finestre di PinballY corrisponda a quella dello schermo del gioco che stai per registrare. Ad esempio, se il piano di gioco del gioco è a schermo intero, assicurati che anche la finestra del piano di gioco di PinballY sia a schermo intero.",
        "This will launch a Web browser window to search for media files for this game.  Look for a \"HyperPin Media Pack\" file.  Download the file and drag it onto this window to install it.\n\nNote that you can drop a Media Pack file onto this window at any time to install media for the currently selected game.  This menu step isn't required to install media; it's just a convenience for launching a Web search.": "Verrà aperta una finestra del browser Web per cercare file multimediali per questo tavolo. Cerca un file \"HyperPin Media Pack\". Scarica il file e trascinalo su questa finestra per installarlo.\n\nNota che puoi trascinare un file Media Pack su questa finestra in qualsiasi momento per installare i contenuti multimediali per il tavolo attualmente selezionato. Questo passaggio del menu non è necessario per installare i contenuti multimediali; serve solo come comoda scorciatoia per avviare una ricerca sul Web.",
        "Uncategorized": "Non categorizzati",
        "Yes, add to current game": "Sì, aggiungi al tavolo attuale",
        "You must enter the game's bibliographic information (title, system, etc.) before adding media files for the game.  The game information is used to determine the folder locations and file names for the game's media files, so it has to be entered before media files can be added to the game.": "Devi inserire le informazioni bibliografiche del tavolo (titolo, sistema, ecc.) prima di aggiungere file multimediali per il tavolo. Queste informazioni vengono utilizzate per determinare i percorsi delle cartelle e i nomi dei file per i contenuti multimediali del tavolo, quindi devono essere inserite prima di poter aggiungere file multimediali.",
    },

    // Labels for the media-capture screen's "Item: Action" lines
    // (e.g. "Playfield Image: Skip"), combined via dynamicLabelBuilders.captureItemAction.
    mediaCaptureItemLabels: {
        "Backglass Image": "Immagine del backglass",
        "Backglass Video": "Video del backglass",
        "Flyer Image": "Immagine del volantino",
        "Instruction Card": "Scheda istruzioni",
        "Playfield Image": "Immagine del piano di gioco",
        "Playfield Video": "Video del piano di gioco",
        "Table Audio": "Audio del tavolo",
        "Wheel Image": "Immagine della wheel",
    },
    mediaCaptureActionLabels: {
        "Add": "Aggiungi",
        "Capture": "Acquisisci",
        "Capture Silent": "Acquisisci senza audio",
        "Capture w/Audio": "Acquisisci con audio",
        "Keep Existing": "Mantieni quello esistente",
        "Replace Existing": "Sostituisci quello esistente",
        "Skip": "Ignora",
    },

    // Status text shown in PinballY's launch overlay, keyed by the
    // language-independent event id (see the "launchoverlaymessage" event).
    launchOverlayMessages: {
        "after": "",
        "capturing": "Acquisizione in corso...",
        "gameover": "Game Over",
        "init": "",
        "launching": "Caricamento in corso...",
        "running": "Avvio del tavolo...",
        "terminating": "Ritorno all'elenco dei giochi...",
    },

    // Functions that build translated titles for PinballY's dynamically
    // generated menu text (category names, star ratings, etc.).
    dynamicLabelBuilders: {
        captureInstructions: (seconds) => {
            const plural = seconds === "1" ? "" : "i";
            return `Seleziona gli elementi da acquisire, quindi fai clic su Avvia acquisizione. Questo avvierà il gioco, acquisirà le immagini dello schermo e chiuderà automaticamente il gioco al termine. Il processo richiederà circa ${seconds} second${plural}. (!) indica che un elemento esistente verrà sostituito.`;
        },
        captureInstructionsOneMinute: () =>
            "Seleziona gli elementi da acquisire, quindi fai clic su Avvia acquisizione. Questo avvierà il gioco, acquisirà le immagini dello schermo e chiuderà automaticamente il gioco al termine. Il processo richiederà circa 1 minuto. (!) indica che un elemento esistente verrà sostituito.",
        captureItemAction: (item, action) => `${item}: ${action}`,
        decadeTables: (decade) => `Tavoli degli anni ${decade}`,
        genericTables: (name) => `Tavoli ${name}`,
        mediaGameMismatchWarning: (draggedGame, currentGame) =>
            `Sembra che alcuni dei file multimediali che stai aggiungendo possano essere destinati a un tavolo diverso, "${draggedGame}". I file multimediali vengono sempre aggiunti al tavolo selezionato sulla wheel, attualmente "${currentGame}". Vuoi aggiungere questi elementi multimediali al tavolo attuale?`,
        mediaGameMismatchWarningMultiple: (gameList, currentGame) =>
            `Sembra che alcuni dei file multimediali che stai aggiungendo possano essere destinati ad altri tavoli: ${gameList}. I file multimediali vengono sempre aggiunti al tavolo selezionato sulla wheel, attualmente "${currentGame}". Vuoi aggiungere questi elementi multimediali al tavolo attuale?`,
        mediaReadyToAdd: (gameName) =>
            `I seguenti elementi multimediali sono pronti per essere aggiunti a ${gameName}. Seleziona gli elementi che desideri aggiungere o sostituire.`,
        starTables: (count) => `Tavoli con ${count} stella${count > 1 ? "e" : ""}`,
        startDelay: (seconds) => `Regola ritardo di avvio (${seconds} sec)`,
        unratedTables: () => "Tavoli non valutati",
    },

    ratingPrompt: {
        message: (tableTitle, minutes) =>
            `Hai giocato a "${tableTitle}" per più di ${minutes} minuti! Vuoi valutarlo ora?`,
        rateNow: "Valuta ora",
        notNow: "Più tardi",
    },

    startupPrompt: {
        introWithPicks: (playerName, dayTitle, weekTitle) => {
            const lines = [`Ciao, ${playerName}! Come vuoi iniziare?`];
            if (dayTitle) lines.push(`Tavolo del giorno: ${dayTitle}`);
            if (weekTitle) lines.push(`Tavolo della settimana: ${weekTitle}`);
            return lines.join("\n");
        },
        stayOnLastPlayed: "Resta sull'ultimo tavolo giocato",
        tableOfTheDay: "Avvia il tavolo del giorno",
        tableOfTheWeek: "Avvia il tavolo della settimana",
        randomTable: "Avvia un tavolo casuale",
    },
    // Lower status line text for the currently selected table.
    // [Filter.Count], [Game.Year], etc. are PinballY placeholders — keep them as-is.
    tableInfoStatusLines: {
        manufacturer: (position) => `Tavolo ${position}/[Filter.Count] - prodotto da [Game.Manuf].`,
        manufacturerFictional: (position) => `Tavolo ${position}/[Filter.Count] - Flipper fittizio.`,
        playCount: (position, count) => `Tavolo ${position}/[Filter.Count] - avviato ${count} volte.`,
        playTime: (position, hours, minutes) => `Tavolo ${position}/[Filter.Count] - giocato per ${formatPlayTime(hours, minutes)}.`,
        year: (position) => `Tavolo ${position}/[Filter.Count] - pubblicato nel [Game.Year].`,
    },

    // Labels for menu items this project adds itself (see custom_menu_commands.js, custom_filter.js and hall_of_fame.js).
    customMenuLabels: {
        hallOfFameFilter: "Hall of Fame",
        originalTablesFilter: "Tavoli originali",
        randomGame: "Avvia un tavolo casuale",
        tableOfTheDay: "Avvia il tavolo del giorno",
        tableOfTheWeek: "Avvia il tavolo della settimana",
        tableSetup: "Configurazione del tavolo",
    },

    achievements: {
        dailyFirstPlayTitle: () => "Ciao, tavolo del giorno!",
        dailyFirstPlayDescription: () => "Avviare il tavolo del giorno per la prima volta.",
        weeklyFirstPlayTitle: () => "Appuntamento settimanale",
        weeklyFirstPlayDescription: () => "Avviare il tavolo della settimana per la prima volta.",
        dailyPeriodsPlayedTitles: {
            10: "Esploratore della domenica",
            50: "Esploratore esperto",
            100: "Indiana Flippers",
        },
        dailyPeriodsPlayedDescription: (days) => `Avviare il tavolo del giorno in ${days} giorni diversi.`,
        weeklyPeriodsPlayedTitles: {
            10: "Habitué della settimana",
            26: "Sei mesi di fedeltà",
            52: "Un anno e non sentirlo",
        },
        weeklyPeriodsPlayedDescription: (weeks) => `Avviare il tavolo della settimana in ${weeks} settimane diverse.`,
        dailyStreakTitles: {
            3: "Non c'è due senza tre",
            7: "Settimana perfetta",
            30: "Monaco del flipper",
        },
        dailyStreakDescription: (days) => `Avviare il tavolo del giorno per ${days} giorni di fila.`,
        weeklyStreakTitles: {
            4: "Un mese senza errori",
            12: "Abbonato fedele",
        },
        weeklyStreakDescription: (weeks) => `Avviare il tavolo della settimana per ${weeks} settimane di fila.`,
        manufacturerCompletionTitle: (manufacturer) => `Fan assoluto di ${manufacturer}`,
        manufacturerCompletionDescription: (manufacturer, count) => `Giocare almeno una volta tutti i ${count} tavoli ${manufacturer}.`,
        firstTableTitle: () => "Primi passi",
        firstTableDescription: () => "Giocare il tuo primissimo tavolo.",
        collectionPercentTitles: {
            10: "Il gusto del metallo",
            25: "Collezionista in erba",
            50: "Metà partita",
            75: "Quasi tutto visto",
            100: "Non mi sfugge niente",
        },
        collectionPercentDescription: (percent, playedCount, totalCount) => `Giocare ${playedCount} tavoli su ${totalCount} (${percent}% della tua collezione).`,
        playTimeMilestoneTitles: {
            1: "Riscaldamento",
            5: "Si fa sul serio",
            10: "Malato di flipper",
            50: "Flipper nel sangue",
            100: "Leggenda del tilt",
        },
        playTimeMilestoneDescription: (hours) => `Accumulare più di ${hours} or${hours > 1 ? "e" : "a"} di gioco.`,
        decadeCompletionTitle: (decadeStartYear) => `Viaggio negli anni ${decadeStartYear}`,
        decadeCompletionDescription: (decadeStartYear, count) => `Giocare almeno una volta tutti i ${count} tavoli degli anni ${decadeStartYear}.`,
        categoryCompletionTitle: (category) => `Maestro ${category}`,
        categoryCompletionDescription: (category, count) => `Giocare almeno una volta tutti i ${count} tavoli "${category}".`,
        marathonTitles: {
            30: "Piccola maratona",
            60: "Maratoneta",
        },
        marathonDescription: (minutes) => `Giocare una singola sessione di oltre ${minutes} minuti.`,
        rageQuitTitle: () => "Abbandono per rabbia?!",
        rageQuitDescription: (minSeconds, maxSeconds) => `Lasciare un tavolo dopo appena ${minSeconds}-${maxSeconds} secondi...`,
        grandReturnTitle: () => "Il grande ritorno",
        grandReturnDescription: (days) => `Rigiocare un tavolo dopo ${days} o più giorni di assenza.`,
        randomGamesTitles: {
            10: "E perché no?",
            50: "Giocatore di dadi",
            100: "Adoooooro il caso",
        },
        randomGamesDescription: (count) => `Giocare ${count} tavoli a caso.`,
        dayManufacturersTitles: {
            3: "Giro del mondo express",
            5: "Farfalla del flipper",
            8: "Infedele seriale",
        },
        dayManufacturersDescription: (count) => `Giocare tavoli di ${count} produttori diversi nello stesso giorno.`,
        // Header of the Achievement Toast card.
        toastHeader: "Obiettivo sbloccato",
    },

    achievementList: {
        menuEntry: "Elenco degli obiettivi",
        totalLine: (unlockedCount, totalCount) => `Totale: ${unlockedCount}/${totalCount}`,
        familyLine: (family, unlockedCount, totalCount) => `${family} (${unlockedCount}/${totalCount})`,
        back: "Indietro",
        // The Achievement Progress line, when there is one, sits between the
        // description and the status.
        cardMessage: (title, description, status, progress) => (progress === undefined
            ? `${title}\n${description}\n\n${status}`
            : `${title}\n${description}\n\n${progress}\n${status}`),
        unlocked: "Sbloccato",
        notUnlocked: "Non ancora sbloccato",
        // A missing Achievement's Achievement Progress: short after its title
        // in a family's list, long on its card.
        titleWithProgress: (title, progress) => `${title} (${progress})`,
        progressLine: progress => `Progresso: ${progress}`,
        progressUnits: {
            tables: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} di ${target} tavoli`,
            },
            hours: {
                short: (current, target) => `${formatHours(current)}/${target} h`,
                long: (current, target) => `${formatHours(current)} di ${target} ore`,
            },
            daysInARow: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} di ${target} giorni di fila`,
            },
            weeksInARow: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} di ${target} settimane di fila`,
            },
            daysPlayed: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} di ${target} giorni giocati`,
            },
            weeksPlayed: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} di ${target} settimane giocate`,
            },
            minutes: {
                short: (current, target) => `${current}/${target} min`,
                long: (current, target) => `${current} di ${target} minuti`,
            },
            randomGames: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} di ${target} tavoli a caso`,
            },
            manufacturers: {
                short: (current, target) => `${current}/${target}`,
                long: (current, target) => `${current} di ${target} produttori`,
            },
        },
        families: {
            collection: "Collezione",
            playTime: "Tempo di gioco",
            periodTables: "Tavoli del giorno e della settimana",
            sessions: "Sessioni",
            randomGame: "Tavolo a caso",
            manufacturers: "Produttori",
            decades: "Decenni",
            categories: "Categorie",
        },
    },

    profileStats: {
        menuEntry: "Statistiche",
        title: (name) => `Statistiche di ${name}`,
        gamesPlayed: (count) => `Partite giocate: ${count}`,
        // Minutes on two digits: "42 h 05".
        totalTime: (hours, minutes) => `Tempo totale: ${hours} h ${String(minutes).padStart(2, "0")}`,
        collection: (played, total, percent) => `Collezione: ${played}/${total} tavoli (${percent}%)`,
        achievements: (unlocked, total) => `Obiettivi: ${unlocked}/${total}`,
        tableOfTheDayStreak: (count, longest) => `Serie giornaliera: ${count} (record ${longest})`,
        tableOfTheWeekStreak: (count, longest) => `Serie settimanale: ${count} (record ${longest})`,
        // Most time spent, with that time; "—" before any play.
        favouriteManufacturer: (name, hours, minutes) => `Marca: ${name} (${hours} h ${String(minutes).padStart(2, "0")})`,
        noFavouriteManufacturer: "Marca: —",
        favouriteDecade: (decadeStartYear, hours, minutes) => `Decennio: ${decadeStartYear} (${hours} h ${String(minutes).padStart(2, "0")})`,
        noFavouriteDecade: "Decennio: —",
        // Sub-menu entries, with how many tables each list holds.
        mostPlayedTables: (count) => `Tavoli più giocati (${count})`,
        neverPlayedTables: (count) => `Tavoli mai giocati (${count})`,
        back: "Indietro",
    },

    // Profiles. Guest's folder name is never shown: this is its name.
    profiles: {
        menuEntry: "Cambia giocatore",
        pickerTitle: "Chi gioca?",
        pickerHint: "Flipper: scorri · Start: scegli · Exit: annulla",
        guestName: "Ospite",
        greeting: name => `Ciao ${name}!`,
    },

    // The clock at the top left of the wheel screen.
    clock: {
        time: (hours, minutes) => `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    },

    // The Challenge Card, under the Profile badge (see common/challenge_card.js).
    challenges: {
        cardHeader: "Sfida della settimana",
        titles: {
            differentTables: (target) => `Giocare ${target} tavoli diversi`,
        },
        progress: (value, target, daysText) => `${value}/${target} · ${daysText}`,
        daysLeft: (days) => `ancora ${days} giorni`,
        lastDay: "ultimo giorno",
    },
};
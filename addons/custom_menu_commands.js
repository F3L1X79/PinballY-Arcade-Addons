// ============================================================
// Adds the custom entries (table setup, random table, table of the day,
// table of the week) to PinballY's main menu through the main menu module,
// which places them after "Play" and runs the matching action when one is
// selected. Once the household has an Admin Profile, only the Admin
// Profiles see "Table Setup" there and PinballY's "Operator Menu" in the
// Exit menu (listens to "menuopen"); the coin door service button still
// opens the Operator Menu for anyone.
// ============================================================

import { safeHandler } from "../common/safe_handler.js";
import { getProfileStore } from "../common/profile_store.js";
import { getRandomGame } from "../common/random_game.js";
import { getTableOfTheDay, getTableOfTheWeek } from "../common/period_table.js";
import { getMainMenu, MAIN_MENU_POSITION } from "../common/main_menu.js";
import lang from "../common/i18n.js";

const SCRIPT_NAME = "CustomMenuCommands";

export default function init() {
    const { customMenuLabels: MENU_LABELS } = lang;
    const tableOfTheDay = getTableOfTheDay();
    const tableOfTheWeek = getTableOfTheWeek();
    const randomGame = getRandomGame();
    const profileStore = getProfileStore();
    // Every Profile sees the setup entries until the household marks an Admin Profile.
    const showsSetupEntries = () => profileStore.isAdmin() || !profileStore.hasAdminProfile();

    const MENU_COMMANDS = [
        {
            name: "showTableSetup",
            label: MENU_LABELS.tableSetup,
            position: MAIN_MENU_POSITION.TABLE_SETUP,
            action: () => { mainWindow.doCommand(command.ShowGameSetupMenu); },
            shownWhen: showsSetupEntries,
        },
        { name: "RandomGameStart", label: MENU_LABELS.randomGame, position: MAIN_MENU_POSITION.RANDOM_GAME, action: randomGame.launch },
        { name: "tableOfTheDay", label: MENU_LABELS.tableOfTheDay, position: MAIN_MENU_POSITION.TABLE_OF_THE_DAY, action: tableOfTheDay.launch },
        { name: "tableOfTheWeek", label: MENU_LABELS.tableOfTheWeek, position: MAIN_MENU_POSITION.TABLE_OF_THE_WEEK, action: tableOfTheWeek.launch },
    ];

    const mainMenu = getMainMenu();
    for (const entry of MENU_COMMANDS) mainMenu.add(entry);

    // Fires when any menu opens, with a fresh item list each time.
    mainWindow.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id !== "exit" || showsSetupEntries()) return;
        ev.deleteMenuItem(command.ShowOperatorMenu);
        ev.tidyMenu();
    }));
}

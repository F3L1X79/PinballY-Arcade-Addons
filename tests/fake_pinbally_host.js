// ============================================================
// In-memory fake PinballY host for the node tests. Offers the same
// interface as common/pinbally_host.js, plus controls for the tests: set
// the date (a manual clock that also runs the host's timers), the table
// list, the wheel selection (and its filter) and the layout size, seed settings, fire
// PinballY events, pick menu items, play launched games, and inspect shown
// menus, launches, written settings keys, drawing layers, what was drawn,
// sounds played and the lower status line; script filters are shown with
// selectFilter(). Its in-memory file system is seeded with files and
// folders (and unreadable images) and inspected (file contents, writes,
// renames and deletes).
// installGlobals() also exposes it as PinballY's globals (and the global
// Date and timers, and the COM file objects over the same file system), so
// code not yet on the host runs too. settle() waits on a real timer for
// the deferred work to run.
// Never loaded by PinballY.
// ============================================================

const RealDate = Date;
const realSetTimeout = setTimeout;
const realClearTimeout = clearTimeout;

// Lets the zero-delay timers (deferred checks, dialogs) run for real.
export const settle = () => new Promise(resolve => realSetTimeout(resolve, 10));

// PinballY's own commands used by the add-ons; custom ones start above them.
const BUILT_IN_COMMANDS = {
    PlayGame: 1, ShowGameSetupMenu: 2, RateGame: 3, MenuReturn: 4, MenuPageUp: 5, MenuPageDown: 6, Quit: 7,
};
const FIRST_CUSTOM_COMMAND = 1000;

const TRUE_STRINGS = ["1", "true", "yes", "on"];

// Rough text metrics for the fake StyledText: fixed-width characters and lines.
const CHAR_WIDTH = 7;
const LINE_HEIGHT = 20;

// PinballY stores every setting as a string and converts on read.
function toStoredString(value) {
    if (typeof value === "boolean") return value ? "1" : "0";
    return String(value);
}

const withoutTrailingSlash = path => path.replace(/\\+$/, "");
const parentFolder = path => path.slice(0, path.lastIndexOf("\\"));

// Records its runs and gives a plausible measure; drawing it writes each
// run's text (without its line break) to the drawing context, where the
// fake layer records it.
class FakeStyledText {
    constructor(options = {}) {
        this.options = options;
        this.runs = [];
    }

    add(run) {
        this.runs.push(typeof run === "string" ? { text: run } : run);
    }

    text() {
        return this.runs.map(run => run.text).join("");
    }

    measure(width) {
        const lines = this.text().split("\n");
        const lineCount = lines.reduce(
            (count, line) => count + Math.max(1, Math.ceil(line.length * CHAR_WIDTH / width)), 0);
        const longest = Math.max(...lines.map(line => line.length));
        return { width: Math.min(width, longest * CHAR_WIDTH), height: lineCount * LINE_HEIGHT };
    }

    draw(dc, rect) {
        for (const run of this.runs) dc.drawText(run.text.replace(/\n$/, ""), rect);
    }
}

export function createFakePinballYHost({
    now = new RealDate(),
    tables = [],
    layoutSize = { width: 1920, height: 1080 },
    programFolder = "C:\\PinballY\\",
} = {}) {
    let nowMs = now.getTime();
    let currentLayoutSize = { ...layoutSize };
    const layers = [];
    // Every layer draw, in order: { zIndex, texts }.
    const drawingList = [];
    const sounds = [];
    // In-memory file system: folder paths, and file contents by path. The
    // program folder and its Scripts folder exist, as in PinballY.
    const folders = new Set();
    const files = new Map();
    // Image files that exist but cannot be decoded (broken or half-written).
    const unreadableImages = new Set();
    // Every write, rename and delete, in order: { operation, path, to? }.
    const fileOperationList = [];
    addFolder(`${withoutTrailingSlash(programFolder)}\\Scripts`);
    // Pending timers, run in due order by advanceTime(): { id, dueMs, callback, intervalMs }.
    let timers = [];
    let nextTimerId = 1;
    let allTables = tables.map(table => ({ ...table }));
    // null = the wheel shows every visible table, in collection order.
    let wheelConfigIds = null;
    // Script filters by full id ("User.<id>"), and the id of the one shown.
    const filters = new Map();
    let currentFilterId = "All";
    // The lower status line's messages.
    const lowerStatusLine = [];
    const storedSettings = new Map();
    const writtenKeys = new Set();
    const handlers = new Map();
    const commandIds = new Map();
    let nextCommandId = FIRST_CUSTOM_COMMAND;
    const shownMenuList = [];
    let shownMenu = null;
    let uiMode = "wheel";
    // "starting", "running" or "exiting" while a game is on, as in PinballY.
    let runMode;
    const launchList = [];
    const logLines = [];
    const executedCommands = [];

    function readSetting(key, defaultValue, convert) {
        return storedSettings.has(key) ? convert(storedSettings.get(key)) : defaultValue;
    }

    const settings = {
        getString: (key, defaultValue) => readSetting(key, defaultValue, text => text),
        getInt: (key, defaultValue) => readSetting(key, defaultValue, text => parseInt(text, 10)),
        getFloat: (key, defaultValue) => readSetting(key, defaultValue, text => parseFloat(text)),
        getBool: (key, defaultValue) =>
            readSetting(key, defaultValue, text => TRUE_STRINGS.includes(text.toLowerCase())),
        set: (key, value) => {
            storedSettings.set(key, toStoredString(value));
            writtenKeys.add(key);
        },
    };

    // PinballY accepts "event.Namespace" names; only the event part matters here.
    function on(eventName, handler) {
        const type = eventName.split(".")[0];
        if (!handlers.has(type)) handlers.set(type, []);
        handlers.get(type).push(handler);
    }

    function fire(type, properties = {}) {
        const ev = {
            type,
            defaultPrevented: false,
            preventDefault() { this.defaultPrevented = true; },
            ...properties,
        };
        for (const handler of [...(handlers.get(type) || [])]) handler(ev);
        return ev;
    }

    function returnToWheel() {
        uiMode = "wheel";
        runMode = undefined;
        fire("wheelmode");
    }

    function getFullUIMode() {
        const mode = { mode: uiMode };
        if (shownMenu) mode.menuID = shownMenu.id;
        if (runMode) mode.runMode = runMode;
        return mode;
    }

    function addTimer(callback, ms, intervalMs) {
        // A zero interval would never let advanceTime() reach its target.
        if (intervalMs !== undefined && !(intervalMs > 0)) {
            throw new Error(`The fake host needs a positive interval, not ${intervalMs} ms.`);
        }
        const id = nextTimerId++;
        timers.push({ id, dueMs: nowMs + ms, callback, intervalMs });
        return id;
    }

    function removeTimer(id) {
        timers = timers.filter(timer => timer.id !== id);
    }

    // Moves the clock forward, running every timer that falls due on the way
    // at its own due time, earliest first (creation order on a tie).
    function advanceTime(ms) {
        const targetMs = nowMs + ms;
        for (;;) {
            const due = timers
                .filter(timer => timer.dueMs <= targetMs)
                .sort((a, b) => a.dueMs - b.dueMs || a.id - b.id)[0];
            if (!due) break;
            nowMs = due.dueMs;
            if (due.intervalMs === undefined) removeTimer(due.id);
            else due.dueMs += due.intervalMs;
            due.callback();
        }
        nowMs = targetMs;
    }

    // A drawing layer that keeps only what the tests look at: the texts,
    // image paths and frames (frameRect) drawn since the last draw or
    // clear, the canvas size of the last draw, its position, scale and
    // alpha. Like PinballY, a draw without a size gets a canvas the size of
    // the window.
    function createDrawingLayer(zIndex) {
        let texts = [];
        let images = [];
        let frames = [];
        let canvasSize = null;
        let position = { x: 0, y: 0 };
        // PinballY's default: stretched to the whole window.
        let scale = { xSpan: 1, ySpan: 1 };
        const dc = {
            getSize: () => ({ ...canvasSize }),
            fillRect() {},
            frameRect: (x, y, width, height) => { frames.push({ x, y, width, height }); },
            drawImage: (path) => { images.push(path); },
            // Like PinballY: throws on a missing or unreadable image.
            getImageSize: (path) => {
                if (!isImageReadable(path)) throw new Error(`Cannot load image: ${path}`);
                return { width: 256, height: 256 };
            },
            drawText: (text) => { texts.push(text); },
        };
        const layer = {
            zIndex,
            alpha: 1,
            draw(drawFunction, width, height) {
                texts = [];
                images = [];
                frames = [];
                canvasSize = width === undefined ? { ...currentLayoutSize } : { width, height };
                drawFunction(dc);
                drawingList.push({ zIndex, texts: [...texts] });
            },
            clear() {
                texts = [];
                images = [];
                frames = [];
            },
            setPos(x, y, align) { position = align === undefined ? { x, y } : { x, y, align }; },
            setScale(options) { scale = { ...options }; },
            texts: () => [...texts],
            images: () => [...images],
            frames: () => frames.map(frame => ({ ...frame })),
            canvasSize: () => ({ ...canvasSize }),
            position: () => ({ ...position }),
            scale: () => ({ ...scale }),
        };
        layers.push(layer);
        return layer;
    }

    function removeDrawingLayer(layer) {
        const index = layers.indexOf(layer);
        if (index >= 0) layers.splice(index, 1);
    }

    const isImageReadable = path => files.has(path) && !unreadableImages.has(path);

    // Like the production host: a file never added by addFile() is missing.
    function playSound(filePath) {
        if (!files.has(filePath)) throw new Error(`Sound file not found: ${filePath}`);
        sounds.push(filePath);
    }

    // Creates the folder and every missing parent folder.
    function addFolder(folderPath) {
        for (let path = withoutTrailingSlash(folderPath); path.includes("\\"); path = parentFolder(path)) {
            folders.add(path);
        }
    }

    function requireParentFolder(path) {
        if (!folders.has(parentFolder(path))) throw new Error(`Folder not found: ${parentFolder(path)}`);
    }

    function requireFile(path) {
        if (!files.has(path)) throw new Error(`File not found: ${path}`);
    }

    // Same rules as Scripting.FileSystemObject and ADODB.Stream: writing
    // needs the folder, renaming never overwrites, a missing file throws.
    const fileSystem = {
        listFolders(folderPath) {
            const parent = withoutTrailingSlash(folderPath);
            return [...folders].filter(path => parentFolder(path) === parent).map(path => path.slice(parent.length + 1));
        },
        fileExists: (path) => files.has(path),
        readText(path) {
            requireFile(path);
            return files.get(path);
        },
        writeText(path, text) {
            requireParentFolder(path);
            files.set(path, text);
            fileOperationList.push({ operation: "write", path });
        },
        renameFile(fromPath, toPath) {
            requireFile(fromPath);
            requireParentFolder(toPath);
            if (files.has(toPath)) throw new Error(`File already exists: ${toPath}`);
            files.set(toPath, files.get(fromPath));
            files.delete(fromPath);
            fileOperationList.push({ operation: "rename", path: fromPath, to: toPath });
        },
        deleteFile(path) {
            requireFile(path);
            files.delete(path);
            fileOperationList.push({ operation: "delete", path });
        },
        createFolder(folderPath) {
            requireParentFolder(withoutTrailingSlash(folderPath));
            folders.add(withoutTrailingSlash(folderPath));
        },
        isImageReadable,
    };

    // Scripting.FileSystemObject over the in-memory file system, for code
    // that uses the COM object directly (the production host, config.js).
    function createComFileSystem() {
        return {
            FileExists: fileSystem.fileExists,
            FolderExists: (path) => folders.has(withoutTrailingSlash(path)),
            GetFolder: (path) => {
                if (!folders.has(withoutTrailingSlash(path))) throw new Error(`Folder not found: ${path}`);
                return { SubFolders: fileSystem.listFolders(path).map(name => ({ Name: name })) };
            },
            CreateFolder: (path) => {
                if (folders.has(withoutTrailingSlash(path))) throw new Error(`Folder already exists: ${path}`);
                fileSystem.createFolder(path);
            },
            MoveFile: fileSystem.renameFile,
            DeleteFile: fileSystem.deleteFile,
        };
    }

    // ADODB.Stream in text mode: only what reading and writing a whole
    // UTF-8 file needs.
    function createComTextStream() {
        let text = "";
        return {
            Type: 0,
            Charset: "",
            Open() { text = ""; },
            LoadFromFile(path) { text = fileSystem.readText(path); },
            ReadText: () => text,
            WriteText(newText) { text += newText; },
            SaveToFile(path) { fileSystem.writeText(path, text); },
            Close() {},
        };
    }

    function showMenu(id, items, options = {}) {
        shownMenu = { id, items: [...items], options };
        shownMenuList.push(shownMenu);
        uiMode = "menu";
    }

    function getGameInfo(configId) {
        return allTables.find(table => table.configId === configId || table.id === configId) || null;
    }

    function getBuiltInCommand(name) {
        if (!(name in BUILT_IN_COMMANDS)) throw new Error(`The fake host has no built-in command "${name}".`);
        return BUILT_IN_COMMANDS[name];
    }

    // PinballY's wheel never shows hidden or unconfigured tables.
    const canBeOnWheel = game => !game.isHidden && game.isConfigured !== false;

    // Runs the filter like PinballY: before(), then select() over the
    // visible, configured tables, sorted with compareForSort(); the wheel
    // then shows them from the first one.
    function applyFilter(filterId) {
        const filter = filters.get(filterId);
        if (!filter) throw new Error(`The fake host has no filter "${filterId}".`);
        currentFilterId = filterId;
        if (filter.before) filter.before();
        const selected = allTables
            .filter(game => canBeOnWheel(game) && filter.select(game));
        if (filter.compareForSort) selected.sort(filter.compareForSort);
        if (filter.after) filter.after();
        wheelConfigIds = selected.map(game => game.configId);
    }

    // Like gameList.setCurFilter(): "All" shows every visible, configured
    // table in collection order, a script filter runs; the current table
    // stays current when the new filter keeps it.
    function setCurrentFilter(filterId) {
        const [current] = host.getWheelTables();
        if (filterId === "All") {
            currentFilterId = filterId;
            wheelConfigIds = allTables
                .filter(canBeOnWheel)
                .map(game => game.configId);
        } else {
            applyFilter(filterId);
        }
        const currentIndex = current ? wheelConfigIds.indexOf(current.configId) : -1;
        if (currentIndex > 0) setWheelGame(currentIndex);
    }

    // Like gameList.createFilter(): kept under its full id, never shown until selected.
    function createFilter(filter) {
        filters.set(`User.${filter.id}`, filter);
        return allocateCommand(`filter ${filter.id}`);
    }

    function refreshFilter() {
        if (filters.has(currentFilterId)) applyFilter(currentFilterId);
    }

    // Like gameList.setWheelGame(): the table at this offset from the current
    // one becomes the current one; the wheel wraps around.
    function setWheelGame(offset) {
        const configIds = host.getWheelTables().map(game => game.configId);
        if (configIds.length === 0) return;
        const start = ((offset % configIds.length) + configIds.length) % configIds.length;
        wheelConfigIds = [...configIds.slice(start), ...configIds.slice(0, start)];
    }

    function allocateCommand(name) {
        const id = nextCommandId++;
        commandIds.set(name, id);
        return id;
    }

    const host = {
        settings,
        now: () => new RealDate(nowMs),
        setTimeout: (callback, ms) => addTimer(callback, ms),
        clearTimeout: removeTimer,
        setInterval: (callback, ms) => addTimer(callback, ms, ms),
        clearInterval: removeTimer,
        getVisibleTables: () => allTables.filter(table => !table.isHidden),
        getWheelTables: () => (wheelConfigIds === null
            ? host.getVisibleTables()
            : wheelConfigIds.map(getGameInfo)),
        getGameInfo,
        setCurrentFilter,
        createFilter,
        getCurrentFilterId: () => currentFilterId,
        refreshFilter,
        setWheelGame,
        getUIMode: () => uiMode,
        getFullUIMode,
        showMenu,
        on,
        createDrawingLayer,
        createStyledText: (options) => new FakeStyledText(options),
        allocateCommand,
        getBuiltInCommand,
        doCommand: (id) => { executedCommands.push(id); },
        // PinballY leaves the wheel as soon as a launch starts.
        playGame: (game) => {
            launchList.push(game);
            uiMode = "running";
            runMode = "starting";
        },
        getProgramFolder: () => programFolder,
        playSound,
        files: fileSystem,
        log: (text) => { logLines.push(text); },

        // Moves the date without running the timers.
        setNow(date) { nowMs = date.getTime(); },
        advanceTime,
        setLayoutSize(size) { currentLayoutSize = { ...size }; },
        drawingLayers: () => [...layers],
        drawings: () => drawingList.map(drawing => ({ ...drawing, texts: [...drawing.texts] })),
        soundsPlayed: () => [...sounds],
        // Seeds a file (and its folders) without recording a write.
        addFile(filePath, content = "") {
            addFolder(parentFolder(filePath));
            files.set(filePath, content);
        },
        // Seeds an image file that exists but cannot be decoded.
        addUnreadableImage(filePath) {
            host.addFile(filePath, "not an image");
            unreadableImages.add(filePath);
        },
        addFolder,
        // Removes the folder with everything in it, as a player would by hand.
        removeFolder(folderPath) {
            const folder = withoutTrailingSlash(folderPath);
            const isInside = path => path === folder || path.startsWith(`${folder}\\`);
            for (const path of [...folders]) if (isInside(path)) folders.delete(path);
            for (const path of [...files.keys()]) if (isInside(path)) files.delete(path);
        },
        // The file's text, or undefined when it doesn't exist.
        readFile: (filePath) => files.get(filePath),
        fileOperations: () => fileOperationList.map(operation => ({ ...operation })),
        setTables(newTables) { allTables = newTables.map(table => ({ ...table })); },
        // The current wheel selection, in wheel order (index 0 is the current
        // table), optionally under a filter id such as "Favorites".
        setWheelTables(configIds, { filterId = currentFilterId } = {}) {
            const unknown = configIds.filter(configId => !getGameInfo(configId));
            if (unknown.length > 0) throw new Error(`Unknown tables in the wheel: ${unknown.join(", ")}`);
            wheelConfigIds = [...configIds];
            currentFilterId = filterId;
        },
        currentFilterId: () => currentFilterId,
        // Shows a script filter, by its full id ("User.<id>").
        selectFilter: applyFilter,
        // The script filters' descriptions, as created.
        scriptFilters: () => [...filters.values()],
        lowerStatusLine: () => [...lowerStatusLine],
        seedSettings(values) {
            for (const [key, value] of Object.entries(values)) storedSettings.set(key, toStoredString(value));
        },
        storedSettings: () => Object.fromEntries(storedSettings),
        writtenSettingsKeys: () => new Set(writtenKeys),
        commandId: (name) => commandIds.get(name),
        fire,

        shownMenus: () => [...shownMenuList],
        currentMenu: () => shownMenu,

        // A menu opened by the player (unlike showMenu, which doesn't fire
        // "menuopen"): handlers may add items before it is shown.
        openMenu(id, items) {
            const menuItems = [...items];
            const ev = fire("menuopen", {
                id,
                items: menuItems,
                addMenuItem(where, newItems) {
                    const toAdd = Array.isArray(newItems) ? newItems : [newItems];
                    const afterIndex = menuItems.findIndex(item => item.cmd === where.after);
                    menuItems.splice(afterIndex + 1, 0, ...toAdd);
                },
            });
            if (!ev.defaultPrevented) showMenu(id, menuItems);
        },

        // Closes the current menu (as Escape would). Back to the wheel only if
        // no table was launched from the menu and no "menuclose" handler
        // opened another menu in the meantime.
        closeMenu() {
            if (!shownMenu) throw new Error("No menu is open.");
            const { id } = shownMenu;
            shownMenu = null;
            if (uiMode === "menu") uiMode = "wheel";
            fire("menuclose", { id });
            if (uiMode === "wheel") fire("wheelmode");
        },

        // Picks the item with this title in the current menu: fires its
        // command, then closes the menu, unless the item stays open. A menu
        // shown by the command replaces it: only its "menuclose" fires.
        selectMenuItem(title) {
            const menu = shownMenu;
            const item = menu && menu.items.find(menuItem => menuItem.title === title);
            if (!item) throw new Error(`No menu item titled "${title}" is showing.`);
            fire("command", { id: item.cmd });
            if (shownMenu !== menu) fire("menuclose", { id: menu.id });
            else if (!item.stayOpen) host.closeMenu();
        },

        launches: () => [...launchList],
        gameStarted(game) {
            uiMode = "running";
            runMode = "running";
            fire("gamestarted", { game });
        },
        gameOver(game) {
            runMode = "exiting";
            fire("gameover", { game });
            returnToWheel();
        },
        launchError(game) {
            runMode = "exiting";
            fire("launcherror", { game });
            returnToWheel();
        },

        logLines: () => [...logLines],
        executedCommands: () => [...executedCommands],

        // Exposes this fake as PinballY's globals; returns the function that
        // restores the previous globals.
        installGlobals() {
            const globalNames = [
                "optionSettings", "gameList", "mainWindow", "command", "logfile", "Date",
                "StyledText", "systemInfo", "createAutomationObject",
                "setTimeout", "clearTimeout", "setInterval", "clearInterval",
            ];
            const previous = globalNames.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);

            class FakeDate extends RealDate {
                constructor(...args) {
                    if (args.length === 0) super(nowMs);
                    else super(...args);
                }
                static now() { return nowMs; }
            }

            Object.assign(globalThis, {
                optionSettings: {
                    get: settings.getString,
                    getInt: settings.getInt,
                    getFloat: settings.getFloat,
                    getBool: settings.getBool,
                    set: settings.set,
                },
                gameList: {
                    getAllGames: () => [...allTables],
                    getAllWheelGames: () => host.getWheelTables(),
                    // "gameselect" and "filterselect", fired with fire() like the main window's events.
                    on,
                    getWheelGame: (offset) => host.getWheelTables()[offset] || null,
                    getWheelCount: () => host.getWheelTables().length,
                    createFilter,
                    getCurFilter: () => ({ id: currentFilterId }),
                    setCurFilter: setCurrentFilter,
                    setWheelGame: (offset) => { setWheelGame(offset); },
                    refreshFilter,
                    getGameInfo,
                },
                mainWindow: {
                    on,
                    showMenu,
                    getUIMode: getFullUIMode,
                    playGame: host.playGame,
                    doCommand: host.doCommand,
                    createDrawingLayer,
                    removeDrawingLayer,
                    statusLines: {
                        lower: {
                            getText: () => [...lowerStatusLine],
                            add: (text) => { lowerStatusLine.push(text); },
                            setText: (index, text) => { lowerStatusLine[index] = text; },
                        },
                    },
                },
                command: { ...BUILT_IN_COMMANDS, allocate: allocateCommand },
                logfile: { log: (text) => { logLines.push(text); } },
                Date: FakeDate,
                // Zero-delay timeouts stay on the real event loop, so the
                // add-ons' "next tick" deferrals still run on settle(); every
                // other timer waits for advanceTime().
                setTimeout: (callback, ms = 0) => (ms > 0 ? addTimer(callback, ms) : realSetTimeout(callback, 0)),
                clearTimeout: (id) => {
                    if (typeof id === "number") removeTimer(id);
                    else realClearTimeout(id);
                },
                setInterval: (callback, ms) => addTimer(callback, ms, ms),
                clearInterval: removeTimer,
                StyledText: FakeStyledText,
                systemInfo: { programDir: programFolder },
                // Only Windows Media Player, where setting the URL plays the
                // file, and the file objects over the in-memory file system
                // (no .env.local unless a test adds one, so common/config.js
                // imported after this keeps its defaults). Any other COM
                // object throws.
                createAutomationObject: (progId) => {
                    if (progId === "WMPlayer.OCX.7") {
                        return { settings: {}, set URL(filePath) { playSound(filePath); } };
                    }
                    if (progId === "Scripting.FileSystemObject") return createComFileSystem();
                    if (progId === "ADODB.Stream") return createComTextStream();
                    throw new Error(`The fake host has no COM object "${progId}".`);
                },
            });

            return function uninstallGlobals() {
                for (const [name, descriptor] of previous) {
                    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
                    else delete globalThis[name];
                }
            };
        },
    };

    return host;
}

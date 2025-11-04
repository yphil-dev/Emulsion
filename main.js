import { app, BrowserWindow, ipcMain, shell, dialog, globalShortcut, Menu, session } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn, exec } from 'child_process';
import { getAllCoverImageUrls, getGameMetaData } from './src/js/backends.js';

import { PLATFORMS, getPlatformInfo } from './src/js/platforms.js';

import axios from 'axios';
import os from 'os';

let childProcesses = new Map();

let gamecontroller = null;

const pjson = await loadPackageJson();

const buttonStates = {
    back: false,
    dpdown: false,
};

function fullRestart() {
  app.relaunch({ args: process.argv.slice(1).concat(['--restarted']) });
  app.exit(0);
}

async function sdlInit() {
    if (process.platform !== 'linux') {
        console.log('SDL2 initialization skipped (not on Linux)');
        return false;
    }

    try {

        const mod = await import('sdl2-gamecontroller');
        gamecontroller = mod.default || mod;

        // Setup event listeners
        gamecontroller.on("error", (data) => {
            console.error("SDL2 Error:", data);
        });

        gamecontroller.on("warning", (data) => {
            console.warn("SDL2 Warning:", data);
            // restartSDL();
        });

        gamecontroller.on("sdl-init", () => {
            console.log("SDL2 Initialized successfully");
        });

        gamecontroller.on("controller-device-added", (data) => {
            console.log(`Controller connected: Player ${data.player}`);
            try {
                gamecontroller.setLeds(0x0f, 0x62, 0xfe, data.player);
            } catch (err) {
                console.error('LED set failed:', err);
            }
        });

        gamecontroller.on("controller-device-removed", (data) => {
            console.log(`Controller disconnected: Player ${data.player}`);
        });

        gamecontroller.on('controller-button-up', (event) => {
            buttonStates[event.button] = false;
        });

        gamecontroller.on('controller-button-down', (event) => {
            console.log("event: ", event);
            buttonStates[event.button] = true;
            if (buttonStates.start && buttonStates.dpdown) {
                console.log('Triggering process kill combo');
                killChildProcesses(childProcesses);
            }
        });

        console.log('SDL2 Gamecontroller initialized');
        return true;
    } catch (err) {
        console.error('SDL2 Initialization failed:', err);
        return false;
    }
}

function restartSDL() {
    console.log('Restarting SDL...');
    setTimeout(() => sdlInit(), 1000);
}

ipcMain.handle('game-controller-init', async () => {
    return await sdlInit();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { readFile } from 'fs/promises';

function getExecutablePath() {
  const exeName = os.platform() === 'win32' ? 'sfo.exe' : 'sfo';
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      'bin',
      exeName
    );
  } else {
    return path.join(__dirname, 'bin', exeName);
  }
}

async function loadPackageJson() {
  // app.getAppPath() returns:
  //  - in dev: the project root folder
  //  - in production: the path to resources/app.asar
  const appPath = app.getAppPath();
  const pkgPath = path.join(appPath, 'package.json');
  const data = await readFile(pkgPath, 'utf-8');
  return JSON.parse(data);
}

const preferencesFilePath = path.join(app.getPath('userData'), "preferences.json");
const recentFilePath = path.join(app.getPath('userData'), "recently_played.json");
const favoritesFilePath = path.join(app.getPath('userData'), "favorites.json");

function showHelp() {
    console.log(`
${pjson.name.toLowerCase()} ${pjson.version}
Usage: ${pjson.name.toLowerCase()} [options]

Options:
  --kiosk                        Read-only / kids mode: No config / settings, disabled platforms hidden.
  --full-screen                  Start Emulsion in full screen mode.
  --auto-select=[platform_name]  Auto-select [platform_name].
  --help                         Show this help message.

Platform names: ${PLATFORMS.map(platform => platform.name).join(', ')}
    `);
    app.quit();
}

if (process.argv.includes('--help')) {
    showHelp();
}

function loadFavorites() {
    try {
        if (fs.existsSync(favoritesFilePath)) {
            const favoritesFileContent = fs.readFileSync(favoritesFilePath, 'utf8');

            try {
                const favorites = JSON.parse(favoritesFileContent);

                if (!Array.isArray(favorites)) {
                    throw new Error("Expected an array");
                }

                const isValidRecord = (record) =>
                      record &&
                      typeof record.gameName === 'string' &&
                      typeof record.gamePath === 'string' &&
                      typeof record.command === 'string' &&
                      typeof record.emulator === 'string' &&
                      typeof record.emulatorArgs === 'string' && // Can be empty string
                      typeof record.platform === 'string';

                const validRecords = favorites.filter(isValidRecord);

                // Optionally overwrite the file if invalid entries were removed
                if (validRecords.length !== favorites.length) {
                    fs.writeFileSync(favoritesFilePath, JSON.stringify(validRecords, null, 2), 'utf8');
                    console.warn(`Removed ${favorites.length - validRecords.length} invalid entries from favorites file.`);
                }

                return validRecords;

            } catch (parseError) {
                console.error('Invalid JSON in favorites file:', parseError);
                return { error: 'INVALID_JSON', message: 'The favorites file contains invalid JSON. It will now be reset.' };
            }
        } else {
            return { error: 'FILE_NOT_FOUND', message: 'No favorites file found.' };
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        return { error: 'UNKNOWN_ERROR', message: 'An unknown error occurred while loading favorites.' };
    }
}

function loadRecents() {
    try {
        if (fs.existsSync(recentFilePath)) {
            const recentFileContent = fs.readFileSync(recentFilePath, 'utf8');

            try {
                const recent = JSON.parse(recentFileContent);

                if (!Array.isArray(recent)) {
                    throw new Error("Expected an array");
                }

                const isValidRecord = (record) =>
                      record &&
                      typeof record.fileName === 'string' &&
                      typeof record.filePath === 'string' &&
                      typeof record.gameName === 'string' &&
                      typeof record.emulator === 'string' &&
                      typeof record.emulatorArgs === 'string' && // Can be empty string
                      typeof record.platform === 'string' &&
                      typeof record.date === 'string' && !isNaN(Date.parse(record.date));

                const validRecords = recent.filter(isValidRecord);

                // Optionally overwrite the file if invalid entries were removed
                if (validRecords.length !== recent.length) {
                    fs.writeFileSync(recentFilePath, JSON.stringify(validRecords, null, 2), 'utf8');
                    console.warn(`Removed ${recent.length - validRecords.length} invalid entries from recents file.`);
                }

                return validRecords;

            } catch (parseError) {
                console.error('Invalid JSON in recent file:', parseError);
                return { error: 'INVALID_JSON', message: 'The recent file contains invalid JSON. It will now be reset.' };
            }
        } else {
            return { error: 'FILE_NOT_FOUND', message: 'No recent file found. Using default recent.' };
        }
    } catch (error) {
        console.error('Error loading recent:', error);
        return { error: 'UNKNOWN_ERROR', message: 'An unknown error occurred while loading recent.' };
    }
}

function loadPreferences() {
    try {
        if (!fs.existsSync(preferencesFilePath)) {
            return { error: 'FILE_NOT_FOUND', message: 'No preferences file found. Using default preferences.' };
        }

        const preferencesFileContent = fs.readFileSync(preferencesFilePath, 'utf8');
        const preferences = JSON.parse(preferencesFileContent);

        for (const [platform, platformPreferences] of Object.entries(preferences)) {
            if (platform === 'settings') {
                if (
                    typeof platformPreferences !== 'object' ||
                    platformPreferences === null ||
                    typeof platformPreferences.numberOfColumns !== 'number' ||
                    typeof platformPreferences.footerSize !== 'string' ||
                    typeof platformPreferences.launchDialogPolicy !== 'string' ||
                    typeof platformPreferences.disabledPlatformsPolicy !== 'string' ||
                    typeof platformPreferences.steamGridAPIKey !== 'string'
                ) {
                    console.error(`Invalid preferences`);
                    return { error: 'INVALID_JSON', message: 'The preferences file contains invalid JSON. It will now be reset.' };
                }
            } else {
                if (
                    typeof platformPreferences !== 'object' ||
                    platformPreferences === null ||
                    typeof platformPreferences.isEnabled !== 'boolean' ||
                    typeof platformPreferences.viewMode !== 'string' ||
                    typeof platformPreferences.gamesDir !== 'string' ||
                    typeof platformPreferences.emulator !== 'string' ||
                    typeof platformPreferences.emulatorArgs !== 'string' ||
                    !Array.isArray(platformPreferences.extensions)
                ) {
                    console.error(`Invalid preferences for platform: ${platform}`);
                    return { error: 'INVALID_JSON', message: 'The preferences file contains invalid JSON. It will now be reset.' };
                }
            }
        }

        return preferences;
    } catch (error) {
        console.error('Error loading preferences:', error);
        const message = error instanceof SyntaxError
            ? 'The preferences file contains invalid JSON. It will now be reset.'
            : 'An unknown error occurred while loading preferences.';
        return { error: error instanceof SyntaxError ? 'INVALID_JSON' : 'UNKNOWN_ERROR', message };
    }
}

function savePreferences(preferences) {
    try {
        const data = JSON.stringify(preferences, null, 4);
        fs.writeFileSync(preferencesFilePath, data, 'utf8');
        console.log('Preferences saved successfully to', preferencesFilePath);
        return 'Preferences saved successfully. to: ' + preferencesFilePath;
    } catch (error) {
        console.error('Error saving preferences:', error);
        return null;
    }
}

const createDirectoryIfNeeded = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const downloadAndSaveImage = async (imgSrc, platform, gameName, gamesDir) => {


    const extension = imgSrc.split('.').pop();
    const saveDir = path.join(gamesDir, 'images');
    const savePath = path.join(saveDir, `${gameName}.${extension}`);
    createDirectoryIfNeeded(saveDir);

    console.log(`Trying to save ${imgSrc} to ${savePath}`);

    try {
        const response = await axios({
            url: imgSrc,
            method: 'GET',
            responseType: 'stream',
            timeout: 30000,
            httpsAgent: new (await import('https')).Agent({
                rejectUnauthorized: false, // Allow invalid certs
            }),
        });

        const writer = fs.createWriteStream(savePath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(savePath));
            writer.on('error', (error) => reject(error));
        });
    } catch (error) {
        console.error("Error downloading image: ", error);
        throw error;
    }
};

// manual pick image file
ipcMain.handle('pick-image', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select cover art',
    properties: ['openFile'],
    filters: [{ name: 'JPG', extensions: ['jpg'] }]
  });
  return canceled ? null : filePaths[0];
});

//  copy to covers directory
ipcMain.handle('save-cover', async (_event, src, dest) => {
  return new Promise(resolve => {
    fs.mkdir(path.dirname(dest), { recursive: true }, err => {
      if (err) {
        console.error('save-cover mkdir error:', err);
        return resolve(false);
      }

      // once dir is ready, copy the file
      fs.copyFile(src, dest, err2 => {
        if (err2) {
          console.error('save-cover copy error:', err2);
          return resolve(false);
        }
        resolve(true);
      });
    });
  });
});

let mainWindow;

function createWindows() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        fullscreen: process.argv.includes('--full-screen'),
        icon: path.join(__dirname, 'img/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    mainWindow.loadFile('src/html/index.html');

    if (app.isPackaged) {
        Menu.setApplicationMenu(null);
    }
}

ipcMain.on('show-context-menu', (event, params) => {
    const template = [
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
    ];
    const devToolsEntry = {
        label: 'Inspect Element',
        click: () => {
            mainWindow.inspectElement(params.x, params.y);
        },
    };
    if (!app.isPackaged) {
        template.push({ type: 'separator' });
        template.push(devToolsEntry);
    }
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow });
});

ipcMain.handle('download-image', async (event, imgSrc, platform, gameName, imagesDir) => {
    try {
        const savedImagePath = await downloadAndSaveImage(imgSrc, platform, gameName, imagesDir);
        return { success: true, path: savedImagePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-user-data', () => {
    return {
        path: app.getPath('userData')
    };
});

ipcMain.handle('select-file-or-directory', async (event, property) => {

    const result = await dialog.showOpenDialog({ properties: [property] });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('go-to-url', async (event, link) => {
    console.log("url: ", link);
    shell.openExternal(link);
    return true;
});

ipcMain.handle('restart', async () => {
    fullRestart();
    return true;
});

ipcMain.on('fetch-images', (event, gameName, platformName, steamGridAPIKey, giantBombAPIKey) => {
    getAllCoverImageUrls(gameName.replace(/\s*[\(\[].*?[\)\]]/g, ''), getPlatformInfo(platformName).name, { steamGridAPIKey, giantBombAPIKey })
        .then((urls) => {
            event.reply('image-urls', urls);
        })
        .catch((err) => {
            console.error('Failed to fetch image URLs:', err);
            event.reply('image-urls', []);
        });
});

ipcMain.on('read-meta', (event, params) => {
    try {
        const metadataDir = path.join(params.gamesDir, 'metadata');
        const filePath = path.join(metadataDir, `${params.gameFileName}.json`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`❌ Metadata file not found: ${filePath}`);
            event.reply('game-data', '');
        }

        // Read and parse the file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(fileContent);

        event.reply('game-meta-data', parsedData.gameMetaData);

    } catch (error) {
        console.error(`❌ Failed to read metadata file: ${error.message}`);
        event.reply('game-meta-data', '');
    }
});

function saveMetaToFile(params, data) {
    const searchParams = {
        cleanName: params.cleanName,
        platformName: params.platformDisplayName
    };

    try {
        const metadataDir = path.join(params.gamesDir, 'metadata');
        const filePath = path.join(metadataDir, `${params.gameFileName}.json`);

        // Ensure metadata directory exists (gamesDir should exist already)
        if (!fs.existsSync(metadataDir)) {
            fs.mkdirSync(metadataDir);
            console.log(`✅ Created metadata directory: ${metadataDir}`);
        }

        const fileData = {
            timestamp: new Date().toISOString(),
            searchParams,
            gameMetaData: data
        };

        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
        console.log(`✅ Game metadata saved to: ${filePath}`);
        return { success: true, filePath };
    } catch (error) {
        console.error('❌ Failed to write JSON file:', error);
        return { success: false, error: error.message };
    }
}

ipcMain.on('fetch-meta', (event, params) => {

    const searchParams = {
        cleanName: params.cleanName.replace(/\s*[\(\[].*?[\)\]]/g, ''),
        platformName: params.platformDisplayName
    };

    getGameMetaData(searchParams)
        .then((data) => {
            console.log("data: ", data);
            const result = data ? saveMetaToFile(params, data) : null;
            event.reply('game-meta-data', data);
        })
        .catch((err) => {
            console.error('❌ Failed to fetch game meta data:', err);
            event.reply('game-meta-data', {
                error: err.message
            });
        });
});

ipcMain.on('save-meta', async (event, params, metaData) => {
    const result = saveMetaToFile(params, metaData);
    // event.reply('meta-saved', result);
});

function getUserConfigFile(file) {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, file);
}

// Main process
ipcMain.handle('add-favorite', async (event, favoriteEntry) => {
    const favoriteFilePath = getUserConfigFile('favorites.json');
    let favorites = [];

    if (fs.existsSync(favoriteFilePath)) {
        try {
            const fileData = fs.readFileSync(favoriteFilePath, 'utf8');
            favorites = JSON.parse(fileData);
        } catch (readErr) {
            console.error("Error reading favorites.json:", readErr);
            favorites = [];
        }
    }

    const existingIndex = favorites.findIndex(entry => entry.gamePath === favoriteEntry.gamePath);

    if (existingIndex >= 0) {
        return { success: false, error: "Already exists" };
    } else {
        favorites.push(favoriteEntry);
    }

    try {
        fs.writeFileSync(favoriteFilePath, JSON.stringify(favorites, null, 4), 'utf8');
        console.log("Updated favorites.json with new/updated entry.");
        return { success: true, path: favoriteFilePath };
    } catch (writeErr) {
        console.error("Error writing favorites.json:", writeErr);
        return { success: false, error: writeErr.message };
    }
});

ipcMain.handle('remove-favorite', async (event, favoriteEntry) => {
    const favoriteFilePath = getUserConfigFile('favorites.json');
    let favorites = [];

    if (fs.existsSync(favoriteFilePath)) {
        try {
            const fileData = fs.readFileSync(favoriteFilePath, 'utf8');
            favorites = JSON.parse(fileData);
        } catch (readErr) {
            console.error("Error reading favorites.json:", readErr);
            return { success: false, error: "Failed to read favorites file" };
        }
    }

    // Find and remove the entry with the same gamePath
    const initialLength = favorites.length;
    favorites = favorites.filter(entry => entry.gamePath !== favoriteEntry.gamePath);

    if (favorites.length === initialLength) {
        return { success: false, error: "Favorite not found" };
    }

    try {
        fs.writeFileSync(favoriteFilePath, JSON.stringify(favorites, null, 4), 'utf8');
        console.log("Updated favorites.json - removed entry.");
        return { success: true, path: favoriteFilePath };
    } catch (writeErr) {
        console.error("Error writing favorites.json:", writeErr);
        return { success: false, error: writeErr.message };
    }
});

ipcMain.on('run-command', (event, data) => {
    const { fileName, filePath, gameName, emulator, emulatorArgs, platform } = data;

    const recentEntry = {
        fileName,
        filePath,
        gameName,
        emulator,
        emulatorArgs,
        platform,
        date: new Date().toISOString()
    };

    const command = `${emulator} ${emulatorArgs || ""} "${filePath}"`;

    const recentFilePath = getUserConfigFile('recently_played.json');
    let recents = [];

    if (fs.existsSync(recentFilePath)) {
        try {
            const fileData = fs.readFileSync(recentFilePath, 'utf8');
            recents = JSON.parse(fileData);
        } catch (readErr) {
            console.error("Error reading recently_played.json:", readErr);
            recents = [];
        }
    }

    // Check if an entry already exists with the same fileName.
    const existingIndex = recents.findIndex(entry => entry.fileName === fileName);

    if (existingIndex >= 0) {
        recents[existingIndex] = {
            ...recents[existingIndex],
            date: recentEntry.date
        };
    } else {
        recents.push(recentEntry);
    }

    try {
        fs.writeFileSync(recentFilePath, JSON.stringify(recents, null, 4), 'utf8');
    } catch (writeErr) {
        console.error("Error writing recently_played.json:", writeErr);
    }

    const child = spawn(command, {
        shell: true,
        detached: true,
        stdio: 'ignore'
    });

    childProcesses.set(child.pid, child);

    child.on('exit', () => {
        childProcesses.delete(child.pid);
    });
});

const defaultPreferences = {
    settings: {
        index: 0,
        numberOfColumns: 6,
        footerSize: "medium",
        disabledPlatformsPolicy: "show",
        recentlyPlayedPolicy: "hide",
        recentlyPlayedViewMode: "grid",
        favoritesPolicy: "hide",
        favoritesViewMode: "grid",
        startupDialogPolicy: "show",
        launchDialogPolicy: "show",
        theme: "night",
        steamGridAPIKey: "",
        giantBombAPIKey: ""
    }
};

PLATFORMS.forEach((platform, index) => {
    defaultPreferences[platform.name] = {
        isEnabled: false,
        gamesDir: "",
        viewMode: "grid",
        emulator: "",
        emulatorArgs: "",
        extensions: platform.extensions
    };
});

ipcMain.handle('load-preferences', () => {
    const preferences = loadPreferences();
    const recents = loadRecents();
    const favorites = loadFavorites();

    const userDataPath = app.getPath('userData');
    const appPath = app.getAppPath();
    const versionNumber = pjson.version;

    function getNamedArg(name) {
        try {
            // Check if process.argv exists and is an array
            if (!process.argv || !Array.isArray(process.argv)) {
                return null;
            }

            const prefix = `--${name}=`;
            const arg = process.argv.find(arg => arg && typeof arg === 'string' && arg.startsWith(prefix));

            if (!arg) {
                return null;
            }

            return arg.slice(prefix.length);
        } catch (error) {
            console.error(`Error in getNamedArg for ${name}:`, error);
            return null;
        }
    }

    if (recents.error) {
        console.log("recent.message: ", recents.message);
    }

    if (favorites.error) {
        console.log("favorite.message: ", favorites.message);
    }

    if (preferences.error && preferences.error === 'INVALID_JSON') {

        const result = dialog.showMessageBoxSync(mainWindow, {
            type: 'error',
            message: preferences.message,
            buttons: ['Reset', 'Quit'],
            defaultId: 0, // "Reset" (default)
            cancelId: 1,  // "Quit"
        });

        if (result === 0) {
            console.log("Resetting preferences to default...");
            fs.writeFileSync(preferencesFilePath, JSON.stringify(defaultPreferences, null, 4), 'utf8');

            defaultPreferences.userDataPath = userDataPath;
            return defaultPreferences;
        } else {
            app.quit();
            return null;
        }

    } else if (preferences.error && preferences.error === 'FILE_NOT_FOUND') {

        console.log("Setting preferences to default...");
        fs.writeFileSync(preferencesFilePath, JSON.stringify(defaultPreferences, null, 4), 'utf8');

        defaultPreferences.userDataPath = userDataPath;
        return defaultPreferences;

    } else {

        preferences.userDataPath = userDataPath;
        preferences.appPath = appPath;
        preferences.versionNumber = versionNumber;
        preferences.kioskMode = process.argv.includes('--kiosk');
        preferences.autoSelect = getNamedArg('auto-select');
        // preferences.autoOpen = getNamedArg('auto-open');
        preferences.recents = recents;
        preferences.favorites = favorites;
        return preferences;
    }
});

ipcMain.handle('toggle-fullscreen', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        const isFull = win.isFullScreen();
        win.setFullScreen(!isFull);
    }
});

ipcMain.handle('save-preferences', async (event, prefs) => {
    savePreferences(prefs);
});

ipcMain.handle('quit', () => {
    app.quit();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

function killChildProcesses(childProcesses) {
    childProcesses.forEach((child, pid) => {
        try {
            if (process.platform === 'win32') {
                // Windows needs taskkill
                spawn('taskkill', ['/pid', pid, '/f', '/t']);
            } else {
                // POSIX systems (Linux/Mac) use process groups
                process.kill(-pid, 'SIGKILL');
            }
        } catch (err) {
            console.error(`Failed to kill PID ${pid}:`, err);
        }
    });
    childProcesses.clear();
}

ipcMain.handle('parse-sfo', async (_event, filePath) => {
    return new Promise((resolve, reject) => {
        const exePath = getExecutablePath();
        const args = ['-q', 'TITLE'];

        const process = spawn(exePath, [filePath, ...args]);

        let output = '';

        process.stdout.on('data', (data) => {
            output += data.toString();
        });

        process.stderr.on('data', (err) => console.error('SFO Error:', err.toString()));

        process.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`SFO parser failed with code ${code}`));
            }
        });
    });
});

ipcMain.handle('get-versions', async () => {
    let latestVersion;
    try {
        const response = await fetch('https://api.github.com/repos/yPhil-gh/Emulsion/releases/latest');
        const data = await response.json();
        latestVersion = data.tag_name.replace(/^v/, '');

    } catch (error) {
        console.error('Failed to fetch GitHub release:', error);
    }

    return {current: pjson.version, latest: latestVersion};
});

app.whenReady().then(() => {

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Access-Control-Allow-Origin": ["*"], // Allow all origins
                "Access-Control-Allow-Methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "Access-Control-Allow-Headers": ["*"]
            }
        });
    });

    createWindows();

    globalShortcut.register('Ctrl+Shift+K', () => {
        killChildProcesses(childProcesses);
    });
});

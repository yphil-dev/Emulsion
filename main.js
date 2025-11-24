import { app, BrowserWindow, ipcMain, shell, dialog, globalShortcut, Menu, session } from 'electron';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn, exec } from 'child_process';
import { getAllCoverImageUrls, getGameMetaData } from './src/js/backends.js';

import { PLATFORMS, getPlatformInfo } from './src/js/platforms.js';

import axios from 'axios';
import os from 'os';

// Auto-updater
import pkg from 'electron-updater';
const { autoUpdater } = pkg;



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
  --help                         Show this help message.
  --full-screen                  Start Emulsion in full screen mode.
  --kiosk                        Read-only / kids mode: No config / settings, disabled platforms hidden.
  --auto-select=[platform_name]  Auto-select [platform_name].
  --verbose                      Show main process messages.

Platform names: ${PLATFORMS.map(platform => platform.name).join(', ')}
    `);
    app.quit();
}

if (process.argv.includes('--help')) {
    showHelp();
}

function loadFavorites() {
    try {
        if (fsSync.existsSync(favoritesFilePath)) {
            const favoritesFileContent = fsSync.readFileSync(favoritesFilePath, 'utf8');

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
                    fsSync.writeFileSync(favoritesFilePath, JSON.stringify(validRecords, null, 2), 'utf8');
                    console.warn(`Removed ${favorites.length - validRecords.length} invalid entries from favorites file.`);
                }

                return validRecords;

            } catch (parseError) {
                console.error('Invalid JSON in favorites file:', parseError);
                return { error: 'INVALID_JSON', message: 'The favorites file contains invalid JSON. It will now be reset.' };
            }
        } else {
            // Fresh install - silently return empty array
            return [];
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        return { error: 'UNKNOWN_ERROR', message: 'An unknown error occurred while loading favorites.' };
    }
}

function loadRecents() {
    try {
        if (fsSync.existsSync(recentFilePath)) {
            const recentFileContent = fsSync.readFileSync(recentFilePath, 'utf8');

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
                    fsSync.writeFileSync(recentFilePath, JSON.stringify(validRecords, null, 2), 'utf8');
                    console.warn(`Removed ${recent.length - recent.length} invalid entries from recents file.`);
                }

                return validRecords;

            } catch (parseError) {
                console.error('Invalid JSON in recent file:', parseError);
                return { error: 'INVALID_JSON', message: 'The recent file contains invalid JSON. It will now be reset.' };
            }
        } else {
            // Fresh install - silently return empty array
            return [];
        }
    } catch (error) {
        console.error('Error loading recent:', error);
        return { error: 'UNKNOWN_ERROR', message: 'An unknown error occurred while loading recent.' };
    }
}

function loadPreferences() {
    try {
        if (!fsSync.existsSync(preferencesFilePath)) {
            // Fresh install - silently create default preferences
            console.log('No preferences file found. Creating default preferences.');
            fsSync.writeFileSync(preferencesFilePath, JSON.stringify(defaultPreferences, null, 4), 'utf8');
            return { ...defaultPreferences };
        }

        const preferencesFileContent = fsSync.readFileSync(preferencesFilePath, 'utf8');
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
        // console.error('Error loading preferences:', error);
        const message = error instanceof SyntaxError
            ? 'The preferences file contains invalid JSON. It will now be reset.'
            : 'An unknown error occurred while loading preferences.';
        return { error: error instanceof SyntaxError ? 'INVALID_JSON' : 'UNKNOWN_ERROR', message };
    }
}

function savePreferences(preferences) {
    try {
        const data = JSON.stringify(preferences, null, 4);
        fsSync.writeFileSync(preferencesFilePath, data, 'utf8');
        console.log('Preferences saved successfully to', preferencesFilePath);
        return 'Preferences saved successfully. to: ' + preferencesFilePath;
    } catch (error) {
        console.error('Error saving preferences:', error);
        return null;
    }
}

const createDirectoryIfNeeded = (dirPath) => {
    if (!fsSync.existsSync(dirPath)) {
        fsSync.mkdirSync(dirPath, { recursive: true });
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
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
            httpsAgent: new (await import('https')).Agent({
                rejectUnauthorized: false, // Allow invalid certs
            }),
        });

        const writer = fsSync.createWriteStream(savePath);

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

// delete cover from covers directory (with existence check)
ipcMain.handle('delete-image', async (_event, imagePath) => {
  return new Promise(resolve => {
    // Check if file exists first
    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        // File doesn't exist, consider this a success
        return resolve(true);
      }

      // File exists, proceed with deletion
      fs.unlink(imagePath, err2 => {
        if (err2) {
          console.error('delete-cover error:', err2);
          return resolve(false);
        }
        resolve(true);
      });
    });
  });
});

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

    let initColor;

    const preferences = loadPreferences();

    // Prefs file doesn't exist or is invalid
    const theme = preferences.error ? 'default' : (preferences.settings?.theme || 'default');

    switch (theme) {
    case 'day':
        initColor = '#bdd9ff';
        break;
    case 'night':
        initColor = '#0a1425';
        break;
    case 'default':
        initColor = '#0f1729';
        break;
    }

    mainWindow = new BrowserWindow({
        show: false,
        backgroundColor: initColor,
        width: 1100,
        height: 700,
        fullscreen: process.argv.includes('--full-screen'),
        icon: path.join(__dirname, 'img/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    mainWindow.loadFile('src/html/index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

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
    console.log("gameName, platformName: ", gameName, platformName);
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
        if (!fsSync.existsSync(filePath)) {
            console.log(`❌ Metadata file not found: ${filePath}`);
            event.reply('game-data', '');
        }

        // Read and parse the file
        const fileContent = fsSync.readFileSync(filePath, 'utf8');
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
        if (!fsSync.existsSync(metadataDir)) {
            fsSync.mkdirSync(metadataDir);
            console.log(`✅ Created metadata directory: ${metadataDir}`);
        }

        const fileData = {
            timestamp: new Date().toISOString(),
            searchParams,
            gameMetaData: data
        };

        fsSync.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
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

    if (fsSync.existsSync(favoriteFilePath)) {
        try {
            const fileData = fsSync.readFileSync(favoriteFilePath, 'utf8');
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
        fsSync.writeFileSync(favoriteFilePath, JSON.stringify(favorites, null, 4), 'utf8');
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

    if (fsSync.existsSync(favoriteFilePath)) {
        try {
            const fileData = fsSync.readFileSync(favoriteFilePath, 'utf8');
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
        fsSync.writeFileSync(favoriteFilePath, JSON.stringify(favorites, null, 4), 'utf8');
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

    if (fsSync.existsSync(recentFilePath)) {
        try {
            const fileData = fsSync.readFileSync(recentFilePath, 'utf8');
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
        fsSync.writeFileSync(recentFilePath, JSON.stringify(recents, null, 4), 'utf8');
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
        numberOfColumns: 6,
        footerSize: "small",
        disabledPlatformsPolicy: "show",
        recentlyPlayedPolicy: "show",
        recentlyPlayedViewMode: "grid",
        favoritesPolicy: "show",
        favoritesViewMode: "grid",
        startupDialogPolicy: "show",
        launchDialogPolicy: "show",
        theme: "default",
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

ipcMain.handle('load-preferences', async (event) => {
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

    if (preferences.error && preferences.error === 'INVALID_JSON') {
        // Return default preferences with error flag for renderer to handle
        const defaultPrefs = { ...defaultPreferences };
        defaultPrefs.userDataPath = userDataPath;
        defaultPrefs.appPath = appPath;
        defaultPrefs.versionNumber = versionNumber;
        defaultPrefs.kioskMode = process.argv.includes('--kiosk');
        defaultPrefs.autoSelect = getNamedArg('auto-select');
        defaultPrefs.recents = recents;
        defaultPrefs.favorites = favorites;
        defaultPrefs.preferencesError = preferences.message;
        return defaultPrefs;
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

ipcMain.handle('reset-preferences', async () => {
    console.log("Resetting preferences to default...");
    fsSync.writeFileSync(preferencesFilePath, JSON.stringify(defaultPreferences, null, 4), 'utf8');
    return { success: true };
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
    // Check for updates on startup
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('checking-for-update', () => {
        console.log('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
        console.log('Update available.', info);
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log('Update not available.', info);
    });

    autoUpdater.on('error', (err) => {
        console.error('Error in auto-updater.', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        console.log(log_message);
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded', info);
    });

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

ipcMain.handle('install-flatpak', async (event, appId) => {
  return new Promise((resolve, reject) => {
    // First check if Flathub remote exists for user, if not add it
    exec('flatpak remotes --user | grep flathub', (error) => {
      if (error) {
        // Flathub not configured for user, add it
        exec('flatpak remote-add --user --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo', (addError) => {
          if (addError) {
            // If adding user remote fails, try to use system remote
            installFromSystemRemote();
            return;
          }
          installFromUserRemote();
        });
      } else {
        installFromUserRemote();
      }
    });

    function installFromUserRemote() {
      exec(`flatpak install --user --noninteractive --assumeyes flathub ${appId}`,
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Installation failed: ${stderr || error.message}`));
          } else {
            resolve({ success: true, appId });
          }
        }
      );
    }

    function installFromSystemRemote() {
      // Try to install from system remote without --user flag
      exec(`flatpak install --noninteractive --assumeyes flathub ${appId}`,
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Installation failed: ${stderr || error.message}`));
          } else {
            resolve({ success: true, appId });
          }
        }
      );
    }
  });
});

ipcMain.handle('is-command-available', async (_event, commandName) => {
  return new Promise((resolve) => {
    exec(`command -v ${commandName}`, (error, stdout) => {
      // if stdout is non-empty, command exists
      resolve(!error && stdout.trim().length > 0);
    });
  });
});

ipcMain.handle('is-flatpak-available', async () => {
  return new Promise((resolve) => {
    exec('which flatpak', (error) => {
      resolve(!error);
    });
  });
});

ipcMain.handle('is-flatpak-package-installed', async (event, appId) => {
  return new Promise((resolve) => {
    // Check both user and system installations
    exec('flatpak list --app --all', (error, stdout) => {
      resolve(!error && stdout.includes(appId));
    });
  });
});

ipcMain.handle('is-flatpak-installing', async (event, appId) => {
  return new Promise((resolve) => {
    exec(`ps aux | grep -E "flatpak.*${appId}" | grep -v grep`, (error, stdout) => {
      resolve(!error && stdout.trim().length > 0);
    });
  });
});

ipcMain.handle('is-flathub-configured', async () => {
  return new Promise((resolve) => {
    exec('flatpak remotes | grep flathub', (error, stdout) => {
      resolve(!error && stdout.trim().length > 0);
    });
  });
});

ipcMain.handle('scan-directory', async (event, gamesDir, extensions, recursive = true, ignoredDirs = ['PS3_EXTRA', 'PKGDIR', 'freezer', 'tmp']) => {
    let files = [];
    const sortedExts = [...new Set(extensions)].sort((a, b) => b.length - a.length);

    if (!gamesDir || typeof gamesDir !== 'string') {
        return files;
    }

    try {
        const items = await fs.readdir(gamesDir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(gamesDir, item.name);

            if (item.isDirectory()) {
                if (ignoredDirs.includes(item.name)) continue;
                if (recursive) files.push(...await scanDirectoryRecursive(fullPath, extensions, recursive, ignoredDirs));
            } else {
                const lowerName = item.name.toLowerCase();
                const match = sortedExts.find(ext => lowerName.endsWith(ext.toLowerCase()));
                if (match) files.push(fullPath);
            }
        }
    } catch (err) {
        if (process.argv.includes('--verbose')) {
            console.warn("Error reading directory:", gamesDir, err);
        }
    }

    return files;
});

async function scanDirectoryRecursive(gamesDir, extensions, recursive, ignoredDirs) {
    let files = [];
    const sortedExts = [...new Set(extensions)].sort((a, b) => b.length - a.length);

    try {
        const items = await fs.readdir(gamesDir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(gamesDir, item.name);

            if (item.isDirectory()) {
                if (ignoredDirs.includes(item.name)) continue;
                if (recursive) files.push(...await scanDirectoryRecursive(fullPath, extensions, recursive, ignoredDirs));
            } else {
                const lowerName = item.name.toLowerCase();
                const match = sortedExts.find(ext => lowerName.endsWith(ext.toLowerCase()));
                if (match) files.push(fullPath);
            }
        }
    } catch (err) {
        console.warn("Error reading directory:", gamesDir, err);
    }

    return files;
}

ipcMain.handle('find-image-file', async (event, basePath, fileNameWithoutExt) => {
    const extensions = ['png', 'jpg', 'webp'];
    let newestImage = null;
    let newestTime = 0;

    for (const extension of extensions) {
        const imagePath = path.join(basePath, `${fileNameWithoutExt}.${extension}`);
        try {
            if (fsSync.existsSync(imagePath)) {
                const stats = fsSync.statSync(imagePath);
                const mtime = stats.mtimeMs;
                if (mtime > newestTime) {
                    newestTime = mtime;
                    newestImage = imagePath;
                }
            }
        } catch (err) {
            // Ignore errors
        }
    }

    return newestImage;
});

ipcMain.handle('get-flatpak-download-size', async (event, appId) => {
  return new Promise((resolve) => {
    exec(`flatpak install --user --assumeyes --dry-run flathub ${appId}`, (error, stdout, stderr) => {
      if (error) {
        resolve(null); // Couldn't determine size
        return;
      }

      // Parse the output to find the total download size
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('Total download size:')) {
          // Extract the size (e.g., "Total download size: 1.2 GB")
          const sizeMatch = line.match(/Total download size:\s*([\d.]+)\s*(\w+)/);
          if (sizeMatch) {
            resolve({
              size: parseFloat(sizeMatch[1]),
              unit: sizeMatch[2],
              fullText: line.trim()
            });
            return;
          }
        }
      }

      resolve(null); // Size not found in output
    });
  });
});

// All the libs used are required here
const { ipcRenderer, shell } = require('electron');
let fs = require('fs');
const path = require('path');
const fsp = require('fs').promises;
const axios = require('axios');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

const LB = {}; // Launch Break :)

window.ipcRenderer = ipcRenderer;

LB.enabledPlatforms = ['settings'];

LB.isMenuOpen = false;

function updateControls(section, newIcon, newText, display) {
    const sectionDiv = document.getElementById(section);
    if (!sectionDiv) {
        console.warn(`Section '${section}' not found!`);
        return;
    }

    const icon = sectionDiv.querySelector("img.icon");
    const textSpan = sectionDiv.querySelector("span");

    if (display === 'off') {
        sectionDiv.style.display = 'none';
    }

    if (display === 'on') {
        sectionDiv.style.display = 'flex';
    }

    if (icon && newIcon !== 'same') {
        icon.src = `../../img/controls/${newIcon}.png`;
    }

    if (textSpan && newText !== 'same') {
        textSpan.innerHTML = newText;
    }
}


function getSelectedGame(gameContainers, selectedIndex) {
    let selectedContainer;
    gameContainers.forEach(async (container, index) => {
        if (index === selectedIndex) {
            selectedContainer = container;
        }

    });
    return selectedContainer || null;
}


function simulateKeyDown(key) {
    const keyCode = key === 'ArrowDown' ? 40 : 38;
    const keyboardEvent = new KeyboardEvent('keydown', {
        key,
        code: key,
        keyCode,
        which: keyCode,
        bubbles: true
    });
    document.dispatchEvent(keyboardEvent);
}

function safeFileName(fileName) {

    const illegalRe = /[\/\?<>\\:\*\|"]/g;
    const controlRe = /[\x00-\x1f\x80-\x9f]/g;
    const reservedRe = /^\.+$/;
    const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
    const windowsTrailingRe = /[\. ]+$/;

    return fileName
        .replace(/[\s]/g, '_') // Replace spaces with underscores
        .replace(illegalRe, '') // Remove invalid characters
        .replace(controlRe, '') // Remove control characters
        .replace(reservedRe, '') // Remove trailing dots
        .replace(/^\s+|\s+$/g, '') || 'default_filename'; // Prevent empty names
}

// Uppercase ALPHANUMER1C
const PREDEFINED_TITLES = {
    VRALLY2:        'V-Rally 2',
    WIPEOUT2097:    'WipEout 2097',
    WIPEOUT3:       'WipEout 3',
    WIPEOUTFUSION:  'WipEout Fusion',
    PROJECTXSE:     'ProjectX SE',
    SONIC3COMPLETE: 'Sonic 3 Complete',
    NHL94:          'NHL 94',
};

function stripExtensions(fileName) {
    if (!fileName || typeof fileName !== 'string') return fileName;

    let base = fileName;
    for (let i = 0; i < 2; i++) {
        const lastDot = base.lastIndexOf('.');
        if (lastDot <= 0) break; // stop if no more extension
        base = base.substring(0, lastDot);
    }
    return base;
}

function cleanFileName(fileName) {
    // 1) Base part before underscore
    const raw = fileName.split('_')[0];

    // 2) Remove all trailing "(…)" or "[…]"
    const noParens = raw.replace(/\s*[\(\[].*?[\)\]]/g, '');

    // 3) Split into [core, subtitle] on first " - "
    const [corePart, subtitlePart] = noParens.split(/\s-\s(.+)$/);

    // 4) Build lookup key from corePart: remove non-alphanumerics, uppercase
    const key = corePart.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // 5) If exception exists, return it + suffix (if any)
    if (PREDEFINED_TITLES[key]) {
        return subtitlePart
            ? `${PREDEFINED_TITLES[key]} - ${subtitlePart}`   // preserve subtitle
            : PREDEFINED_TITLES[key];
    }

    // 6) Fallback to your original pipeline on the full raw filename
    let s = _removeAfterUnderscore(fileName);
    s = _splitSpecial(s);
    s = _splitCamelCase(s);
    s = _splitAcronym(s);
    s = _removeParens(s);
    s = _removeBrackets(s);
    s = _moveTrailingArticleToFront(s);

    return _titleCase(s);
}

function _removeAfterUnderscore(s) {
    return s.split('_')[0];
}

function _splitSpecial(s) {
    return s.replace(/(\d+[A-Z])(?=[A-Z][a-z])/g, '$1 ');
}

function _splitCamelCase(s) {
    return s.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function _splitAcronym(s) {
    return s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function _removeParens(s) {
    return s.replace(/\s*\(.*?\)/g, '');
}

function _removeBrackets(s) {
    return s.replace(/\s*\[.*?\]/g, '');
}

function _moveTrailingArticleToFront(s) {
    // Matches "... , The" (case-insensitive), end of string
    const m = s.match(/^(.*?),\s*(The|An|A)$/i);
    if (m) {
        // Capitalize the article properly and prepend
        const art = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
        return `${art} ${m[1].trim()}`;
    }
    return s;
}

function _titleCase(s) {
    return s
        .split(/\s+/)
        .map(word => {
            // If it's all digits or ALL-CAP (or contains digits), leave as-is
            if (/^[0-9]+$/.test(word) || /^[A-Z0-9]+$/.test(word)) {
                return word;
            }
            // Otherwise, uppercase first letter, lowercase the rest
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

function getPlatformInfo(name) {
    const platforms = {
        'settings': { name: 'Settings', vendor: 'Emulsion', index: 0 },
        'atari': { name: '2600 +', vendor: 'Atari', index: 1 },
        'spectrum': { name: 'ZX Spectrum', vendor: 'Sinclair', index: 2 },
        'c64': { name: 'C64', vendor: 'Commodore', index: 3 },
        'nes': { name: 'NES', vendor: 'Nintendo', index: 4 },
        'sms': { name: 'Master System', vendor: 'Sega', index: 5 },
        'pcengine': { name: 'PC Engine', vendor: 'NEC', index: 6 },
        'amiga': { name: 'Amiga', vendor: 'Commodore', index: 7 },
        'megadrive': { name: 'Megadrive', vendor: 'Sega', index: 8 },
        'gameboy': { name: 'Game Boy', vendor: 'Nintendo', index: 9 },
        'lynx': { name: 'Lynx', vendor: 'Atari', index: 10 },
        'gamegear': { name: 'Game Gear', vendor: 'Sega', index: 11 },
        'snes': { name: 'SNES', vendor: 'Nintendo', index: 12 },
        'jaguar': { name: 'Jaguar', vendor: 'Atari', index: 13 },
        'saturn': { name: 'Saturn', vendor: 'Sega', index: 14 },
        'psx': { name: 'PlayStation', vendor: 'Sony', index: 15 },
        'n64': { name: 'Nintendo64', vendor: 'Nintendo', index: 16 },
        'dreamcast': { name: 'Dreamcast', vendor: 'Sega', index: 17 },
        'ps2': { name: 'PlayStation 2', vendor: 'Sony', index: 18 },
        'gamecube': { name: 'GameCube', vendor: 'Nintendo', index: 19 },
        'xbox': { name: 'X-Box', vendor: 'Microsoft', index: 20 },
        'psp': { name: 'PS Portable', vendor: 'Sony', index: 21 },
        'ps3': { name: 'PlayStation 3', vendor: 'Sony', index: 22 },
        '3ds': { name: '3/DS', vendor: 'Nintendo', index: 23 },
        'xbox360': { name: 'X-Box 360', vendor: 'Microsoft', index: 24 },
        'ps4': { name: 'PlayStation 4', vendor: 'Sony', index: 25 },
        'recents': { name: 'Recents', vendor: 'Emulsion', index: 26 }
    };
    // Return the platform info if found, otherwise return the original name and no vendor
    return platforms[name] || { name: name, vendor: '' };
}

async function _loadUserData() {
    try {
        const preferences = await ipcRenderer.invoke('load-preferences');

        LB.userDataPath = preferences.userDataPath;
        LB.baseDir = path.resolve(preferences.appPath);
        LB.versionNumber = preferences.versionNumber;
        LB.kidsMode = preferences.kidsMode;
        LB.autoSelect = preferences.autoSelect;
        console.log("LB.autoSelect: ", LB.autoSelect);
        // LB.autoOpen = preferences.autoOpen;
        LB.recents = preferences.recents;

        delete preferences.userDataPath;
        delete preferences.appPath;
        delete preferences.versionNumber;
        delete preferences.kidsMode;
        delete preferences.autoSelect;
        delete preferences.recents;

        LB.preferences = preferences;

        return preferences;
    } catch (error) {
        console.error("Failed to load preferences:", error);
        window.location.reload();

        throw error; // Re-throw the error if needed
    }
}

async function getPrefs() {
    try {
        const preferences = await _loadUserData();
        return preferences;
    } catch (error) {
        console.error("Error loading preferences:", error);
        throw error;
    }
}

async function updatePreference(platformName, key, value) {
    console.log("platformName, key, value: ", platformName, key, value);
    try {

        const preferences = await getPrefs();

        console.log("preferences[key]: ", preferences[platformName][key]);
        console.log("preferences[key] === value: ", preferences[platformName][key] === value);

        if (preferences[platformName][key] === value) {
            console.log("Nothing to save or do.");
            return null;
        }

        preferences[platformName][key] = value;
        await ipcRenderer.invoke('save-preferences', preferences);

        const notifications = document.getElementById('notifications');
        const notification = document.getElementById('notification');

        notification.textContent = 'Preferences saved successfuly';

        notifications.style.opacity = 1;

        setTimeout(() => {
            notifications.style.opacity = 0;
        }, 3000);

        console.log(`${platformName} Preferences saved successfully!`);

        return 'OK';
    } catch (error) {
        console.error('Error updating preference:', error);
        throw error; // Re-throw the error to handle it elsewhere
    }
}

async function getPlatformPreference(platformName, key) {
    try {
        const preferences = await getPrefs();

        if (!preferences[platformName]) {
            throw new Error(`Platform "${platformName}" not found in preferences.`);
        }

        if (preferences[platformName][key] === undefined) {
            throw new Error(`Key "${key}" not found for platform "${platformName}".`);
        }

        return preferences[platformName][key];
    } catch (error) {
        console.error('Error getting platform preference:', error);
        throw error; // Re-throw the error to handle it elsewhere
    }
}

function applyTheme(theme) {
    const body = document.querySelector('body');
    const menu = document.getElementById('menu');

    const baseDir = LB.baseDir.endsWith('/')
          ? LB.baseDir.slice(0, -1)
          : LB.baseDir;

    const bgPath = path.join(LB.baseDir, 'img', 'themes', theme, 'background.png');
    const bgImageUrl = `url("file://${bgPath.replace(/\\/g, '/')}")`;

    body.style.backgroundImage = bgImageUrl;
    menu.style.backgroundImage = bgImageUrl;

    menu.style.transition = 'filter 1s';
    menu.style.filter = 'opacity(0.5)';

    body.classList.remove('theme-day', 'theme-night', 'theme-default');
    body.classList.add(`theme-${theme}`);

    menu.style.transition = 'filter 1s, color 1s';
    menu.style.filter = 'opacity(0.5)';

    setTimeout(() => {
        menu.style.backgroundImage = bgImageUrl;
        menu.style.filter = 'opacity(1)';
    }, 100);
}

function setFooterSize(size) {
    const footer = document.getElementById('footer');
    footer.className = `footer-${size}`;
}

function getDataIndexByPlatform(platformName) {
    // Get all elements with class "page" that have data-platform attribute
    const pages = document.querySelectorAll('.page[data-platform]');

    // Find the page with the matching platform name
    const matchingPage = Array.from(pages).find(page =>
        page.getAttribute('data-platform') === platformName
    );

    // Return the data-index if found, otherwise return null or undefined
    return matchingPage ? matchingPage.getAttribute('data-index') : null;
}

LB.prefs = {
    load: getPrefs,
    save: updatePreference,
    getValue: getPlatformPreference
};

LB.utils = {
    applyTheme: applyTheme,
    setFooterSize: setFooterSize,
    getPlatformInfo: getPlatformInfo,
    stripExtensions: stripExtensions,
    cleanFileName: cleanFileName,
    safeFileName: safeFileName,
    simulateKeyDown: simulateKeyDown,
    getSelectedGame: getSelectedGame,
    updateControls: updateControls,
    getDataIndexByPlatform: getDataIndexByPlatform
};

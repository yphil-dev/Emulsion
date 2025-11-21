import { PLATFORMS } from './platforms.js';
import { buildEmptyPageGameContainer } from './gallery.js';
import { downloadMetaDialog } from './dialog.js';
import { getMeta } from './metadata.js';
import { updateGamePane } from './slideshow.js';

const fs = require('fs');
const path = require('path');
const fsp = fs.promises;

export function initFooterControls() {
    updateFooterControls('dpad', 'ew', 'Platforms', 'on');
    updateFooterControls('shoulders', 'same', 'same', 'off');
    updateFooterControls('west', 'same', 'same', 'off');
    updateFooterControls('north', 'same', 'same', 'off');
    updateFooterControls('east', 'same', 'Exit', 'on');
    updateFooterControls('south', 'same', 'same', 'on');
}

export function updateFooterControlsFor(context) {

    switch (context) {
    case 'gallery':
        updateFooterControls('dpad', 'nsew', 'Games', 'on');
        updateFooterControls('west', 'same', 'Cover', 'on');
        updateFooterControls('north', 'same', 'Favorite', 'on');
        updateFooterControls('shoulders', 'same', 'Platforms', 'on');
        updateFooterControls('south', 'same', 'Launch', 'on');
        updateFooterControls('east', 'same', 'Exit', 'on');
        break;

    case 'gallery-list':
        updateFooterControls('dpad', 'ns', 'Games', 'on');
        updateFooterControls('west', 'same', 'Cover', 'on');
        updateFooterControls('north', 'same', 'Favorite', 'on');
        updateFooterControls('shoulders', 'same', 'Platforms', 'on');
        updateFooterControls('south', 'same', 'Launch', 'on');
        updateFooterControls('east', 'same', 'Exit', 'on');
        break;

    case 'settings':
        updateFooterControls('dpad', 'nsew', 'Platforms', 'on');
        updateFooterControls('shoulders', 'same', 'Platforms', 'on');
        updateFooterControls('west', 'same', 'Cover', 'off');
        updateFooterControls('north', 'same', 'same', 'off');
        break;

    case 'game-menu':
        updateFooterControls('dpad', 'same', 'Platforms', 'on');
        updateFooterControls('shoulders', 'same', 'Platforms', 'on');
        updateFooterControls('west', 'same', 'Cover', 'off');
        updateFooterControls('north', 'same', 'same', 'off');
        break;

    case 'platform-menu':
        updateFooterControls('dpad', 'ns', 'Inputs', 'on');
        updateFooterControls('west', 'same', '', 'off');
        updateFooterControls('shoulders', 'same', '', 'off');
        updateFooterControls('north', 'same', 'same', 'off');
        break;

    case 'empty-page':
        updateFooterControls('dpad', 'same', 'Buttons', 'on');
        updateFooterControls('shoulders', 'same', 'Platforms', 'on');
        updateFooterControls('west', 'same', 'Cover', 'off');
        updateFooterControls('south', 'same', 'Select', 'on');
        updateFooterControls('north', 'same', 'same', 'off');
        break;

    case 'slide-show':
        initFooterControls();
        break;
    }
}

function updateFooterControls(section, cardinals, newText, display) {

    const colorSets = {
        ew: {
            '--fill-east': 'var(--color-selected)',
            '--fill-south': 'black',
            '--fill-north': 'black',
            '--fill-west': 'var(--color-selected)',
        },
        ns: {
            '--fill-east': 'black',
            '--fill-south': 'var(--color-selected)',
            '--fill-north': 'var(--color-selected)',
            '--fill-west': 'black',
        },
        nsew: {
            '--fill-east': 'var(--color-selected)',
            '--fill-south': 'var(--color-selected)',
            '--fill-north': 'var(--color-selected)',
            '--fill-west': 'var(--color-selected)',
        },
    };

    const dpadColors = colorSets[cardinals] || colorSets.nsew;

    const sectionDiv = document.querySelector(`div#${section}`);
    if (!sectionDiv) return;

    const label = sectionDiv.querySelector("span.control-item-label");
    const svg = sectionDiv.querySelector('svg.control-icon');

    // --- fade only ---
    if (display === 'off') {
        sectionDiv.style.display = 'none';
        return;
    }
    if (display === 'on') {
        sectionDiv.style.display = 'flex';
    }

    // --- color updates ---
    if (cardinals && cardinals !== 'same') {
        Object.entries(dpadColors).forEach(([key, value]) => {
            svg.style.setProperty(key, value);
        });
    }

    // --- text update with mini-fade ---
    if (label && newText !== 'same') {
        label.textContent = newText;
    }
}

export function applyTheme(theme) {
    const body = document.querySelector('body');
    const menu = document.getElementById('menu');

    const elementsToTheme = document.querySelectorAll('.themed-background');

    const baseDir = LB.baseDir.endsWith('/')
          ? LB.baseDir.slice(0, -1)
          : LB.baseDir;

    const bgPath = window.path.join(LB.baseDir, 'img', 'themes', theme, 'background.png');
    const bgImageUrl = `url("file://${bgPath.replace(/\\/g, '/')}")`;

    // elementsToTheme.forEach(element => {
    //     element.style.backgroundImage = bgImageUrl;
    // });

    menu.style.transition = 'filter 1s';
    menu.style.filter = 'opacity(0.5)';

    body.classList.remove('theme-day', 'theme-night', 'theme-default');
    body.classList.add(`theme-${theme}`);

    menu.style.transition = 'filter 1s, color 1s';
    menu.style.filter = 'opacity(1)';

    // setTimeout(() => {
    //     menu.style.backgroundImage = bgImageUrl;
    //     menu.style.filter = 'opacity(1)';
    // }, 100);
}

export function setFooterSize(size) {
    const footer = document.getElementById('footer');
    footer.style.opacity = 1;

    footer.className = `footer-${size}`;
    LB.preferences['settings'].footerSize = size;

    let heightValue;
    switch (size) {
        case 'small':
            heightValue = '50px';
            break;
        case 'medium':
            heightValue = '80px';
            break;
        case 'big':
            heightValue = '110px';
            break;
        default:
            heightValue = '80px';
    }

    document.documentElement.style.setProperty('--footer-height', heightValue);
}


export function getSelectedGameContainer(gameContainers, selectedIndex) {
    // Direct access if index is valid
    if (selectedIndex >= 0 && selectedIndex < gameContainers.length) {
        return gameContainers[selectedIndex];
    }
    return null;
}

export function simulateTabNavigation(container, shiftKey = false) {

    const focusableElements = container.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const focusableElementsArray = Array.from(focusableElements)
          .filter(el =>
              !el.disabled &&
                  window.getComputedStyle(el).display !== 'none' &&
                  !(el.tagName === 'INPUT' && el.type === 'range')
          );

    if (focusableElementsArray.length === 0) {
        return;
    }

    const currentIndex = focusableElementsArray.indexOf(document.activeElement);
    let nextIndex;

    if (shiftKey) {
        nextIndex = currentIndex <= 0 ? focusableElementsArray.length - 1 : currentIndex - 1;
    } else {
        nextIndex = currentIndex >= focusableElementsArray.length - 1 ? 0 : currentIndex + 1;
    }

    const nextElement = focusableElementsArray[nextIndex];

    if (nextElement) {
        nextElement.focus({ preventScroll: false });
    }
}

export function simulateKeyDown(key, modifiers = {}) {
    console.log("key: ", key);
    const keyCodes = {
        ArrowLeft: 37,
        ArrowRight: 39,
        ArrowUp: 38,
        ArrowDown: 40,
        Shift: 16,
        Enter: 13,
        Escape: 27,
        Tab: 9,
        Space: 32
    };

    const keyboardEvent = new KeyboardEvent('keydown', {
        key,
        code: key,
        keyCode: keyCodes[key] || 0,
        which: keyCodes[key] || 0,
        shiftKey: modifiers.shift || false,
        ctrlKey: modifiers.ctrl || false,
        altKey: modifiers.alt || false,
        metaKey: modifiers.meta || false,
        bubbles: true,
        cancelable: true
    });

    document.dispatchEvent(keyboardEvent);
}

export function stripExtensions(fileName, platformExtensions = []) {
    if (!fileName || typeof fileName !== 'string') return fileName;
    if (!platformExtensions || platformExtensions.length === 0) {

        const lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
    }

    const sortedExtensions = [...platformExtensions].sort((a, b) => b.length - a.length);

    for (const ext of sortedExtensions) {
        if (fileName.toLowerCase().endsWith(ext.toLowerCase())) {
            return fileName.substring(0, fileName.length - ext.length);
        }
    }

    return fileName;
}

const PREDEFINED_TITLES = {
    VRALLY2:        'V-Rally 2',
    WIPEOUT2097:    'WipEout 2097',
    WIPEOUT3:       'WipEout 3',
    WIPEOUTFUSION:  'WipEout Fusion',
    PROJECTXSE:     'ProjectX SE',
    DUCKTALES:      'DuckTales',
    SONIC3COMPLETE: 'Sonic 3 Complete',
    NHL94:          'NHL 94',
};

const TAGS_TO_KEEP = ['CD32', 'AGA'];

// Terms to isolate if glued to a word
const NUMERIC_SUFFIXES = [
    '2d', '3d', '4d'
];

export function cleanFileName(fileName) {
    const foundTags = [];
    TAGS_TO_KEEP.forEach(tag => {
        if (fileName.includes(tag)) {
            foundTags.push(tag);
        }
    });

    const raw = fileName.split('_')[0];
    const noParens = raw.replace(/\s*[\(\[].*?[\)\]]/g, '');
    const [corePart, subtitlePart] = noParens.split(/\s-\s(.+)$/);
    const key = corePart.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (PREDEFINED_TITLES[key]) {
        const result = subtitlePart
              ? `${PREDEFINED_TITLES[key]} - ${subtitlePart}`
              : PREDEFINED_TITLES[key];
        return foundTags.length > 0 ? `${result} (${foundTags.join(', ')})` : result;
    }

    // Pipeline
    let s = _removeAfterUnderscore(fileName);
    s = _splitSpecial(s);
    s = _splitCamelCase(s);
    s = _splitAcronym(s);
    s = _removeParens(s);
    s = _removeBrackets(s);
    s = _isolateNumericSuffixes(s);   // 👈 NEW STEP
    s = _moveTrailingArticleToFront(s);

    const result = _titleCase(s);
    return foundTags.length > 0 ? `${result} (${foundTags.join(', ')})` : result;
}

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------

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
    const m = s.match(/^(.*?),\s*(The|An|A)$/i);
    if (m) {
        const art = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
        return `${art} ${m[1].trim()}`;
    }
    return s;
}

function _isolateNumericSuffixes(s) {
    for (const term of NUMERIC_SUFFIXES) {
        const re = new RegExp(`([A-Za-z])(${term})(\\b|$)`, 'gi');
        s = s.replace(re, '$1 $2');
    }
    return s;
}

function _titleCase(s) {
    return s
        .split(/\s+/)
        .map(word => {
            if (/^[0-9]+$/.test(word) || /^[A-Z0-9]+$/.test(word)) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

export function setKeydown(newHandler) {
    // Initialize the storage if it doesn't exist
    if (!LB._keydownHistory) LB._keydownHistory = [];

    // Remove the currently active handler if any
    if (LB.currentKeydownHandler) {
        window.removeEventListener('keydown', LB.currentKeydownHandler);
        console.log('[keydown] Removed current handler:', LB.currentKeydownHandler.name || '(anonymous)');
    }

    // Case 1: restore the previous handler
    if (newHandler === 'previous') {
        const previousHandler = LB._keydownHistory.pop(); // get the last one
        if (previousHandler) {
            window.addEventListener('keydown', previousHandler);
            LB.currentKeydownHandler = previousHandler;
            console.log('[keydown] Restored previous handler:', previousHandler.name || '(anonymous)');
        } else {
            LB.currentKeydownHandler = null;
            console.log('[keydown] No previous handler to restore.');
        }
        return;
    }

    // Case 2: install a new handler
    if (typeof newHandler === 'function') {
        // Push the current one (if any) to history before replacing
        if (LB.currentKeydownHandler) {
            LB._keydownHistory.push(LB.currentKeydownHandler);
        }

        window.addEventListener('keydown', newHandler);
        LB.currentKeydownHandler = newHandler;
        console.log('[keydown] Added new handler:', newHandler.name || '(anonymous)');
    } else {
        console.warn('[keydown] Invalid handler passed to setKeydown:', newHandler);
    }
}

export function notify(text) {
    console.log("text: ", text);
}

export function getPlatformByName(platformName) {
    return PLATFORMS.find(p => p.name === platformName);
}

export function toggleHeaderNavLinks(display) {
    const links = document.querySelectorAll('header .pages-nav-links');

    links.forEach((link, i) => {
        link.style.opacity = display === 'show' ? 1 : 0;
    });
}

export function updateHeader(platformName, gameName) {
    const header = document.getElementById("header");
    const headerControls = document.getElementById("header-controls");

    const showHeader = platformName !== 'hide';
    const showControls = !(LB.mode === 'gameMenu' || LB.mode === 'menu' || platformName === 'settings');

    header.style.display = showHeader ? 'flex' : 'none';
    headerControls.style.display = showControls ? 'flex' : 'none';

    if (!showHeader) return;

    const galleries = document.getElementById('galleries');

    const favPage = galleries.querySelector('.page[data-platform="favorites"] .page-content');
    const recentsPage = galleries.querySelector('.page[data-platform="recents"] .page-content');

    let platform;
    if (platformName === 'settings') {
        platform = { nbGames: PLATFORMS.length, displayName: "Settings", vendor: "Emulsion" };
    } else if (platformName === 'favorites') {
        platform = { nbGames: favPage.children.length, displayName: "Favorites", vendor: "Emulsion" };
    } else if (platformName === 'recents') {
        platform = { nbGames: recentsPage.children.length, displayName: "Recently played", vendor: "Emulsion" };
    } else {
        platform = getPlatformByName(platformName);
    }

    let itemType = gameName ? 'image' : 'game';
    let count = platform.nbGames;

    if (platformName === 'settings') itemType = 'platform';
    if (platformName === 'recents') count = LB.recents.length;
    if (count === 0) count = 'No';

    const vendor = LB.mode === 'gameMenu' ? platform.displayName : platform.vendor || 'Emulsion';

    const pluralize = (count, singular) => count === 1 ? singular : `${singular}s`;

    header.querySelector('.platform-name').textContent = gameName || platform.displayName;
    header.querySelector('.vendor-name').textContent = vendor;
    header.querySelector('.item-number').textContent = count;
    header.querySelector('.item-type').textContent = pluralize(count, itemType);
    const headerImage = LB.mode === 'menu' ? 'settings.png' : `${platformName}.png`;
    header.querySelector('.platform-image').style.backgroundImage = `url('../../img/platforms/${headerImage}')`;
}

export function toggleFullScreen(elem = document.documentElement) {
    if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

export async function scanDirectory(gamesDir, extensions, recursive = true, ignoredDirs = ['PS3_EXTRA', 'PKGDIR', 'freezer', 'tmp']) {

    if (!gamesDir || typeof gamesDir !== 'string') {
        console.warn("scanDirectory: Invalid directory path provided:", gamesDir);
        return [];
    }

    try {
        // Use IPC to call the main process scanDirectory handler
        const files = await ipcRenderer.invoke('scan-directory', gamesDir, extensions, recursive, ignoredDirs);
        return files;
    } catch (err) {
        return [];
    }
}

export async function findImageFile(basePath, fileNameWithoutExt) {
    try {
        // Use IPC to call the main process findImageFile handler
        return await ipcRenderer.invoke('find-image-file', basePath, fileNameWithoutExt);
    } catch (err) {
        console.warn("Error finding image file:", err);
        return null;
    }
}



function setFooterProgress(barIndex, percent) {
    const bar = document.getElementById(`progress-bar-${barIndex}`);
    if (bar) {
        bar.style.width = `${Math.max(0, Math.min(100, percent))}vw`;
    }
}

export function setFooterProgressVisible(show = true) {
    const container = document.getElementById('footer-progress-bars');
    if (!container) return;

    if (show) {
        container.style.opacity = '1';
        container.style.transition = 'opacity 0.3s ease';
    } else {
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.6s ease';
    }
}

export async function executeBatchDownload(games, type, platformName) {
    if (type !== 'image' && type !== 'meta') return;

    if (type === 'image') setFooterProgress(1, 0);
    if (type === 'meta') setFooterProgress(2, 0);

    for (let i = 0; i < games.length; i++) {

        const gameContainer = games[i];
        const gameName = gameContainer.dataset.gameName;
        const cleanName = gameContainer.dataset.cleanName;

        if (type === 'image') {
            setFooterProgress(1, (i / games.length) * 100);

            const activePageContent = gameContainer.parentElement;

            const currentPage = document.querySelector(`div.page[data-platform="${platformName}"]`);

            console.log("currentPage.dataset.viewMode: ", currentPage.dataset.viewMode);

            let elementToPulse;

            const isListMode = currentPage.dataset.viewMode === 'list';
            const gameContainerImage = gameContainer.querySelector('.game-container-image');

            if (isListMode) {
                elementToPulse = gameContainer;
            } else {
                elementToPulse = gameContainerImage;
            }

            elementToPulse.classList.add('loading');

            try {
                const urls = await new Promise((resolve) => {
                    ipcRenderer.send('fetch-images', cleanName, platformName, LB.steamGridAPIKey, LB.giantBombAPIKey);
                    ipcRenderer.once('image-urls', (event, urls) => resolve(urls));
                });

                const url = typeof urls[0] === 'string' ? urls[0] : urls[0]?.url;
                if (!url) continue;

                const result = await downloadImage(
                    url,
                    platformName,
                    gameName
                );

                if (result) {
                    const imgEl = gameContainer.querySelector("img");
                    if (imgEl) {
                        imgEl.src = result + '?t=' + Date.now();
                        gameContainer.removeAttribute('data-missing-image');
                        elementToPulse.classList.remove('loading');
                        if (isListMode) {
                            updateGamePane(gameContainer);
                        }
                    }
                } else {
                    elementToPulse.classList.remove('loading');
                }

            } catch (err) {
                console.error(`Failed batch Dload for ${gameName}:`, err);
                elementToPulse.classList.remove('loading');
            }
        } else if (type === 'meta') {
            setFooterProgress(2, (i / games.length) * 100);

            const currentPage = document.querySelector(`div.page[data-platform="${platformName}"]`);
            const isListMode = currentPage.dataset.viewMode === 'list';
            const gameContainerImage = gameContainer.querySelector('.game-container-image');

            let elementToPulse = isListMode ? gameContainer : gameContainerImage;
            elementToPulse.classList.add('loading');

            try {
                const params = {
                    cleanName: gameContainer.dataset.cleanName,
                    platformName: platformName,
                    gameFileName: gameName,
                    function: 'fetch-meta'
                };

                await getMeta(params);

                if (isListMode) {
                    updateGamePane(gameContainer);
                }
                elementToPulse.classList.remove('loading');

            } catch (err) {
                console.error(`Failed to fetch meta for ${gameName}:`, err);
                elementToPulse.classList.remove('loading');
                await new Promise(r => setTimeout(r, 100));
            }
        }
    }

}

export async function addFavorite(container) {
    const galleries = document.getElementById('galleries');
    const favPage = galleries.querySelector('.page[data-platform="favorites"] .page-content');

    const favoriteEntry = {
        gameName: container.dataset.gameName,
        gamePath: container.dataset.gamePath,
        command: container.dataset.command,
        emulator: container.dataset.emulator,
        emulatorArgs: container.dataset.emulatorArgs,
        platform: container.dataset.platform
    };

    const emptyPageGameContainer = favPage.querySelector('.empty-platform-game-container');

    if (favPage) {
        if (emptyPageGameContainer) {
            emptyPageGameContainer.remove();
        }
        const clone = container.cloneNode(true);
        clone.classList.remove('selected');
        favPage.appendChild(clone);
    }

    try {
        const result = await ipcRenderer.invoke('add-favorite', favoriteEntry);
        console.log("result:", result);
        if (result.success) {
            console.info(`Yo, ${result.path}`);
            return result.path;
        } else {
            console.error(`Error: ${result.error}`);
            return null;
        }
    } catch (error) {
        console.error('Error communicating with main process:', error);
        return null;
    }
}

export async function removeFavorite(container) {
    const galleries = document.getElementById('galleries');
    const favPage = galleries.querySelector('.page[data-platform="favorites"] .page-content');

    const favoriteEntry = {
        gameName: container.dataset.gameName,
        gamePath: container.dataset.gamePath,
        command: container.dataset.command,
        emulator: container.dataset.emulator,
        emulatorArgs: container.dataset.emulatorArgs,
        platform: container.dataset.platform
    };

    console.log("removeFavorite - favoriteEntry: ", favoriteEntry);

    try {
        const result = await ipcRenderer.invoke('remove-favorite', favoriteEntry);
        console.log("removeFavorite - result: ", result);
        if (result.success) {

            if (favPage) {
                const favorite = favPage.querySelector(`.game-container[data-game-name="${favoriteEntry.gameName}"]`);
                favorite.remove();
                const remaining = favPage.querySelectorAll('.game-container').length;
                if (remaining === 0) {

                    const emptyContainer = buildEmptyPageGameContainer({
                        context: "no-favorites",
                    });

                    favPage.appendChild(emptyContainer);
                }
            }

            console.info(`Removed favorite: ${favoriteEntry.gameName}`);
            return result.path;
        } else {
            console.error(`Error removing favorite: ${result.error}`);
            return null;
        }
    } catch (error) {
        console.error('Error communicating with main process:', error);
        return null;
    }
}

export async function downloadImage(imgSrc, platform, gameName) {
    const gamesDir = window.LB.preferences[platform]?.gamesDir;
    if (!gamesDir) {
        console.error('No games directory found for platform:', platform);
        return null;
    }

    console.log("imgSrc, platform, gameName, gamesDir: ", imgSrc, platform, gameName, gamesDir);

    try {
        const result = await ipcRenderer.invoke('download-image', imgSrc, platform, gameName, gamesDir);
        if (result.success) {
            console.info(`Image saved at ${result.path}`);
            // notify(`Image saved at ${result.path}`);
            return result.path;
        } else {
            console.error(`Error saving image: ${result.error}`);
            // notify(`Error saving image: ${result.error}`);
            return null;
        }
    } catch (error) {
        console.error('Error communicating with main process:', error);
        alert('Failed to save image');
        return null;
    }
}

export async function batchDownload() {
    if (LB.batchRunning) {
        console.info("Batch download already running");
        return;
    }

    console.log("batchDownload: ");

    // Ensure platform and directories are valid
    const currentPlatform = LB.currentPlatform;
    const platformPrefs = LB.preferences[currentPlatform];
    if (!platformPrefs?.gamesDir) {
        document.getElementById('games-dir-sub-label').textContent = 'This field cannot be empty';
        return;
    }

    const pages = document.querySelectorAll('#galleries .page');
    const currentPlatformPage = Array.from(pages).find(
        page => page.dataset.platform === currentPlatform
    );
    if (!currentPlatformPage) {
        console.warn("No page found for current platform:", currentPlatform);
        return;
    }

    // Identify missing items
    const gamesMissingImage = currentPlatformPage.querySelectorAll(".game-container[data-missing-image]");
    const gamesMissingMeta = await getMissingMetaGames(currentPlatformPage);

    // Ask user for confirmation
    let confirmed;
    try {
        confirmed = await downloadMetaDialog(gamesMissingImage.length, gamesMissingMeta.length);
    } catch {
        // Dialog cancelled
        return;
    }

    if (!confirmed) {
        console.info("Batch download cancelled by user");
        return;
    }

    setFooterProgressVisible(true);

    const tasks = [];

    if (confirmed.imageBatch) {
        tasks.push(executeBatchDownload(gamesMissingImage, 'image', LB.currentPlatform));
    }
    if (confirmed.metaBatch) {
        tasks.push(executeBatchDownload(gamesMissingMeta, 'meta', LB.currentPlatform));
    }

    LB.batchRunning = true;
    try {
        await Promise.all(tasks); // run concurrently
    } finally {
        LB.batchRunning = false;
        setFooterProgress(1, 100);
        setFooterProgress(2, 100);

        // Ensure all loading classes are removed from the current platform's containers
        const currentPlatformPage = document.querySelector(`div.page[data-platform="${LB.currentPlatform}"]`);
        if (currentPlatformPage) {
            const loadingElements = currentPlatformPage.querySelectorAll('.loading');
            loadingElements.forEach(element => element.classList.remove('loading'));
        }

        setTimeout(() => setFooterProgressVisible(false), 1500);
    }
}

export async function getMissingMetaGames(currentPlatformPage) {
    const gameContainers = currentPlatformPage.querySelectorAll(".game-container");

    const gamesMissingMeta = [];

    for (const gameContainer of gameContainers) {
        const params = {
            cleanName: gameContainer.dataset.cleanName,
            platformName: gameContainer.dataset.platform,
            gameFileName: gameContainer.dataset.gameName,
            function: 'read-meta'
        };

        try {
            await getMeta(params);
        } catch (err) {
            gamesMissingMeta.push(gameContainer);
        }
    }

    return gamesMissingMeta;
}

export async function getPs3GameName(filePath) {
    try {
        return await ipcRenderer.invoke('parse-sfo', filePath);
    } catch (err) {
        console.error('Failed to parse SFO:', err);
        return null;
    }
}


function explodeGameContainer(gameContainer) {

    const numParticles = 12;
    const container = document.body;
    let rect;
    try {
        rect = gameContainer.getBoundingClientRect();
    } catch (err) {
        console.log("err: ", err);
    }

    const colors = ['#FF3B3B', '#FF8C00', '#FFD700', '#32CD32', '#1E90FF', '#8A2BE2'];

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';

        // Random size
        const size = 15 + Math.random() * 25;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        // Random starting offset
        const offsetXStart = (Math.random() - 0.5) * 30; // spread at spawn
        const offsetYStart = (Math.random() - 0.5) * 30;
        particle.style.setProperty('--x-start', offsetXStart + 'px');
        particle.style.setProperty('--y-start', offsetYStart + 'px');
        particle.style.setProperty('--rotation', `${-360 + Math.random() * 720}deg`);

        // Position relative to viewport
        if (rect) {
            particle.style.left = (rect.left + rect.width / 2 - size / 2) + 'px';
            particle.style.top = (rect.top + rect.height / 2 - size / 2) + 'px';
        } else {
            return;
        }

        // Random direction/distance
        const angle = Math.random() * 2 * Math.PI;
        const distance = 120 + Math.random() * 80; // was 80 + Math.random() * 100

        particle.style.setProperty('--x', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--y', Math.sin(angle) * distance + 'px');

        // Random scale
        particle.style.setProperty('--scale', 1.5 + Math.random() * 1.5);

        // Faster particles
        particle.style.animationDuration = (0.8 + Math.random() * 0.4) + 's';

        particle.addEventListener('animationend', () => particle.remove());

        fragment.appendChild(particle);
    }

    container.appendChild(fragment);
}

export function launchGame(gameContainer) {
    explodeGameContainer(gameContainer);

    ipcRenderer.send('run-command', {
        fileName: gameContainer.dataset.gameName,
        filePath: gameContainer.dataset.gamePath,
        gameName: gameContainer.dataset.gameName,
        emulator: gameContainer.dataset.emulator,
        emulatorArgs: gameContainer.dataset.emulatorArgs,
        platform: gameContainer.dataset.platform
    });
}

export function switchIcon (svgElement, newId) {
  const use = svgElement.querySelector('use');
  if (!use) return;
  use.setAttribute('href', `#${newId}`);
}

export function buildIcon (symbolId, className) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", `icon ${className || ''}`);
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#${symbolId}`);
    svg.appendChild(use);
    return svg;
};

export function fadeOut(element, fadeDurationMs = 1000) {
    setTimeout(() => {
        element.style.transition = `opacity ${fadeDurationMs}ms ease-out`;
        element.style.opacity = "0";
    }, 2000);
}

export function updateLabelFontSize(numOfCols) {
    const factor = 8 / numOfCols;
    const fontSize = `clamp(10px, ${factor}vw, 28px)`;
    document.documentElement.style.setProperty("--font-size-gallery-label", fontSize);
}


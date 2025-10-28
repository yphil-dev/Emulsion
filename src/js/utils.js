import { PLATFORMS } from './platforms.js';
import { buildEmptyPageGameContainer } from './gallery.js';
import { batchDialog } from './dialog.js';
import { getMeta } from './metadata.js';

export function initFooterControls() {
    updateFooterControls('dpad', 'button-dpad-ew', 'Platforms', 'on');
    updateFooterControls('shoulders', 'same', 'same', 'off');
    updateFooterControls('west', 'same', 'same', 'off');
    updateFooterControls('north', 'same', 'same', 'off');
    updateFooterControls('east', 'same', 'Exit', 'on');
    updateFooterControls('south', 'same', 'same', 'on'); // Make sure south is on
}

export function updateFooterControlsFor(context) {

    switch (context) {
    case 'gallery':
        updateFooterControls('dpad', 'button-dpad-nesw', 'Games', 'on');
        updateFooterControls('west', 'same', 'Cover', 'on');
        updateFooterControls('west', 'button-west', 'Cover', 'on');
        updateFooterControls('north', 'button-north', 'Favorite', 'on');
        updateFooterControls('shoulders', 'same', 'Platforms', 'on');
        break;

    case 'settings':
        updateFooterControls('dpad', 'button-dpad-nesw', 'Platforms', 'on');
        updateFooterControls('shoulders', 'same', 'Platforms', 'on');
        updateFooterControls('west', 'same', 'Cover', 'off');
        updateFooterControls('north', 'same', 'same', 'off');
        break;

    case 'game-menu':
        updateFooterControls('dpad', 'button-dpad-nesw', 'Platforms', 'on');
        updateFooterControls('shoulders', 'same', 'Platforms', 'on');
        updateFooterControls('west', 'same', 'Cover', 'off');
        updateFooterControls('north', 'same', 'same', 'off');
        break;

    case 'platform-menu':
        updateFooterControls('dpad', 'button-dpad-nesw', 'Inputs', 'on');
        updateFooterControls('west', 'same', '', 'off');
        updateFooterControls('shoulders', 'same', '', 'off');
        updateFooterControls('north', 'same', 'same', 'off');
        break;

    case 'empty-page':
        updateFooterControls('dpad', 'button-dpad-nesw', 'Platforms', 'off');
        updateFooterControls('shoulders', 'same', 'Platforms', 'on');
        updateFooterControls('west', 'same', 'Cover', 'off');
        updateFooterControls('north', 'same', 'same', 'off');
        break;

    case 'slide-show':
        initFooterControls();
        break;

    }
}

function updateFooterControls(section, newIcon, newText, display) {
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

const path = require('path');

export function applyTheme(theme) {
    const body = document.querySelector('body');
    const menu = document.getElementById('menu');

    const elementsToTheme = document.querySelectorAll('.themed-background');

    const baseDir = LB.baseDir.endsWith('/')
          ? LB.baseDir.slice(0, -1)
          : LB.baseDir;

    const bgPath = path.join(LB.baseDir, 'img', 'themes', theme, 'background.png');
    const bgImageUrl = `url("file://${bgPath.replace(/\\/g, '/')}")`;

    elementsToTheme.forEach(element => {
        element.style.backgroundImage = bgImageUrl;
    });

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

export function setFooterSize(size) {
    const footer = document.getElementById('footer');
    footer.style.opacity = 1;

    // Set class
    footer.className = `footer-${size}`;
    LB.preferences['settings'].footerSize = size;

    // Set CSS variable --footer-height dynamically
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

export function simulateTabNavigation(shiftKey = false) {
    // Get all potentially focusable elements
    const focusableElements = document.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Filter to only elements that are visible and not disabled
    const visibleFocusableElements = Array.from(focusableElements).filter(el => {
        return el.offsetWidth > 0 &&
               el.offsetHeight > 0 &&
               !el.disabled &&
               getComputedStyle(el).visibility !== 'hidden' &&
               getComputedStyle(el).display !== 'none';
    });

    if (visibleFocusableElements.length === 0) {
        console.warn("No focusable elements found");
        return;
    }

    const currentIndex = visibleFocusableElements.indexOf(document.activeElement);
    let nextIndex;

    if (shiftKey) {
        // Shift+Tab - move backward
        nextIndex = currentIndex <= 0 ? visibleFocusableElements.length - 1 : currentIndex - 1;
    } else {
        // Tab - move forward
        nextIndex = currentIndex >= visibleFocusableElements.length - 1 ? 0 : currentIndex + 1;
    }

    const nextElement = visibleFocusableElements[nextIndex];

    if (nextElement) {
        // Ensure the element is focusable
        if (!nextElement.hasAttribute('tabindex')) {
            nextElement.setAttribute('tabindex', '0');
        }

        nextElement.focus({ preventScroll: false });

        // Manual scroll to replace scrollIntoView
        const elementRect = nextElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const scrollTop = window.pageYOffset;
        const scrollLeft = window.pageXOffset;
        const elementTop = elementRect.top + scrollTop;
        const elementLeft = elementRect.left + scrollLeft;
        const elementHeight = elementRect.height;
        const elementWidth = elementRect.width;
        const newScrollTop = elementTop - (windowHeight / 2) + (elementHeight / 2);
        const newScrollLeft = elementLeft - (windowWidth / 2) + (elementWidth / 2);
        window.scrollTo({
            top: Math.max(0, newScrollTop),
            left: Math.max(0, newScrollLeft),
            behavior: 'smooth'
        });
    }
}

export function simulateKeyDown(key, modifiers = {}) {
    const keyCodes = {
        ArrowLeft: 37,
        ArrowRight: 39,
        ArrowUp: 38,
        ArrowDown: 40,
        Shift: 16,
        Enter: 13,
        Escape: 27,
        Tab: 9
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
        bubbles: true
    });

    document.dispatchEvent(keyboardEvent);
}


export function safeFileName(fileName) {
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

const TAGS_TO_KEEP = ['CD32', 'AGA'];

export function cleanFileName(fileName) {
    // JUST check for tags and store them
    const foundTags = [];
    TAGS_TO_KEEP.forEach(tag => {
        if (fileName.includes(tag)) {
            foundTags.push(tag);
        }
    });

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
        const result = subtitlePart
            ? `${PREDEFINED_TITLES[key]} - ${subtitlePart}`   // preserve subtitle
            : PREDEFINED_TITLES[key];

        // Add tags if any were found
        return foundTags.length > 0 ? `${result} (${foundTags.join(', ')})` : result;
    }

    // 6) Fallback to your original pipeline on the full raw filename
    let s = _removeAfterUnderscore(fileName);
    s = _splitSpecial(s);
    s = _splitCamelCase(s);
    s = _splitAcronym(s);
    s = _removeParens(s);
    s = _removeBrackets(s);
    s = _moveTrailingArticleToFront(s);

    const result = _titleCase(s);

    // Add tags if any were found
    return foundTags.length > 0 ? `${result} (${foundTags.join(', ')})` : result;
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
    const notifications = document.getElementById('notifications');
    const notification = document.getElementById('notification');

    notification.textContent = text;
    notifications.style.opacity = 1;

    setTimeout(() => {
        notifications.style.opacity = 0;
        notification.textContent = '';
        notification.innerHTML = '';
    }, 3000);
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
    const showControls = !(LB.mode === 'menu' || platformName === 'settings');

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
    header.querySelector('.platform-image').style.backgroundImage = `url('../../img/platforms/${platformName}.png')`;
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

// Recursively scan a directory for files with specific extensions.
// If recursive is false, only the top-level directory is scanned.
// If gamesDir is invalid, it returns an empty array.
export async function scanDirectory(gamesDir, extensions, recursive = true, ignoredDirs = ['PS3_EXTRA', 'PKGDIR', 'freezer', 'tmp']) {
    let files = [];

    // Sort extensions by longest first to prioritize multi-part matches
    const sortedExts = [...new Set(extensions)].sort((a, b) => b.length - a.length); // Dedupe and sort

    if (!gamesDir || typeof gamesDir !== 'string') {
        console.warn("scanDirectory: Invalid directory path provided:", gamesDir);
        return files;
    }

    try {
        const items = await fsp.readdir(gamesDir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(gamesDir, item.name);

            if (item.isDirectory()) {
                if (ignoredDirs.includes(item.name)) continue;
                if (recursive) files.push(...await scanDirectory(fullPath, extensions, recursive, ignoredDirs));
            } else {
                // Check if filename ENDS WITH any allowed extension (case-insensitive)
                const lowerName = item.name.toLowerCase();
                const match = sortedExts.find(ext => lowerName.endsWith(ext.toLowerCase()));
                if (match) files.push(fullPath);
            }
        }
    } catch (err) {
        console.error("Error reading directory:", gamesDir, err);
    }

    return files;
}

export function findImageFile(basePath, fileNameWithoutExt) {
    const extensions = ['png', 'jpg', 'webp'];
    let newestImage = null;
    let newestTime = 0;

    for (const extension of extensions) {
        const imagePath = path.join(basePath, `${fileNameWithoutExt}.${extension}`);
        if (fs.existsSync(imagePath)) {
            const stats = fs.statSync(imagePath);
            const mtime = stats.mtimeMs;
            if (mtime > newestTime) {
                newestTime = mtime;
                newestImage = imagePath;
            }
        }
    }

    return newestImage;
}

let progressAnimationId = null;
let currentProgressValue = 0;
let targetProgressValue = 0;
const CIRCUMFERENCE = 283; // 2 * π * 45 (radius)

// Function to smoothly show the progress indicator
export function showProgress() {
    const pie = document.getElementById('footer-progress');
    const notifications = document.getElementById('notifications');

    if (pie) {
        pie.style.opacity = 1;
        pie.style.transform = 'scale(1)';
    }

    if (notifications) {
        notifications.style.opacity = 1;
    }
}

// Function to smoothly hide the progress indicator
export function hideProgress() {
    const pie = document.getElementById('footer-progress');
    const notifications = document.getElementById('notifications');

    if (pie) {
        pie.style.opacity = 0;
        pie.style.transform = 'scale(0.9)';
    }

    if (notifications) {
        notifications.style.opacity = 0;
    }
}

// Function to reset progress to 0
export function resetProgress() {
    targetProgressValue = 0;
    currentProgressValue = 0;

    const pie = document.getElementById('footer-progress');
    if (pie) {
        const progressFill = pie.querySelector('.progress-fill');
        if (progressFill) {
            // Reset to empty circle (full dash offset) - accounting for 12 o'clock start
            progressFill.style.strokeDashoffset = CIRCUMFERENCE;
        }
    }
}

// Function to set progress directly (for immediate updates)
export function setProgressDirect(percent) {
    targetProgressValue = percent;
    currentProgressValue = percent;

    const pie = document.getElementById('footer-progress');
    if (pie) {
        const progressFill = pie.querySelector('.progress-fill');
        if (progressFill) {
            const progressOffset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
            progressFill.style.strokeDashoffset = progressOffset;
        }
    }
}

function setProgress(current, total) {
    const fill = document.getElementById('menu-progress-fill');
    const pie = document.getElementById('footer-progress');

    if (total > 0) {
        const targetPercent = (current / total) * 100;
        targetProgressValue = targetPercent;

        // Cancel any existing animation
        if (progressAnimationId) {
            cancelAnimationFrame(progressAnimationId);
        }

        // Start smooth animation towards target
        animateProgress();

        if (fill) fill.style.width = `${Math.round(targetPercent)}%`;
    }
}

function animateProgress() {
    const pie = document.getElementById('footer-progress');
    if (!pie) return;

    const progressFill = pie.querySelector('.progress-fill');
    if (!progressFill) return;

    // Smooth interpolation towards target with adaptive easing
    const diff = targetProgressValue - currentProgressValue;
    const step = diff * 0.15; // Slightly faster interpolation

    if (Math.abs(diff) < 0.05) {
        currentProgressValue = targetProgressValue;
    } else {
        currentProgressValue += step;
    }

    // Calculate stroke-dashoffset for SVG (inverted: 0% = full circle, 100% = empty circle)
    const progressOffset = CIRCUMFERENCE - (currentProgressValue / 100) * CIRCUMFERENCE;
    progressFill.style.strokeDashoffset = progressOffset;

    // Continue animation if not at target
    if (Math.abs(targetProgressValue - currentProgressValue) > 0.05) {
        progressAnimationId = requestAnimationFrame(animateProgress);
    } else {
        progressAnimationId = null;
    }
}

export async function executeBatchDownload(games, platformName) {
    // Smooth show animation
    showProgress();

    function setProgressText(newText, colorCode) {
        const text = document.getElementById('menu-progress-text');
        if (text) {
            text.classList.remove('success', 'error');
            text.classList.add(colorCode);
            text.textContent = newText;
        }
    }

    for (let i = 0; i < games.length; i++) {
        // Use direct progress update for immediate visual feedback
        setProgressDirect((i / games.length) * 100);

        const gameContainer = games[i];
        const gameName = gameContainer.dataset.gameName;

        const activePageContent = gameContainer.parentElement;

        const currentPage = document.querySelector(`div.page[data-platform="${platformName}"]`);

        console.log("currentPage.dataset.viewMode: ", currentPage.dataset.viewMode);

        let elementToPulse;

        if (currentPage.dataset.viewMode === 'grid') {
            elementToPulse = gameContainerImage;
        } else {
            elementToPulse = gameContainer;
        }

        const gameContainerImage = gameContainer.querySelector('.game-container-image');

        elementToPulse.classList.add('loading');

        setProgressText(`${gameName}`, 'none');

        try {
            const urls = await new Promise((resolve) => {
                ipcRenderer.send('fetch-images', gameName, platformName, LB.steamGridAPIKey, LB.giantBombAPIKey);
                ipcRenderer.once('image-urls', (event, urls) => resolve(urls));
            });

            if (!urls.length) {
                setProgressText(`${gameName}`, 'error');
                await new Promise(r => setTimeout(r, 100));
                continue;
            }

            setProgressText(`${gameName}`, 'success');

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
                }
            }

        } catch (err) {
            console.error(`Failed batch Dload for ${gameName}:`, err);
        }
    }

    // Set final progress to 100%
    setProgressDirect(100);
    setProgressText(`Batch download complete!`, 'success');

    // Smooth hide animation after a delay
    setTimeout(() => {
        hideProgress();
    }, 1500);
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
                    const emptyPageGameContainer = buildEmptyPageGameContainer();
                    favPage.appendChild(emptyPageGameContainer);
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

    // Find games with missing images in the current platform
    const pages = document.querySelectorAll('#galleries .page');
    const currentPlatformPage = Array.from(pages).find(page =>
        page.dataset.platform === LB.currentPlatform
    );

    console.log("LB.preferences: ", LB.preferences[LB.currentPlatform]);

    if (!LB.preferences[LB.currentPlatform].gamesDir) {
        document.getElementById('games-dir-sub-label').textContent = 'This field cannot be empty';
        return;
    }

    const gamesMissingImage = currentPlatformPage.querySelectorAll(".game-container[data-missing-image]");

    const nbOfMissingMeta = await countMissingMetaGames(currentPlatformPage);

    // Show confirmation dialog
    let confirmed;
    try {
        confirmed = await batchDialog(gamesMissingImage.length, nbOfMissingMeta);
    } catch (err) {
        // Silently catch cancel error
        return;
    }
    if (!confirmed) {
        console.info("Batch download cancelled by user");
        return;
    }

    await executeBatchDownload(gamesMissingImage, LB.currentPlatform);
}

export async function countMissingMetaGames(currentPlatformPage) {
    const gameContainers = currentPlatformPage.querySelectorAll(".game-container");

    let nbOfMissingMeta = 0;

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
            nbOfMissingMeta++;
        }
    }

    return nbOfMissingMeta;
}

export async function getPs3GameName(filePath) {
    try {
        return await ipcRenderer.invoke('parse-sfo', filePath);
    } catch (err) {
        console.error('Failed to parse SFO:', err);
        return null;
    }
}

import { PLATFORMS } from './platforms.js';
// DOM and UI utility functions

export function updateFooterControls(section, newIcon, newText, display) {
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
    footer.className = `footer-${size}`;
}

export function getSelectedGameContainer(gameContainers, selectedIndex) {
    // Direct access if index is valid
    if (selectedIndex >= 0 && selectedIndex < gameContainers.length) {
        return gameContainers[selectedIndex];
    }
    return null;
}

export function simulateTabNavigation(shiftKey = false) {
    const focusableElements = document.querySelectorAll(
        'button, input, select, textarea'
    );

    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
    let nextIndex;

    if (shiftKey) {
        // Shift+Tab - move backward
        nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    } else {
        // Tab - move forward
        nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
    }

    const nextElement = focusableElements[nextIndex];
    if (nextElement) {
        nextElement.focus();
        nextElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
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

export function stripExtensions(fileName) {
    if (!fileName || typeof fileName !== 'string') return fileName;

    const lastDot = fileName.lastIndexOf('.');
    if (lastDot <= 0) return fileName; // no dot or starts with a dot

    return fileName.substring(0, lastDot);
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

export function cleanFileName(fileName) {
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

export function handleKeyDownListeners(context) {
    const slideshow = document.getElementById('slideshow');
    const galleries = document.getElementById('galleries');
    const menu = document.getElementById('menu');
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

function getPlatformByName(platformName) {
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

    if (LB.mode === 'menu' || platformName === 'settings') {
        headerControls.style.display = 'none';
    } else {
        headerControls.style.display = 'flex';
    }

    if (platformName === 'hide') {
        header.style.display = 'none';
        return;
    }

    header.style.display = 'flex';

    const settingsPlatform = { nbGames: PLATFORMS.length, displayName:"Settings" };
    const platform = platformName === 'settings' ? settingsPlatform : getPlatformByName(platformName);

    let itemType = 'game';
    let count = platform?.nbGames;

    if (platformName === 'settings') {
        itemType = 'platform';
    }

    if (platformName === 'recents') {
        count = LB.recents.length;
    }

    if (gameName) {
        itemType = 'image';
        count = 0;
    }

    const pluralize = (count, singular, plural = `${singular}s`) =>
          count === 1 ? singular : plural;

    header.querySelector('.platform-name').textContent = gameName ? gameName : platform.displayName;
    header.querySelector('.vendor-name').textContent = platform.vendor || 'Emulsion';
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
    const imageFormats = ['jpg', 'png', 'webp'];
    for (const format of imageFormats) {
        const imagePath = path.join(basePath, `${fileNameWithoutExt}.${format}`);
        if (fs.existsSync(imagePath)) {
            return imagePath;
        }
    }
    return null;
}

function setProgress(current, total) {
    const fill = document.getElementById('menu-progress-fill');
    const pie = document.getElementById('footer-progress');

    if (total > 0) {
        const percent = Math.round((current / total) * 100);
        if (fill) fill.style.width = `${percent}%`;
        pie.style.setProperty('--p', percent);
        pie.textContent = `${percent}%`;
    }

}

export async function executeBatchDownload(games, platformName) {
    const pie = document.getElementById("footer-progress");
    pie.style.opacity = 1;

    function setProgressText(newText, colorCode) {
        const text = document.getElementById('menu-progress-text');
        if (text) {
            text.classList.remove('success', 'error');
            text.classList.add(colorCode);
            text.textContent = newText;
        }
    }

    for (let i = 0; i < games.length; i++) {
        setProgress(i + 1, games.length);

        const gameContainer = games[i];
        const gameName = gameContainer.dataset.gameName;

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
                }
            }

        } catch (err) {
            console.error(`Failed batch Dload for ${gameName}:`, err);
        }
    }

    setProgressText(`Batch download complete!`, 'success');
    pie.style.opacity = 0;
}


async function downloadImage(imgSrc, platform, gameName) {
    const gamesDir = window.LB.preferences[platform]?.gamesDir;
    if (!gamesDir) {
        console.error('No games directory found for platform:', platform);
        return null;
    }

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
        console.log("wopop: ");
        document.getElementById('games-dir-sub-label').textContent = 'This field cannot be empty';
    }


    // if (!gamesDirInput.value) {
    //     gamesDirSubLabel.textContent = 'This field cannot be empty';
    //     return;
    // }

    if (!currentPlatformPage) {
        console.error("Platform page not found");
        return;
    }

    const games = currentPlatformPage.querySelectorAll(".game-container[data-missing-image]");

    // if (!games.length) {
    //     console.warn("No games with missing images found");
    //     batchSubLabel.textContent = 'No missing images found';
    //     return;
    // }

    console.info(`Found ${games.length} games with missing images`);

    // Show confirmation dialog
    const confirmed = await showBatchConfirmationDialog(games.length);
    if (!confirmed) {
        console.info("Batch download cancelled by user");
        return;
    }

    await executeBatchDownload(games, LB.currentPlatform);
}

function showBatchConfirmationDialog(gameCount) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('batch-confirmation-overlay');

        const dialogTitle = document.getElementById('batch-dialog-title');
        const dialogText = document.getElementById('batch-dialog-text');

        dialogTitle.textContent = 'Batch Download';


        dialogText.textContent = `Found ${gameCount} missing ${getPlatformByName(LB.currentPlatform).displayName} game cover images`;

        overlay.style.display = 'flex';
        document.getElementById('batch-cancel-button').focus();

        const onOk = () => {
            cleanup();
            resolve(true);
        };

        const onCancel = () => {
            cleanup();
            resolve(false);
        };

        const onKeyDown = (event) => {
            if (event.key === 'Escape') onCancel();
        };

        const cleanup = () => {
            overlay.style.display = 'none';
            document.removeEventListener('keydown', onKeyDown);
        };

        document.getElementById('batch-ok-button').onclick = onOk;
        document.getElementById('batch-cancel-button').onclick = onCancel;
        document.addEventListener('keydown', onKeyDown);
        overlay.onclick = (e) => { if (e.target === overlay) onCancel(); };
    });
}

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

export function setFooterSize(size) {
    const footer = document.getElementById('footer');
    footer.className = `footer-${size}`;
}

export function getSelectedGameContainer(gameContainers, selectedIndex) {
    // Direct access if index is valid
    if (selectedIndex >= 0 && selectedIndex < gameContainers.length) {
        return gameContainers[selectedIndex];
    }
    return null;
}

export function simulateKeyDown(key, modifiers = {}) {
    const keyCodes = {
        ArrowLeft: 37,
        ArrowRight: 39,
        ArrowUp: 38,
        ArrowDown: 40,
        Shift: 16,
        Enter: 13,
        Escape: 27
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

    let base = fileName;
    for (let i = 0; i < 2; i++) {
        const lastDot = base.lastIndexOf('.');
        if (lastDot <= 0) break; // stop if no more extension
        base = base.substring(0, lastDot);
    }
    return base;
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

export function toggleHeaderNavLinks(display) {
    const links = document.querySelectorAll('header .pages-nav-links');

    links.forEach((link, i) => {
        link.style.opacity = display === 'show' ? 1 : 0;
    })
}

export function handleKeyDownListeners(context) {
    const slideshow = document.getElementById('slideshow');
    const galleries = document.getElementById('galleries');
    const menu = document.getElementById('menu');
}

export function toggleHeader(display) {
    document.getElementById('header').style.display = display === 'show' ? 'flex' : 'none';
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



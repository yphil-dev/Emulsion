const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const axios = require('axios');

import * as preferences from './preferences.js';
import * as theme from './theme.js';
import { systemDialog, kbShortcutsDialog } from './dialog.js';

// Make Node.js modules globally available
window.ipcRenderer = ipcRenderer;
window.path = path;
window.fs = fs;
window.fsp = fsp;
window.axios = axios;

// Create LB global object for backward compatibility
// As we migrate, we'll remove these and use direct imports instead
const LB = {
    enabledPlatforms: ['settings'],
};

// Make LB globally available for backward compatibility
window.LB = LB;


let mouseBlankerTimer = null;
let lastInputWasMouse = false;
const MOUSE_TIMEOUT = 3000;

function handleMouseInput() {
    lastInputWasMouse = true;
    showCursor();
    resetMouseTimer();
}

function handleNonMouseInput() {
    lastInputWasMouse = false;
    hideCursor(); // Immediately hide on non-mouse input
    resetMouseTimer();
}

function resetMouseTimer() {
    if (mouseBlankerTimer) clearTimeout(mouseBlankerTimer);
    mouseBlankerTimer = setTimeout(hideCursor, MOUSE_TIMEOUT);
}

function showCursor() {
    document.body.style.cursor = 'default';
    document.body.classList.remove('no-hover');
}

function hideCursor() {
    document.body.style.cursor = 'none';
    document.body.classList.add('no-hover');
}


function toggleFullScreen(elem = document.documentElement) {
    if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Initialize app data on load
async function initializeApp() {
    try {
        const appData = await preferences.loadAppData();

        // Batch assign all LB properties at once to avoid multiple property assignments
        Object.assign(LB, {
            userDataPath: appData.userDataPath,
            baseDir: appData.baseDir,
            versionNumber: appData.versionNumber,
            kioskMode: appData.kioskMode,
            autoSelect: appData.autoSelect,
            recents: appData.recents,
            favorites: appData.favorites,
            favoritesViewMode: appData.favoritesViewMode,
            recentlyPlayedViewMode: appData.recentlyPlayedViewMode,
            preferences: appData.preferences,
            galleryNumOfCols: appData.preferences.settings.numberOfColumns,
            homeMenuTheme: appData.preferences.settings.homeMenuTheme
        });

        console.log("LB.favoritesViewMode: ", LB.favoritesViewMode);

        // Start listening
        document.addEventListener('mousemove', handleMouseInput);
        document.addEventListener('mousedown', handleMouseInput);
        document.addEventListener('wheel', handleMouseInput);
        document.addEventListener('keydown', handleNonMouseInput);

        hideCursor();
        resetMouseTimer();

        document.addEventListener('keydown', (event) => {

            // if (event.key === 'F11') {
            //     // toggleFullScreen();
            // }

            if (event.key === 'F5') {
                window.location.reload();
            }

            if (event.key === '/') {
                systemDialog();
            }

            if (event.key === '?') {
                kbShortcutsDialog();
            }

            if (LB.mode === 'gallery' && window.onGalleryKeyDown) {
                window.onGalleryKeyDown(event);
            } else if (LB.mode === 'slideshow' && window.onSlideShowKeyDown) {
                window.onSlideShowKeyDown(event);
            } else if (LB.mode === 'quit' && window.onQuitKeyDown) {
                window.onQuitKeyDown(event);
            } else if (LB.mode === 'menu' && window.onMenuKeyDown) {
                window.onMenuKeyDown(event);
            } else if (LB.mode === 'metaEdit' && window.onMetaEditKeyDown) {
                window.onMetaEditKeyDown(event);
            } else if (LB.mode === 'gameMenu' && window.onGalleryKeyDown) {
                window.onGalleryKeyDown(event);
            } else if (LB.mode === 'kbHelp' && window.onKBHelpKeyDown) {
                window.onKBHelpKeyDown(event);
            } else if (LB.mode === 'systemDialog' && window.onSystemDialogKeyDown) {
                window.onSystemDialogKeyDown(event);
            }
        });

        console.log('App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        throw error;
    }
}

// Font loading check and initialization
function ensureFontsLoaded() {
    return new Promise((resolve) => {
        // Check if ForkAwesome font is loaded
        const testElement = document.createElement('i');
        testElement.className = 'fa fa-check';
        testElement.style.position = 'absolute';
        testElement.style.left = '-9999px';
        testElement.style.fontFamily = 'ForkAwesome';
        document.body.appendChild(testElement);

        // Check font loading status
        const computedStyle = window.getComputedStyle(testElement);
        const fontFamily = computedStyle.getPropertyValue('font-family');

        if (fontFamily.includes('ForkAwesome') || fontFamily.includes('forkawesome')) {
            // Font is loaded
            document.body.removeChild(testElement);
            resolve();
        } else {
            // Wait for font to load
            const checkFont = () => {
                const style = window.getComputedStyle(testElement);
                const family = style.getPropertyValue('font-family');
                if (family.includes('ForkAwesome') || family.includes('forkawesome')) {
                    document.body.removeChild(testElement);
                    resolve();
                } else {
                    setTimeout(checkFont, 50);
                }
            };
            checkFont();
        }
    });
}

// Auto-initialize when module loads with font check
ensureFontsLoaded().then(() => {
    console.log('ForkAwesome icons are ready');
    initializeApp();
}).catch((error) => {
    console.warn('Font loading check failed, initializing anyway:', error);
    initializeApp();
});

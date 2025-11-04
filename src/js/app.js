const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const axios = require('axios');

import * as preferences from './preferences.js';
import { systemDialog, helpDialog } from './dialog.js';
import { applyTheme, setFooterSize, initFooterControls } from './utils.js';
import { buildHomeSlide, initSlideShow, initGallery, initGamepad } from './slideshow.js';
import { loadPreferences } from './preferences.js';
import { buildGalleries } from './gallery.js';

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

async function initializeApp() {
    try {
        // Load all app data and preferences in one call
        const appData = await preferences.loadAppData();

        // Load SVG symbols
        fetch('../html/svg-symbols.html').then(res => res.text()).then(html => document.body.insertAdjacentHTML('afterbegin', html)).catch(console.error);

        // Initialize gamepad and footer controls
        initGamepad();
        initFooterControls();

        // Load preferences for UI initialization
        const uiPreferences = await loadPreferences();

        // Batch assign ALL LB properties at once to avoid multiple property assignments and concurrency issues
        Object.assign(LB, {
            // App data properties
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

            // UI preference properties
            steamGridAPIKey: uiPreferences.settings.steamGridAPIKey,
            giantBombAPIKey: uiPreferences.settings.giantBombAPIKey,
            footerSize: uiPreferences.settings.footerSize,
            theme: uiPreferences.settings.theme,
            disabledPlatformsPolicy: uiPreferences.settings.disabledPlatformsPolicy,
            recentlyPlayedPolicy: uiPreferences.settings.recentlyPlayedPolicy,
            favoritesPolicy: uiPreferences.settings.favoritesPolicy,
            favoritePendingAction: null,
            startupDialogPolicy: uiPreferences.settings.startupDialogPolicy,
            launchDialogPolicy: uiPreferences.settings.launchDialogPolicy
        });

        LB.batchRunning = false;

        setFooterSize(LB.footerSize);
        applyTheme(LB.theme);

        document.addEventListener('mousemove', handleMouseInput);
        document.addEventListener('mousedown', handleMouseInput);
        document.addEventListener('wheel', handleMouseInput);
        document.addEventListener('keydown', handleNonMouseInput);

        hideCursor();
        resetMouseTimer();

        // Set up keyboard shortcuts
        document.addEventListener('keydown', async (event) => {
            if (event.key === 'F11') {
                ipcRenderer.invoke('toggle-fullscreen');
            }

            if (event.key === 'F5') {
                window.location.reload();
            }

            if (event.key === '/') {
                systemDialog();
            }

            if (event.key === '?') {
                await helpDialog('shortcuts');
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
            } else if (LB.mode === 'launchGame' && window.onLaunchGameKeyDown) {
                window.onLaunchGameKeyDown(event);
            } else if (LB.mode === 'downloadMetaDialog' && window.onDownloadMetaKeyDown) {
                window.onDownloadMetaKeyDown(event);
            }
        });

        // Build galleries and initialize UI
        return buildGalleries(uiPreferences, LB.userDataPath)
            .then((platforms) => {
                LB.totalNumberOfPlatforms = platforms.length - 1;

                const slideshow = document.getElementById("slideshow");

                // Build home slides in parallel for better performance
                const homeSlidePromises = platforms.map((platform) => {
                    return new Promise((resolve) => {
                        const homeSlide = buildHomeSlide(platform, uiPreferences);
                        if (homeSlide) {
                            slideshow.appendChild(homeSlide);
                        }
                        resolve();
                    });
                });

                return Promise.all(homeSlidePromises).then(() => {

                    document.getElementById('galleries').style.display = 'none';
                    document.getElementById("splash").remove();
                    document.getElementById("main").style.display = 'flex';
                    document.getElementById("footer").style.display = 'flex';

                    if (LB.autoSelect && LB.enabledPlatforms.some(platform => platform === LB.autoSelect)) {
                        initGallery(LB.autoSelect);
                    } else {
                        initSlideShow(0);
                    }

                    // Show startup dialog if configured
                    if (LB.startupDialogPolicy === 'show') {
                        return helpDialog('quickstart');
                    }
                });
            });

    } catch (error) {
        console.error('Failed to initialize app:', error);
        throw error;
    }
}

function ensureFontsLoaded() {
    return new Promise((resolve) => {
        document.fonts.ready
            .then(() => {
                resolve();
            });
    });
}

ensureFontsLoaded()
    .then(() => {
        document.getElementById('splash').classList.add('show');
        return initializeApp();
    })
    .then(() => console.log('App fully initialized successfully'));

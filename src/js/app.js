const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const axios = require('axios');

import * as preferences from './preferences.js';
import * as theme from './theme.js';

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

// Initialize app data on load
async function initializeApp() {
    try {
        const appData = await preferences.loadAppData();

        LB.userDataPath = appData.userDataPath;
        LB.baseDir = appData.baseDir;
        LB.versionNumber = appData.versionNumber;
        LB.kioskMode = appData.kioskMode;
        LB.autoSelect = appData.autoSelect;
        LB.recents = appData.recents;
        LB.preferences = appData.preferences;
        LB.galleryNumOfCols = appData.preferences.settings.numberOfColumns;
        LB.homeMenuTheme = appData.preferences.settings.homeMenuTheme;

        document.addEventListener('keydown', (event) => {
            if (LB.mode === 'gallery' && window.onGalleryKeyDown) {
                window.onGalleryKeyDown(event);
            } else if (LB.mode === 'slideshow' && window.onSlideShowKeyDown) {
                window.onSlideShowKeyDown(event);
            } else if (LB.mode === 'quit' && window.onQuitKeyDown) {
                window.onQuitKeyDown(event);
            } else if (LB.mode === 'menu' && window.onMenuKeyDown) {
                window.onMenuKeyDown(event);
            }
        });

        console.log('App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        throw error;
    }
}

// Auto-initialize when module loads
initializeApp();

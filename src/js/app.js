// Main application entry point - ES6 Module
// This replaces init.js and provides backward compatibility during migration

const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const axios = require('axios');
import { PLATFORMS, getPlatformInfo } from './platforms.js';

// Import all modules
import * as utils from './utils.js';
import * as preferences from './preferences.js';
import * as theme from './theme.js';

// Make Node.js modules globally available (required by existing code)
window.ipcRenderer = ipcRenderer;
window.path = path;
window.fs = fs;
window.fsp = fsp;
window.axios = axios;

// Create LB global object for backward compatibility
// As we migrate, we'll remove these and use direct imports instead
const LB = {
    enabledPlatforms: ['settings'],
    isMenuOpen: false,

    // Expose preferences functions
    prefs: {
        load: preferences.loadPreferences,
        save: preferences.updatePreference,
        getValue: preferences.getPlatformPreference
    }
};

// Make LB globally available for backward compatibility
window.LB = LB;

// Create a promise that other scripts can wait for
let initResolve;
LB.initialized = new Promise((resolve) => {
    initResolve = resolve;
});

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

        console.log('App initialized successfully');
        initResolve(); // Signal that initialization is complete
    } catch (error) {
        console.error('Failed to initialize app:', error);
        throw error;
    }
}

// Auto-initialize when module loads
initializeApp();

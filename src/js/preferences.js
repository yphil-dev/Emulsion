// Preferences management

// All the libs used are required here
const { ipcRenderer } = require('electron');
const path = require('path');

async function _loadUserData() {
    try {
        const preferences = await ipcRenderer.invoke('load-preferences');

        const userDataPath = preferences.userDataPath;
        const baseDir = path.resolve(preferences.appPath);
        const versionNumber = preferences.versionNumber;
        const kioskMode = preferences.kioskMode;
        const autoSelect = preferences.autoSelect;
        const recents = preferences.recents;

        console.log("autoSelect: ", autoSelect);

        delete preferences.userDataPath;
        delete preferences.appPath;
        delete preferences.versionNumber;
        delete preferences.kioskMode;
        delete preferences.autoSelect;
        delete preferences.recents;

        return {
            preferences,
            userDataPath,
            baseDir,
            versionNumber,
            kioskMode,
            autoSelect,
            recents
        };
    } catch (error) {
        console.error("Failed to load preferences:", error);
        window.location.reload();
        throw error;
    }
}

export async function loadPreferences() {
    try {
        const data = await _loadUserData();
        return data.preferences;
    } catch (error) {
        console.error("Error loading preferences:", error);
        throw error;
    }
}

export async function loadAppData() {
    try {
        return await _loadUserData();
    } catch (error) {
        console.error("Error loading app data:", error);
        throw error;
    }
}

export async function updatePreference(platformName, key, value) {
    console.log("platformName, key, value: ", platformName, key, value);
    try {
        const preferences = await loadPreferences();

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
        throw error;
    }
}

export async function getPreference(platformName, key) {
    try {
        const preferences = await loadPreferences();

        if (!preferences[platformName]) {
            throw new Error(`Platform "${platformName}" not found in preferences.`);
        }

        if (preferences[platformName][key] === undefined) {
            throw new Error(`Key "${key}" not found for platform "${platformName}".`);
        }

        return preferences[platformName][key];
    } catch (error) {
        console.error('Error getting platform preference:', error);
        throw error;
    }
}

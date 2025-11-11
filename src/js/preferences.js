import { PLATFORMS } from './platforms.js';

async function loadUserData() {
    try {
        const response = await ipcRenderer.invoke('load-preferences');

        const userDataPath = response.userDataPath;
        const baseDir = window.path.resolve(response.appPath);
        const versionNumber = response.versionNumber;
        const kioskMode = response.kioskMode;
        const autoSelect = response.autoSelect;
        const recents = response.recents;
        const favorites = response.favorites;
        const preferencesError = response.preferencesError;

        const preferences = { ...response };
        delete preferences.userDataPath;
        delete preferences.appPath;
        delete preferences.versionNumber;
        delete preferences.kioskMode;
        delete preferences.autoSelect;
        delete preferences.recents;
        delete preferences.favorites;
        delete preferences.preferencesError;

        return {
            preferences,
            userDataPath,
            baseDir,
            versionNumber,
            kioskMode,
            autoSelect,
            recents,
            favorites,
            preferencesError
        };
    } catch (error) {
        console.error("Failed to load preferences:", error);
        window.location.reload();
        throw error;
    }
}

export async function loadPreferences() {
    try {
        const data = await loadUserData();
        return data.preferences;
    } catch (error) {
        console.error("Error loading preferences:", error);
        throw error;
    }
}

export async function loadAppData() {
    try {
        return await loadUserData();
    } catch (error) {
        console.error("Error loading app data:", error);
        throw error;
    }
}

export async function updatePreference(platformName, key, value) {
    try {
        const preferences = await loadPreferences();

        if (preferences[platformName][key] === value) {
            return null;
        }

        preferences[platformName][key] = value;

        await ipcRenderer.invoke('save-preferences', preferences);

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

export function incrementNbGames(platformName) {
    const platform = PLATFORMS.find(p => p.name === platformName);
    if (platform) {
        platform.nbGames++;
    } else {
        console.warn(`Platform not found: ${platformName}`);
    }
}

// SINGLE SOURCE OF TRUTH - Platforms definition
// This is the only place where platforms are defined!
export const PLATFORMS = [
    { nbGames: 0, display: "grid", displayName: "2600+", vendor: "Atari", name: "atari", extensions: [".zip"] },
    { nbGames: 0, display: "grid", displayName: "GX4000 / CPC", vendor: "Amstrad", name: "amstrad", extensions: [".zip"] },
    { nbGames: 0, display: "grid", displayName: "ZX Spectrum", vendor: "Sinclair", name: "spectrum", extensions: [".zip"] },
    { nbGames: 0, display: "grid", displayName: "C-64", vendor: "Commodore", name: "c64", extensions: [".zip"] },
    { nbGames: 0, display: "grid", displayName: "NES", vendor: "Nintendo", name: "nes", extensions: [".zip"] },
    { nbGames: 0, display: "grid", displayName: "Master System", vendor: "Sega", name: "sms", extensions: [".zip"] },
    { nbGames: 0, display: "grid", displayName: "PC Engine", vendor: "NEC", name: "pcengine", extensions: [".pce"] },
    { nbGames: 0, display: "grid", displayName: "Amiga", vendor: "Commodore", name: "amiga", extensions: [".lha", ".adf"] },
    { nbGames: 0, display: "grid", displayName: "Mega Drive", vendor: "Sega", name: "megadrive", extensions: [".md"] },
    { nbGames: 0, display: "grid", displayName: "Game Boy", vendor: "Nintendo", name: "gameboy", extensions: [".md"] },
    { nbGames: 0, display: "grid", displayName: "Lynx", vendor: "Atari", name: "lynx", extensions: [".md"] },
    { nbGames: 0, display: "grid", displayName: "Game Gear", vendor: "Sega", name: "gamegear", extensions: [".zip"] },
    { nbGames: 0, display: "grid", displayName: "SNES", vendor: "Nintendo", name: "snes", extensions: [".smc"] },
    { nbGames: 0, display: "grid", displayName: "Jaguar", vendor: "Atari", name: "jaguar", extensions: [".jag"] },
    { nbGames: 0, display: "grid", displayName: "Saturn", vendor: "Sega", name: "saturn", extensions: [".cue"] },
    { nbGames: 0, display: "grid", displayName: "PlayStation", vendor: "Sony", name: "ps1", extensions: [".cue"] },
    { nbGames: 0, display: "grid", displayName: "Nintendo 64", vendor: "Nintendo", name: "n64", extensions: [".z64"] },
    { nbGames: 0, display: "grid", displayName: "Dreamcast", vendor: "Sega", name: "dreamcast", extensions: [".gdi", ".cdi"] },
    { nbGames: 0, display: "grid", displayName: "PlayStation 2", vendor: "Sony", name: "ps2", extensions: [".bin", ".iso"] },
    { nbGames: 0, display: "grid", displayName: "GameCube", vendor: "Nintendo", name: "gamecube", extensions: [".iso", ".ciso"] },
    { nbGames: 0, display: "grid", displayName: "Xbox", vendor: "Microsoft", name: "xbox", extensions: [".iso"] },
    { nbGames: 0, display: "grid", displayName: "PSP", vendor: "Sony", name: "psp", extensions: [".iso"] },
    { nbGames: 0, display: "grid", displayName: "PlayStation 3", vendor: "Sony", name: "ps3", extensions: [".SFO"] },
    { nbGames: 0, display: "grid", displayName: "3DS", vendor: "Nintendo", name: "3ds", extensions: [".3ds"] },
    { nbGames: 0, display: "grid", displayName: "Xbox 360", vendor: "Microsoft", name: "xbox360", extensions: [".iso", ".xex"] },
    { nbGames: 0, display: "grid", displayName: "PlayStation 4", vendor: "Sony", name: "ps4", extensions: [".iso"] }
];

export function getPlatformInfo(platformName) {
    // Find platform info from PLATFORMS array
    const platform = PLATFORMS.find(p => p.name === platformName);
    if (platform) {
        return {
            vendor: platform.vendor,
            name: platform.displayName,
            index: PLATFORMS.indexOf(platform) + 1  // +1 because settings is index 0
        };
    }

    // Fallback for settings and recents
    if (platformName === 'settings') {
        return { vendor: 'Emulsion', name: 'Settings', index: 0 };
    }

    if (platformName === 'recents') {
        return { vendor: 'Emulsion', name: 'Recents', index: PLATFORMS.length + 1 };
    }

    if (platformName === 'favorites') {
        return { vendor: 'Emulsion', name: 'Favorites', index: PLATFORMS.length + 2 };
    }

    // Final fallback
    return { vendor: platformName, name: platformName, index: -1 };
}

// For CommonJS compatibility (Node.js/Electron main process)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PLATFORMS,
        getPlatformInfo
    };
}

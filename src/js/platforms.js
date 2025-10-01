// SINGLE SOURCE OF TRUTH - Platforms definition
const PLATFORMS = [
    { name: "atari", vendor: "Atari", displayName: "2600", extensions: [".zip"], nbGames: 0 },
    { name: "spectrum", vendor: "Sinclair", displayName: "ZX Spectrum", extensions: [".zip"], nbGames: 0 },
    { name: "c64", vendor: "Commodore", displayName: "Commodore 64", extensions: [".zip"], nbGames: 0 },
    { name: "nes", vendor: "Nintendo", displayName: "NES", extensions: [".zip"], nbGames: 0 },
    { name: "sms", vendor: "Sega", displayName: "Master System", extensions: [".zip"], nbGames: 0 },
    { name: "pcengine", vendor: "NEC", displayName: "PC Engine", extensions: [".pce"], nbGames: 0 },
    { name: "amiga", vendor: "Commodore", displayName: "Amiga", extensions: [".lha", ".adf"], nbGames: 0 },
    { name: "megadrive", vendor: "Sega", displayName: "Mega Drive", extensions: [".md"], nbGames: 0 },
    { name: "gameboy", vendor: "Nintendo", displayName: "Game Boy", extensions: [".md"], nbGames: 0 },
    { name: "lynx", vendor: "Atari", displayName: "Lynx", extensions: [".md"], nbGames: 0 },
    { name: "gamegear", vendor: "Sega", displayName: "Game Gear", extensions: [".zip"], nbGames: 0 },
    { name: "snes", vendor: "Nintendo", displayName: "SNES", extensions: [".smc"], nbGames: 0 },
    { name: "jaguar", vendor: "Atari", displayName: "Jaguar", extensions: [".jag"], nbGames: 0 },
    { name: "saturn", vendor: "Sega", displayName: "Saturn", extensions: [".cue"], nbGames: 0 },
    { name: "psx", vendor: "Sony", displayName: "PlayStation", extensions: [".cue"], nbGames: 0 },
    { name: "n64", vendor: "Nintendo", displayName: "Nintendo 64", extensions: [".z64"], nbGames: 0 },
    { name: "dreamcast", vendor: "Sega", displayName: "Dreamcast", extensions: [".gdi", ".cdi"], nbGames: 0 },
    { name: "ps2", vendor: "Sony", displayName: "PlayStation 2", extensions: [".bin", ".iso"], nbGames: 0 },
    { name: "gamecube", vendor: "Nintendo", displayName: "GameCube", extensions: [".iso", ".ciso"], nbGames: 0 },
    { name: "xbox", vendor: "Microsoft", displayName: "Xbox", extensions: [".iso"], nbGames: 0 },
    { name: "psp", vendor: "Sony", displayName: "PSP", extensions: [".iso"], nbGames: 0 },
    { name: "ps3", vendor: "Sony", displayName: "PlayStation 3", extensions: [".SFO"], nbGames: 0 },
    { name: "3ds", vendor: "Nintendo", displayName: "3DS", extensions: [".3ds"], nbGames: 0 },
    { name: "xbox360", vendor: "Microsoft", displayName: "Xbox 360", extensions: [".iso", ".xex"], nbGames: 0 },
    { name: "ps4", vendor: "Sony", displayName: "PlayStation 4", extensions: [".iso"], nbGames: 0 }
];

function getPlatformInfo(platformName) {
    // Find platform info from PLATFORMS array
    const platform = PLATFORMS.find(p => p.name === platformName);
    if (platform) {
        return { vendor: platform.vendor,
                 name: platform.displayName
               };
    }

    // Fallback for settings and recents
    if (platformName === 'settings') {
        return { vendor: 'Emulsion', name: 'Settings' };
    }
    if (platformName === 'recents') {
        return { vendor: 'Emulsion', name: 'Recents' };
    }

    // Final fallback
    return { vendor: platformName, name: platformName };
}

// Integrate with existing LB global object
if (typeof LB !== 'undefined') {
    LB.platforms = {
        PLATFORMS,
        getPlatformInfo
    };
} else {
    // Fallback for CommonJS if needed
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            PLATFORMS,
            getPlatformInfo
        };
    }
}

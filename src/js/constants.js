// Platform information and constants

export function getPlatformInfo(name) {
    const platforms = {
        'settings': { name: 'Settings', vendor: 'Emulsion', index: 0 },
        'atari': { name: '2600 +', vendor: 'Atari', index: 1 },
        'spectrum': { name: 'ZX Spectrum', vendor: 'Sinclair', index: 2 },
        'c64': { name: 'C64', vendor: 'Commodore', index: 3 },
        'nes': { name: 'NES', vendor: 'Nintendo', index: 4 },
        'sms': { name: 'Master System', vendor: 'Sega', index: 5 },
        'pcengine': { name: 'PC Engine', vendor: 'NEC', index: 6 },
        'amiga': { name: 'Amiga', vendor: 'Commodore', index: 7 },
        'megadrive': { name: 'Megadrive', vendor: 'Sega', index: 8 },
        'gameboy': { name: 'Game Boy', vendor: 'Nintendo', index: 9 },
        'lynx': { name: 'Lynx', vendor: 'Atari', index: 10 },
        'gamegear': { name: 'Game Gear', vendor: 'Sega', index: 11 },
        'snes': { name: 'SNES', vendor: 'Nintendo', index: 12 },
        'jaguar': { name: 'Jaguar', vendor: 'Atari', index: 13 },
        'saturn': { name: 'Saturn', vendor: 'Sega', index: 14 },
        'psx': { name: 'PlayStation', vendor: 'Sony', index: 15 },
        'n64': { name: 'Nintendo64', vendor: 'Nintendo', index: 16 },
        'dreamcast': { name: 'Dreamcast', vendor: 'Sega', index: 17 },
        'ps2': { name: 'PlayStation 2', vendor: 'Sony', index: 18 },
        'gamecube': { name: 'GameCube', vendor: 'Nintendo', index: 19 },
        'xbox': { name: 'X-Box', vendor: 'Microsoft', index: 20 },
        'psp': { name: 'PS Portable', vendor: 'Sony', index: 21 },
        'ps3': { name: 'PlayStation 3', vendor: 'Sony', index: 22 },
        '3ds': { name: '3/DS', vendor: 'Nintendo', index: 23 },
        'xbox360': { name: 'X-Box 360', vendor: 'Microsoft', index: 24 },
        'ps4': { name: 'PlayStation 4', vendor: 'Sony', index: 25 },
        'recents': { name: 'Recents', vendor: 'Emulsion', index: 26 }
    };
    // Return the platform info if found, otherwise return the original name and no vendor
    return platforms[name] || { name: name, vendor: '' };
}

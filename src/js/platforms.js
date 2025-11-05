// SINGLE SOURCE OF TRUTH - Platforms definition
// This is the only place where platforms are defined!
export const PLATFORMS = [
    {
        nbGames: 0,
        display: "grid",
        displayName: "2600+",
        vendor: "Atari",
        name: "atari",
        extensions: [".zip"],
        emulators: [
            { name: "stella", flatpak: "org.stella.Stella" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "GX4000 / CPC",
        vendor: "Amstrad",
        name: "amstrad",
        extensions: [".dsk", ".cpr"],
        emulators: [
            { name: "caprice32", flatpak: null },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "javacpc", flatpak: null },
            { name: "mame", flatpak: "org.mamedev.MAME" },
            { name: "arnold", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "ZX Spectrum",
        vendor: "Sinclair",
        name: "spectrum",
        extensions: [".zip"],
        emulators: [
            { name: "fuse", flatpak: null },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "spectaculator", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "C-64",
        vendor: "Commodore",
        name: "c64",
        extensions: [".zip"],
        emulators: [
            { name: "vice", flatpak: null },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "frodo", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "NES",
        vendor: "Nintendo",
        name: "nes",
        extensions: [".zip"],
        emulators: [
            { name: "nestopia", flatpak: "ca._0ldsk00l.Nestopia" },
            { name: "fceux", flatpak: null },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "mesen", flatpak: "com.mesen.Mesen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Master System",
        vendor: "Sega",
        name: "sms",
        extensions: [".zip"],
        emulators: [
            { name: "kega-fusion", flatpak: null },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "osmose", flatpak: null },
            { name: "dgen", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "PC Engine",
        vendor: "NEC",
        name: "pcengine",
        extensions: [".pce"],
        emulators: [
            { name: "mednafen", flatpak: "com.mednafen.Mednafen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "ootake", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Amiga",
        vendor: "Commodore",
        name: "amiga",
        extensions: [".lha", ".adf"],
        emulators: [
            { name: "fs-uae", flatpak: null },
            { name: "winuae", flatpak: null },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "emux", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Mega Drive",
        vendor: "Sega",
        name: "megadrive",
        extensions: [".md"],
        emulators: [
            { name: "kega-fusion", flatpak: null },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "blastem", flatpak: null },
            { name: "genesis-plus-gx", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Game Boy",
        vendor: "Nintendo",
        name: "gameboy",
        extensions: [".md"],
        emulators: [
            { name: "mgba", flatpak: "io.mgba.mGBA" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "vba-m", flatpak: null },
            { name: "gambatte", flatpak: null },
            { name: "bgb", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Lynx",
        vendor: "Atari",
        name: "lynx",
        extensions: [".md"],
        emulators: [
            { name: "mednafen", flatpak: "com.mednafen.Mednafen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "handy", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Game Gear",
        vendor: "Sega",
        name: "gamegear",
        extensions: [".zip"],
        emulators: [
            { name: "kega-fusion", flatpak: null },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "osmose", flatpak: null },
            { name: "genesis-plus-gx", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "SNES",
        vendor: "Nintendo",
        name: "snes",
        extensions: [".smc"],
        emulators: [
            { name: "snes9x", flatpak: "com.snes9x.Snes9x" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "bsnes", flatpak: null },
            { name: "higan", flatpak: null },
            { name: "zsnes", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Jaguar",
        vendor: "Atari",
        name: "jaguar",
        extensions: [".jag"],
        emulators: [
            { name: "virtual-jaguar", flatpak: null },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "project-tempest", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Saturn",
        vendor: "Sega",
        name: "saturn",
        extensions: [".cue"],
        emulators: [
            { name: "mednafen", flatpak: "com.mednafen.Mednafen" },
            { name: "yabause", flatpak: null },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "kronos", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "PlayStation",
        vendor: "Sony",
        name: "ps1",
        extensions: [".cue"],
        emulators: [
            { name: "duckstation", flatpak: "org.duckstation.DuckStation" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "pcsx-r", flatpak: "net.pcsxr.PCSXR" },
            { name: "mednafen", flatpak: "com.mednafen.Mednafen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Nintendo 64",
        vendor: "Nintendo",
        name: "n64",
        extensions: [".z64"],
        emulators: [
            { name: "mupen64plus", flatpak: null },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "project64", flatpak: null },
            { name: "simple64", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Dreamcast",
        vendor: "Sega",
        name: "dreamcast",
        extensions: [".gdi", ".cdi"],
        emulators: [
            { name: "flycast", flatpak: null },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" },
            { name: "redream", flatpak: null },
            { name: "nulldc", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "PlayStation 2",
        vendor: "Sony",
        name: "ps2",
        extensions: [".bin", ".iso"],
        emulators: [
            { name: "pcsx2", flatpak: "net.pcsx2.PCSX2" },
            { name: "play!", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "GameCube",
        vendor: "Nintendo",
        name: "gamecube",
        extensions: [".iso", ".ciso"],
        emulators: [
            { name: "dolphin", flatpak: "org.DolphinEmu.dolphin-emu" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Xbox",
        vendor: "Microsoft",
        name: "xbox",
        extensions: [".iso"],
        emulators: [
            { name: "xemu", flatpak: "app.xemu.xemu" },
            { name: "cxbx-reloaded", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "PSP",
        vendor: "Sony",
        name: "psp",
        extensions: [".iso"],
        emulators: [
            { name: "ppsspp", flatpak: "org.ppsspp.PPSSPP" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "PlayStation 3",
        vendor: "Sony",
        name: "ps3",
        extensions: [".SFO"],
        emulators: [
            { name: "rpcs3", flatpak: "net.rpcs3.RPCS3" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "3DS",
        vendor: "Nintendo",
        name: "3ds",
        extensions: [".3ds"],
        emulators: [
            { name: "citra", flatpak: "org.citra_emu.citra" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Xbox 360",
        vendor: "Microsoft",
        name: "xbox360",
        extensions: [".iso", ".xex"],
        emulators: [
            { name: "xenia", flatpak: null }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "PlayStation 4",
        vendor: "Sony",
        name: "ps4",
        extensions: [".iso"],
        emulators: [
            { name: "fpPS4", flatpak: null },
            { name: "spine", flatpak: null }
        ]
    }
];

export function getPlatformInfo(platformName) {
    // Find platform info from PLATFORMS array
    const platform = PLATFORMS.find(p => p.name === platformName);
    if (platform) {
        return {
            vendor: platform.vendor,
            name: platform.displayName,
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

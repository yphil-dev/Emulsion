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
            { name: "stella", flatpak: "org.stella.Stella", args: "--fullscreen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" }
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
            { name: "caprice32", flatpak: null, args: "--fullscreen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "javacpc", flatpak: null, args: "" },
            { name: "mame", flatpak: "org.mamedev.MAME", args: "-nowindow" },
            { name: "arnold", flatpak: null, args: "" }
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
            { name: "fuse", flatpak: null, args: "--full-screen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "spectaculator", flatpak: null, args: "" }
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
            { name: "vice", flatpak: null, args: "-fullscreen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "frodo", flatpak: null, args: "" }
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
            { name: "nestopia", flatpak: "ca._0ldsk00l.Nestopia", args: "--fullscreen" },
            { name: "fceux", flatpak: null, args: "--fullscreen 1" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "mesen", flatpak: "com.mesen.Mesen", args: "--fullscreen" }
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
            { name: "kega-fusion", flatpak: null, args: "-fullscreen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "osmose", flatpak: null, args: "" },
            { name: "dgen", flatpak: null, args: "-f" }
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
            { name: "mednafen", flatpak: "com.mednafen.Mednafen", args: "-fs 1" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "ootake", flatpak: null, args: "" }
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
            { name: "fs-uae", flatpak: null, args: "--fullscreen" },
            { name: "winuae", flatpak: null, args: "-f" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "emux", flatpak: null, args: "" }
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
            { name: "kega-fusion", flatpak: null, args: "-fullscreen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "blastem", flatpak: null, args: "-m gen -f" },
            { name: "genesis-plus-gx", flatpak: null, args: "" }
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
            { name: "mgba", flatpak: "io.mgba.mGBA", args: "-f" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "vba-m", flatpak: null, args: "--fullscreen" },
            { name: "gambatte", flatpak: null, args: "" },
            { name: "bgb", flatpak: null, args: "" }
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
            { name: "mednafen", flatpak: "com.mednafen.Mednafen", args: "-fs 1" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "handy", flatpak: null, args: "--fullscreen" }
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
            { name: "kega-fusion", flatpak: null, args: "-fullscreen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "osmose", flatpak: null, args: "" },
            { name: "genesis-plus-gx", flatpak: null, args: "" }
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
            { name: "snes9x", flatpak: "com.snes9x.Snes9x", args: "--fullscreen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "bsnes", flatpak: null, args: "--fullscreen" },
            { name: "higan", flatpak: null, args: "--fullscreen" },
            { name: "zsnes", flatpak: null, args: "-m" }
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
            { name: "virtual-jaguar", flatpak: null, args: "--fullscreen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "project-tempest", flatpak: null, args: "" }
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
            { name: "mednafen", flatpak: "com.mednafen.Mednafen", args: "-fs 1" },
            { name: "yabause", flatpak: null, args: "-f" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "kronos", flatpak: null, args: "--fullscreen" }
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
            { name: "duckstation", flatpak: "org.duckstation.DuckStation", args: "-fullscreen -nogui" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "pcsx-r", flatpak: "net.pcsxr.PCSXR", args: "-nogui -cdfile" },
            { name: "mednafen", flatpak: "com.mednafen.Mednafen", args: "-fs 1" }
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
            { name: "mupen64plus", flatpak: null, args: "--fullscreen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "project64", flatpak: null, args: "--fullscreen" },
            { name: "simple64", flatpak: null, args: "--fullscreen" }
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
            { name: "flycast", flatpak: null, args: "--fullscreen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" },
            { name: "redream", flatpak: null, args: "--fullscreen" },
            { name: "nulldc", flatpak: null, args: "-config nullDC_GUI:Fullscreen=1" }
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
            { name: "pcsx2", flatpak: "net.pcsx2.PCSX2", args: "-nogui -fullscreen" },
            { name: "play!", flatpak: null, args: "--fullscreen" }
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
            { name: "dolphin", flatpak: "org.DolphinEmu.dolphin-emu", args: "-b -e" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" }
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
            { name: "xemu", flatpak: "app.xemu.xemu", args: "-full-screen -dvd_path" },
            { name: "cxbx-reloaded", flatpak: null, args: "--fullscreen" }
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
            { name: "ppsspp", flatpak: "org.ppsspp.PPSSPP", args: "--fullscreen" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" }
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
            { name: "rpcs3", flatpak: "net.rpcs3.RPCS3", args: "--no-gui" }
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
            { name: "citra", flatpak: "org.citra_emu.citra", args: "-f" },
            { name: "retroarch", flatpak: "org.libretro.RetroArch", args: "-f" }
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
            { name: "xenia", flatpak: null, args: "--fullscreen" }
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
            { name: "fpPS4", flatpak: null, args: "--fullscreen" },
            { name: "spine", flatpak: null, args: "--fullscreen" }
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

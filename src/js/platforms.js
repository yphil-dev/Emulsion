export const PLATFORMS = [
    {
        nbGames: 0,
        display: "grid",
        displayName: "2600 / +",
        vendor: "Atari",
        name: "atari",
        extensions: [".bin", ".a26", ".rom", ".gz", ".xex", ".xfd", ".atr", ".dcm", ".cas" ],
        sortGamesBy: "name",
        emulators: [
            { name: "ARES", flatpak: "dev.ares.ares", scoop: "games/ares", url: "https://ares-emu.net/", args: "--fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "GX4000 / CPC",
        vendor: "Amstrad",
        name: "amstrad",
        extensions: [".dsk", ".cpr", ".tap", ".cdt", ".m3u"],
        sortGamesBy: "name",
        emulators: [
            { name: "Caprice32", flatpak: null, scoop: null, args: "", url: "https://github.com/ColinPitrat/caprice32" },
            { name: "Caprice33", flatpak: null, scoop: null, args: "", url: "https://github.com/ColinPitrat/caprice32" },
            { name: "xcpc", flatpak: null, scoop: null, args: "--keyboard=english", url: "https://www.xcpc-emulator.net/" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "ZX / Spectrum",
        vendor: "Sinclair",
        name: "spectrum",
        extensions: [".tzx", ".tap", ".z80", ".sna", ".dsk", ".trd", ".scl", ".rom", ".zip"],
        sortGamesBy: "name",
        emulators: [
            { name: "Fuse", flatpak: "net.sourceforge.fuse_emulator.Fuse", scoop: "games/fuse", url: "https://fuse-emulator.sourceforge.net/", args: "--sound --auto-load" },
            { name: "ARES", flatpak: "dev.ares.ares", scoop: "games/ares", url: "https://ares-emu.net/", args: "--fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "C / 64",
        vendor: "Commodore",
        name: "c64",
        extensions: [".tzx", ".tap", ".z80", ".sna", ".dsk"],
        sortGamesBy: "name",
        emulators: [
            { name: "VICE", flatpak: "net.sf.VICE", scoop: "games/vice", url:"https://vice-emu.sourceforge.io/", args: "-fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "NES",
        vendor: "Nintendo",
        name: "nes",
        extensions: [".zip", ".nes", ".fds", ".unif"],
        sortGamesBy: "name",
        emulators: [
            { name: "Nestopia", flatpak: "ca._0ldsk00l.Nestopia", scoop: "games/nestopia", url: "http://0ldsk00l.ca/nestopia/", args: "--fullscreen" },
            { name: "bsnes", flatpak: "dev.bsnes.bsnes", scoop: "games/bsnes", url:"https://github.com/bsnes-emu/bsnes/", args: "--fullscreen" },
            { name: "ARES", flatpak: "dev.ares.ares", scoop: "games/ares", url: "https://ares-emu.net/", args: "--fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Master System",
        vendor: "Sega",
        name: "sms",
        extensions: [".sms", ".sg", ".zip"],
        sortGamesBy: "name",
        emulators: [
            { name: "Kega Fusion", flatpak: "com.carpeludum.KegaFusion", scoop: "games/kega-fusion", url:"https://www.carpeludum.com/kega-fusion/", args: "-fullscreen" },
            { name: "Blastem", flatpak: "com.retrodev.blastem", scoop: null, url:"https://www.retrodev.com/blastem/", args: "-f" },
            { name: "ARES", flatpak: "dev.ares.ares", scoop: "games/ares", url: "https://ares-emu.net/", args: "--fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "PC Engine",
        vendor: "NEC",
        name: "pcengine",
        extensions: [".pce", ".cue", ".iso", ".bin", ".ccd"],
        sortGamesBy: "name",
        emulators: [
            { name: "ARES", flatpak: "dev.ares.ares", scoop: "games/ares", url: "https://ares-emu.net/", args: "--fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Amiga",
        vendor: "Commodore",
        name: "amiga",
        extensions: [".adf", ".adz", ".dms", ".lha", ".zip"],
        sortGamesBy: "name",
        emulators: [
            { name: "amiberry", flatpak: "com.blitterstudio.amiberry", scoop: null, url:"https://amiberry.com/", args: "-s joyport1_amiberry_custom_axis_none_righttrigger='Quit emulator' --autoload" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "MegaDrive",
        vendor: "Sega",
        name: "megadrive",
        extensions: [".md", ".smd", ".bin", ".gen", ".zip"],
        sortGamesBy: "name",
        emulators: [
            { name: "Kega Fusion", flatpak: "com.carpeludum.KegaFusion", scoop: "games/kega-fusion", url:"https://www.carpeludum.com/kega-fusion/", args: "-fullscreen" },
            { name: "Blastem", flatpak: "com.retrodev.blastem", scoop: null, url:"https://www.retrodev.com/blastem/", args: "-f" },
            { name: "ARES", flatpak: "dev.ares.ares", scoop: "games/ares", url: "https://ares-emu.net/", args: "--fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Game Boy",
        vendor: "Nintendo",
        name: "gameboy",
        extensions: [".gb", ".gbc", ".zip"],
        sortGamesBy: "name",
        emulators: [
            { name: "mgba", flatpak: "io.mgba.mGBA", scoop: "games/mgba", url:"https://mgba.io/", args: "-f" },
            { name: "ARES", flatpak: "dev.ares.ares", scoop: "games/ares", url: "https://ares-emu.net/", args: "--fullscreen" },
            { name: "Sameboy", flatpak: "io.github.sameboy.SameBoy", scoop: "games/sameboy", url:"https://sameboy.github.io/", args: "--fullscreen" },
            { name: "GB Enhanced+", flatpak: "com.github.shonumi.gbe-plus", scoop: null, url:"https://github.com/shonumi/gbe-plus/releases/latest", args: "" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Lynx",
        vendor: "Atari",
        name: "lynx",
        extensions: [".lnx", ".zip"],
        sortGamesBy: "name",
        emulators: [
            { name: "Holani", flatpak: null, scoop: null, url:"https://github.com/LLeny/holani", args: "--fullscreen" },
            { name: "Felix", flatpak: null, scoop: null, url:"https://github.com/laoo/Felix", args: "--fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Game Gear",
        vendor: "Sega",
        name: "gamegear",
        extensions: [".gg", ".sg", ".zip"],
        sortGamesBy: "name",
        emulators: [
            { name: "Kega Fusion", flatpak: "com.carpeludum.KegaFusion", scoop: "games/kega-fusion", url:"https://www.carpeludum.com/kega-fusion/", args: "-fullscreen" },
            { name: "ARES", flatpak: "dev.ares.ares", scoop: "games/ares", url: "https://ares-emu.net/", args: "--fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "SNES",
        vendor: "Nintendo",
        name: "snes",
        extensions: [".smc", ".sfc", ".fig", ".swc", ".zip"],
        sortGamesBy: "name",
        emulators: [
            { name: "Snes9x", flatpak: "com.snes9x.Snes9x", scoop: "games/snes9x", url:"https://www.snes9x.com/", args: "--fullscreen" },
            { name: "bsnes", flatpak: "dev.bsnes.bsnes", scoop: "games/bsnes", url:"https://github.com/bsnes-emu/bsnes/", args: "--fullscreen" },
            { name: "ARES", flatpak: "dev.ares.ares", scoop: "games/ares", url: "https://ares-emu.net/", args: "--fullscreen" },
            { name: "zsnes", flatpak: "io.github.xyproto.zsnes", scoop: null, url:"https://github.com/xyproto/zsnes", args: "-m" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Jaguar",
        vendor: "Atari",
        name: "jaguar",
        extensions: [".jag", ".zip"],
        sortGamesBy: "name",
        emulators: [
            { name: "BigPEmu", flatpak: "com.richwhitehouse.BigPEmu", scoop: null, url:"https://richwhitehouse.com/jaguar/", args: "-f" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Saturn",
        vendor: "Sega",
        name: "saturn",
        extensions: [".cue", ".bin", ".iso"],
        sortGamesBy: "name",
        emulators: [
            { name: "Ymir", flatpak: "io.github.strikerx3.ymir", scoop: null, url:"https://github.com/StrikerX3/Ymir", args: "-f" },
            { name: "Blastem", flatpak: "com.retrodev.blastem", scoop: null, url:"https://www.retrodev.com/blastem/", args: "-f" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "PlayStation",
        vendor: "Sony",
        name: "ps1",
        extensions: [".cue", ".bin", ".iso"],
        sortGamesBy: "name",
        emulators: [
            { name: "ARES", flatpak: "dev.ares.ares", scoop: "games/ares", url: "https://ares-emu.net/", args: "--fullscreen" },
            { name: "DuckStation", flatpak: null, scoop: null, url: "https://duckstation.org/", args: "-fullscreen -nogui" },
            { name: "PSXE", flatpak: null, scoop: null, url: "http://github.com/allkern/psxe", args: "--fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Nintendo 64",
        vendor: "Nintendo",
        name: "n64",
        extensions: ["n64", ".v64", ".z64"],
        sortGamesBy: "name",
        emulators: [
            { name: "Rosalie's Mupen GUI", flatpak: "com.github.Rosalie241.RMG", scoop: "games/rmg", url:"https://github.com/Rosalie241/RMG", args: "--nogui --fullscreen" },
            { name: "Gopher64", flatpak: "io.github.gopher64.gopher64", scoop: null, url:"https://github.com/gopher64/gopher64", args: "-f" },
            { name: "M64Py", flatpak: "net.sourceforge.m64py.M64Py", scoop: null, url:"https://m64py.sourceforge.net/", args: "" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Dreamcast",
        vendor: "Sega",
        name: "dreamcast",
        extensions: [".gdi", ".cdi", ".chd", ".bin", ".cue"],
        sortGamesBy: "name",
        emulators: [
            { name: "flycast", flatpak: "org.flycast.Flycast", scoop: "games/flycast", url:"https://github.com/flyinghead/flycast", args: "--fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "PlayStation 2",
        vendor: "Sony",
        name: "ps2",
        extensions: [".iso", ".bin", ".img", ".cue", ".mdf"],
        sortGamesBy: "name",
        emulators: [
            { name: "PCSX2", flatpak: "net.pcsx2.PCSX2", scoop: "games/pcsx2", url:"https://pcsx2.net/", args: "-nogui -fullscreen" },
            { name: "Play!", flatpak: "org.purei.Play", scoop: null, url:"https://purei.org/", args: "--fullscreen --disc" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "GameCube",
        vendor: "Nintendo",
        name: "gamecube",
        extensions: [".iso", ".ciso", ".gcm", ".gcz"],
        sortGamesBy: "name",
        emulators: [
            { name: "dolphin", flatpak: "org.DolphinEmu.dolphin-emu", scoop: "games/dolphin", url:"https://dolphin-emu.org/", args: "-b -e" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Xbox",
        vendor: "Microsoft",
        name: "xbox",
        extensions: [".iso", ".xiso"],
        sortGamesBy: "name",
        emulators: [
            { name: "xemu", flatpak: "app.xemu.xemu", scoop: "games/xemu", url:"https://xemu.app/", args: "-full-screen -dvd_path" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "PSP",
        vendor: "Sony",
        name: "psp",
        extensions: [".iso", ".cso", ".pbp"],
        sortGamesBy: "name",
        emulators: [
            { name: "PPSSPP", flatpak: "org.ppsspp.PPSSPP", scoop: "games/ppsspp", url:"https://www.ppsspp.org/", args: "--fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "PlayStation 3",
        vendor: "Sony",
        name: "ps3",
        extensions: [".SFO"],
        sortGamesBy: "name",
        emulators: [
            { name: "RPCS3", flatpak: "net.rpcs3.RPCS3", scoop: "games/rpcs3", url:"https://rpcs3.net/", args: "--no-gui" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "3DS",
        vendor: "Nintendo",
        name: "3ds",
        extensions: [".3ds", ".cci", ".cxi"],
        sortGamesBy: "name",
        emulators: [
            { name: "Azahar", flatpak: "org.azahar_emu.Azahar", scoop: null, url:"https://azahar-emu.org/", args: "-f" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Xbox 360",
        vendor: "Microsoft",
        name: "xbox360",
        extensions: [".iso", ".xex"],
        sortGamesBy: "name",
        emulators: [
            { name: "Xenia Canary", flatpak: null, scoop: null, args: "-f", url:"https://github.com/xenia-canary/xenia-canary-releases"}
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "PlayStation 4",
        vendor: "Sony",
        name: "ps4",
        extensions: [".iso"],
        sortGamesBy: "name",
        emulators: [
            { name: "shadPS4", flatpak: "net.shadps4.shadPS4", scoop: null, url:"https://shadps4.net/", args: "--fullscreen" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Visual Pinball X 1",
        vendor: "The Electro-Mechanical Era",
        name: "vpx1",
        extensions: [".vpx"],
        sortGamesBy: "name",
        emulators: [
            { name: "VPXStandalone", flatpak: null, scoop: null, url:"https://github.com/vpinball/vpinball", args: "--play" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Visual Pinball X 2",
        vendor: "The Solid State Era",
        name: "vpx2",
        extensions: [".vpx"],
        sortGamesBy: "name",
        emulators: [
            { name: "VPXStandalone", flatpak: null, scoop: null, url:"https://github.com/vpinball/vpinball", args: "--play" }
        ]
    },
    {
        nbGames: 0,
        display: "grid",
        displayName: "Visual Pinball X 3",
        vendor: "The Computer Era",
        name: "vpx3",
        extensions: [".vpx"],
        sortGamesBy: "name",
        emulators: [
            { name: "VPXStandalone", flatpak: null, scoop: null, url:"https://github.com/vpinball/vpinball", args: "--play" }
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

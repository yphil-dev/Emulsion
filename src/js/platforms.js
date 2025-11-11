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
            { name: "ARES", flatpak: "dev.ares.ares", args: "--fullscreen" }
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
            { name: "Caprice32", flatpak: null, args: "", url: "https://github.com/ColinPitrat/caprice32" }

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
            { name: "fuse", flatpak: "net.sourceforge.fuse_emulator.Fuse", args: "--sound --auto-load" },
            { name: "ARES", flatpak: "dev.ares.ares", args: "--fullscreen" }
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
            { name: "VICE", flatpak: "net.sf.VICE", args: "-fullscreen" }
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
            { name: "Nestopia", flatpak: "ca._0ldsk00l.Nestopia", args: "--fullscreen" },
            { name: "bsnes", flatpak: "dev.bsnes.bsnes", args: "--fullscreen" },
            { name: "ARES", flatpak: "dev.ares.ares", args: "--fullscreen" }
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
            { name: "Kega Fusion", flatpak: "com.carpeludum.KegaFusion", args: "-fullscreen" },
            { name: "Blastem", flatpak: "com.retrodev.blastem", args: "-f" },
            { name: "ARES", flatpak: "dev.ares.ares", args: "--fullscreen" }
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
            { name: "ARES", flatpak: "dev.ares.ares", args: "--fullscreen" }
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
            { name: "amiberry", flatpak: "com.blitterstudio.amiberry", args: "-s joyport1_amiberry_custom_axis_none_righttrigger='Quit emulator' --autoload" }
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
            { name: "Kega Fusion", flatpak: "com.carpeludum.KegaFusion", args: "-fullscreen" },
            { name: "ARES", flatpak: "dev.ares.ares", args: "--fullscreen" },
            { name: "Blastem", flatpak: "com.retrodev.blastem", args: "-f" }
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
            { name: "ARES", flatpak: "dev.ares.ares", args: "--fullscreen" },
            { name: "Sameboy", flatpak: "io.github.sameboy.SameBoy", args: "--fullscreen" },
            { name: "GB Enhanced+", flatpak: "com.github.shonumi.gbe-plus", args: "" }
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
            { name: "Kega Fusion", flatpak: "com.carpeludum.KegaFusion", args: "-fullscreen" },
            { name: "ARES", flatpak: "dev.ares.ares", args: "--fullscreen" }
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
            { name: "Snes9x", flatpak: "com.snes9x.Snes9x", args: "--fullscreen" },
            { name: "bsnes", flatpak: "dev.bsnes.bsnes", args: "--fullscreen" },
            { name: "ARES", flatpak: "dev.ares.ares", args: "--fullscreen" },
            { name: "zsnes", flatpak: "io.github.xyproto.zsnes", args: "-m" }
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
            { name: "BigPEmu", flatpak: "com.richwhitehouse.BigPEmu", args: "-f" }
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
            { name: "Ymir", flatpak: "io.github.strikerx3.ymir", args: "-f" },
            { name: "Blastem", flatpak: "com.retrodev.blastem", args: "-f" }
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
            { name: "duckstation", flatpak: "org.duckstation.DuckStation", args: "-fullscreen -nogui" }
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
            { name: "Rosalie's Mupen GUI", flatpak: "com.github.Rosalie241.RMG", args: "--nogui --fullscreen" },
            { name: "Gopher64", flatpak: "io.github.gopher64.gopher64", args: "-f" },
            { name: "M64Py", flatpak: "net.sourceforge.m64py.M64Py", args: "--fullscreen" }
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
            { name: "flycast", flatpak: "org.flycast.Flycast", args: "--fullscreen" }
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
            { name: "PCSX2", flatpak: "net.pcsx2.PCSX2", args: "--nogui -fullscreen" },
            { name: "Play!", flatpak: "org.purei.Play", args: "--fullscreen" }
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
            { name: "dolphin", flatpak: "org.DolphinEmu.dolphin-emu", args: "-b -e" }
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
            { name: "xemu", flatpak: "app.xemu.xemu", args: "-full-screen -dvd_path" }
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
            { name: "PPSSPP", flatpak: "org.ppsspp.PPSSPP", args: "--fullscreen" }
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
            { name: "RPCS3", flatpak: "net.rpcs3.RPCS3", args: "--no-gui" }
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
            { name: "Azahar", flatpak: "org.azahar_emu.Azahar", args: "-f" }
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
            { name: "Xenia Canary", flatpak: null, args: "-f", url:"https://github.com/xenia-canary/xenia-canary-releases"}
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
            { name: "shadPS4", flatpak: "net.shadps4.shadPS4", args: "--fullscreen" }
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

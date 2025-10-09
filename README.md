[![CI/CD](https://img.shields.io/github/actions/workflow/status/yPhil-gh/emulsion/.github/workflows/ci.yml?style=flat)](https://github.com/yPhil-gh/emulsion/actions)
[![Release](https://img.shields.io/github/v/release/yPhil-gh/emulsion?style=flat)](https://github.com/yPhil-gh/emulsion/releases)
[![License](https://img.shields.io/github/license/yPhil-gh/emulsion?style=flat)](https://github.com/yPhil-gh/emulsion/blob/main/LICENSE)
[![LiberaPay](https://img.shields.io/liberapay/receives/yphil.svg?logo=liberapay&style=flat)](https://liberapay.com/yphil/donate)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support_Me-FF5E5B?logo=ko-fi&logoColor=white&style=flat)](https://ko-fi.com/yphil)

<div align="center">

# Emulsion

### *Better gaming throught chemistry*

**One interface. All your emulators. Zero hassle.**

[Website](https://yphil.gitlab.io/emulsion) • [Download](https://github.com/yPhil-gh/emulsion/releases/latest) • [Documentation](#configuration) • [Community](https://gitlab.com/yphil/emulsion/-/issues)

![Emulsion Hero](https://yphil.gitlab.io/images/emulsion-screenshot00.png?cache=xyz)

</div>

---

## Why Emulsion?

Emulsion brings everything together in one beautiful, responsive frontend that just works.

### Key Features

- **True Unification** - All your emulators, one elegant interface
- **Lightning fast** - Thousands of games realy to launch under the second
- **Universal Input** - Keyboard, mouse, or any game controller
- **Responsive UX** - Adapts perfectly to any screen size / orientation
- **Flexible Storage** - Games across multiple drives? No problem!
- **Smart Cover Art** - Manually curate your collection with images from multiple sources, or batch-download in real time
- **Non-Invasive** - Doesn't mess with your emulator configs
- **Reproducible** - One config file = instant gaming PC setup
- **Arcade Ready** - Perfect for driving an arcade cabinet

### What Makes It Different

Unlike other solutions that try to do everything (and often break things), Emulsion focuses on what matters:

- ✅ **Respects your setup** - Works with YOUR emulators, YOUR way
- ✅ **No controller drama** - Uses your existing configurations and never forgets it (won't even ask)
- ✅ **Curated art selection** - Cover artwork / image download from 3 major APIs
- ✅ **Rock solid** - It Won't Randomly Forget Your Controller Setup™
- ✅ **One config file** - Backup, restore, or share your entire setup in seconds

---

## Installation

### Pre-built Packages (Recommended)


#### Linux

- [**Debian / Ubuntu Package**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_amd64.deb)
- [**RPM Package**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x86_64.rpm)
- [**AppImage**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x86_64.AppImage)

#### Windows

- [**Executable**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x64.exe)


👉 [**All Releases**](https://github.com/yphil-gh/emulsion/releases/latest)

### From Source

```bash
npm install && npm start
```

---

## Quick Start

**Get gaming in 5 minutes:**

1. **Get some games** - Let's say [NES](https://duckduckgo.com/?q=vimms+lair+NES) ROMs
2. **Install an emulator** - e.g., `sudo apt install nestopia`
3. **Open Emulsion** → Settings → NES
   - **Games Directory**: Browse to your NES games folder
   - **Emulator**: Enter `nestopia`
   - **Extensions**: `.zip` (already default!)
   - **Batch cover download**: (optional) click to get the cover of all you new NEW games
4. **Done!** - 🚀 Start gaming

> 💡 **Pro Tip**: Your config lives in `~/.config/emulsion/preferences.json` - back it up!

---

## Configuration

![Settings Screenshot](https://yphil.gitlab.io/images/emulsion-01-platform_config.png?xxx)

### Per-Platform Settings

| Setting                  | Description                                                                         |
|--------------------------|-------------------------------------------------------------------------------------|
| **Games Directory**      | Where your ROMs are for this platform                                               |
| **Emulator**             | The emulator executable (name of installed emulator, or or full path to executable) |
| **Emulator Arguments**   | Optional flags (most emulators don't need any)                                      |
| **Get all cover images** | Batch dowload of all tthis platform's game covers artwork                           |
| **Extensions**           | File types to scan for (e.g., `.zip`, `.iso`)                                       |

### Emulator Quick Reference

Here's what works great on our machines:

| Platform   | Recommended Emulator                                      | Arguments            | Extensions      |
|------------|-----------------------------------------------------------|----------------------|-----------------|
| Atari      | **[Stella](https://stella-emu.github.io/)**               |                      | `.zip`          |
| NES        | **[Nestopia](https://nestopia.sourceforge.net/)**         | `--fullscreen`       | `.zip`          |
| SMS        | **[Mednafen](https://mednafen.github.io/)**               |                      | `.zip`          |
| PCEngine   | **[Mednafen](https://mednafen.github.io/)**               |                      | `.zip`          |
| Amiga      | **[AmiBerry](https://github.com/BlitterStudio/amiberry)** |                      | `.lha`, `.adf`  |
| Mega Drive | [Blastem](https://www.retrodev.com/blastem/)              | `-m gen -f`          | `.md`           |
| SNES       | [Mesen](https://www.mesen.ca/)                            |                      | `.smc`          |
| PSX        | [DuckStation](https://github.com/stenzek/duckstation)     | `-fullscreen -nogui` | `.cue`          |
| N64        | **[Mupen64Plus](https://mupen64plus.org/)**               |                      | `.z64`          |
| Dreamcast  | [Flycast](https://github.com/flyinghead/flycast)          |                      | `.gdi`, `.cdi`  |
| PS2        | **[PCSX2](https://pcsx2.net/)**                           | `-nogui -fullscreen` | `.iso`          |
| GameCube   | [Dolphin](https://dolphin-emu.org/)                       | `-b -e`              | `.iso`, `.ciso` |
| PS3        | [RPCS3](https://rpcs3.net/)                               | `--no-gui`           | `.SFO`          |

**Bold names** = Available in Ubuntu repos! Install with: `apt install nestopia mednafen amiberry mupen64plus pcsx2`

---

## Cover Art

Press <kbd>□</kbd> or <kbd>I</kbd> to select the cover art for the selected game.

### API Keys (Optional but Recommended)

Get **way more images** by adding these free API keys:

#### SteamGridDB
1. Login at [steamgriddb.com](https://www.steamgriddb.com/)
2. Get your key from Preferences
3. Paste into Emulsion Settings

#### GiantBomb
1. Get your free key at [giantbomb.com/api](https://www.giantbomb.com/api/)
2. Paste into Emulsion Settings

### All Image Sources

- [SteamGridDB](https://www.steamgriddb.com/) (API - Best coverage)
- [GiantBomb](https://www.giantbomb.com/api/) (API - Great metadata)
- [Wikipedia](https://en.wikipedia.org/) (API - Surprising)

Images are saved to the platform games / roms directory.

---

## Controls

### Home Screen

| Action                        | Keyboard                         | Controller                      |
|-------------------------------|----------------------------------|---------------------------------|
| Navigate platforms            | <kbd>←</kbd> <kbd>→</kbd>        | <kbd>◄</kbd> <kbd>►</kbd> D-Pad |
| Select platform               | <kbd>Enter</kbd>                 | <kbd>⤫</kbd> A/Cross            |
| Go to 1st (settings) platform | <kbd>Home</kbd> / <kbd>End</kbd> |                                 |
| Exit                          | <kbd>Ctrl+Q</kbd>                | <kbd>○</kbd> B/Circle           |

### Game Gallery

| Action           | Keyboard                                            | Controller                  |
|------------------|-----------------------------------------------------|-----------------------------|
| Browse games     | <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | D-Pad                       |
| Switch platforms | <kbd>Shift+←</kbd> <kbd>Shift+→</kbd>               | <kbd>L1</kbd> <kbd>R1</kbd> |
| Jump 10 rows     | <kbd>PgUp</kbd> <kbd>PgDn</kbd>                     | -                           |
| **LAUNCH GAME**  | <kbd>Enter</kbd>                                    | <kbd>⤫</kbd> A/Cross        |
| Cover art menu   | <kbd>I</kbd>                                        | <kbd>□</kbd> X/Square       |
| Back to home     | <kbd>Esc</kbd>                                      | <kbd>○</kbd> B/Circle       |

### Global Shortcuts

| Action                             | Keyboard                | Controller            |
|------------------------------------|-------------------------|-----------------------|
| Kill emulator (return to Emulsion) | <kbd>Ctrl+Shift+K</kbd> | Select + <kbd>▼</kbd> |
| Reload Emulsion                    | <kbd>F5</kbd>           | -                     |
| Restart Emulsion                   | <kbd>Shift+F5</kbd>     | Select + <kbd>▲</kbd> |

### Mouse Support

- **Left Click**: Launch game / Select cover art
- **Right Click**: Open game cover menu
- **Scroll Wheel**: Navigate

*💡 Contextual hints appear in the footer based on current screen*

---

## Command Line

```bash
emulsion [options]

Options:
  --kiosk                        Read-only mode (perfect for kids/arcade)
  --full-screen                  Start fullscreen
  --auto-select=PLATFORM         Jump directly to a platform
  --help                         Show this help

Available platforms:
  atari spectrum c64 nes sms pcengine amiga megadrive
  gameboy lynx gamegear snes jaguar saturn psx n64
  dreamcast ps2 gamecube xbox psp ps3 3ds xbox360 ps4
  recents settings
```

**Example:**
```bash
emulsion --kiosk --full-screen --auto-select=snes
```

---

## Contributing

### Support the Project

Use Emulsion? Consider supporting development:

<div align="center">

[![LiberaPay](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/yphil/donate)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Buy_Me_Coffee-FF5E5B?logo=ko-fi&logoColor=white&style=for-the-badge)](https://ko-fi.com/yphil)

</div>

### Found a Bug?

[Report it on GitLab](https://gitlab.com/yphil/emulsion/-/issues) - We track everything there!

### Have an Idea?

[Open an issue](https://gitlab.com/yphil/emulsion/-/issues) and let's discuss it!

### Want to Code?

[Check out our issues](https://gitlab.com/yphil/emulsion/-/issues) - contributions welcome!

---

## License

Emulsion is open source under the [GPL V3](LICENSE) and brought to you for free by [yPhil](https://yphil.gitlab.io). You are welcome.

---

## Links

- [Website](https://yphil.gitlab.io/emulsion)
- [Releases](https://github.com/yPhil-gh/emulsion/releases)
- [GitLab (Primary)](https://gitlab.com/yphil/emulsion)
- [GitHub (Mirror)](https://github.com/yPhil-gh/Emulsion)
- [Blog](https://yphil.gitlab.io/)

---

<div align="center">

**Help ❤️ your global coder**

*This repository is a mirror of the official [GitLab repo](https://gitlab.com/yphil/emulsion)*

[Back to top](#emulsion)

</div>

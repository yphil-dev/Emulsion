<div align="center">

[![CI/CD](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/yPhil-gh/emulsion/actions)
[![Release](https://img.shields.io/github/v/release/yPhil-gh/emulsion?style=flat&logo=github&color=brightgreen)](https://github.com/yPhil-gh/emulsion/releases)
[![License](https://img.shields.io/github/license/yPhil-gh/emulsion?style=flat)](https://github.com/yPhil-gh/emulsion/blob/main/LICENSE)
[![LiberaPay](https://img.shields.io/liberapay/receives/yphil.svg?logo=liberapay&style=flat)](https://liberapay.com/yphil/donate)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support_Me-FF5E5B?logo=ko-fi&logoColor=white&style=flat)](https://ko-fi.com/yphil)

# Emulsion

### *Better gaming throught chemistry*

**Display your games collection into responsive galleries, manage game metadata, cover art and emulator configuration. Launch your games in style.**

[Website](https://yphil.gitlab.io/emulsion) • [Download](https://github.com/yPhil-gh/emulsion/releases/latest) • [Documentation](#configuration) • [Cracktro](https://yphil.gitlab.io/ext/emulsion.html)

![Emulsion Hero](https://yphil.gitlab.io/images/emulsion-screenshot_01.png?cache=xyzzz)

</div>

## What is Emulsion?

A portal to your **games** ; It brings everything together in one beautiful, responsive frontend that just-works.

### Key Features

- **True Unification** - All your emulators, one elegant interface
- **Fast** - Thousands of games realy to launch under the second
- **Light** - Emulsion is not a gigantic cathedral that also does coffee, or downright its own Operating System 😉

### *Unique* Features ; Why Emulsion?
Only Emulsion does it this way ; Seriously, look it up!

- **Universal Input** - Keyboard, mouse, or any game controller
- **Responsive UX** - Adapts perfectly to any screen size / orientation
- **Flexible Storage** - Games across multiple drives? No problem!
- **Smart Meta data management** - Manually curate your collection with images and text from multiple sources (but always WikiPedia API as a fallback) or batch-download them in real time
- **Non-Invasive** - Doesn't mess with your emulator configs
- **Reproducible** - One config file = instant gaming PC setup
- **Arcade Ready** - Perfect for driving an arcade cabinet

![Emulsion Hero](https://yphil.gitlab.io/images/emulsion-list-pce.png?cache=x)

## Installation

### Pre-built Packages (Recommended)

- [**Debian / Ubuntu Package**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_amd64.deb)
- [**RPM Package**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x86_64.rpm)
- [**AppImage**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x86_64.AppImage)


👉 [**All Releases**](https://github.com/yphil-gh/emulsion/releases/latest)

### From Source

```bash
npm install && npm start
```

## Quick Start

**Get gaming in 5 minutes:**

1. Open any console page

1. **Get some games** - Let's say [NES](https://duckduckgo.com/?q=vimms+lair+NES) ROMs
2. **Install an emulator**
3. **Open Emulsion** → Settings → NES
   - **Games Directory**: Browse to your NES games folder
   - **Emulator**: Enter `nestopia`
   - **Extensions**: `.zip` (already default!)
   - **Batch cover download**: (optional) click to get the cover of all you new NEW games
4. **Done!** - 🚀 Start gaming

> 💡 **Pro Tip**: Your config lives in `~/.config/emulsion/preferences.json` - back it up!

## Configuration

![Settings Screenshot](https://yphil.gitlab.io/images/emulsion-prefs-snes.png?xxx)

### Per-Platform Settings

| Setting                  | Description                                                                                                                                                                                    |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Games Directory**      | Where your ROMs are for this platform                                                                                                                                                          |
| **Emulator**             | The emulator executable (name of installed emulator, or or full path to executable)                                                                                                            |
| **Emulator Arguments**   | Optional flags (most emulators don't need any)                                                                                                                                                 |
| **Get all cover images** | Batch download of all this platform's game covers artwork (you can close the menu and do something else - like play a game - while it downloads and refreshes your games gallery in real time) |
| **Extensions**           | File types to scan for (e.g., `.zip`, `.iso`)                                                                                                                                                  |

## Emulators management

Emulsion finds your emulators, helps you install the ones you don’t have, and sets them up with sensible defaults (file extensions and CLI arguments) — all configurable. Emulsion is *flexible*: You can put all your Vic20 games in the C64 page if you want.

![Emulators management](https://yphil.gitlab.io/images/emulsion-emulators-n64.png?cache=x)

Up-to-date on Linux emulators and the way they work ; Smart, [DWIM](https://en.wikipedia.org/wiki/DWIM) & and hassle-free.

## Game Metadata & Cover Art

Press <kbd>□</kbd> or <kbd>I</kbd> to select the cover art for the selected platform / game.

By default, Emulsion uses Wikipedia to fetch cover images and game metadata — so even without any setup, you get images, release info, and other useful text details automatically.

### Optional: Add API Keys for More Images & Data

Want more options and higher-quality covers? Add free API keys to expand Emulsion’s reach:

#### SteamGridDB

- Login at steamgriddb.com
- Get your API key from Preferences
- Paste it into Emulsion Settings

#### GiantBomb

- Register at giantbomb.com/api
- Paste your free key into Emulsion Settings

#### Text Sources

- Wikipedia – default, text metadata (title, release date, description, etc.)

#### Image Sources

- Wikipedia – default, finds both images and basic text metadata (title, release date, description, etc.)
- SteamGridDB – API, best coverage for high-quality images
- GiantBomb – API, actually quite poor, thinking of removing it.

All images and metadata are saved alongside your platform games / ROMs, keeping your collection organized.

## Controls

### Home
The platform carousel

| Action                        | Keyboard                         | Controller                      |
|-------------------------------|----------------------------------|---------------------------------|
| Navigate platforms            | <kbd>←</kbd> <kbd>→</kbd>        | <kbd>◄</kbd> <kbd>►</kbd> D-Pad |
| Select platform               | <kbd>Enter</kbd>                 | <kbd>⤫</kbd> A/Cross            |
| Go to 1st (settings) platform | <kbd>Home</kbd> / <kbd>End</kbd> |                                 |
| Exit                          | <kbd>Ctrl+Q</kbd>                | <kbd>○</kbd> B/Circle           |

### Gallery
The games gallery

| Action           | Keyboard                                            | Controller                  |
|------------------|-----------------------------------------------------|-----------------------------|
| Browse games     | <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | D-Pad                       |
| Switch platforms | <kbd>Shift+←</kbd> <kbd>Shift+→</kbd>               | <kbd>L1</kbd> <kbd>R1</kbd> |
| Jump 10 rows     | <kbd>PgUp</kbd> <kbd>PgDn</kbd>                     | -                           |
| **LAUNCH GAME**  | <kbd>Enter</kbd>                                    | <kbd>⤫</kbd> A/Cross        |
| Cover art menu   | <kbd>I</kbd>                                        | <kbd>□</kbd> X/Square       |
| Back to home     | <kbd>Esc</kbd>                                      | <kbd>○</kbd> B/Circle       |

### Global Shortcuts
They work everywhere

| Action                             | Keyboard                | Controller                       |
|------------------------------------|-------------------------|----------------------------------|
| Kill emulator (return to Emulsion) | <kbd>Ctrl+Shift+K</kbd> | Select + <kbd>▼</kbd> D-Pad Down |
| Reload Emulsion                    | <kbd>F5</kbd>           | -                                |
| Restart Emulsion                   | <kbd>Shift+F5</kbd>     | Select + <kbd>▲</kbd> D-Pad Up   |

### Mouse Support

- **Left Click**: Launch game / Select cover art
- **Right Click**: Open game cover menu
- **Scroll Wheel**: Navigate

*💡 Contextual hints appear in the footer based on current screen*

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

## License

Emulsion is open source under the [GPL V3](LICENSE) and brought to you for free by [yPhil](https://yphil.gitlab.io). You are welcome.

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

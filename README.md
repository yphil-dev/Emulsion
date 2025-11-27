<div align="center">

[![CI/CD](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/yPhil-gh/emulsion/actions)
[![Release](https://img.shields.io/github/v/release/yPhil-gh/emulsion?style=flat&logo=github&color=brightgreen)](https://github.com/yPhil-gh/emulsion/releases)
[![License](https://img.shields.io/github/license/yPhil-gh/emulsion?style=flat)](https://github.com/yPhil-gh/emulsion/blob/main/LICENSE)
[![LiberaPay](https://img.shields.io/liberapay/receives/yphil.svg?logo=liberapay&style=flat)](https://liberapay.com/yphil/donate)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support_Me-FF5E5B?logo=ko-fi&logoColor=white&style=flat)](https://ko-fi.com/yphil)

# Emulsion

*Better gaming throught chemistry*

**Display your games collection into responsive galleries, manage game metadata, cover art and emulator configuration. Launch your games in style.**

[Website](https://yphil.gitlab.io/emulsion) • [Download](https://github.com/yPhil-gh/emulsion/releases/latest) • [Documentation](#configuration) • [GitHub mirror (releases)](https://github.com/yPhil-gh/Emulsion) • [Cracktro](https://yphil.gitlab.io/ext/emulsion.html)

![Emulsion Hero](https://yphil.gitlab.io/images/emulsion-screenshot_01.png?cache=xyzzz)

</div>

## Features

- **Flexible Storage** - Your games / ROMs can be anywhere, across multiple drives / NAS, etc.
- **Universal Input** - Keyboard, mouse, or any game controller
- **Responsive UX** - Adapts perfectly to any screen size / orientation
- **Smart emulator management** - Emulsion uses your installed emulator, or installs it ; Standard and up to date.
- **Flexible Metadata Management** - Manual curation, and / or batch automation. Downloads from multiple sources, Wikipedia API default ; All manageable from the platform page.

Emulsion is **reproducible** - one single config file - and **arcade ready** ; Perfect for driving an arcade cabinet.

![emulsion-list-pce](https://yphil.gitlab.io/images/emulsion-list-pce.png?cache=xx)

## Installation

### Pre-built Packages (Recommended)

- [**Debian / Ubuntu Package**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_amd64.deb)
- [**RPM Package**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x86_64.rpm)
- [**AppImage**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x86_64.AppImage)
- [**Windows**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x64.exe)
- [**Mac OS** (testers needed)](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x64.dmg)

[**All Releases**](https://github.com/yphil-gh/emulsion/releases/latest)

### From Source

```bash
npm install && npm start
```
## Configuration

### Quick Start

**Get gaming in 5 minutes:**

1. **Get some games** - Let's say [NES](https://duckduckgo.com/?q=vimms+lair+NES) ROMs
2. **Open Emulsion** → **NES**
   - **Games Directory**: Click **Browse**, navigate to your NES games folder
   - **Emulator**:
     - Click **Install**, choose... Let's try `nestopia`.
     - Click **Select**
     - Click **Enable**, click **Save**
3. **Done** - That's it, your NES Platform is set up forever.
4. When you're done, set "disabled platforms: hide" in the [global setting menu](#global-settings), so you only see the enabled platforms.

> 💡 **Pro Tip**: Your config lives in `~/.config/emulsion/preferences.json` - back it up!


![Settings Screenshot](https://yphil.gitlab.io/images/emulsion-prefs-n64.png?cache=x)

### Per-Console Settings

| Setting                | Description                                                                   |
|------------------------|-------------------------------------------------------------------------------|
| **Games Directory**    | Where your ROMs are for this platform                                         |
| **Emulator**           | The emulator executable (use the install button to install / select emulator) |
| **Emulator Arguments** | Optional flags (most emulators don't need any)                                |
| **Extensions**         | File types to scan for (already set if you use the Install / Select dialog)   |

### Emulators management

Emulsion finds your emulators, helps you install the ones you don’t have, and sets them up with sensible defaults (file extensions and CLI arguments) — all configurable. Emulsion is *flexible*: You can put all your Vic20 games in the C64 page if you want.

![Emulators management](https://yphil.gitlab.io/images/emulsion-emulators-n64.png?cache=x)

Emulsion is up-to-date on Linux emulators and the way they work (extensions + arguments) ; Smart, [DWIM](https://en.wikipedia.org/wiki/DWIM) & and hassle-free.

> ⚠️ **Note**: Automatic emulator installation / selection is currently only available on Linux. On Windows and macOS, emulators must be installed manually. No biggie, the result is the same anyway: setup and forget.

#### Other OSes

For Windows, we're thinking of implementing something like [Scoop](https://scoop.sh/) or [WinGet](https://github.com/microsoft/winget-cli), when we find the time and [motivation](https://mstdn.social/@yPhil/115620906353244396). Again, it's not a big deal: Install youe emulator, select it with the "Browse" button, save (optionally tweak the arguments) and you are done.

### Game Metadata & Cover Art

Press <kbd>□</kbd> or <kbd>I</kbd> to select the cover art for the selected platform / game.

By default, Emulsion uses Wikipedia to fetch cover images and game metadata — so even without any setup, you get images, release info, and other useful text details automatically.

#### Optional: Add API Keys for More Images & Data

Want more options and higher-quality covers? Add free API keys to expand Emulsion’s reach:

##### SteamGridDB

- Login at steamgriddb.com
- Get your API key from Preferences
- Paste it into Emulsion Settings

##### GiantBomb

- Register at giantbomb.com/api
- Paste your free key into Emulsion Settings

#### Text Sources

- Wikipedia – API (default) text metadata (title, release date, description, etc.)

#### Image Sources

- WikiMedia – API (default) good coverage
- SteamGridDB – API, best coverage & high-quality images
- GiantBomb – API, actually quite poor, thinking of removing it.

All images and metadata are saved alongside your platform games / ROMs, keeping your collection organized.

### Global settings

![Global settings](https://yphil.gitlab.io/images/emulsion-settings.png?cache=x)

## Controls

### Home
The console carousel

| Action                        | Keyboard                         | Controller                      |
|-------------------------------|----------------------------------|---------------------------------|
| Navigate consoles            | <kbd>←</kbd> <kbd>→</kbd>        | <kbd>◄</kbd> <kbd>►</kbd> D-Pad |
| Select console               | <kbd>Enter</kbd>                 | <kbd>⤫</kbd> A/Cross            |
| Go to 1st (settings) platform | <kbd>Home</kbd> / <kbd>End</kbd> |                                 |
| Exit                          | <kbd>Ctrl+Q</kbd>                | <kbd>○</kbd> B/Circle           |

### Gallery
The games gallery

| Action           | Keyboard                                            | Controller                  |
|------------------|-----------------------------------------------------|-----------------------------|
| Browse games     | <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | D-Pad                       |
| Switch consoles | <kbd>Shift+←</kbd> <kbd>Shift+→</kbd>               | <kbd>L1</kbd> <kbd>R1</kbd> |
| Jump 10 rows     | <kbd>PgUp</kbd> <kbd>PgDn</kbd>                     | -                           |
| **LAUNCH GAME**  | <kbd>Enter</kbd>                                    | <kbd>⤫</kbd> A/Cross        |
| Cover art menu   | <kbd>I</kbd>                                        | <kbd>□</kbd> X/Square       |
| Back to home     | <kbd>Esc</kbd>                                      | <kbd>○</kbd> B/Circle       |

### Global Shortcuts
They work everywhere

| Action                                        | Keyboard                | Controller                       |
|-----------------------------------------------|-------------------------|----------------------------------|
| Display Emulation menu                        | <kbd>/</kbd>            | Start                            |
| **Exit emulator / Game** (return to Emulsion) | <kbd>Ctrl+Shift+K</kbd> | Select + <kbd>▼</kbd> D-Pad Down |
| Reload Emulsion                               | <kbd>F5</kbd>           | -                                |
| Restart Emulsion                              | <kbd>Shift+F5</kbd>     | Select + <kbd>▲</kbd> D-Pad Up   |

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

Available consoles:
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

[![CI/CD](https://img.shields.io/github/actions/workflow/status/yPhil-gh/emulsion/.github/workflows/ci.yml?style=flat)](https://github.com/yPhil-gh/emulsion/actions)
[![Release](https://img.shields.io/github/v/release/yPhil-gh/emulsion?style=flat)](https://github.com/yPhil-gh/emulsion/releases)
[![License](https://img.shields.io/github/license/yPhil-gh/emulsion?style=flat)](https://github.com/yPhil-gh/emulsion/blob/main/LICENSE)
[![LiberaPay](https://img.shields.io/liberapay/receives/yphil.svg?logo=liberapay&style=flat)](https://liberapay.com/yphil/donate)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support_Me-FF5E5B?logo=ko-fi&logoColor=white&style=flat)](https://ko-fi.com/yphil)

# [Emulsion](https://yphil.gitlab.io/emulsion)

A unified, lightweight frontend for your games ; Ideal for driving an arcade cabinet. [Website](https://yphil.gitlab.io/emulsion) | [GitLab](https://gitlab.com/yphil/emulsion) (master) | [GitHub](https://github.com/yPhil-gh/Emulsion) | [Blog](https://yphil.gitlab.io/)

![Emulsion](https://yphil.gitlab.io/images/emulsion-screenshot00.png?cache=xyz)

- [Installation](#installation)
  - [Package](#package)
  - [Source](#source)
- [Configuration](#configuration)
  - [QuickStart](#quickstart)
  - [Settings](#settings)
- [Usage](#usage)
  - [Controls](#controls)
  - [Command Line Interface](#command-line-interface)

## Features

Emulsion
- Unifies all *your* emulators in a single interface
- Allows you to have your games stored in multiple locations / drives
- Lets you *precisely* select game cover art from multiple backends
- Works with both keyboard, mouse and (any) game controller
- Adapts itself responsively to the size of the screen

These features set it apart from solutions that:
- Centralize the emulators config files (which Emulsion doesn't do)
- Handle controller configuration (often unreliably)
- Handle cover art downloads automatically / unattended / or even externally, without selection options

Emulsion is *reproductible*: Thanks to [its single **standard** config file](#configuration), you can install a full gaming PC in one command, and It-Won't-Move, like randomly greet you with a tedious game controller calibration dialog because it somehow forgot it.

## Installation

### Package

Latest Package releases (recommended)

- [Linux Deb](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_amd64.deb)
- [Linux AppImage](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x86_64.AppImage)
- [Windows (unsigned)](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x64.exe)
- [Other Releases](https://github.com/yphil-gh/emulsion/releases/latest)

### Source

- `npm install ; npm start`

## Configuration

### QuickStart

1. Get some games for a platform, let's say NES ;
2. Download an emulator for that platform, let's say Nestopia: `sudo atp install nestopia` ;
3. (Optional) Check the documentation: `nestopia --help` ;
4. (Optional) Test that everything works in the CLI: `nestopia --fullscreen /games/nes/game.zip` ;
5. Open Emulsion: **Settings** / **NES** ;
   1. **Games Directory**: Click "Browse" and select the directory where you put your NES games ;
   2. **Emulator**: nestopia ;
   3. **Extensions**: Enter ".zip" (NB it's already the default) ;
6. That's it, everything is saved in the configuration file, now ; Happy gaming !

#### NB
- You configuration file is in `~/.config/emulsion/preferences.json`
- With a game selected, press the image download key to select a cover art image ; it works right of the box, but you'll have better results by using the [Backends API keys](#backends-api-keys).
- The images are in `~/.config/emulsion/covers/[platform name]/[game name].jpg`.

### Settings

![Emulsion](https://yphil.gitlab.io/images/emulsion-01-platform_config.png?xxx)

For each platform / machine, you can configure:

- **Games Directory**

The directory where the games are stored for that platform ; Enter a path or better, use the Browse button.

- **Emulator**

The emulator for that platform. The name of a program installed on your machine, or use the Browse button to select an emulator executable.

- **Emulator Arguments**

The *optional* arguments for that emulator ; Most don't need any, [read on](#emulator-tips).

#### Emulator tips

Here is a non exhaustive list of emulators that you can use in Emulsion ; These are just what I use on my current machine, for inspiration.

| Platform   | Emulator                                                     | Emulator Arguments       | Extensions (1)  |
|------------|--------------------------------------------------------------|--------------------------|-----------------|
| NES        | **[Nestopia](https://nestopia.sourceforge.net/)** (2)        | `--fullscreen`           | `.zip`          |
| NES        | **[Mednafen](https://mednafen.github.io/)**                  |                          | `.zip`          |
| SMS        | Mednafen                                                     |                          | `.zip`          |
| PC Engine  | Mednafen                                                     |                          | `.pce`          |
| Amiga      | **[AmiBerry](https://github.com/BlitterStudio/amiberry)**    |                          | `.lha`, `.adf`  |
| Mega Drive | [Blastem](https://www.retrodev.com/blastem/)                 | `-m gen -f`              | `.md `          |
| SNES       | [Mesen](https://www.mesen.ca/)                               |                          | `.smc`          |
| Jaguar     | [BigPEmu](https://www.richwhitehouse.com/jaguar/)            |                          | `.jag`          |
| Saturn     | Mednafen                                                     |                          | `.cue`          |
| PSX        | [DuckStation](https://github.com/stenzek/duckstation)        | `-fullscreen -nogui`     | `.srm`          |
| N64        | **[Mupen64Plus](https://mupen64plus.org/)**                  |                          | `.z64`          |
| Dreamcast  | [Flycast](https://github.com/flyinghead/flycast)             |                          | `.gdi`, `.cdi`  |
| PS2        | **[PCSX2](https://pcsx2.net/)**                              | `-nogui -fullscreen`     | `.bin`, `.iso`  |
| GameCube   | [Dolphin Emulator](https://dolphin-emu.org/)                 | `-b -e`                  | `.iso`, `.ciso` |
| Xbox       | [xemu](https://xemu.app/)                                    | `-full-screen -dvd_path` | `.xiso.iso`     |
| PSP        | [PPSSPP](https://www.ppsspp.org/)                            |                          | `.iso`          |
| PS3        | [RPCS3](https://rpcs3.net/)                                  | `--no-gui`               | `.SFO`          |
| X-Box 630  | [Xenia Canary](https://github.com/xenia-canary/xenia-canary) |                          | `.iso`          |

**NB**
- **1** The extensions in this list are set as default in Emulsion
- **2** All the names **in bold** are directly installed from the normal system (Ubuntu box) repo / app store:

`mednafen nestopia amiberry mupen64plus pcsx2`

The other emulators can all be installed with appImage.

#### Cover art

Press the <kbd>□</kbd> button or the <kbd>I</kbd> key to set the cover art image of the selected game.

##### backends API Keys

Some cover art download backends (SteamGridDB and GiantBomb) require authentication ; The key is free and easy to obtain:

- **GiantBomb**
  - get your key at https://www.giantbomb.com/api/

- **SteamGridDB**
  - Create or log into your [Steam](https://store.steampowered.com/) account ;
  - Get your [API](https://www.steamgriddb.com/api/v2) key by login in to https://www.steamgriddb.com and open the preferences menu.

Paste the key into the corresponding field in the [Emulsion settings form](#settings) ; click Save.
The other backends require no authentication, but you'll find **way more images** leveraging all the backends.

If you can - after you [donated to this project](https://yphil.gitlab.io/ext/support.html) of course, thank you very much 🙂 please consider supporting those backends ; They do a great job of keeping our common culture aliv... Well, existing.

##### All backends
  - [SteamGridDB](https://www.steamgriddb.com/) (API)
  - [GiantBomb](https://www.giantbomb.com/api/) (API)
  - [MobyGames](mobygames.com) (Web)
  - [Exotica](https://www.exotica.org.uk/) (Web)
  - [Wikipedia](https://en.wikipedia.org/w/index.php?title=Category:Amiga_game_covers) (Amiga) (Web)
  - [UVList](https://www.uvlist.net/) (Web)

...More to come.

## Usage

### Controls

- **Home**

Platforms / machines home carousel

| Action                      | Keyboard                       | Game controller                                |
|-----------------------------|--------------------------------|------------------------------------------------|
| Navigate between machines   | <kbd>←</kbd> / <kbd>→</kbd>    | D-Pad Left / Right <kbd>◄</kbd> / <kbd>►</kbd> |
| Select highlighted platform | <kbd>Enter</kbd>               | Cross / A / South <kbd>⤫</kbd>                 |
| Exit Emulsion               | <kbd>Ctrl</kbd> + <kbd>Q</kbd> | Circle / B / East <kbd>○</kbd>                 |

- **Game Galleries**

Games (and plaforms config) pages

| Action                                    | Keyboard                                                  | Game controller                |
|-------------------------------------------|-----------------------------------------------------------|--------------------------------|
| Browse games                              | <kbd>←</kbd> / <kbd>→</kbd> / <kbd>↑</kbd> / <kbd>↓</kbd> | DPad                           |
| Browse machines / platforms               | <kbd>Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd>            | <kbd>L1</kbd> / <kbd>R1</kbd>  |
| Jump 10 rows                              | <kbd>Page Up</kbd> / <kbd>Page Down</kbd>                 |                                |
| Jump to first / last game                 | <kbd>Home</kbd> / <kbd>End</kbd>                          |                                |
| **Launch** selected **game** 🚀           | <kbd>Enter</kbd>                                          | Cross / A / South <kbd>⤫</kbd> |
| Open game / cover image menu              | <kbd>I</kbd>                                              | Square / X / West <kbd>□</kbd> |
| Return to home screen / machines menu (1) | <kbd>Escape</kbd>                                         | Circle / B / East <kbd>○</kbd> |

**1**: Only works on Linux ([for now](https://github.com/IBM/sdl2-gamecontroller/issues/16)).

- **Game cover art image menu**

Game config / download cover art menu

| Action                      | Keyboard                                                  | Game controller                |
|-----------------------------|-----------------------------------------------------------|--------------------------------|
| Navigate image thumbnails   | <kbd>←</kbd> / <kbd>→</kbd> / <kbd>↑</kbd> / <kbd>↓</kbd> | DPad                           |
| Select / save image         | <kbd>Enter</kbd>                                          | Cross / A / South <kbd>⤫</kbd> |

- **Global controls**

Works everywhere

| Action                                           | Keyboard                                          | Game controller                                |
|--------------------------------------------------|---------------------------------------------------|------------------------------------------------|
| Back                                             | <kbd>Escape</kbd>                                 | D-Pad Left / Right <kbd>◄</kbd> / <kbd>►</kbd> |
| Select                                           | <kbd>Enter</kbd>                                  | Cross / A / South <kbd>⤫</kbd>                 |
| Exit Emulsion                                    | <kbd>Ctrl</kbd> + <kbd>Q</kbd>                    | Circle / B / East <kbd>○</kbd>                 |
| Quit game / Exit emulator and return to Emulsion | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd> | Select / Share + <kbd>▼</kbd>                  |
| Reload Emulsion                                  | <kbd>F5</kbd>                                     |                                                |
| Restart Emulsion                                 | <kbd>Shift</kbd> + <kbd>F5</kbd>                  | Select / Share + <kbd>▲</kbd>                  |

- **Mouse**
  - Left Click: Home: Select platform, Menu: Select and save cover art image, Gallery: **launch game** 🚀
  - Right-Click: Open contextual game menu
  - Mouse Wheel: Scroll / browse machines / games

- **Contextual help**
  - Control hints appear in the footer based on current screen.

### Command Line Interface

CLI arguments

```
Options:
  --kiosk                        No config / settings, disabled platforms hidden.
  --full-screen                  Start in full screen mode.
  --auto-select=[platform_name]  Auto-select [platform_name].
  --help                         Show this help message.

Platform names:
atari spectrum c64 nes sms pcengine amiga megadrive gameboy lynx gamegear snes jaguar saturn psx n64 dreamcast ps2 gamecube xbox psp ps3 3ds xbox360 ps4 recents settings
```

## Can I help?

Why of course, thank you for asking

- [Donate](https://yphil.gitlab.io/ext/support.html)
- [Report usage problems / suggestions](https://gitlab.com/yphil/emulsion/-/issues)
- [Contribute code](https://gitlab.com/yphil/emulsion/-/issues)

This repository is a mirror of https://gitlab.com/yphil/emulsion the official [Emulsion](https://yphil.gitlab.io/emulsion) repo. [Back to top ↑](#emulsion)

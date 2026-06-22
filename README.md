<div align="center">

[![CI/CD](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/yphil-dev/emulsion/actions)
[![Release](https://img.shields.io/github/v/release/yphil-dev/emulsion?style=flat&logo=github&color=brightgreen)](https://github.com/yphil-dev/emulsion/releases)
[![License](https://img.shields.io/github/license/yphil-dev/emulsion?style=flat)](https://github.com/yphil-dev/emulsion/blob/main/LICENSE)
[![LiberaPay](https://img.shields.io/liberapay/receives/yphil.svg?logo=liberapay&style=flat)](https://liberapay.com/yphil/donate)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support_Me-FF5E5B?logo=ko-fi&logoColor=white&style=flat)](https://ko-fi.com/yphil)

# Emulsion

*Better gaming through chemistry*

**A tonic front end for your game machine.**

[Website](https://yphil.gitlab.io/emulsion) • [Download](https://github.com/yphil-dev/emulsion/releases/latest) • [GitLab (primary)](https://gitlab.com/yphil/emulsion) • [GitHub mirror](https://github.com/yphil-dev/Emulsion) • [Blog](https://yphil.gitlab.io/)

![Emulsion Hero](https://yphil.gitlab.io/images/emulsion-screenshot_01.png?cache=xyzzz)

</div>

## Why Emulsion?

Emulsion lets you browse and launch a mixed game collection from one interface.
It is designed to be practical: fullscreen-friendly, comfortable with a controller, and flexible about how your collection is organized.

Your games can stay where they already are: **local disk, external drive, mixed folders, or a NAS share**. Emulsion does not require a proprietary library layout.

It also works well for **arcade and pinball cabinets**, including **VPX** setups.

### Highlights

- **Multi-platform launcher** — one frontend for many systems
- **Your games can stay where they are** — local folders, external drives, mixed storage, even a NAS
- **Gamepad-first UI** — also works with keyboard and mouse
- **Recents and Favorites** — quick access to what matters
- **Metadata and cover management** — fetch, edit, save, batch-download
- **Per-platform emulator config** — executable, args, extensions, enable / disable
- **Responsive layouts** — grid or list, configurable columns, fullscreen friendly
- **Kiosk mode** — ideal for kids, cabinets, or public-facing setups
- **GameModeRun support** on Linux — enabled by default when available
- **Pinball ready** — pinball control scheme, OPDB integration, cabinet-friendly launching

### Why it is practical

Emulsion tries to stay out of your way:

- point each platform at the folder you already use
- keep your existing emulator binaries and command lines
- add metadata and cover art without reorganizing your collection
- mix tiny curated setups with huge multi-system libraries
- use it on a desktop today, then drop the same config into a cabinet later

### Why it works well in a cabinet

For cabinet builders, Emulsion gives you the stuff that matters:

- boot straight into a platform with `--auto-select`
- hide the UI chrome entirely with `--no-ui`
- lock things down with `--kiosk`
- use **recents** and **favorites** like a real front-end, not an afterthought
- run **VPX** from the same launcher as the rest of your collection
- fetch **OPDB** metadata and images for pinball setups
- use the built-in **pinball control scheme** with `--control-scheme=pinball`

It works well as a couch-friendly launcher, a dedicated cabinet frontend, or a setup where the collection already lives on a server or NAS.

Emulsion keeps your library structure simple:

- images are stored in `images/` inside your games folder
- metadata is stored in `metadata/` inside your games folder
- recents and favorites are stored in your user config directory
- favorites / recents enrich their records from `metadata/<gameName>.json` when available, using `publisher` and `releaseDate`
- for VPX-style names like `Game Name (Publisher YYYY)`, the gallery badge prefers the filename values over metadata

![Theme screenshot](https://yphil.gitlab.io/images/emulsion-screenshot_02.png)

## Installation

### Packages

- [**Linux Debian / Ubuntu**](https://github.com/yphil-dev/emulsion/releases/latest/download/emulsion_amd64.deb)
- [**Linux RPM**](https://github.com/yphil-dev/emulsion/releases/latest/download/emulsion_x86_64.rpm)
- [**Linux AppImage**](https://github.com/yphil-dev/emulsion/releases/latest/download/Emulsion-no-install_x86_64.AppImage)
- [**Linux Arch**](https://github.com/yphil-dev/emulsion/releases/latest/download/emulsion_x86_64.pacman)
- [**FreeBSD**](https://github.com/yphil-dev/emulsion/releases/latest/download/emulsion_x86_64.freebsd) *(testers welcome)*
- [**Windows**](https://github.com/yphil-dev/emulsion/releases/latest/download/emulsion_x64.exe)
- [**macOS**](https://github.com/yphil-dev/emulsion/releases/latest/download/emulsion_x64.dmg) *(testers welcome)*

[**All releases**](https://github.com/yphil-dev/emulsion/releases/latest)

> **Wayland note:** if your Linux setup needs it, try:
>
> `emulsion --enable-features=UseOzonePlatform --ozone-platform=x11`

### From source

```bash
npm install
npm start
```

## Quick start

1. Launch **Emulsion**
2. Open a platform from the home carousel
3. In the platform menu, set:
   - **Games Directory**
   - **Emulator**
   - optional **Emulator Arguments**
4. Save
5. Browse, launch, add favorites, fetch covers, enjoy

When your setup is done, you can switch **Disabled platforms** to **hide** in Settings for a cleaner home screen.

> **Tip:** your main config lives in `~/.config/emulsion/preferences.json` on Linux.

![Settings Screenshot](https://yphil.gitlab.io/images/emulsion-prefs-n64.png?cache=x)

## Configuration

### Per-platform settings

| Setting | What it does |
|---|---|
| **Games Directory** | Folder scanned for games / ROMs |
| **Emulator** | Executable used to launch the selected platform |
| **Emulator Arguments** | Optional CLI flags |
| **Extensions** | File extensions to scan |
| **View Mode** | Grid or list |
| **Enabled** | Show or hide the platform from normal browsing |

### Global settings

Current global settings include:

- theme
- footer size
- number of columns
- disabled platform policy
- recents / favorites visibility
- recents / favorites view mode
- favorites sorting
- startup help dialog policy
- launch dialog policy
- **Optimize (GameModeRun)**
- API keys for image / metadata sources

> On Linux, **Optimize (GameModeRun)** is enabled by default when `gamemoderun` is available. You can disable it in Settings.

![Global settings](https://yphil.gitlab.io/images/emulsion-settings.png?cache=x)

## Emulator management

Emulsion helps you manage emulator setup per platform.

- On **Linux**, it can help install / select supported emulators automatically
- On **Windows / macOS / BSD**, you can point Emulsion at your already-installed emulator manually

Either way, the result is the same: once configured, it becomes a set-it-and-forget-it frontend.

![Emulators management](https://yphil.gitlab.io/images/emulsion-emulators-n64.png?cache=x)

## Metadata & cover art

Emulsion supports both manual curation and batch automation.

### Built-in behavior

By default, Emulsion can fetch useful game information and images even without extra setup.

### Optional APIs

Add keys in **Settings** to improve coverage:

- **SteamGridDB** — strong image coverage
- **GiantBomb** — optional extra source
- **OPDB** — especially relevant for **VPX / pinball metadata and images**

### Sources currently used

**Text / metadata**
- Wikipedia
- OPDB for VPX

**Images**
- Wikimedia / Wikipedia
- SteamGridDB
- GiantBomb
- OPDB for VPX

All fetched assets are stored alongside your games:

- `images/`
- `metadata/`

## Controls

### Home carousel

| Action | Keyboard | Controller |
|---|---|---|
| Navigate platforms | <kbd>←</kbd> <kbd>→</kbd> | D-Pad left / right |
| Select platform | <kbd>Enter</kbd> | A / Cross |
| Jump to Settings | <kbd>Home</kbd> / <kbd>End</kbd> | — |
| Exit | <kbd>Ctrl+Q</kbd> | B / Circle |

### Gallery

| Action | Keyboard | Controller |
|---|---|---|
| Move selection | Arrows | D-Pad |
| Switch platforms | <kbd>Shift+←</kbd> <kbd>Shift+→</kbd> | <kbd>L1</kbd> <kbd>R1</kbd> |
| Jump 10 rows | <kbd>PgUp</kbd> <kbd>PgDn</kbd> | — |
| Launch game | <kbd>Enter</kbd> | A / Cross |
| Open cover / image menu | <kbd>I</kbd> | X / Square |
| Back to home | <kbd>Esc</kbd> | B / Circle |

### Global shortcuts

| Action | Keyboard | Controller |
|---|---|---|
| Open Emulsion menu | <kbd>/</kbd> | Start |
| Exit emulator / game back to Emulsion | <kbd>Ctrl+Shift+K</kbd> | Select + D-Pad Down |
| Reload Emulsion | <kbd>F5</kbd> | — |
| Restart Emulsion | <kbd>Shift+F5</kbd> | Select + D-Pad Up |
| Toggle fullscreen | <kbd>F11</kbd> | — |

### Mouse

- **Left click**: open / launch
- **Right click**: game image / cover menu
- **Wheel**: navigate

## Command line

```bash
emulsion [options]

Options:
  --help
  --full-screen
  --kiosk
  --auto-select=[gallery_name]
  --no-ui
  --verbose
```

### Notes

- `--auto-select` supports platform names, plus `recents` and `favorites`
- `--no-ui` is meant for use with `--kiosk` and `--auto-select`
- Emulsion also supports `--control-scheme=pinball` for cabinet-oriented controls

### Example

```bash
emulsion --kiosk --full-screen --auto-select=snes
```

### Cabinet / pinball example

```bash
emulsion --kiosk --full-screen --auto-select=vpx --no-ui --control-scheme=pinball
```

## Platforms

Current platform keys include:

- `atari`
- `amstrad`
- `spectrum`
- `c64`
- `nes`
- `sms`
- `pcengine`
- `amiga`
- `megadrive`
- `gameboy`
- `lynx`
- `gamegear`
- `snes`
- `jaguar`
- `saturn`
- `ps1`
- `n64`
- `dreamcast`
- `ps2`
- `gamecube`
- `xbox`
- `psp`
- `ps3`
- `3ds`
- `xbox360`
- `ps4`
- `vpx`
- plus `recents` and `favorites`

Not every platform has to be enabled. Emulsion is happy with a tiny curated setup or a giant all-in-one cabinet build.

## Data locations

Typical Linux paths:

- Main config: `~/.config/emulsion/preferences.json`
- Recents: `~/.config/emulsion/recently_played.json`
- Favorites: `~/.config/emulsion/favorites.json`

Per-platform content lives next to your games:

- `your-games-folder/images/`
- `your-games-folder/metadata/`

## Contributing

### Found a bug?

[Report it on GitLab](https://gitlab.com/yphil/emulsion/-/issues)

### Have an idea?

[Open an issue](https://gitlab.com/yphil/emulsion/-/issues)

### Want to contribute code?

Contributions are welcome.

## Support the project

<div align="center">

[![LiberaPay](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/yphil/donate)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Buy_Me_Coffee-FF5E5B?logo=ko-fi&logoColor=white&style=for-the-badge)](https://ko-fi.com/yphil)

</div>

## License

Emulsion is open source under the [GPL v3](LICENSE).

## Links

- [Website](https://yphil.gitlab.io/emulsion)
- [Releases](https://github.com/yphil-dev/emulsion/releases)
- [GitLab (primary)](https://gitlab.com/yphil/emulsion)
- [GitHub (mirror)](https://github.com/yphil-dev/Emulsion)
- [Blog](https://yphil.gitlab.io/)

---

<div align="center">

*This repository is a mirror of the official [GitLab repo](https://gitlab.com/yphil/emulsion).*

[Back to top](#emulsion)

</div>

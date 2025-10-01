[![CI/CD](https://img.shields.io/github/actions/workflow/status/yPhil-gh/emulsion/.github/workflows/ci.yml?style=flat)](https://github.com/yPhil-gh/emulsion/actions)
[![Release](https://img.shields.io/github/v/release/yPhil-gh/emulsion?style=flat)](https://github.com/yPhil-gh/emulsion/releases)
[![License](https://img.shields.io/github/license/yPhil-gh/emulsion?style=flat)](https://github.com/yPhil-gh/emulsion/blob/main/LICENSE)
[![LiberaPay](https://img.shields.io/liberapay/receives/yphil.svg?logo=liberapay&style=flat)](https://liberapay.com/yphil/donate)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support_Me-FF5E5B?logo=ko-fi&logoColor=white&style=flat)](https://ko-fi.com/yphil)

<div align="center">

# 🎮 Emulsion

### *The Ultimate Frontend for Your Gaming Collection*

**One interface. All your emulators. Zero hassle.**

[🌐 Website](https://yphil.gitlab.io/emulsion) • [📦 Download](https://github.com/yPhil-gh/emulsion/releases/latest) • [📖 Docs](#configuration) • [💬 Community](https://gitlab.com/yphil/emulsion/-/issues)

![Emulsion Hero](https://yphil.gitlab.io/images/emulsion-screenshot00.png?cache=xyz)

</div>

---

## ✨ Why Emulsion?

**Tired of juggling dozens of different emulator interfaces?** Emulsion brings everything together in one beautiful, responsive frontend that just works.

### 🚀 Key Features

- **🎯 True Unification** - All your emulators, one elegant interface
- **📂 Flexible Storage** - Games across multiple drives? No problem!
- **🖼️ Smart Cover Art** - Manually curate your collection with images from multiple sources
- **🎮 Universal Input** - Keyboard, mouse, or any game controller
- **📱 Responsive Design** - Adapts perfectly to any screen size
- **🔧 Non-Invasive** - Doesn't mess with your emulator configs
- **⚡ Reproducible** - One config file = instant gaming PC setup
- **🏠 Arcade Ready** - Perfect for driving an arcade cabinet

### 💎 What Makes It Different

Unlike other solutions that try to do everything (and often break things), Emulsion focuses on what matters:

- ✅ **Respects your setup** - Works with YOUR emulators, YOUR way
- ✅ **No controller drama** - Uses your existing configurations
- ✅ **Curated art selection** - YOU choose the perfect cover, not some algorithm
- ✅ **Rock solid** - It Won't Randomly Forget Your Setup™
- ✅ **One config file** - Backup, restore, or share your entire setup in seconds

---

## 📥 Installation

### 🎁 Pre-built Packages (Recommended)

<table>
<tr>
<td width="50%">

#### 🐧 Linux

- [**Debian Package (.deb)**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_amd64.deb)
- [**AppImage**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x86_64.AppImage)

</td>
<td width="50%">

#### 🪟 Windows

- [**Installer (.exe)**](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x64.exe)  
  *(Note: Unsigned, you may need to allow it)*

</td>
</tr>
</table>

👉 [**All Releases**](https://github.com/yphil-gh/emulsion/releases/latest)

### 🛠️ From Source

```bash
npm install && npm start
```

---

## 🚀 Quick Start

**Get gaming in 5 minutes:**

1. **🎮 Get some games** - Let's say NES ROMs
2. **📦 Install an emulator** - e.g., `sudo apt install nestopia`
3. **🔧 Open Emulsion** → Settings → NES
   - 📁 **Games Directory**: Browse to your NES games folder
   - 🎯 **Emulator**: Enter `nestopia`
   - 📝 **Extensions**: `.zip` (already default!)
4. **🎉 Done!** - Start gaming!

> 💡 **Pro Tip**: Your config lives in `~/.config/emulsion/preferences.json` - back it up!

---

## ⚙️ Configuration

![Settings Screenshot](https://yphil.gitlab.io/images/emulsion-01-platform_config.png?xxx)

### Per-Platform Settings

| Setting | Description |
|---------|-------------|
| **📁 Games Directory** | Where your ROMs live for this platform |
| **🎮 Emulator** | The emulator executable (name or full path) |
| **⚙️ Emulator Arguments** | Optional flags (most emulators don't need any) |
| **📝 Extensions** | File types to scan for (e.g., `.zip`, `.iso`) |

### 🎮 Emulator Quick Reference

Here's what works great on our machines:

| Platform | 🏆 Recommended Emulator | Arguments | Extensions |
|----------|------------------------|-----------|------------|
| NES | **[Nestopia](https://nestopia.sourceforge.net/)** | `--fullscreen` | `.zip` |
| SMS | **[Mednafen](https://mednafen.github.io/)** | | `.zip` |
| Amiga | **[AmiBerry](https://github.com/BlitterStudio/amiberry)** | | `.lha`, `.adf` |
| Mega Drive | [Blastem](https://www.retrodev.com/blastem/) | `-m gen -f` | `.md` |
| SNES | [Mesen](https://www.mesen.ca/) | | `.smc` |
| PSX | [DuckStation](https://github.com/stenzek/duckstation) | `-fullscreen -nogui` | `.cue` |
| N64 | **[Mupen64Plus](https://mupen64plus.org/)** | | `.z64` |
| Dreamcast | [Flycast](https://github.com/flyinghead/flycast) | | `.gdi`, `.cdi` |
| PS2 | **[PCSX2](https://pcsx2.net/)** | `-nogui -fullscreen` | `.iso` |
| GameCube | [Dolphin](https://dolphin-emu.org/) | `-b -e` | `.iso`, `.ciso` |
| PS3 | [RPCS3](https://rpcs3.net/) | `--no-gui` | `.SFO` |

**Bold names** = Available in Ubuntu repos! Install with: `apt install nestopia mednafen amiberry mupen64plus pcsx2`

---

## 🖼️ Cover Art Magic

Press <kbd>□</kbd> or <kbd>I</kbd> to browse and select the perfect cover art for any game.

### 🔑 API Keys (Optional but Recommended)

Get **way more images** by adding these free API keys:

#### 🎨 SteamGridDB
1. Login at [steamgriddb.com](https://www.steamgriddb.com/)
2. Get your key from Preferences
3. Paste into Emulsion Settings

#### 🎮 GiantBomb
1. Get your free key at [giantbomb.com/api](https://www.giantbomb.com/api/)
2. Paste into Emulsion Settings

### 📚 All Image Sources

- 🔐 [SteamGridDB](https://www.steamgriddb.com/) (API - Best coverage)
- 🔐 [GiantBomb](https://www.giantbomb.com/api/) (API - Great metadata)
- 🌐 [MobyGames](https://mobygames.com) (Web scraping)
- 🌐 [Exotica](https://www.exotica.org.uk/) (Web scraping)
- 🌐 [Wikipedia](https://en.wikipedia.org/) (Web scraping)
- 🌐 [UVList](https://www.uvlist.net/) (Web scraping)

*Images are saved to `~/.config/emulsion/covers/[platform]/[game].jpg`*

---

## 🎯 Controls

### 🏠 Home Screen

| Action | ⌨️ Keyboard | 🎮 Controller |
|--------|------------|--------------|
| Navigate platforms | <kbd>←</kbd> <kbd>→</kbd> | <kbd>◄</kbd> <kbd>►</kbd> D-Pad |
| Select platform | <kbd>Enter</kbd> | <kbd>⤫</kbd> A/Cross |
| Exit | <kbd>Ctrl+Q</kbd> | <kbd>○</kbd> B/Circle |

### 📚 Game Gallery

| Action | ⌨️ Keyboard | 🎮 Controller |
|--------|------------|--------------|
| Browse games | <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | D-Pad |
| Switch platforms | <kbd>Shift+←</kbd> <kbd>Shift+→</kbd> | <kbd>L1</kbd> <kbd>R1</kbd> |
| Jump 10 rows | <kbd>PgUp</kbd> <kbd>PgDn</kbd> | - |
| **🚀 LAUNCH GAME** | <kbd>Enter</kbd> | <kbd>⤫</kbd> A/Cross |
| Cover art menu | <kbd>I</kbd> | <kbd>□</kbd> X/Square |
| Back to home | <kbd>Esc</kbd> | <kbd>○</kbd> B/Circle |

### 🌍 Global Shortcuts

| Action | ⌨️ Keyboard | 🎮 Controller |
|--------|------------|--------------|
| Kill emulator (return to Emulsion) | <kbd>Ctrl+Shift+K</kbd> | Select + <kbd>▼</kbd> |
| Reload Emulsion | <kbd>F5</kbd> | - |
| Restart Emulsion | <kbd>Shift+F5</kbd> | Select + <kbd>▲</kbd> |

### 🖱️ Mouse Support

- **Left Click**: Launch game / Select cover art
- **Right Click**: Open game menu
- **Scroll Wheel**: Navigate

*💡 Contextual hints appear in the footer based on current screen*

---

## 💻 Command Line

```bash
emulsion [options]

Options:
  --kiosk                        🔒 Read-only mode (perfect for kids/arcade)
  --full-screen                  🖥️ Start fullscreen
  --auto-select=PLATFORM         ⚡ Jump directly to a platform
  --help                         ❓ Show this help

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

## 🤝 Contributing

### 💰 Support the Project

Love Emulsion? Consider supporting development:

<div align="center">

[![LiberaPay](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/yphil/donate)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Buy_Me_Coffee-FF5E5B?logo=ko-fi&logoColor=white&style=for-the-badge)](https://ko-fi.com/yphil)

</div>

### 🐛 Found a Bug?

[Report it on GitLab](https://gitlab.com/yphil/emulsion/-/issues) - We track everything there!

### 💡 Have an Idea?

[Open an issue](https://gitlab.com/yphil/emulsion/-/issues) and let's discuss it!

### 👨‍💻 Want to Code?

[Check out our issues](https://gitlab.com/yphil/emulsion/-/issues) - contributions welcome!

---

## 📜 License

Emulsion is open source under the [MIT License](LICENSE).

---

## 🔗 Links

- 🌐 [Website](https://yphil.gitlab.io/emulsion)
- 📦 [Releases](https://github.com/yPhil-gh/emulsion/releases)
- 🔧 [GitLab (Primary)](https://gitlab.com/yphil/emulsion)
- 🔨 [GitHub (Mirror)](https://github.com/yPhil-gh/Emulsion)
- 📝 [Blog](https://yphil.gitlab.io/)

---

<div align="center">

**Made with ❤️ by gamers, for gamers**

*This repository is a mirror of the official [GitLab repo](https://gitlab.com/yphil/emulsion)*

[⬆️ Back to top](#-emulsion)

</div>

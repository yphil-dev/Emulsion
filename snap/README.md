# Emulsion Snap Package

This directory contains the Snap packaging for Emulsion, a retro game launcher.

## Building the Snap

### Prerequisites
- **LXD** (Linux Containers) - required for building snaps
- **Snapcraft** - the build tool

### Build Steps

1. Install Snapcraft:
   ```bash
   snap install snapcraft --classic
   ```

2. Install LXD (when prompted by snapcraft):
   ```bash
   # snapcraft will ask to install LXD - answer 'y'
   cd snap
   snapcraft
   ```

3. Build the Snap package:
   ```bash
   cd snap
   snapcraft
   ```

4. Install the resulting .snap file:
   ```bash
   sudo snap install emulsion_0.9.31_amd64.snap --dangerous
   ```

### Alternative: Manual Testing

If you don't want to set up LXD, you can test the packaging manually:

```bash
# Extract the Linux build
tar -xf https://github.com/yPhil-gh/Emulsion/releases/download/0.9.31/linux-unpacked.tar.gz
cd linux-unpacked

# Test that it runs
./emulsion --no-sandbox
```

The Snap package provides the same functionality with better system integration.

## About Classic Confinement

This Snap uses **classic confinement** which gives the application full system access, similar to traditional .deb packages. This is necessary for a game launcher that needs to:

- Scan arbitrary directories for game files
- Launch external emulators and games
- Access the full filesystem

Users will see a warning about classic confinement when installing, which is expected and appropriate for this type of application.

## Why Not Strict Confinement?

Strict confinement (like Flatpak) uses sandboxing that prevents applications from accessing the full filesystem. While this works for many applications, game launchers need unrestricted access to scan game directories and launch executables.

The document portal system used by Flatpak/strict Snaps is designed for individual file access, not recursive directory scanning, making it unsuitable for game launchers.

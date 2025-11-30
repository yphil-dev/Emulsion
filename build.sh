#!/usr/bin/env bash

# See .gitlab-ci.yml for build system dependancies

# mkdir -pv dist

packageName() {
    echo "$(jq -r '.name' package.json)"
}

author() {
    echo "$(jq -r '.author.name' package.json) <$(jq -r '.author.email' package.json)>"
}

PACKAGE_NAME=$(packageName)
PACKAGE_VERSION=$(jq -r '.version' package.json)

echo "Building $PACKAGE_NAME v$PACKAGE_VERSION"

# Build ; This cleans, too, see package.json
npm run build

modify_atexit() {
  local file="$1"
  sed -i '39,48c\
atexit()\
{\
  if [ $isEulaAccepted == 1 ] ; then\
    if [ $NUMBER_OF_ARGS -eq 0 ] ; then\
      exec "$BIN" "--no-sandbox"\
    else\
      exec "$BIN" "${args[@]}" "--no-sandbox"\
    fi\
  fi\
}' "$file"
}

createAppData() {
    local appdir="$1"
    echo "Creating AppData file..."

    # Create metainfo and applications directories
    mkdir -p "${appdir}/usr/share/metainfo"
    mkdir -p "${appdir}/usr/share/applications"

    # Generate desktop file on the fly
    cat > "${appdir}/usr/share/applications/io.gitlab.yphil.emulsion.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Emulsion
Comment=Display your games collection into responsive galleries, manage game metadata, cover art and emulator configuration. Launch your games in style.
Exec=emulsion %U
Icon=emulsion
Categories=Utility;Game;
StartupNotify=true
EOF

    # Create AppData XML
    cat > "${appdir}/usr/share/metainfo/io.gitlab.yphil.emulsion.appdata.xml" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>io.gitlab.yphil.emulsion</id>
  <metadata_license>CC0-1.0</metadata_license>
  <project_license>GPL-3.0</project_license>
  <name>Emulsion</name>
  <summary>Better gaming through chemistry</summary>
  <description>
    <p>Display your games collection into responsive galleries, manage game metadata, cover art and emulator configuration. Launch your games in style.</p>
  </description>
  <launchable type="desktop-id">io.gitlab.yphil.emulsion.desktop</launchable>
  <screenshots>
    <screenshot type="default">
      <image>https://yphil.gitlab.io/images/emulsion-screenshot_01.png</image>
    </screenshot>
    <screenshot type="default">
      <image>https://yphil.gitlab.io/images/emulsion-screenshot_02.png</image>
    </screenshot>
  </screenshots>
  <url type="homepage">https://yphil.gitlab.io/emulsion</url>
  <categories>
    <category>Game</category>
    <category>Utility</category>
  </categories>
  <releases>
    <release version="${PACKAGE_VERSION}" date="$(date +%Y-%m-%d)"/>
  </releases>
  <content_rating type="oars-1.1" />
  <developer id="https://yphil.gitlab.io">
    <name>yPhil</name>
  </developer>
</component>
EOF
}

doAppImage() {
    local pkg="Emulsion-${PACKAGE_VERSION}-x86_64.AppImage"
    echo "Processing $pkg..."
    if [ -f "dist/emulsion_x86_64.AppImage" ]; then
        cd ./dist/
        ./emulsion_x86_64.AppImage --appimage-extract

        # Create AppData file for app store integration
        createAppData "./squashfs-root"

        # cp -v ../AppRun ./squashfs-root/AppRun
        modify_atexit "./squashfs-root/AppRun"
        rm -rfv ./squashfs-root/locales/*
        # ../appimagetool-x86_64.AppImage squashfs-root "Emulsion-${PACKAGE_VERSION}-x86_64.AppImage"
        echo "PWD: $(pwd) name: $pkg"
        if command -v ../bin/appimagetool-x86_64.AppImage &> /dev/null; then
            echo "Using appimagetool from PATH"
            ../bin/appimagetool-x86_64.AppImage squashfs-root "$pkg"
        else
            # We are in GitLab CI/CD
            echo "In the repo: $(ls -la ../)"
            echo "Using local ../appimagetool-x86_64.AppImage"
            ../appimagetool-x86_64.AppImage squashfs-root "$pkg"
        fi
        cd ..
    fi
}


doAppImage

echo "In dist: $(ls -la ./dist/)"

echo "Post-build process for $PACKAGE_NAME v$PACKAGE_VERSION complete."

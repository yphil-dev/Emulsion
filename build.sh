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

doAppImage() {
    local pkg="${PACKAGE_NAME}_x86_64.AppImage"
    echo "Processing $pkg..."
    if [ -f "dist/$pkg" ]; then
        cd ./dist/
        ./"$pkg" --appimage-extract
        # cp -v ../AppRun ./squashfs-root/AppRun
        modify_atexit "./squashfs-root/AppRun"
        rm -rfv ./squashfs-root/locales/*
        # ../appimagetool-x86_64.AppImage squashfs-root "$PACKAGE_NAME.AppImage"
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

# Yeah :|

doAppImage

# cd ..

echo "In dist: $(ls -la ./dist/)"

# rm -v ./emulsion.desktop
# rm -rfv ./DEBIAN/
# rm -rfv ./out/

# rm -rfv ./squashfs-root/

echo "Post-build process for $PACKAGE_NAME v$PACKAGE_VERSION complete."

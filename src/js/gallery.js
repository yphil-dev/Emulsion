import { getPlatformInfo, PLATFORMS } from './platforms.js';
import { safeFileName, cleanFileName, stripExtensions, scanDirectory, findImageFile } from './utils.js';
import { getPreference, incrementNbGames } from './preferences.js';
import { openPlatformMenu } from './menu.js';

export async function buildGalleries (preferences, userDataPath) {
    return new Promise(async (resolve, reject) => {
        try {
            const galleriesContainer = document.getElementById('galleries');
            let i = 0;
            const platforms = Object.keys(preferences);

            for (const platformName of platforms) {
                let prefs = preferences[platformName];

                if (prefs) {
                    let gamesDir, viewMode, emulator, emulatorArgs, extensions, isEnabled, index;
                    if (platformName === 'settings') {
                        gamesDir = 'none';
                        emulator = 'none';
                        emulatorArgs = 'none';
                        extensions = 'none';
                        index = 0; // Settings is always index 0
                    } else {
                        gamesDir = prefs.gamesDir;
                        viewMode = prefs.viewMode;
                        emulator = prefs.emulator;
                        emulatorArgs = prefs.emulatorArgs;
                        extensions = prefs.extensions;
                        isEnabled = prefs.isEnabled;
                        index = i + 1; // Platforms start from index 1
                    }
                    const params = {
                        platform: platformName,
                        gamesDir,
                        viewMode,
                        emulator,
                        emulatorArgs,
                        userDataPath,
                        index: index,
                        platforms,
                        extensions,
                        isEnabled
                    };

                    const container = await buildGallery(params);
                    if (container) {
                        galleriesContainer.appendChild(container);
                    }

                    if (platformName !== 'settings' && prefs.isEnabled) {
                        LB.enabledPlatforms.push(platformName);
                        i++;
                    }
                } else if (platformName === 'settings') {
                    const params = {
                        platform: platformName,
                        gamesDir: 'none',
                        emulator: 'none',
                        emulatorArgs: 'none',
                        userDataPath,
                        index: 0, // Settings is always index 0
                        platforms,
                        extensions: 'none'
                    };
                    const container = await buildGallery(params);
                    if (container) {
                        galleriesContainer.appendChild(container);
                    }
                    // Don't increment i for settings
                } else {
                    reject('No prefs for ' + platformName);
                }
            }

            if (LB.recentlyPlayedPolicy === 'show') {
                const recentGallery = await buildRecentGallery({ userDataPath, index: platforms.length });
                if (recentGallery) {
                    galleriesContainer.appendChild(recentGallery);
                }
                platforms.push("recents");
            }


            if (LB.favoritesPolicy === 'show') {
                const favGallery = await buildFavoritesGallery({ userDataPath, index: platforms.length });
                if (favGallery) {
                    galleriesContainer.appendChild(favGallery);
                }
                platforms.push("favorites");
            }

            resolve(platforms);
        } catch (error) {
            reject(error);
        }
    });
}

export async function buildGallery(params) {
    const {
        platform,
        gamesDir,
        viewMode,
        emulator,
        emulatorArgs,
        index,
        platforms,
        extensions,
        isEnabled
    } = params;

    const platformInfo = getPlatformInfo(platform);

    document.getElementById('loading-platform-name').textContent = platform;

    const page = document.createElement('div');
    page.classList.add('page');
    page.dataset.index = index;
    page.dataset.platform = platform;
    page.dataset.viewMode = viewMode;

    // SETTINGS page
    if (platform === 'settings') {
        if (LB.kioskMode) {
            page.dataset.status = 'disabled';
            page.appendChild(document.createElement('div')); // empty placeholder
            return page;
        }
        const settingsContent = buildSettingsPageContent(platforms);
        page.appendChild(settingsContent);
        return page;
    }

    const pageContent = document.createElement('div');
    pageContent.classList.add('page-content');
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    if (!isEnabled) {
        page.dataset.status = 'disabled';
        page.appendChild(pageContent);
        return page;
    }

    const imagesDir = path.join(gamesDir, 'images');
    const getEbootPath = (gameFile) => path.join(path.dirname(gameFile), 'USRDIR', 'EBOOT.BIN');

    async function getPs3GameTitleSafe(filePath) {
        try {
            return await ipcRenderer.invoke('parse-sfo', filePath);
        } catch (err) {
            console.error('Failed to parse SFO:', err);
            return null;
        }
    }

    const gameFiles = await scanDirectory(gamesDir, extensions, true);

    if (gameFiles.length === 0) {
        const emptyGameContainer = document.createElement('div');
        emptyGameContainer.classList.add('empty-platform-game-container');
        // emptyGameContainer.style.gridColumn = `1 / span 2`;

        emptyGameContainer.style.gridColumn = `1 / span ${LB.galleryNumOfCols}`;

        const iconP = document.createElement('p');
        const titleP = document.createElement('p');
        const textCode = document.createElement('code');

        titleP.textContent = `No game files found in `;
        textCode.innerHTML = gamesDir;
        titleP.appendChild(textCode);

        page.dataset.empty = true;

        const icon = document.createElement('i');
        icon.className = 'fa fa-heartbeat fa-5x';
        icon.setAttribute('aria-hidden', 'true');

        const confButton = document.createElement('button');
        confButton.classList.add('button');
        confButton.textContent = `Configure ${getPlatformInfo(platform).vendor} ${getPlatformInfo(platform).name}`;

        confButton.addEventListener('click', () => openPlatformMenu(platform));

        iconP.appendChild(icon);
        emptyGameContainer.appendChild(iconP);
        emptyGameContainer.appendChild(titleP);
        emptyGameContainer.appendChild(confButton);

        pageContent.appendChild(emptyGameContainer);
        page.appendChild(pageContent);
        return page;
    }

    for (const [i, originalGameFilePath] of gameFiles.entries()) {
        let gameFilePath = originalGameFilePath;
        let fileName = path.basename(gameFilePath);
        let fileNameWithoutExt = stripExtensions(fileName, extensions);
        let displayName = cleanFileName(fileNameWithoutExt);

        // PS3 special handling
        if (platform === 'ps3') {
            const ps3Title = await getPs3GameTitleSafe(gameFilePath);
            if (ps3Title) {
                fileNameWithoutExt = safeFileName(ps3Title);
                displayName = ps3Title;
            } else {
                fileNameWithoutExt = stripExtensions(fileName);
                displayName = cleanFileName(fileNameWithoutExt);
            }
            gameFilePath = getEbootPath(originalGameFilePath);
        }

        const coverPath = findImageFile(imagesDir, fileNameWithoutExt);
        const imageExists = fs.existsSync(coverPath);

        const gameContainer = buildGameContainer({
            platform,
            emulator,
            emulatorArgs,
            filePath: gameFilePath,
            displayName,
            dataName: fileNameWithoutExt,
            imagePath: coverPath,
            imageExists,
            index: i
        });

        incrementNbGames(platform);
        pageContent.appendChild(gameContainer);
    }

    page.appendChild(pageContent);
    return page;
}

export function buildGameContainer({
    platform,
    emulator,
    emulatorArgs,
    filePath,
    displayName,
    dataName,
    imagePath,
    imageExists,
    index
}) {
    const container = document.createElement('div');
    container.classList.add('game-container');
    container.title = `${displayName}

- File: ${filePath}
- Click to launch with ${emulator}
- Right-click to fetch cover art image`;

    container.dataset.gameName = dataName;
    container.dataset.platform = platform;
    container.dataset.command = `${emulator} ${emulatorArgs} ${filePath}`;
    container.dataset.emulator = emulator;
    container.dataset.emulatorArgs = emulatorArgs;
    container.dataset.gamePath = filePath;
    container.dataset.index = index;

    const imgEl = document.createElement('img');
    imgEl.classList.add('game-image');
    imgEl.src = imageExists ? imagePath : path.join(LB.baseDir, 'img', 'missing.png');
    if (!imageExists) container.dataset.missingImage = true;
    if (!imageExists) imgEl.classList.add('missing-image');

    const label = document.createElement('div');
    label.classList.add('game-label');
    label.textContent = displayName;

    container.appendChild(imgEl);
    container.appendChild(label);

    return container;
}

async function buildFavoritesGallery({ index }) {
    const favorites = LB.favorites;

    if (!favorites || favorites.length === 0 || favorites.error) {
        console.log("No favorite entries found.");
        return null;
    }

    const page = document.createElement('div');
    page.classList.add('page');
    page.dataset.index = index;
    page.dataset.platform = 'favorites';
    page.dataset.viewMode = LB.favoritesViewMode;

    const pageContent = document.createElement('div');
    pageContent.classList.add('page-content');
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    for (const [i, favorite] of favorites.entries()) {
        try {
            const gamesDir = await getPreference(favorite.platform, 'gamesDir');
            const coverPath = findImageFile(path.join(gamesDir, 'images'), favorite.gameName);
            const imageExists = coverPath && fs.existsSync(coverPath);

            const displayName = cleanFileName(favorite.gameName);

            console.log("favorite.gamePath: ", favorite.gamePath);

            const gameContainer = buildGameContainer({
                platform: favorite.platform,
                emulator: favorite.emulator,
                emulatorArgs: favorite.emulatorArgs,
                filePath: favorite.gamePath,
                displayName: displayName,
                dataName: favorite.gameName,
                imagePath: coverPath,
                imageExists,
                index: i
            });

            pageContent.appendChild(gameContainer);

        } catch (err) {
            console.error('Failed to get platform preference:', err);
        }
    }

    page.appendChild(pageContent);
    return page;
}

async function buildRecentGallery({ index }) {
    const recents = LB.recents;
    if (!recents || recents.length === 0 || recents.error) {
        console.log("No recent entries found.");
        return null;
    }

    const sortedRecents = [...recents].sort((a, b) => new Date(b.date) - new Date(a.date));

    const page = document.createElement('div');
    page.classList.add('page');
    page.dataset.index = index;
    page.dataset.platform = 'recents';

    const pageContent = document.createElement('div');
    pageContent.classList.add('page-content');
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    for (const [i, recent] of sortedRecents.entries()) {
        try {
            const gamesDir = await getPreference(recent.platform, 'gamesDir');
            const coverPath = findImageFile(path.join(gamesDir, 'images'), recent.fileName);
            const imageExists = coverPath && fs.existsSync(coverPath);

            const gameContainer = buildGameContainer({
                platform: recent.platform,
                emulator: recent.emulator,
                emulatorArgs: recent.emulatorArgs,
                filePath: recent.filePath,
                displayName: recent.gameName,
                dataName: recent.fileName,
                imagePath: coverPath,
                imageExists,
                index: i
            });

            pageContent.appendChild(gameContainer);

        } catch (err) {
            console.error('Failed to get platform preference:', err);
        }
    }

    page.appendChild(pageContent);
    return page;
}

function buildSettingsPageContent(platforms) {
    const pageContent = document.createElement('div');
    pageContent.classList.add('page-content');

    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    let i = 0;
    platforms.forEach((platformName) => {
        // if (platformName === "settings") return;

        const platformContainer = document.createElement('div');
        platformContainer.setAttribute('data-platform', platformName);
        platformContainer.classList.add('game-container', 'platform-container');
        platformContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';

        platformContainer.title = platformName;
        platformContainer.classList.add('settings');
        platformContainer.setAttribute('data-name', platformName);
        platformContainer.setAttribute('data-index', i);

        const platformInfo = getPlatformInfo(platformName);

        const platformNameElement = document.createElement('div');
        platformNameElement.classList.add('platform-info');

        const vendorSpan = document.createElement('span');
        vendorSpan.classList.add('vendor');
        vendorSpan.textContent = platformInfo.vendor;

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('name');
        nameSpan.textContent = platformInfo.name;

        const lineBreak = document.createElement('br');

        platformNameElement.appendChild(vendorSpan);
        platformNameElement.appendChild(lineBreak);
        platformNameElement.appendChild(nameSpan);

        const platformImage = document.createElement('img');

        platformImage.src = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);

        platformImage.classList.add('platform-image');
        platformImage.classList.add('game-image');

        platformContainer.appendChild(platformNameElement);
        platformContainer.appendChild(platformImage);

        pageContent.appendChild(platformContainer);
        i++;
    });

    return pageContent;
}



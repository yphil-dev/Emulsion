import { getPlatformInfo, PLATFORMS } from './platforms.js';
import { safeFileName,
         cleanFileName,
         stripExtensions,
         scanDirectory,
         getPs3GameName,
         getEbootPath,
         findImageFile } from './utils.js';
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
        const emptyContainer = buildEmptyPageGameContainer(platform, gamesDir);
        page.dataset.empty = true;
        pageContent.appendChild(emptyContainer);
        page.appendChild(pageContent);
        return page;
    }

    for (const [i, originalGameFilePath] of gameFiles.entries()) {
        let gameFilePath = originalGameFilePath;
        let fileName = path.basename(gameFilePath);
        let fileNameWithoutExt = stripExtensions(fileName, extensions);

        // PS3 special handling
        if (platform === 'ps3') {
            const ps3Title = await getPs3GameName(gameFilePath);
            if (ps3Title) {
                fileNameWithoutExt = safeFileName(ps3Title);
            } else {
                fileNameWithoutExt = stripExtensions(fileName);
            }
            gameFilePath = getEbootPath(originalGameFilePath);
        }

        const gameContainer = buildGameContainer({
            platform,
            emulator,
            emulatorArgs,
            filePath: gameFilePath,
            gameName: fileNameWithoutExt,
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
    gameName,
    index
}) {
    const container = document.createElement('div');
    const gamesDir = LB.preferences[platform].gamesDir;
    const cleanName = cleanFileName(gameName);
    const coverPath = findImageFile(path.join(gamesDir, 'images'), gameName);
    const platformBadge = document.createElement('div');
    platformBadge.className = 'platform-badge';
    platformBadge.textContent = platform;
    container.classList.add('game-container');
    container.title = `${cleanName}

- File: ${filePath}
- Click to launch with ${emulator}
- Right-click to fetch cover art image`;

    container.dataset.gameName = gameName;
    container.dataset.cleanName = cleanName;
    container.dataset.platform = platform;
    container.dataset.command = `${emulator} ${emulatorArgs} ${filePath}`;
    container.dataset.emulator = emulator;
    container.dataset.emulatorArgs = emulatorArgs;
    container.dataset.gamePath = filePath;
    container.dataset.index = index;

    const gameImage = document.createElement('img');
    gameImage.classList.add('game-image');
    gameImage.src = coverPath ? coverPath : path.join(LB.baseDir, 'img', 'missing.png');
    if (!coverPath) container.dataset.missingImage = true;
    if (!coverPath) gameImage.classList.add('missing-image');

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('game-container-image');

    const label = document.createElement('div');
    label.classList.add('game-label');

    label.setAttribute('lang', 'en');


    const labelText = document.createElement('div');
    label.textContent = cleanName;

    imageContainer.appendChild(gameImage);
    container.appendChild(imageContainer);
    container.appendChild(platformBadge);
    container.appendChild(label);

    return container;
}

async function buildFavoritesGallery({ index }) {
    const favorites = LB.favorites;

    const noFavorites = (!favorites || favorites.length === 0 || favorites.error);

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

            const gameContainer = buildGameContainer({
                platform: favorite.platform,
                emulator: favorite.emulator,
                emulatorArgs: favorite.emulatorArgs,
                filePath: favorite.gamePath,
                gameName: favorite.gameName,
                index: i
            });

            pageContent.appendChild(gameContainer);

        } catch (err) {
            console.error('Failed to get platform preference:', err);
        }
    }

    if (noFavorites) {
        const emptyContainer = buildEmptyPageGameContainer();
        pageContent.appendChild(emptyContainer);

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
    page.dataset.viewMode = LB.recentlyPlayedViewMode;

    const pageContent = document.createElement('div');
    pageContent.classList.add('page-content');
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    for (const [i, recent] of sortedRecents.entries()) {
        try {

            const gameContainer = buildGameContainer({
                platform: recent.platform,
                emulator: recent.emulator,
                emulatorArgs: recent.emulatorArgs,
                filePath: recent.filePath,
                gameName: recent.fileName,
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

export function buildPlatformContainer({
    platformName,
    index,
    galleryNumOfCols
}) {
    const container = document.createElement('div');
    const platformInfo = getPlatformInfo(platformName);

    container.classList.add('game-container', 'platform-container', 'settings');
    container.dataset.platform = platformName;
    container.dataset.name = platformName;
    container.dataset.index = index;

    container.title = platformName;
    container.style.height = `calc(120vw / ${galleryNumOfCols})`;

    const infoDiv = document.createElement('div');
    infoDiv.classList.add('platform-info');

    const vendorSpan = document.createElement('span');
    vendorSpan.classList.add('vendor');
    vendorSpan.textContent = platformInfo.vendor;

    const nameSpan = document.createElement('span');
    nameSpan.classList.add('name');
    nameSpan.textContent = platformInfo.name;

    infoDiv.appendChild(vendorSpan);
    infoDiv.appendChild(document.createElement('br'));
    infoDiv.appendChild(nameSpan);

    const image = document.createElement('img');
    image.src = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
    image.classList.add('platform-image', 'game-image');

    container.appendChild(image);
    container.appendChild(infoDiv);

    return container;
}


function buildSettingsPageContent(platforms) {
    const pageContent = document.createElement('div');
    pageContent.classList.add('page-content');

    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    let i = 0;
    platforms.forEach(platformName => {
        const platformContainer = buildPlatformContainer({
            platformName,
            index: i++,
            galleryNumOfCols: LB.galleryNumOfCols
        });
        pageContent.appendChild(platformContainer);
    });


    return pageContent;
}


export function buildEmptyPageGameContainer(platform, gamesDir) {
    const container = document.createElement('div');
    container.classList.add('empty-platform-game-container');
    container.style.gridColumn = `1 / span ${LB.galleryNumOfCols}`;

    const iconP = document.createElement('p');
    const titleP = document.createElement('p');
    const subTitleP = document.createElement('p');
    const icon = document.createElement('i');
    let confButton = null;

    if (platform && gamesDir) {
        const textCode = document.createElement('code');
        textCode.textContent = gamesDir;

        titleP.textContent = 'No game files found in ';
        titleP.appendChild(textCode);

        icon.className = 'fa fa-heartbeat fa-5x';
        icon.setAttribute('aria-hidden', 'true');
        iconP.appendChild(icon);

        confButton = document.createElement('button');
        confButton.classList.add('button');
        confButton.textContent = `Configure ${getPlatformInfo(platform).vendor} ${getPlatformInfo(platform).name}`;
        confButton.addEventListener('click', () => openPlatformMenu(platform));
    } else {
        titleP.textContent = 'No favorites yet — go add some!';
        subTitleP.textContent = 'Press □ to add the selected game to favorites';

        icon.className = 'fa fa-thumbs-o-down fa-5x';
        iconP.appendChild(icon);
    }

    container.append(iconP, titleP, subTitleP);
    if (confButton) container.append(confButton);

    return container;
}


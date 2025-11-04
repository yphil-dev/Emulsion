import { getPlatformInfo, PLATFORMS } from './platforms.js';
import { cleanFileName,
         stripExtensions,
         scanDirectory,
         getPs3GameName,
         findImageFile } from './utils.js';
import { getPreference, incrementNbGames } from './preferences.js';
import { openPlatformMenu } from './menu.js';

export async function buildGalleries (preferences, userDataPath) {
    return new Promise(async (resolve, reject) => {
        try {
            const galleriesContainer = document.getElementById('galleries');
            let i = 0;
            // Ensure consistent order: settings, platforms in PLATFORMS order, recents, favorites
            const platformNames = PLATFORMS.map(p => p.name).filter(name => preferences[name]);
            const platforms = ['settings', ...platformNames];

            // Prepare all gallery building promises
            const galleryPromises = [];
            const platformParams = [];

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

                    galleryPromises.push(buildGallery(params));
                    platformParams.push({ platformName, prefs, index: platformName === 'settings' ? 0 : i + 1 });

                    if (platformName !== 'settings') {
                        if (prefs.isEnabled) {
                            LB.enabledPlatforms.push(platformName);
                        }
                        i++;
                    }
                } else if (platformName === 'settings') {
                    document.getElementById('loading-platform-name').textContent = 'settings';
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
                    galleryPromises.push(buildGallery(params));
                    platformParams.push({ platformName, prefs: null, index: 0 });
                    // Don't increment i for settings
                } else {
                    reject('No prefs for ' + platformName);
                    return;
                }
            }

            // Build all galleries in parallel
            const galleryContainers = await Promise.all(galleryPromises);

            // Append all containers to DOM in order (maintaining visual consistency)
            galleryContainers.forEach(container => {
                if (container) {
                    galleriesContainer.appendChild(container);
                }
            });

            // Build additional galleries (recents and favorites) in parallel
            const additionalPromises = [];

            if (LB.recentlyPlayedPolicy === 'show') {
                additionalPromises.push(
                    buildRecentGallery({ userDataPath, index: platforms.length })
                        .then(recentGallery => {
                            if (recentGallery) {
                                galleriesContainer.appendChild(recentGallery);
                                platforms.push("recents");
                            }
                        })
                );
            }

            if (LB.favoritesPolicy === 'show') {
                additionalPromises.push(
                    buildFavoritesGallery({ userDataPath, index: LB.recentlyPlayedPolicy === 'hide' ? platforms.length : platforms.length + 1 })
                        .then(favGallery => {
                            if (favGallery) {
                                galleriesContainer.appendChild(favGallery);
                                platforms.push("favorites");
                            }
                        })
                );
            }

            // Wait for additional galleries to complete
            await Promise.all(additionalPromises);

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

    const page = document.createElement('div');
    page.classList.add('page');
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

    const gameFiles = (await scanDirectory(gamesDir, extensions, true))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (gameFiles.length === 0) {
        const emptyContainer = buildEmptyPageGameContainer(platform, gamesDir);
        page.dataset.empty = true;
        pageContent.appendChild(emptyContainer);
        page.appendChild(pageContent);
        return page;
    }

    // Process all games in parallel using Promise.all
    const gameContainerPromises = gameFiles.map(async (gameFilePath, i) => {
        let fileName = path.basename(gameFilePath);
        let fileNameWithoutExt = stripExtensions(fileName, extensions);

        // PS3 special handling - fetch PS3 titles in parallel (but limit concurrency to avoid overwhelming IPC)
        if (platform === 'ps3') {
            try {
                const ps3Title = await getPs3GameName(gameFilePath);
                if (ps3Title) {
                    fileNameWithoutExt = stripExtensions(ps3Title);
                }
            } catch (err) {
                console.warn(`Failed to parse PS3 title for ${gameFilePath}:`, err);
                // Continue with original filename if parsing fails
            }
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
        return gameContainer;
    });

    // Wait for all game containers to be created in parallel
    const gameContainers = await Promise.all(gameContainerPromises);

    // Batch DOM operations - create a document fragment and append all at once
    const fragment = document.createDocumentFragment();
    gameContainers.forEach(container => {
        fragment.appendChild(container);
    });

    // Single DOM operation to append all game containers
    pageContent.appendChild(fragment);

    page.appendChild(pageContent);

    document.getElementById('loading-platform-name').textContent = platform;

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

    document.getElementById('loading-platform-name').textContent = 'favorites';

    const favorites = LB.favorites;

    const noFavorites = (!favorites || favorites.length === 0 || favorites.error);

    const page = document.createElement('div');
    page.classList.add('page');
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

    document.getElementById('loading-platform-name').textContent = 'recents';

    const recents = LB.recents;
    if (!recents || recents.length === 0 || recents.error) {
        console.log("No recent entries found.");
        return null;
    }

    const sortedRecents = [...recents].sort((a, b) => new Date(b.date) - new Date(a.date));

    const page = document.createElement('div');
    page.classList.add('page');
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
    image.style.height = `calc(120vw / ${galleryNumOfCols})`;

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

        icon.className = 'fa fa-folder-open-o fa-5x';
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

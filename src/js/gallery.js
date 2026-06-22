import { getPlatformInfo, PLATFORMS } from './platforms.js';
import { cleanFileName,
         stripExtensions,
         scanDirectory,
         getPs3GameName,
         findImageFile,
         buildIcon,
         extractVpxYear,
         extractVpxVendor,
         syncGameContainerLaunchConfig } from './utils.js';
import { incrementNbGames } from './preferences.js';
import { openPlatformMenu } from './menu.js';

let favoriteGamePaths = new Set();

function isFavoriteGamePath(gamePath) {
    return favoriteGamePaths.has(gamePath);
}

export async function buildGalleries (preferences, userDataPath) {
    return new Promise(async (resolve, reject) => {
        try {
            const galleriesContainer = document.getElementById('galleries');
            favoriteGamePaths = new Set(
                Array.isArray(LB.favorites)
                    ? LB.favorites.map(record => record?.gamePath).filter(Boolean)
                    : []
            );
            let i = 0;
            const platformNames = PLATFORMS.map(p => p.name).filter(name => preferences[name]);
            const platforms = ['settings', ...platformNames];

            for (const platformName of platforms) {
                const prefs = preferences[platformName];
                let params;

                if (prefs) {
                    let gamesDir, viewMode, emulator, emulatorArgs, extensions, isEnabled, index;
                    if (platformName === 'settings') {
                        gamesDir = 'none';
                        emulator = 'none';
                        emulatorArgs = 'none';
                        extensions = 'none';
                        index = 0;
                    } else {
                        gamesDir = prefs.gamesDir;
                        viewMode = prefs.viewMode;
                        emulator = prefs.emulator;
                        emulatorArgs = prefs.emulatorArgs;
                        extensions = prefs.extensions;
                        isEnabled = prefs.isEnabled;
                        index = i + 1;
                    }

                    params = {
                        platform: platformName,
                        gamesDir,
                        viewMode,
                        emulator,
                        emulatorArgs,
                        userDataPath,
                        index,
                        platforms,
                        extensions,
                        isEnabled
                    };

                    if (platformName !== 'settings') {
                        if (prefs.isEnabled) {
                            LB.enabledPlatforms.push(platformName);
                        }
                        i++;
                    }
                } else if (platformName === 'settings') {
                    params = {
                        platform: platformName,
                        gamesDir: 'none',
                        emulator: 'none',
                        emulatorArgs: 'none',
                        userDataPath,
                        index: 0,
                        platforms,
                        extensions: 'none'
                    };
                } else {
                    reject('No prefs for ' + platformName);
                    return;
                }

                const container = await buildGallery(params);
                if (container) {
                    galleriesContainer.appendChild(container);
                }
            }

            if (LB.recentlyPlayedPolicy === 'show') {
                const recentGallery = await buildRecentGallery({ userDataPath, index: platforms.length });
                if (recentGallery) {
                    galleriesContainer.appendChild(recentGallery);
                    platforms.push('recents');
                }
            }

            if (LB.favoritesPolicy === 'show') {
                const favGallery = await buildFavoritesGallery({ userDataPath, index: platforms.length + (LB.recentlyPlayedPolicy === 'show' ? 1 : 0) });
                if (favGallery) {
                    galleriesContainer.appendChild(favGallery);
                    platforms.push('favorites');
                }
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

    document.getElementById('loading-platform-name').textContent = getPlatformInfo(platform).name;

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

    const gameFiles = await scanDirectory(gamesDir, extensions, true);

    // Sort based on sortGamesBy preference
    const sortGamesBy = LB.preferences[platform]?.sortGamesBy || 'name';

    if (sortGamesBy === 'date') {
        gameFiles.sort((a, b) => {
            const yearA = extractVpxYear(path.basename(a));
            const yearB = extractVpxYear(path.basename(b));
            if (yearA !== yearB) return yearA - yearB;
            // Fallback to alphabetical for same year or no year
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });
    } else if (sortGamesBy === 'vendor') {
        gameFiles.sort((a, b) => {
            const vendorA = extractVpxVendor(path.basename(a));
            const vendorB = extractVpxVendor(path.basename(b));
            // Empty vendors go to the end
            if (!vendorA && vendorB) return 1;
            if (vendorA && !vendorB) return -1;
            if (!vendorA && !vendorB) return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
            // Compare vendors first, then by year if same vendor
            const vendorCompare = vendorA.localeCompare(vendorB, undefined, { sensitivity: 'base' });
            if (vendorCompare !== 0) return vendorCompare;
            // Same vendor: sort by year
            const yearA = extractVpxYear(path.basename(a));
            const yearB = extractVpxYear(path.basename(b));
            if (yearA !== yearB) return yearA - yearB;
            // Same vendor and year: sort alphabetically
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });
    } else {
        // Default: sort by name
        gameFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }

    if (gameFiles.length === 0) {

        const emptyContainer = buildEmptyPageGameContainer({
            platform: platform,
            gamesDir: gamesDir,
            context: "no-games",
        });

        page.dataset.empty = true;
        pageContent.appendChild(emptyContainer);
        page.appendChild(pageContent);
        return page;
    }

    const fragment = document.createDocumentFragment();

    for (const [i, gamePath] of gameFiles.entries()) {
        const rawGameFileName = path.basename(gamePath);
        let gameName = stripExtensions(rawGameFileName, extensions);

        if (platform === 'ps3') {
            try {
                const ps3Title = await getPs3GameName(gamePath);
                if (ps3Title) {
                    gameName = stripExtensions(ps3Title);
                }
            } catch (err) {
                console.warn(`Failed to parse PS3 title for ${gamePath}:`, err);
            }
        }

        const gameContainer = await buildGameContainer({
            platform,
            emulator,
            emulatorArgs,
            gamePath,
            gameName,
            index: i
        });

        if (gameContainer) {
            fragment.appendChild(gameContainer);
            incrementNbGames(platform);
        }

        if (i > 0 && i % 32 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    pageContent.appendChild(fragment);
    page.appendChild(pageContent);

    return page;
}

export async function buildGameContainer({
    platform,
    emulator,
    emulatorArgs,
    gamePath,
    gameName,
    index
}) {
    const container = document.createElement('div');
    const gamesDir = LB.preferences[platform]?.gamesDir;
    if (!gamesDir) {
        console.warn(`Platform "${platform}" not found in preferences, skipping game: ${gameName}`);
        return null;
    }
    const cleanName = cleanFileName(gameName);
    const coverPath = await findImageFile(path.join(gamesDir, 'images'), gameName);
    const platformBadge = document.createElement('div');
    platformBadge.className = 'platform-badge';

    // Display vendor/date for VPX* platforms only
    const isVpxPlatform = platform.startsWith('vpx');
    if (isVpxPlatform) {
        const vendor = extractVpxVendor(gameName) || 'N/A';
        const year = extractVpxYear(gameName) || 'N/A';
        platformBadge.textContent = `${vendor} ${year}`;
        platformBadge.style.display = 'block';
    } else {
        platformBadge.textContent = platform;
    }
    container.classList.add('game-container');
    container.dataset.gameName = gameName;
    container.dataset.cleanName = cleanName;
    container.dataset.platform = platform;
    container.dataset.command = `${emulator} ${emulatorArgs} ${gamePath}`;
    container.dataset.emulator = emulator;
    container.dataset.emulatorArgs = emulatorArgs;
    container.dataset.gamePath = gamePath;
    container.dataset.index = index;

    syncGameContainerLaunchConfig(container);

    const gameImage = document.createElement('img');
    gameImage.classList.add('game-image');
    gameImage.src = coverPath ? coverPath : path.join(LB.baseDir, 'img', 'missing.png');
    if (!coverPath) container.dataset.missingImage = true;
    if (!coverPath) gameImage.classList.add('missing-image');

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('game-container-image');

    if (isFavoriteGamePath(gamePath)) {
        const favoriteBadge = document.createElement('img');
        favoriteBadge.className = 'favorite-badge';
        favoriteBadge.src = path.join(LB.baseDir, 'img', 'platforms', 'favorites.png');
        favoriteBadge.alt = 'Favorite';
        imageContainer.appendChild(favoriteBadge);
    }

    const label = document.createElement('div');
    label.classList.add('game-label');

    label.setAttribute('lang', 'en');


    label.textContent = cleanName;

    imageContainer.appendChild(gameImage);
    container.appendChild(imageContainer);
    container.appendChild(platformBadge);
    container.appendChild(label);

    return container;
}

async function buildRecordGalleryPage({ loadingName, pagePlatform, pageViewMode, gameRecords, emptyContext }) {
    document.getElementById('loading-platform-name').textContent = loadingName;

    const page = document.createElement('div');
    page.classList.add('page');
    page.dataset.platform = pagePlatform;
    page.dataset.viewMode = pageViewMode;

    const pageContent = document.createElement('div');
    pageContent.classList.add('page-content');
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    const hasRecords = Array.isArray(gameRecords) && gameRecords.length > 0;
    let appendedCount = 0;

    if (hasRecords) {
        const fragment = document.createDocumentFragment();

        for (const [i, gameRecord] of gameRecords.entries()) {
            try {
                const gameContainer = await buildGameContainer({
                    platform: gameRecord.platform,
                    emulator: '',
                    emulatorArgs: '',
                    gamePath: gameRecord.gamePath,
                    gameName: gameRecord.gameName,
                    index: i
                });

                if (gameContainer) {
                    fragment.appendChild(gameContainer);
                    appendedCount++;
                }
            } catch (err) {
                console.error('Failed to build record gallery item:', err);
            }

            if (i > 0 && i % 32 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        pageContent.appendChild(fragment);
    }

    if (!hasRecords || appendedCount === 0) {
        const emptyContainer = buildEmptyPageGameContainer({
            context: emptyContext,
        });

        page.dataset.empty = true;
        pageContent.appendChild(emptyContainer);
    }

    page.appendChild(pageContent);
    return page;
}

async function buildFavoritesGallery({ index }) {
    const favoriteRecords = Array.isArray(LB.favorites) ? LB.favorites : [];

    return buildRecordGalleryPage({
        loadingName: 'favorites',
        pagePlatform: 'favorites',
        pageViewMode: LB.favoritesViewMode,
        gameRecords: favoriteRecords,
        emptyContext: 'no-favorites'
    });
}

async function buildRecentGallery({ index }) {
    const recentRecords = Array.isArray(LB.recents)
        ? [...LB.recents].sort((recentRecordA, recentRecordB) => new Date(recentRecordB.date) - new Date(recentRecordA.date))
        : [];

    return buildRecordGalleryPage({
        loadingName: 'recents',
        pagePlatform: 'recents',
        pageViewMode: LB.recentlyPlayedViewMode,
        gameRecords: recentRecords,
        emptyContext: 'no-recents'
    });
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

    const vendorDiv = document.createElement('div');
    vendorDiv.classList.add('vendor');
    vendorDiv.textContent = platformInfo.vendor;

    const nameDiv = document.createElement('div');
    nameDiv.classList.add('name');
    nameDiv.textContent = platformInfo.name;

    infoDiv.appendChild(vendorDiv);
    infoDiv.appendChild(nameDiv);

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

export function buildEmptyPageGameContainer({
    platform = null,
    gamesDir = null,
    context = "none",   // "no-games" | "no-favorites" | "no-recents"
} = {}) {

    const container = document.createElement('div');
    container.classList.add('empty-platform-game-container');
    container.style.gridColumn = `1 / span ${LB.galleryNumOfCols}`;

    const iconP = document.createElement('p');
    const titleP = document.createElement('p');
    const subTitleP = document.createElement('p');
    let confButton = null;

    if (context === "no-games") {
        const textCode = document.createElement('code');
        textCode.textContent = gamesDir;

        titleP.textContent = 'No game files found in ';
        titleP.appendChild(textCode);

        const icon = buildIcon("folder-open", "huge");
        iconP.appendChild(icon);

        confButton = document.createElement('button');
        confButton.classList.add('button', 'focused');
        confButton.textContent =
            `Configure ${getPlatformInfo(platform).vendor} ${getPlatformInfo(platform).name}`;
        confButton.addEventListener('click', () => openPlatformMenu(platform));
    } else if (context === "no-favorites") {
        titleP.innerHTML = 'No <span class="accent">Favorites</span> yet — go add some!';
        subTitleP.textContent = 'Press □ to add the selected game to favorites';

        const icon = buildIcon("like", "huge");
        iconP.appendChild(icon);
    } else {
        titleP.innerHTML = 'No <span class="accent">Recents</span> yet — go play!';

        const icon = buildIcon("clock", "huge");
        iconP.appendChild(icon);
    }

    container.append(iconP, titleP, subTitleP);
    if (confButton) container.append(confButton);

    return container;
}

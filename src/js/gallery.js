import { getPlatformInfo, PLATFORMS } from './platforms.js';
import { cleanFileName,
         stripExtensions,
         scanDirectory,
         getPs3GameName,
         getMameNameMap,
         findImageFile,
         buildIcon,
         extractVpxYear,
         extractVpxVendor,
         syncGameContainerLaunchConfig } from './utils.js';
import { incrementNbGames } from './preferences.js';
import { openPlatformMenu } from './menu.js';

let favoriteGamePaths = new Set();
const galleryBuilders = new Map();
const galleryBuildPromises = new Map();
const VIRTUAL_GALLERY_THRESHOLD = 800;
const VIRTUAL_GALLERY_ROWS = 12;

function setLoadingPlatformName(platformName) {
    const loadingPlatformName = document.getElementById('loading-platform-name');
    if (loadingPlatformName) {
        loadingPlatformName.textContent = platformName;
    }
}

function getGalleryPage(platformName) {
    return Array.from(document.querySelectorAll('#galleries .page'))
        .find(page => page.dataset.platform === platformName) || null;
}

function buildGalleryPlaceholder(platformName, viewMode) {
    const page = document.createElement('div');
    page.classList.add('page');
    page.dataset.platform = platformName;
    page.dataset.viewMode = viewMode;
    page.dataset.galleryBuilt = 'false';
    return page;
}

function isFavoriteGamePath(gamePath) {
    return favoriteGamePaths.has(gamePath);
}

function getMameMachineData(mameNameMap, gameName) {
    const machine = mameNameMap?.[gameName];

    return {
        displayName: machine?.displayName || cleanFileName(gameName),
        year: machine?.year || '',
        yearNumber: parseInt(machine?.year, 10) || 0,
        manufacturer: machine?.manufacturer || ''
    };
}

function formatMameBadge(machine) {
    return [machine?.manufacturer, machine?.year].filter(Boolean).join(' ');
}

function createVirtualSpacer() {
    const spacer = document.createElement('div');
    spacer.className = 'virtual-gallery-spacer';
    spacer.style.gridColumn = '1 / -1';
    return spacer;
}

function getVirtualGalleryRowHeight(page) {
    const state = page?._galleryState;
    const firstContainer = state?.pageContent?.querySelector('.game-container');
    const rowGap = parseFloat(getComputedStyle(state.pageContent).rowGap) || 10;
    const measuredHeight = firstContainer?.getBoundingClientRect().height || 0;

    return measuredHeight > 0
        ? measuredHeight + rowGap
        : Math.max(1, Math.round(window.innerHeight * 0.35));
}

function updateVirtualGallerySpacers(page) {
    const state = page?._galleryState;
    if (!state) return;

    const columns = Math.max(1, Number(LB.galleryNumOfCols) || 1);
    state.rowHeight = getVirtualGalleryRowHeight(page);
    const topRows = Math.floor(state.start / columns);
    const bottomRows = Math.ceil((state.records.length - state.end) / columns);

    state.topSpacer.style.height = `${topRows * state.rowHeight}px`;
    state.bottomSpacer.style.height = `${bottomRows * state.rowHeight}px`;
}

async function renderVirtualGalleryWindow(page, targetIndex = 0, renderAll = false) {
    const state = page?._galleryState;
    if (!state) return;

    const columns = Math.max(1, Number(LB.galleryNumOfCols) || 1);
    const rowCount = renderAll
        ? Math.ceil(state.records.length / columns)
        : VIRTUAL_GALLERY_ROWS;
    const boundedTargetIndex = Math.min(
        Math.max(0, targetIndex),
        Math.max(0, state.records.length - 1)
    );
    const targetRow = Math.floor(boundedTargetIndex / columns);
    const startRow = renderAll
        ? 0
        : Math.max(0, targetRow - Math.floor(rowCount / 2));
    const start = startRow * columns;
    const end = renderAll
        ? state.records.length
        : Math.min(state.records.length, (startRow + rowCount) * columns);
    const renderToken = ++state.renderToken;
    const rendered = new Map();
    const scrollTop = page.scrollTop;

    for (let index = start; index < end; index++) {
        const record = state.records[index];
        const gameContainer = await buildGameContainer({ ...record, index });
        if (renderToken !== state.renderToken) return;
        if (gameContainer) rendered.set(index, gameContainer);
    }

    if (renderToken !== state.renderToken) return;

    state.start = start;
    state.end = end;
    state.rendered = rendered;
    state.pageContent.replaceChildren(state.topSpacer, ...rendered.values(), state.bottomSpacer);
    updateVirtualGallerySpacers(page);
    if (page.isConnected) page.scrollTop = scrollTop;

    const selectedContainer = rendered.get(state.selectedIndex);
    selectedContainer?.classList.add('selected');
}

async function buildVirtualGalleryPage(page, pageContent, records) {
    page.dataset.virtualized = 'true';
    pageContent.classList.add(page.dataset.viewMode === 'list' ? 'list' : 'grid');
    page.dataset.gameCount = records.length;
    page._galleryState = {
        records,
        pageContent,
        rendered: new Map(),
        start: 0,
        end: 0,
        selectedIndex: 0,
        renderToken: 0,
        rowHeight: 0,
        renderPromise: null,
        pendingIndex: null,
        topSpacer: createVirtualSpacer(),
        bottomSpacer: createVirtualSpacer()
    };
    page.appendChild(pageContent);
    await renderVirtualGalleryWindow(page);
    return page;
}

export function getGalleryState(page) {
    return page?._galleryState || null;
}

export function getGalleryItemCount(page) {
    return page?._galleryState?.records.length
        ?? page?.querySelectorAll('.game-container:not(.empty-platform-game-container)').length
        ?? 0;
}

export function getGalleryContainer(page, index) {
    const state = page?._galleryState;
    return state ? state.rendered.get(index) || null : page?.querySelectorAll('.game-container')[index] || null;
}

export function getGalleryContainers(page) {
    const state = page?._galleryState;
    return state ? Array.from(state.rendered.values()) : Array.from(page?.querySelectorAll('.game-container') || []);
}

export async function ensureGalleryIndexRendered(page, index) {
    const state = page?._galleryState;
    if (!state) return getGalleryContainer(page, index);

    const boundedIndex = Math.min(
        Math.max(0, index),
        Math.max(0, state.records.length - 1)
    );

    if (state.renderPromise) {
        state.pendingIndex = boundedIndex;
        await state.renderPromise;
    } else if (boundedIndex < state.start || boundedIndex >= state.end) {
        state.pendingIndex = boundedIndex;
        state.renderPromise = (async () => {
            while (state.pendingIndex !== null) {
                const targetIndex = state.pendingIndex;
                state.pendingIndex = null;
                if (targetIndex < state.start || targetIndex >= state.end) {
                    await renderVirtualGalleryWindow(page, targetIndex);
                }
            }
        })().finally(() => {
            state.renderPromise = null;
        });
        await state.renderPromise;
    }

    const container = state.rendered.get(boundedIndex);
    if (container) {
        state.selectedIndex = boundedIndex;
        container.classList.add('selected');
        return container;
    }

    return getGalleryContainer(page, state.selectedIndex);
}

export function refreshVirtualGalleryLayout(page) {
    if (page?._galleryState) updateVirtualGallerySpacers(page);
}

export async function materializeGallery(page) {
    const state = page?._galleryState;
    if (!state) return;

    await renderVirtualGalleryWindow(page, 0, true);
    page._galleryState.pageContent.replaceChildren(
        ...page._galleryState.rendered.values()
    );
    page.dataset.virtualized = 'false';
    page._galleryState = null;
}

export async function buildGalleries (preferences, userDataPath) {
    const galleriesContainer = document.getElementById('galleries');
    const platformNames = PLATFORMS.map(p => p.name).filter(name => preferences[name]);
    const platforms = ['settings', ...platformNames];

    galleryBuilders.clear();
    galleryBuildPromises.clear();
    favoriteGamePaths = new Set(
        Array.isArray(LB.favorites)
            ? LB.favorites.map(record => record?.gamePath).filter(Boolean)
            : []
    );
    LB.enabledPlatforms = [
        'settings',
        ...platformNames.filter(platformName => preferences[platformName]?.isEnabled)
    ];

    const settingsPage = await buildGallery({
        platform: 'settings',
        gamesDir: 'none',
        emulator: 'none',
        emulatorArgs: 'none',
        userDataPath,
        index: 0,
        platforms,
        extensions: 'none'
    });
    settingsPage.dataset.galleryBuilt = 'true';
    galleriesContainer.appendChild(settingsPage);

    platformNames.forEach((platformName, index) => {
        const prefs = preferences[platformName];
        const params = {
            platform: platformName,
            gamesDir: prefs.gamesDir,
            viewMode: prefs.viewMode,
            emulator: prefs.emulator,
            emulatorArgs: prefs.emulatorArgs,
            userDataPath,
            index: index + 1,
            platforms,
            extensions: prefs.extensions,
            isEnabled: prefs.isEnabled
        };

        galleryBuilders.set(platformName, () => buildGallery(params));
        galleriesContainer.appendChild(buildGalleryPlaceholder(platformName, prefs.viewMode));
    });

    if (LB.recentlyPlayedPolicy === 'show') {
        galleryBuilders.set('recents', () => buildRecentGallery({ userDataPath, index: platforms.length }));
        galleriesContainer.appendChild(buildGalleryPlaceholder('recents', LB.recentlyPlayedViewMode));
        platforms.push('recents');
    }

    if (LB.favoritesPolicy === 'show') {
        galleryBuilders.set('favorites', () => buildFavoritesGallery({ userDataPath, index: platforms.length }));
        galleriesContainer.appendChild(buildGalleryPlaceholder('favorites', LB.favoritesViewMode));
        platforms.push('favorites');
    }

    return platforms;
}

export async function ensureGalleryBuilt(platformName) {
    const existingPage = getGalleryPage(platformName);
    if (existingPage?.dataset.galleryBuilt === 'true') {
        return existingPage;
    }

    const builder = galleryBuilders.get(platformName);
    if (!builder) {
        return existingPage;
    }

    if (!galleryBuildPromises.has(platformName)) {
        const buildPromise = (async () => {
            favoriteGamePaths = new Set(
                Array.isArray(LB.favorites)
                    ? LB.favorites.map(record => record?.gamePath).filter(Boolean)
                    : []
            );

            const page = await builder();
            if (!page) return null;

            page.dataset.galleryBuilt = 'true';
            const placeholder = getGalleryPage(platformName);
            if (placeholder) {
                ['active', 'prev', 'next', 'adjacent'].forEach(className => {
                    if (placeholder.classList.contains(className)) {
                        page.classList.add(className);
                    }
                });
                placeholder.replaceWith(page);
            }

            return page;
        })();

        galleryBuildPromises.set(platformName, buildPromise);
        buildPromise.catch(() => galleryBuildPromises.delete(platformName));
    }

    return galleryBuildPromises.get(platformName);
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

    setLoadingPlatformName(getPlatformInfo(platform).name);

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
    const mameNameMap = platform === 'mame'
        ? await getMameNameMap(emulator)
        : {};

    // Sort based on sortGamesBy preference
    const sortGamesBy = LB.preferences[platform]?.sortGamesBy || 'name';

    if (platform === 'mame') {
        gameFiles.sort((a, b) => {
            const gameNameA = stripExtensions(path.basename(a), extensions);
            const gameNameB = stripExtensions(path.basename(b), extensions);
            const machineA = getMameMachineData(mameNameMap, gameNameA);
            const machineB = getMameMachineData(mameNameMap, gameNameB);

            if (sortGamesBy === 'date') {
                if (machineA.yearNumber !== machineB.yearNumber) return machineA.yearNumber - machineB.yearNumber;
                return machineA.displayName.localeCompare(machineB.displayName, undefined, { numeric: true, sensitivity: 'base' });
            }

            if (sortGamesBy === 'vendor') {
                if (!machineA.manufacturer && machineB.manufacturer) return 1;
                if (machineA.manufacturer && !machineB.manufacturer) return -1;
                if (machineA.manufacturer && machineB.manufacturer) {
                    const vendorCompare = machineA.manufacturer.localeCompare(machineB.manufacturer, undefined, { sensitivity: 'base' });
                    if (vendorCompare !== 0) return vendorCompare;
                }
                if (machineA.yearNumber !== machineB.yearNumber) return machineA.yearNumber - machineB.yearNumber;
                return machineA.displayName.localeCompare(machineB.displayName, undefined, { numeric: true, sensitivity: 'base' });
            }

            return machineA.displayName.localeCompare(machineB.displayName, undefined, { numeric: true, sensitivity: 'base' });
        });
    } else if (sortGamesBy === 'date') {
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

    const records = [];

    for (const [i, gamePath] of gameFiles.entries()) {
        const rawGameFileName = path.basename(gamePath);
        let gameName = stripExtensions(rawGameFileName, extensions);
        let displayName;
        let badgeText;

        if (platform === 'ps3') {
            try {
                const ps3Title = await getPs3GameName(gamePath);
                if (ps3Title) {
                    gameName = stripExtensions(ps3Title);
                }
            } catch (err) {
                console.warn(`Failed to parse PS3 title for ${gamePath}:`, err);
            }
        } else if (platform === 'mame') {
            const mameMachine = getMameMachineData(mameNameMap, gameName);
            displayName = mameMachine.displayName;
            badgeText = formatMameBadge(mameMachine);
        }

        records.push({
            platform,
            emulator,
            emulatorArgs,
            gamePath,
            gameName,
            displayName,
            badgeText
        });
        incrementNbGames(platform);

        if (i > 0 && i % 32 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    if (records.length > VIRTUAL_GALLERY_THRESHOLD) {
        return buildVirtualGalleryPage(page, pageContent, records);
    }

    const fragment = document.createDocumentFragment();
    for (const [i, record] of records.entries()) {
        const gameContainer = await buildGameContainer({ ...record, index: i });
        if (gameContainer) fragment.appendChild(gameContainer);
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
    displayName,
    badgeText,
    index
}) {
    const container = document.createElement('div');
    const gamesDir = LB.preferences[platform]?.gamesDir;
    if (!gamesDir) {
        console.warn(`Platform "${platform}" not found in preferences, skipping game: ${gameName}`);
        return null;
    }
    const cleanName = displayName || cleanFileName(gameName);
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
    } else if (platform === 'mame') {
        platformBadge.textContent = badgeText || platform;
        platformBadge.title = badgeText || platform;
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
    setLoadingPlatformName(loadingName);

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
        const records = [];
        const mameNameMaps = new Map();

        for (const [i, gameRecord] of gameRecords.entries()) {
            try {
                let displayName;
                let badgeText;

                if (gameRecord.platform === 'mame') {
                    const mameEmulator = LB.preferences?.mame?.emulator || '';

                    if (!mameNameMaps.has(mameEmulator)) {
                        mameNameMaps.set(mameEmulator, await getMameNameMap(mameEmulator));
                    }

                    const mameNameMap = mameNameMaps.get(mameEmulator) || {};
                    const mameMachine = getMameMachineData(mameNameMap, gameRecord.gameName);
                    displayName = mameMachine.displayName;
                    badgeText = formatMameBadge(mameMachine);
                }

                records.push({
                    platform: gameRecord.platform,
                    emulator: '',
                    emulatorArgs: '',
                    gamePath: gameRecord.gamePath,
                    gameName: gameRecord.gameName,
                    displayName,
                    badgeText
                });
            } catch (err) {
                console.error('Failed to build record gallery item:', err);
            }

            if (i > 0 && i % 32 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        if (records.length > VIRTUAL_GALLERY_THRESHOLD) {
            return buildVirtualGalleryPage(page, pageContent, records);
        }

        const fragment = document.createDocumentFragment();
        for (const [i, record] of records.entries()) {
            const gameContainer = await buildGameContainer({ ...record, index: i });
            if (gameContainer) {
                fragment.appendChild(gameContainer);
                appendedCount++;
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

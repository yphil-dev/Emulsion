import { getPlatformInfo, PLATFORMS } from './platforms.js';
import { safeFileName, cleanFileName, stripExtensions } from './utils.js';

// LB.gallery.buildGalleries now also builds the "recent" gallery
LB.gallery = {
    buildGalleries: async function (preferences, userDataPath) {
        return new Promise(async (resolve, reject) => {
            try {
                const galleriesContainer = document.getElementById('galleries');
                let i = 0;
                const platforms = Object.keys(preferences);

                for (const platformName of platforms) {
                    let prefs = preferences[platformName];

                    if (prefs) {
                        let gamesDir, emulator, emulatorArgs, extensions, isEnabled, index;
                        if (platformName === 'settings') {
                            gamesDir = 'none';
                            emulator = 'none';
                            emulatorArgs = 'none';
                            extensions = 'none';
                            index = i;
                        } else {
                            gamesDir = prefs.gamesDir;
                            emulator = prefs.emulator;
                            emulatorArgs = prefs.emulatorArgs;
                            extensions = prefs.extensions;
                            isEnabled = prefs.isEnabled;
                            index = PLATFORMS.findIndex(p => p.name === platformName);
                        }
                        const params = {
                            platform: platformName,
                            gamesDir,
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
                            index: 0,
                            platforms,
                            extensions: 'none'
                        };
                        const container = await buildGallery(params);
                        if (container) {
                            galleriesContainer.appendChild(container);
                        }
                        i++;
                    } else {
                        reject('No prefs for ' + platformName);
                    }
                }

                if (LB.recentlyPlayedPolicy === 'show') {
                    const recentGallery = await _buildRecentGallery({ userDataPath, index: platforms.length });
                    if (recentGallery) {
                        galleriesContainer.appendChild(recentGallery);
                        i++;
                    }
                    platforms.push("recents");
                }

                resolve(platforms);
            } catch (error) {
                reject(error);
            }
        });
    }
};

async function _buildRecentGallery({ userDataPath, index }) {
    let recents = LB.recents;

    if (!recents || recents.length === 0 || recents.error) {
        console.log("No recent entries found.");
        return null;
    }

    // Sort by date (newest first)
    const sortedRecents = [...recents].sort((a, b) => {
        return new Date(b.date) - new Date(a.date); // Descending order
    });

    const page = document.createElement('div');
    page.classList.add('page');
    page.id = `page${index}`;
    page.setAttribute('data-index', index);
    page.setAttribute('data-platform', 'recents');

    const pageContent = document.createElement('div');
    pageContent.classList.add('page-content');
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    // Use the sorted array
    sortedRecents.forEach((recent, i) => {
        const gameContainer = document.createElement('div');
        gameContainer.classList.add('game-container');

        const date = new Date(recent.date);
        gameContainer.title = `${recent.gameName} (${recent.platform}) - Last played on ${date.toLocaleString()} \n\n- Click to launch with ${recent.emulator}\n- Righ-click to configure`;

        gameContainer.setAttribute('data-game-name', recent.fileName);
        gameContainer.setAttribute('data-platform', recent.platform);
        gameContainer.setAttribute('data-emulator', recent.emulator);
        gameContainer.setAttribute('data-emulator-args', recent.emulatorArgs);
        gameContainer.setAttribute('data-game-path', recent.filePath);
        gameContainer.setAttribute('data-index', i);

        let coverImagePath = findImageFile(
            path.join(userDataPath, "covers", recent.platform),
            recent.fileName
        );
        const missingImagePath = path.join(LB.baseDir, 'img', 'missing.png');
        const isImgExists = (coverImagePath && fs.existsSync(coverImagePath));
        const gameImage = document.createElement('img');
        gameImage.src = isImgExists ? coverImagePath : missingImagePath;
        gameImage.classList.add('game-image');
        if (!isImgExists) {
            gameImage.classList.add('missing-image');
        }

        const gameLabel = document.createElement('div');
        gameLabel.classList.add('game-label');
        gameLabel.textContent = recent.gameName;

        gameContainer.appendChild(gameLabel);
        gameContainer.appendChild(gameImage);
        pageContent.appendChild(gameContainer);
    });

    page.appendChild(pageContent);
    return page;
}

// Recursively scan a directory for files with specific extensions.
// If recursive is false, only the top-level directory is scanned.
// If gamesDir is invalid, it returns an empty array.
async function scanDirectory(gamesDir, extensions, recursive = true, ignoredDirs = ['PS3_EXTRA', 'PKGDIR', 'freezer', 'tmp']) {
    let files = [];

    // Sort extensions by longest first to prioritize multi-part matches
    const sortedExts = [...new Set(extensions)].sort((a, b) => b.length - a.length); // Dedupe and sort

    if (!gamesDir || typeof gamesDir !== 'string') {
        console.warn("scanDirectory: Invalid directory path provided:", gamesDir);
        return files;
    }

    try {
        const items = await fsp.readdir(gamesDir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(gamesDir, item.name);

            if (item.isDirectory()) {
                if (ignoredDirs.includes(item.name)) continue;
                if (recursive) files.push(...await scanDirectory(fullPath, extensions, recursive, ignoredDirs));
            } else {
                // Check if filename ENDS WITH any allowed extension (case-insensitive)
                const lowerName = item.name.toLowerCase();
                const match = sortedExts.find(ext => lowerName.endsWith(ext.toLowerCase()));
                if (match) files.push(fullPath);
            }
        }
    } catch (err) {
        console.error("Error reading directory:", gamesDir, err);
    }

    return files;
}

const imageFormats = ['jpg', 'png', 'webp'];

function findImageFile(basePath, fileNameWithoutExt) {
    for (const format of imageFormats) {
        const imagePath = path.join(basePath, `${fileNameWithoutExt}.${format}`);
        if (fs.existsSync(imagePath)) {
            return imagePath;
        }
    }
    return null;
}

function buildSettingsPageContent(platforms) {
    const pageContent = document.createElement('div');
    pageContent.classList.add('page-content');

    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    let i = 0;
    platforms.forEach((platformName) => {
        // if (platformName === "settings") return;

        const platformContainer = document.createElement('div');
        platformContainer.classList.add('game-container', 'platform-container');
        platformContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';

        platformContainer.title = platformName;
        platformContainer.classList.add('settings');
        platformContainer.setAttribute('data-platform', platformName);
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

async function buildGallery(params) {

    const platform = params.platform;
    const gamesDir = params.gamesDir;
    const emulator = params.emulator;
    const emulatorArgs = params.emulatorArgs;
    const userDataPath = params.userDataPath;
    const index = params.index;
    const platforms = params.platforms;
    const extensions = params.extensions;
    const isEnabled = params.isEnabled;

    document.getElementById('loading-platform-name').textContent = platform;

    const galleryContainer = document.createElement('div');
    galleryContainer.id = `page-${platform}`;
    galleryContainer.classList.add('gallery');
    galleryContainer.tabindex = -1;

    const page = document.createElement('div');
    page.classList.add('page');
    page.id = `page${index}`;
    page.setAttribute('data-index', index);

    page.setAttribute('data-platform', platform);

    let pageContent;

    if (platform === "settings") {
        if (LB.kioskMode) {
            pageContent = document.createElement('div');
            page.setAttribute('data-status', 'disabled');
        } else {
            pageContent = buildSettingsPageContent(platforms);
        }
    } else {
        pageContent = document.createElement('div');
        pageContent.classList.add('page-content');

        pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

        if (!isEnabled) {
            pageContent.textContent = '';

            const gameContainer = document.createElement('div');
            gameContainer.classList.add('game-container');
            // gameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
            gameContainer.setAttribute('data-platform', platform);

            pageContent.appendChild(gameContainer);
            page.setAttribute('data-status', 'disabled');
            page.appendChild(pageContent);
            return page;
        }

        const gameFiles = await scanDirectory(gamesDir, extensions, true);

        function getEbootPath(gameFile) {
            const gameDir = path.dirname(gameFile);
            return path.join(gameDir, 'USRDIR', 'EBOOT.BIN');
        }

        async function getPs3GameTitle(filePath) {
            try {
                return await ipcRenderer.invoke('parse-sfo', filePath);
            } catch (error) {
                console.error('Failed to parse SFO:', error);
                return null;
            }
        }

        if (gameFiles.length > 0) {
            for (let i = 0; i < gameFiles.length; i++) {
                let gameFilePath = gameFiles[i];
                const missingImagePath = path.join(LB.baseDir, 'img', 'missing.png');

                let fileName = path.basename(gameFilePath);
                let fileNameWithoutExt = stripExtensions(fileName);
                let fileNameClean = cleanFileName(fileNameWithoutExt);

                let dataCommand = `${emulator} ${emulatorArgs} ${gameFilePath}`;

                if (platform === 'ps3') {
                    const ps3GameTitle = await getPs3GameTitle(gameFilePath);
                    fileNameWithoutExt = safeFileName(ps3GameTitle);
                    fileNameClean = ps3GameTitle;
                    gameFilePath = getEbootPath(gameFilePath);
                }

                let coverImagePath = findImageFile(path.join(gamesDir, 'images'), fileNameWithoutExt);

                const isImgExists = fs.existsSync(coverImagePath);

                const gameContainer = document.createElement('div');
                gameContainer.classList.add('game-container');
                // gameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
                gameContainer.title = `${fileNameClean} (${fileNameWithoutExt}) real name: ${fileName} \n\n- Click to launch with ${emulator}\n- Righ-click to configure`;
                gameContainer.setAttribute('data-game-name', fileNameWithoutExt);
                gameContainer.setAttribute('data-platform', platform);
                gameContainer.setAttribute('data-command', dataCommand);
                gameContainer.setAttribute('data-emulator', emulator);
                gameContainer.setAttribute('data-emulator-args', emulatorArgs);
                gameContainer.setAttribute('data-game-path', gameFilePath);
                gameContainer.setAttribute('data-index', i);

                const gameImage = document.createElement('img');
                gameImage.src = isImgExists ? coverImagePath : missingImagePath;
                gameImage.classList.add('game-image');

                if (!isImgExists) {
                    gameImage.classList.add('missing-image');
                    gameContainer.setAttribute('data-missing-image', true);
                }

                // Set explicit width and height attributes
                // gameImage.width = columnWidth; // Set width attribute
                // gameImage.height = columnWidth; // Set height attribute (placeholder)

                const gameLabel = document.createElement('div');
                gameLabel.classList.add('game-label');
                gameLabel.textContent = fileNameClean;

                gameContainer.appendChild(gameImage);
                gameContainer.appendChild(gameLabel);
                pageContent.appendChild(gameContainer);
            }
        } else {

            const gameContainer = document.createElement('div');
            gameContainer.classList.add('game-container', 'empty-platform-game-container');
            // gameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
            // gameContainer.style.gridColumn = `1 / span ${LB.galleryNumOfCols}`;
            // gameContainer.style.gridColumn = `2 / calc(${LB.galleryNumOfCols} - 1)`;
            // gameContainer.style.gridColumn = `calc(${LB.galleryNumOfCols} / 2) / span 2`;

            gameContainer.style.gridColumn = `1 / span 2`;

            gameContainer.innerHTML = `<p><i class="fa fa-heartbeat fa-5x" aria-hidden="true"></i></p><p>No game files found in</p><p><code>${gamesDir}</code></p>`;
            pageContent.appendChild(gameContainer);

        }

    }

    page.appendChild(pageContent);

    return page;
}

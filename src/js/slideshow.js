import { getPlatformInfo } from './platforms.js';
import { openPlatformMenu, openGameMenu, closeGameMenu } from './menu.js';
import { updateFooterControlsFor,
         addFavorite,
         removeFavorite,
         updateHeader,
         batchDownload,
         launchGame,
         simulateKeyDown,
         toggleHeaderNavLinks } from './utils.js';
import { updatePreference } from './preferences.js';
import { getMeta, displayMetaData } from './metadata.js';
import { editMetaDialog, toggleFavDialog, launchGameDialog, systemDialog } from './dialog.js';

const main = document.querySelector('main');
const slideshow = document.getElementById("slideshow");
const galleries = document.getElementById("galleries");

let confirmationTimeout = null;

export function initSlideShow(platformToDisplay) {
    LB.mode = 'slideshow';

    main.style.top = 0;

    galleries.style.display = 'none';
    slideshow.style.display = 'flex';

    updateHeader('hide');

    const slides = Array.from(slideshow.querySelectorAll('.slide'));
    let currentIndex = 0;

    if (platformToDisplay) {
        const foundIndex = slides.findIndex(
            s => s.dataset.platform === platformToDisplay || s.dataset.name === platformToDisplay
        );
        if (foundIndex !== -1) currentIndex = foundIndex;
    }

    function updateSlideShow() {
        const totalSlides = slides.length;
        const radius = 90 * totalSlides;

        slides.forEach((slide, i) => {
            const angleIncrement = 360 / totalSlides;
            const angle = angleIncrement * (i - currentIndex);

            slide.style.setProperty('--angle', angle);
            slide.style.setProperty('--radius', radius);

            slide.classList.remove(
                'active', 'prev', 'next', 'adjacent'
            );

            if (i === currentIndex) {
                LB.currentPlatform = slide.dataset.platform;
                slide.classList.add('active');
            } else if (i === (currentIndex - 1 + totalSlides) % totalSlides) {
                slide.classList.add('prev');
            } else if (i === (currentIndex + 1) % totalSlides) {
                slide.classList.add('next');
            } else {
                slide.classList.add('adjacent');
            }
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlideShow();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlideShow();
    }

    // Slide click
    slides.forEach(slide => {
        slide.addEventListener('click', event => {
            console.log("event: ", event);
            event.stopPropagation();
            event.stopImmediatePropagation();
            const slideDiv = event.target.closest('div.slide');

            console.log("slideDiv.classList: ", slideDiv.classList);

            if (slideDiv.classList.contains('active')) {
                console.log("plop: ");
                simulateKeyDown('Enter');
            } else {
                initSlideShow(slideDiv.dataset.platform);
            };
        });
    });

    slideshow.addEventListener('wheel', event => {
        event.preventDefault();
        event.deltaY > 0 ? nextSlide() : prevSlide();
    });

    window.onSlideShowKeyDown = function(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
        case 'ArrowRight':
            nextSlide();
            break;
        case 'ArrowLeft':
            prevSlide();
            break;
        case 'Enter': {
            const activeSlide = slides[currentIndex];
            const platformName = activeSlide.dataset.platform;

            if (platformName === 'settings' && LB.kioskMode) return;

            if (platformName === 'recents' || platformName === 'settings' || platformName === 'favorites') {
                initGallery(platformName);
            } else if (LB.enabledPlatforms.includes(platformName)) {
                initGallery(platformName);
            } else {
                openPlatformMenu(platformName, 'slideshow');
            }

            galleries.style.display = 'flex';
            slideshow.style.display = 'none';
            break;
        }
        case 'Home':
        case 'End':
            initSlideShow('settings');
            break;

        case 'Escape':
            systemDialog('quit');
            break;

        default:
            if (!event.ctrlKey && !event.altKey && !event.metaKey && /^[a-z0-9]$/i.test(event.key)) {
                const key = event.key.toLowerCase();
                const startIndex = currentIndex + 1;
                let matchIndex = -1;

                // forward search
                for (let i = startIndex; i < slides.length; i++) {
                    const name = (slides[i].dataset.platform || slides[i].dataset.name || '').toLowerCase();
                    if (name.startsWith(key)) {
                        matchIndex = i;
                        break;
                    }
                }

                // wrap-around search
                if (matchIndex === -1) {
                    for (let i = 0; i < startIndex; i++) {
                        const name = (slides[i].dataset.platform || slides[i].dataset.name || '').toLowerCase();
                        if (name.startsWith(key)) {
                            matchIndex = i;
                            break;
                        }
                    }
                }

                if (matchIndex >= 0) {
                    currentIndex = matchIndex;
                    updateSlideShow();
                }
            }
            break;
        }

    };

    updateFooterControlsFor('slide-show');

    document.querySelector('footer .back').onclick = () => simulateKeyDown('Escape');

    updateSlideShow();
}

export function buildHomeSlide(platformName, preferences) {

    const slide = document.createElement("div");
    slide.className = "slide";
    slide.id = platformName;
    const platformImgPath = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
    const bgImageUrl = `url("file://${platformImgPath.replace(/\\/g, '/')}")`;

    slide.style.backgroundImage = bgImageUrl;

    const slideContent = document.createElement("div");
    slideContent.className = "slide-content";
    const platformInfo = getPlatformInfo(platformName);
    slideContent.innerHTML = `<p class="vendor">${platformInfo.vendor}</p> <p class="name">${platformInfo.name}</p>`;

    slide.setAttribute('data-platform', platformName);

    slide.appendChild(slideContent);

    if (platformName !== 'settings' &&
        ((LB.kioskMode || LB.disabledPlatformsPolicy === 'hide') && !preferences[platformName]?.isEnabled)) {
        return null;
    }

    slide.setAttribute('data-is-enabled', preferences[platformName]?.isEnabled);

    return slide;
}

function setGalleryFooterControls(pageDataset) {
    if (pageDataset.platform === 'settings') {
        updateFooterControlsFor('settings');
    } else if (pageDataset.empty) {
        updateFooterControlsFor('empty-page');
    } else if (pageDataset.viewMode === 'list') {
        updateFooterControlsFor('gallery-list');
    } else {
        updateFooterControlsFor('gallery');
    }
}

// galleryState.js
export const GalleryState = {
    selectedIndex: 0,
    currentPageIndex: 0,
    gameContainers: [],
    enabledPages: [],
};

export function initGallery(platformNameOrIndex, focusIndex = null) {

    LB.mode = 'gallery';

    main.style.top = '100px';

    const galleries = document.getElementById('galleries');
    const header = document.getElementById('header');

    document.getElementById('slideshow').style.display = 'none';
    galleries.style.display = 'flex';

    const pages = Array.from(galleries.querySelectorAll('.page'));

    GalleryState.enabledPages = pages.filter(p => p.dataset.status !== 'disabled');

    // --- Find target page
    const targetPage = typeof platformNameOrIndex === 'string'
        ? GalleryState.enabledPages.find(p => p.dataset.platform === platformNameOrIndex)
        : (typeof platformNameOrIndex === 'number' && platformNameOrIndex >= 0 && platformNameOrIndex < GalleryState.enabledPages.length)
            ? GalleryState.enabledPages[platformNameOrIndex]
            : null;

    if (!targetPage) {
        console.error('Could not find page for:', platformNameOrIndex, 'falling back to first enabled page');
        targetPage = GalleryState.enabledPages[0];
        if (!targetPage) {
            console.error('No enabled pages found, cannot initialize gallery');
            return;
        }
    }

    GalleryState.currentPageIndex = GalleryState.enabledPages.indexOf(targetPage);

    function initCurrentGallery(page) {

        GalleryState.gameContainers = Array.from(page.querySelectorAll('.game-container'));

        const selected = page.querySelector('.game-container.selected');

        if (!selected && !page.dataset.empty) {
            GalleryState.gameContainers[0].classList.add('selected');
            GalleryState.selectedIndex = 0;
        } else {
            GalleryState.selectedIndex = GalleryState.gameContainers.indexOf(selected);
        }

        if (!page.dataset.listenersAttached) {
            GalleryState.gameContainers.forEach(container => {
                container.addEventListener('click', (event) => {
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    if (container.classList.contains('settings')) {
                        openPlatformMenu(container.dataset.platform, 'settings');
                    } else if (!container.classList.contains('empty-platform-game-container')) {
                        launchGameDialog(container);
                    }

                    GalleryState.gameContainers.forEach(c => c.classList.remove('selected'));
                });

                container.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    GalleryState.gameContainers.forEach(c => c.classList.remove('selected'));
                    container.classList.add('selected');
                    openGameMenu(container);
                });
            });
            page.dataset.listenersAttached = true;
        }

        toggleHeaderNavLinks('show');
        updateHeader(page.dataset.platform);
        setGalleryFooterControls(page.dataset);

    }

    function updateGallery() {
        const activePos = GalleryState.currentPageIndex;

        GalleryState.enabledPages.forEach((page, index) => {
            // Use a more efficient class management approach
            const currentClasses = page.className.split(' ').filter(cls =>
                !['active', 'prev', 'next', 'adjacent'].includes(cls)
            );
            page.className = currentClasses.join(' ');

            if (index === activePos) {
                initCurrentGallery(page);
                LB.currentPlatform = page.dataset.platform;
                page.classList.add('active');

                const pageContent = page.querySelector('.page-content');
                // Reset scroll position when switching pages
                if (pageContent) {
                    pageContent.scrollTop = 0;
                }
                // Ensure the page is scrollable for grid mode
                page.style.overflowY = 'auto';
                page.style.overflowX = 'hidden';

                if (page.dataset.platform === 'recents' || page.dataset.platform === 'favorites') {
                    const platformBadges = page.querySelectorAll('.platform-badge');
                    platformBadges.forEach(badge => {
                        badge.style.display = 'block';
                    });
                }

                if (!page.dataset.empty) {
                    setGalleryViewMode(page.dataset.viewMode);
                }

                updateHeaderControls(page.dataset);
            } else if (index === activePos - 1) {
                page.classList.add('prev');
            } else if (index === activePos + 1) {
                page.classList.add('next');
            } else {
                page.classList.add('adjacent');
            }
        });
    }

    function updateHeaderControls(pageDataset) {

        const headerControls = document.getElementById('header-controls');

        if (LB.kioskMode) {
            headerControls.style.display = 'none';
            return;
        }

        const toggleViewModeButton = document.getElementById('view-mode-toggle-button');
        const metaDataButton = document.getElementById('platform-covers-button');
        const configPlatformButton = document.getElementById('config-platform-button');

        metaDataButton.title = `Get meta data for ${pageDataset.platform} games`;
        configPlatformButton.title = `Configure ${pageDataset.platform}`;

        configPlatformButton.classList.remove('disabled');

        if (pageDataset.empty) {
            toggleViewModeButton.classList.add('disabled');
            metaDataButton.classList.add('disabled');
        } else {
            toggleViewModeButton.classList.remove('disabled');
            metaDataButton.classList.remove('disabled');
        }

        if (pageDataset.platform === 'recents' || pageDataset.platform === 'favorites') {
            configPlatformButton.classList.add('disabled');
            metaDataButton.classList.add('disabled');
        }
    }

    function goToPage(direction = 1) {
        const next = (GalleryState.currentPageIndex + direction + GalleryState.enabledPages.length) % GalleryState.enabledPages.length;
        GalleryState.currentPageIndex = next;
        updateGallery();
    }

    GalleryState.goToNextPage = () => goToPage(1);
    GalleryState.goToPrevPage = () => goToPage(-1);

    galleries.addEventListener('wheel', event => {

        const scrollableDiv = document.querySelector('.game-pane');

        if (scrollableDiv && scrollableDiv.contains(event.target)) {
            // Let normal scrolling happen
            return;
        }

        event.preventDefault();
        if (event.shiftKey) event.deltaY > 0 ? GalleryState.goToNextPage() : GalleryState.goToPrevPage();
        else simulateKeyDown(event.deltaY > 0 ? 'ArrowDown' : 'ArrowUp');
    });

    header.addEventListener('wheel', event => {
        event.preventDefault();
        if (LB.mode === 'gallery') {
            event.deltaY > 0 ? GalleryState.goToNextPage() : GalleryState.goToPrevPage();
        }
    });

    document.getElementById('prev-link').addEventListener('click', function() {
        GalleryState.goToPrevPage();
    });

    document.getElementById('next-link').addEventListener('click', function() {
        GalleryState.goToNextPage();
    });

    document.getElementById('view-mode-toggle-button').addEventListener('click', function() {
        setGalleryViewMode(this.classList.contains('fa-th') ? 'grid' : 'list', true);
    });

    document.getElementById('config-platform-button').addEventListener('click', function() {
        openPlatformMenu(LB.currentPlatform, 'gallery');
    });

    document.getElementById('platform-covers-button').addEventListener('click', function() {
        batchDownload();
    });

    updateGallery();
}

window.onGalleryKeyDown = function onGalleryKeyDown(event) {

    const menu = document.getElementById('menu');

    const isGallery = LB.mode === 'gallery';
    const isGameMenu = LB.mode === 'gameMenu';

    const containers = isGallery
          ? GalleryState.gameContainers
          : Array.from(menu.querySelectorAll('.menu-game-container'));

    const activePage = document.querySelector('.page.active');
    const isListMode = activePage && activePage.querySelector('.page-content') ? activePage.querySelector('.page-content').classList.contains('list') : false;

    const _moveRows = (idx, rows) => {
        const col = idx % LB.galleryNumOfCols;
        const row = Math.floor(idx / LB.galleryNumOfCols);
        return Math.min(Math.max((row + rows) * LB.galleryNumOfCols + col, 0), containers.length - 1);
    };

    switch (event.key) {
    case 'ArrowLeft':
        if (event.shiftKey) {
            GalleryState.goToPrevPage();
            GalleryState.selectedIndex = 1;
        } else {
            if (isListMode && LB.mode === 'gallery') {
                GalleryState.selectedIndex = Math.max(GalleryState.selectedIndex - 1, 0);
            } else {
                if (LB.mode === 'gameMenu' && GalleryState.selectedIndex === 1) {
                    return;
                }
                GalleryState.selectedIndex = (GalleryState.selectedIndex - 1 + containers.length) % containers.length;
            }
        }
        break;

    case 'ArrowRight':
        if (event.shiftKey) {
            const nextPage = GalleryState.goToNextPage();
            if (nextPage) {
                GalleryState.selectedIndex = nextPage;
            }
        } else {
            if (isListMode && LB.mode === 'gallery') {
                GalleryState.selectedIndex = Math.min(GalleryState.selectedIndex + 1, containers.length - 1);
            } else {
                GalleryState.selectedIndex = (GalleryState.selectedIndex + 1) % containers.length;
            }
        }
        break;

    case 'ArrowUp':
        if (isListMode && LB.mode === 'gallery') {
            GalleryState.selectedIndex = Math.max(GalleryState.selectedIndex - 1, 0);
        } else {
            if (LB.mode === 'gameMenu' && GalleryState.selectedIndex === LB.galleryNumOfCols) {
                return;
            }
            GalleryState.selectedIndex = _moveRows(GalleryState.selectedIndex, -1);
        }
        break;

    case 'ArrowDown':
        if (isListMode && LB.mode === 'gallery') {
            GalleryState.selectedIndex = Math.min(GalleryState.selectedIndex + 1, containers.length - 1);
        } else {
            GalleryState.selectedIndex = _moveRows(GalleryState.selectedIndex, 1);
        }
        break;

    case 'PageUp':
        if (isListMode && LB.mode === 'gallery') {
            GalleryState.selectedIndex = Math.max(GalleryState.selectedIndex - 10, 0);
        } else {
            GalleryState.selectedIndex = _moveRows(GalleryState.selectedIndex, -Math.ceil(10 / LB.galleryNumOfCols));
        }
        break;

    case 'PageDown':
        if (isListMode && LB.mode === 'gallery') {
            GalleryState.selectedIndex = Math.min(GalleryState.selectedIndex + 10, containers.length - 1);
        } else {
            GalleryState.selectedIndex = _moveRows(GalleryState.selectedIndex, Math.ceil(10 / LB.galleryNumOfCols));
        }
        break;

    case 'Home':
        GalleryState.selectedIndex = 0;
        break;

    case 'End':
        GalleryState.selectedIndex = containers.length - 1;
        break;

    case 'Escape':
        if (isGameMenu) {
            closeGameMenu();
        } else {
            initSlideShow(activePage.dataset.platform);
        }
        break;

    case 'Enter':
        event.stopPropagation();
        event.stopImmediatePropagation();
        event.preventDefault();

        const selectedContainer = containers[GalleryState.selectedIndex];

        if (isGallery) {
            if (activePage.dataset.platform === 'settings') {
                openPlatformMenu(selectedContainer.dataset.platform, 'settings');
            } else if (!selectedContainer.classList.contains('empty-platform-game-container')) {
                if (LB.launchDialogPolicy === 'show') {
                    launchGameDialog(selectedContainer);
                } else {
                    launchGame(selectedContainer);
                }
            }
        } else {
            closeGameMenu(selectedContainer.querySelector('img').src);
        }
        break;

    case '+':
        if (!LB.kioskMode) {
            handleFavoriteToggle(containers[GalleryState.selectedIndex]);
        }

        break;


    case 'l':
        if (!LB.kioskMode) {
            if (event.ctrlKey) {
                document.getElementById('view-mode-toggle-button').click();
            }
        }
        break;

    case 'i':
        if (!LB.kioskMode) {
            if (event.ctrlKey) {
                const selectedContainer = containers[GalleryState.selectedIndex];
                openGameMenu(selectedContainer);
            }
        }
        break;

    case 'm':
        if (activePage.dataset.platform === 'recents' || activePage.dataset.platform === 'favorites') {
            return;
        }
        if (!LB.kioskMode) {
            if (event.ctrlKey) {
                batchDownload();
            }
        }
        break;

    default:
        if (!event.ctrlKey && !event.altKey && !event.metaKey && /^[a-z0-9]$/i.test(event.key)) {
            const key = event.key.toLowerCase();
            const startIndex = GalleryState.selectedIndex + 1;
            let matchIndex = -1;

            for (let i = startIndex; i < containers.length; i++) {
                const name = (containers[i].dataset.cleanName || containers[i].dataset.gameName || '').toLowerCase();
                if (name.startsWith(key)) {
                    matchIndex = i;
                    break;
                }
            }

            // Wrap-around
            if (matchIndex === -1) {
                for (let i = 0; i < startIndex; i++) {
                    const name = (containers[i].dataset.cleanName || containers[i].dataset.gameName || '').toLowerCase();
                    if (name.startsWith(key)) {
                        matchIndex = i;
                        break;
                    }
                }
            }

            if (matchIndex >= 0) {
                GalleryState.selectedIndex = matchIndex;
            }
        }
        break;

    }

    const selectedContainer = containers[GalleryState.selectedIndex];
    const isEmptyPage = activePage.dataset.empty === 'true';

    containers.forEach((container, index) =>
        container.classList.toggle('selected', index === GalleryState.selectedIndex)
    );

    if (LB.mode === 'gameMenu') {
        selectedContainer.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }

    if (!isEmptyPage && !event.shiftKey && selectedContainer) {
        if (isListMode && (event.key.startsWith('Arrow') || event.key.startsWith('Page') || event.key === 'Home' || event.key === 'End')) {
            updateGamePane(selectedContainer);
        }
        // Manual scroll to replace scrollIntoView
        const scrollContainer = isListMode ? activePage.querySelector('.page-content') : activePage;
        if (scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const itemRect = selectedContainer.getBoundingClientRect();
            const scrollTop = scrollContainer.scrollTop;
            const itemTop = itemRect.top - containerRect.top + scrollTop;
            const itemHeight = itemRect.height;
            const containerHeight = containerRect.height;
            let newScrollTop;
            if (isListMode) {
                // For list mode, scroll to end
                newScrollTop = itemTop - containerHeight + itemHeight;
            } else {
                // For grid mode, center
                newScrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2);
            }
            // Temporarily remove transform for accurate calculation
            const originalTransform = scrollContainer.style.transform;
            scrollContainer.style.transform = 'none';
            if (isListMode) {
                scrollContainer.scrollTop = Math.max(0, newScrollTop);
            } else {
                scrollContainer.scrollTo({
                    top: Math.max(0, newScrollTop),
                    behavior: 'smooth'
                });
            }
            scrollContainer.style.transform = originalTransform;
        }
    }
};


export function initGamepad() {
    const gamepads = navigator.getGamepads();
    const connected = Array.from(gamepads).some(gamepad => gamepad !== null);

    if (connected) {
        console.log('Gamepad connected at startup:', gamepads[0].id);
    } else {
        console.log('No gamepad connected at startup.');
    }

    const buttonStates = {
        0: false, // Cross /South button (X)
        1: false, // Circle /East button (O)
        2: false, // Square / West button
        3: false, // Triangle button
        4: false, // L1 button
        5: false, // R1 button
        6: false, // L2 button
        7: false, // R2 button
        8: false, // Share button
        9: false, // Options button
        10: false, // L3 button (Left stick click)
        11: false, // R3 button (Right stick click)
        12: false, // D-pad up
        13: false, // D-pad down
        14: false, // D-pad left
        15: false, // D-pad right
        16: false, // PS button (Home button)
    };

    // Listen for gamepad connection events
    window.addEventListener('gamepadconnected', (event) => {
        console.log('Gamepad connected:', event.gamepad.id);
        ipcRenderer.invoke('game-controller-init');
        requestAnimationFrame(pollGamepad);
    });

    window.addEventListener('gamepaddisconnected', (event) => {
        console.log('Gamepad disconnected:', event.gamepad.id);
        cancelAnimationFrame(pollGamepad);
    });

    console.log("navigator.getGamepads(): ", navigator.getGamepads());

    function pollGamepad() {
        let animationFrameId = null;
        // If the document doesn't have focus, simply skip processing
        if (!document.hasFocus()) {
            // Optionally, we can cancel polling here
            // or simply schedule the next check
            animationFrameId = requestAnimationFrame(pollGamepad);
            return;
        }

        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[0]; // Use the first connected gamepad

        if (gamepad) {
            [0,1,2,3,4,5,8,12,13,14,15].forEach((buttonIndex) => {
                const button = gamepad.buttons[buttonIndex];
                const wasPressed = buttonStates[buttonIndex];

                if (button.pressed && !wasPressed) {
                    buttonStates[buttonIndex] = true;
                } else if (!button.pressed && wasPressed) {
                    buttonStates[buttonIndex] = false;

                    if (buttonIndex === 12 && buttonStates[8]) {
                        console.log('Share + Up combo!');
                        ipcRenderer.invoke('restart');
                        return;
                    }

                    // Otherwise handle normally
                    handleGameControllerButtonPress(buttonIndex);
                }
            });
        }

        // Continue polling
        animationFrameId = requestAnimationFrame(pollGamepad);
    }

    function handleGameControllerButtonPress(buttonIndex) {

        switch (buttonIndex) {
        case 0:
            simulateKeyDown('Enter');
            break;
        case 1:
            simulateKeyDown('Escape');
            break;
        case 2:
            simulateKeyDown('i');
            break;
        case 3:
            simulateKeyDown('+');
            console.log("3 (triangle)");
            break;
        case 4:
            simulateKeyDown('ArrowLeft', { shift: true });
            break;
        case 5:
            simulateKeyDown('ArrowRight', { shift: true });
            break;
        case 8:
            simulateKeyDown('/');
            break;
        case 12:
            simulateKeyDown('ArrowUp');
            break;
        case 13:
            simulateKeyDown('ArrowDown');
            break;
        case 14:
            simulateKeyDown('ArrowLeft');
            break;
        case 15:
            simulateKeyDown('ArrowRight');
            break;
        }
    }

}

async function setGalleryViewMode(viewMode, save) {

    const viewToggleBtn = document.getElementById('view-mode-toggle-button');
    const page = document.querySelector('.page.active');
    const pageContent = page.querySelector('.page-content');
    const gamePane = page.querySelector('.game-pane');
    const selectedContainer = pageContent.querySelector('.game-container.selected') || pageContent.querySelector('.game-container');

    page.dataset.viewMode = viewMode;
    // pageContent.classList.remove('list');
    viewToggleBtn.classList.remove('fa-list', 'fa-th');

    if (save) {
        if (LB.currentPlatform === 'favorites') {
            await updatePreference('settings', 'favoritesViewMode', viewMode);
        } else if (LB.currentPlatform === 'recents') {
            await updatePreference('settings', 'recentlyPlayedViewMode', viewMode);
        } else {
            await updatePreference(LB.currentPlatform, 'viewMode', viewMode);
        }
    }

    if (viewMode === 'list') {
        pageContent.classList.add('list');
        viewToggleBtn.classList.add('fa-th');
        viewToggleBtn.title = 'Grid mode';
        if (gamePane) {
            gamePane.style.display = 'flex';
        }
        if (selectedContainer) {
            const isEmptyPage = page.dataset.empty === 'true';
            if (!isEmptyPage) {
                await updateGamePane(selectedContainer);
            }
        }
    } else {
        pageContent.classList.remove('list');
        pageContent.classList.add('grid');
        viewToggleBtn.title = 'List mode';
        viewToggleBtn.classList.add('fa-list');
        if (gamePane) {
            gamePane.style.display = 'none';
        }
    }
}

function ensureGamePane(params) {
    const page = document.querySelector('.page.active');
    if (!page) return null;

    let gamePane = page.querySelector('.game-pane');
    if (!gamePane) {
        gamePane = buildGamePane(params);
        page.appendChild(gamePane);
    }

    gamePane.dataset.platformName = params.platformName;
    gamePane.dataset.gameFileName = params.gameFileName;
    gamePane.dataset.cleanName = params.cleanName;

    return gamePane;
}

function buildGamePane(params) {
    const gamePane = document.createElement('div');
    gamePane.classList.add('game-pane');

    const imagePane = document.createElement('div');
    imagePane.classList.add('pane-image');

    const paneImage = document.createElement('img');

    const paneText = document.createElement('div');
    paneText.classList.add('pane-text');

    const paneControls = document.createElement('div');
    paneControls.classList.add('pane-controls');

    const gameTitle = document.createElement('div');
    gameTitle.classList.add('game-title');

    const fetchMetaButton = document.createElement('button');
    fetchMetaButton.classList.add('pane-fetch-meta-button', 'button');

    const metaIcon = document.createElement('i');
    metaIcon.className = 'fa fa-wikidata';
    fetchMetaButton.appendChild(metaIcon);

    const coverArtButton = document.createElement('button');
    coverArtButton.classList.add('pane-edit-cover-art-button', 'button');

    const coverArtIcon = document.createElement('i');
    coverArtIcon.className = 'fa fa-image';
    coverArtButton.appendChild(coverArtIcon);

    const webLinkButton = document.createElement('button');
    webLinkButton.classList.add('pane-web-link-button', 'button');

    const webLinkIcon = document.createElement('i');
    webLinkIcon.className = 'fa fa-external-link';
    webLinkButton.appendChild(webLinkIcon);

    const editMetaButton = document.createElement('button');
    editMetaButton.classList.add('pane-edit-meta-button', 'button');

    const editMetaIcon = document.createElement('i');
    editMetaIcon.className = 'fa fa-pencil';
    editMetaButton.appendChild(editMetaIcon);

    coverArtButton.addEventListener('click', () => {
        const page = document.querySelector('.page.active');
        const selectedContainer = page.querySelector('div.selected');
        openGameMenu(selectedContainer);
    });

    editMetaButton.addEventListener('click', async () => {
        // fetch current meta
        const params = {
            cleanName: gamePane.dataset.cleanName,
            platformName: gamePane.dataset.platformName,
            gameFileName: gamePane.dataset.gameFileName,
            function: 'read-meta'
        };

        try {
            const metaData = await getMeta(params);
            editMetaDialog(params, metaData);
        } catch (err) {
            editMetaDialog(params, {});
        }

    });

    fetchMetaButton.addEventListener('click', async () => {
        fetchMetaButton.classList.add('loading');
        const params = {
            cleanName: gamePane.dataset.cleanName,
            platformName: gamePane.dataset.platformName,
            gameFileName: gamePane.dataset.gameFileName,
            function: 'fetch-meta'
        };

        let gameMetaData;

        try {
            gameMetaData = await getMeta(params);

            console.log("gameMetaData: ", gameMetaData);
            if (!gameMetaData || gameMetaData.error) {
                params.error = true;
            }

        } catch (err) {
            params.error = true;
            console.warn("err: ", err);
        }

        await displayMetaData(params, gameMetaData);

        fetchMetaButton.classList.remove('loading');

    });

    webLinkButton.addEventListener('click', async () => {
        const cleanName = gamePane.dataset.cleanName;
        const query = encodeURIComponent(cleanName);
        const googleUrl = `https://www.duckduckgo.com?q=${query}+(video+game)`;

        ipcRenderer.invoke('go-to-url', googleUrl);
    });

    paneControls.append(fetchMetaButton, coverArtButton, webLinkButton, editMetaButton);

    imagePane.appendChild(paneImage);

    if (!LB.kioskMode) {
        paneText.appendChild(paneControls);
    }

    paneText.appendChild(gameTitle);

    gamePane.appendChild(imagePane);
    gamePane.appendChild(paneText);

    return gamePane;
}

export async function updateGamePane(selectedContainer) {

    const gamePane = ensureGamePane({
        platformName: selectedContainer.dataset.platform,
        gameFileName: selectedContainer.dataset.gameName,
        cleanName: selectedContainer.dataset.cleanName
    });
    const paneText = gamePane.querySelector('.pane-text');
    const imagePane = gamePane.querySelector('.pane-image');

    if (!LB.kioskMode) {
        const webLinkButton = gamePane.querySelector('.pane-web-link-button');
        webLinkButton.title = `Search the web for "${selectedContainer.dataset.cleanName}"`;

        const editMetaButton = gamePane.querySelector('.pane-edit-meta-button');
        editMetaButton.title = `Edit meta data for "${selectedContainer.dataset.cleanName}"`;

        const editCoverArtButton = gamePane.querySelector('.pane-edit-cover-art-button');
        editCoverArtButton.title = `Edit coverArt data for "${selectedContainer.dataset.cleanName}"`;

        const fetchMetaButton = gamePane.querySelector('.pane-fetch-meta-button');
        fetchMetaButton.title = `Fetch meta data from WikiData for "${selectedContainer.dataset.cleanName}"`;
    }

    const imgSrc = selectedContainer.querySelector('img').src;
    imagePane.querySelector('img').src = imgSrc;
    paneText.querySelector('.game-title').textContent = selectedContainer.dataset.cleanName;

    const params = {
        platformName: selectedContainer.dataset.platform,
        gameFileName: selectedContainer.dataset.gameName,
        paneText,
        function: 'read-meta'
    };

    let gameMetaData;

    try {
        gameMetaData = await getMeta(params);

        if (!gameMetaData || gameMetaData.error) {
            params.error = true;
        }

    } catch (err) {
        params.error = true;
        console.warn("err: ", err);
    }

    await displayMetaData(params, gameMetaData);
}

function checkIfFavorite(container) {
    const galleries = document.getElementById('galleries');
    const favPage = galleries.querySelector('.page[data-platform="favorites"] .page-content');

    if (!favPage) return false;

    const favoriteEntry = {
        gameName: container.dataset.gameName,
        gamePath: container.dataset.gamePath,
        command: container.dataset.command,
        emulator: container.dataset.emulator,
        emulatorArgs: container.dataset.emulatorArgs,
        platform: container.dataset.platform
    };

    // Check if this game exists in favorites page
    const existingFavorite = favPage.querySelector(`.game-container[data-game-name="${favoriteEntry.gameName}"][data-game-path="${favoriteEntry.gamePath}"]`);
    return existingFavorite !== null;
}

function handleFavoriteToggle(selectedContainer) {
    if (LB.favoritePendingAction === 'toggle-favorite') {
        // Second press - execute action
        const existingDialog = document.getElementById('favorite-confirmation');
        if (existingDialog) existingDialog.remove();
        LB.favoritePendingAction = null;
        clearTimeout(confirmationTimeout);
        toggleFavorite(selectedContainer);
    } else {
        // First press - show confirmation
        LB.favoritePendingAction = 'toggle-favorite';

        // Check if it's already a favorite to show appropriate message
        const isFavorite = checkIfFavorite(selectedContainer);
        const message = isFavorite
            ? 'Press + again to remove from favorites'
            : 'Press + again to add to favorites';

        toggleFavDialog(message);
    }
}

async function toggleFavorite(container) {
    const isFavorite = checkIfFavorite(container);

    if (isFavorite) {
        await removeFavorite(container);
    } else {
        await addFavorite(container);
    }
}

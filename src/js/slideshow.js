import { getPlatformInfo } from './platforms.js';
import { openPlatformMenu, openGameMenu } from './menu.js';
import { getSelectedGameContainer,
         updateFooterControls,
         updateHeader,
         setKeydown,
         simulateKeyDown,
         toggleFullScreen,
         toggleHeaderNavLinks } from './utils.js';

const main = document.querySelector('main');
const slideshow = document.getElementById("slideshow");
const galleries = document.getElementById("galleries");

export function initSlideShow(platformToDisplay) {
    LB.mode = 'slideshow';

    galleries.style.display = 'none';
    slideshow.style.display = 'flex';

    updateHeader('hide');

    const slides = Array.from(slideshow.querySelectorAll('.slide'));
    let currentIndex = 0;

    // Find start index by platform name or dataset.index
    if (platformToDisplay) {
        const foundIndex = slides.findIndex(
            s => s.dataset.platform === platformToDisplay || s.dataset.name === platformToDisplay
        );
        if (foundIndex !== -1) currentIndex = foundIndex;
    }

    function updateSlideShow() {
        const totalSlides = slides.length;
        const radius = 90 * totalSlides;
        const is3D = LB.homeMenuTheme === '3D';

        slides.forEach((slide, i) => {
            const angleIncrement = 360 / totalSlides;
            const angle = angleIncrement * (i - currentIndex);

            slide.style.setProperty('--angle', angle);
            slide.style.setProperty('--radius', radius);

            slide.classList.remove(
                'active', 'prev-slide-3d', 'prev-slide-flat',
                'next-slide-3d', 'next-slide-flat',
                'adjacent-flat', 'adjacent-3d'
            );

            if (i === currentIndex) {
                LB.currentPlatform = slide.dataset.platform;
                slide.classList.add('active');
            } else if (i === (currentIndex - 1 + totalSlides) % totalSlides) {
                slide.classList.add(is3D ? 'prev-slide-3d' : 'prev-slide-flat');
            } else if (i === (currentIndex + 1) % totalSlides) {
                slide.classList.add(is3D ? 'next-slide-3d' : 'next-slide-flat');
            } else {
                slide.classList.add(is3D ? 'adjacent-3d' : 'adjacent-flat');
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
            event.stopPropagation();
            event.stopImmediatePropagation();
            const slideDiv = event.target.closest('div.slide');

            if (slideDiv.classList.contains('active')) simulateKeyDown('Enter');
            else initSlideShow(slideDiv.dataset.platform);
        });
    });

    // Wheel scroll
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

                if (platformName === 'recents' || platformName === 'settings') {
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
            case 'F5':
                event.shiftKey ? ipcRenderer.invoke('restart') : window.location.reload();
                break;
            case 'F11':
                toggleFullScreen();
                break;
            case 'Escape':
                showQuitConfirmationDialog();
                break;
            case 'q':
                if (event.ctrlKey || event.metaKey) ipcRenderer.invoke('quit').catch(() => window.close());
                break;
        }
    };

    // Footer buttons
    updateFooterControls('dpad', 'button-dpad-ew', 'Platforms', 'on');
    updateFooterControls('shoulders', 'same', 'Platforms', 'off');
    updateFooterControls('west', 'same', 'same', 'off');
    updateFooterControls('east', 'same', 'Exit');

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

    if (platformName === 'recents') {
        slide.setAttribute('data-index', LB.totalNumberOfPlatforms);
        return slide;
    }

    if (platformName !== 'settings' &&
        ((LB.kioskMode || LB.disabledPlatformsPolicy === 'hide') && !preferences[platformName]?.isEnabled)) {
        return null;
    }

    slide.setAttribute('data-index', preferences[platformName].index);
    slide.setAttribute('data-is-enabled', preferences[platformName].isEnabled);

    return slide;
}

function setGalleryFooterControls(platformName) {
    if (platformName === 'settings') {
        updateFooterControls('dpad', 'button-dpad-nesw', 'Platforms', 'on');
        updateFooterControls('shoulders', 'same', 'Platforms', 'on');
        updateFooterControls('west', 'same', 'Cover', 'off');
    } else {
        updateFooterControls('dpad', 'button-dpad-nesw', 'Games', 'on');
        updateFooterControls('west', 'same', 'Cover', 'on');
        updateFooterControls('shoulders', 'same', 'Platforms', 'on');
    }
    updateFooterControls('east', 'same', 'Back');
}

function explodeGameContainer(gameContainer) {
    const numParticles = 12;
    const container = document.body;
    const rect = gameContainer.getBoundingClientRect();
    const colors = ['#FF3B3B', '#FF8C00', '#FFD700', '#32CD32', '#1E90FF', '#8A2BE2'];

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';

        // Random size
        const size = 15 + Math.random() * 25;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        // Random starting offset
        const offsetXStart = (Math.random() - 0.5) * 30; // spread at spawn
        const offsetYStart = (Math.random() - 0.5) * 30;
        particle.style.setProperty('--x-start', offsetXStart + 'px');
        particle.style.setProperty('--y-start', offsetYStart + 'px');
        particle.style.setProperty('--rotation', `${-360 + Math.random() * 720}deg`);

        // Position relative to viewport
        particle.style.left = (rect.left + rect.width / 2 - size / 2) + 'px';
        particle.style.top = (rect.top + rect.height / 2 - size / 2) + 'px';

        // Random direction/distance
        const angle = Math.random() * 2 * Math.PI;
        const distance = 120 + Math.random() * 80; // was 80 + Math.random() * 100

        particle.style.setProperty('--x', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--y', Math.sin(angle) * distance + 'px');

        // Random scale
        particle.style.setProperty('--scale', 1.5 + Math.random() * 1.5);

        // Faster particles
        particle.style.animationDuration = (0.8 + Math.random() * 0.4) + 's';

        particle.addEventListener('animationend', () => particle.remove());

        fragment.appendChild(particle);
    }

    container.appendChild(fragment);
}

function launchGame(gameContainer) {
    explodeGameContainer(gameContainer);

    ipcRenderer.send('run-command', {
        fileName: gameContainer.dataset.gameName,
        filePath: gameContainer.dataset.gamePath,
        gameName: gameContainer.dataset.gameName,
        emulator: gameContainer.dataset.emulator,
        emulatorArgs: gameContainer.dataset.emulatorArgs,
        platform: gameContainer.dataset.platform
    });
}
// galleryState.js
export const GalleryState = {
    selectedIndex: 0,
    currentPageIndex: 0,
    gameContainers: [],
    enabledPages: [],
};

export function initGallery(platformNameOrIndex) {
    LB.mode = 'gallery';

    main.style.top = '100px';

    const galleries = document.getElementById('galleries');
    const header = document.getElementById('header');

    document.getElementById('slideshow').style.display = 'none';
    galleries.style.display = 'flex';
    toggleHeaderNavLinks('show');

    const pages = Array.from(galleries.querySelectorAll('.page'));

    // --- Find target page
    const targetPage = typeof platformNameOrIndex === 'string'
        ? pages.find(p => p.dataset.platform === platformNameOrIndex)
        : pages.find(p => Number(p.dataset.index) === platformNameOrIndex);

    if (!targetPage) return console.error('Could not find page for:', platformNameOrIndex);

    GalleryState.currentPageIndex = Number(targetPage.dataset.index);

    GalleryState.enabledPages = pages.filter(p => p.dataset.status !== 'disabled');

    function initCurrentGallery(page) {
        GalleryState.gameContainers = Array.from(page.querySelectorAll('.game-container'));
        GalleryState.gameContainers.forEach(c => c.classList.remove('selected'));

        if (!page.dataset.listenersAttached) {
            GalleryState.gameContainers.forEach(container => {
                container.addEventListener('click', () => {
                    if (container.classList.contains('settings')) openPlatformMenu(container.dataset.platform);
                    else if (!container.classList.contains('empty-platform-game-container')) launchGame(container);

                    GalleryState.gameContainers.forEach(c => c.classList.remove('selected'));
                });

                container.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    GalleryState.gameContainers.forEach(c => c.classList.remove('selected'));
                    container.classList.add('selected');
                    openGameMenu(container);
                });
            });
            page.dataset.listenersAttached = true;
        }

        updateHeader(page.dataset.platform);
    }

    function updateGallery() {
        const sortedEnabled = GalleryState.enabledPages.sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));
        const activePos = sortedEnabled.findIndex(p => Number(p.dataset.index) === GalleryState.currentPageIndex);

        sortedEnabled.forEach((page, idx) => {
            page.classList.remove('active', 'prev', 'next', 'adjacent');

            if (idx === activePos) {
                initCurrentGallery(page);
                LB.currentPlatform = page.dataset.platform;
                page.classList.add('active');
                setGalleryView(page.dataset.viewMode);
            } else if (idx === activePos - 1) page.classList.add('prev');
            else if (idx === activePos + 1) page.classList.add('next');
            else page.classList.add('adjacent');
        });
    }

    function goToPage(direction = 1) {
        const current = GalleryState.enabledPages.findIndex(p => +p.dataset.index === GalleryState.currentPageIndex);
        const next = (current + direction + GalleryState.enabledPages.length) % GalleryState.enabledPages.length;
        GalleryState.currentPageIndex = +GalleryState.enabledPages[next].dataset.index;
        updateGallery();
    }

    GalleryState.goToNextPage = () => goToPage(1);
    GalleryState.goToPrevPage = () => goToPage(-1);

    // Wheel scrolling
    galleries.addEventListener('wheel', e => {
        e.preventDefault();
        if (e.shiftKey) e.deltaY > 0 ? GalleryState.goToNextPage() : GalleryState.goToPrevPage();
        else simulateKeyDown(e.deltaY > 0 ? 'ArrowDown' : 'ArrowUp');
    });

    header.addEventListener('wheel', e => {
        e.preventDefault();
        e.deltaY > 0 ? GalleryState.goToNextPage() : GalleryState.goToPrevPage();
    });

    document.getElementById('view-mode-toggle-button').addEventListener('click', function() {
        setGalleryView(this.classList.contains('fa-th') ? 'grid' : 'list');
    });

    document.getElementById('config-platform-button').addEventListener('click', function() {
        openPlatformMenu(LB.currentPlatform);
    });

    document.getElementById('platform-covers-button').addEventListener('click', function() {


    });

    updateGallery();
}

window.onGalleryKeyDown = function onGalleryKeyDown(event) {
    const containers = GalleryState.gameContainers;
    if (!containers.length) return;

    const activePage = document.querySelector('.page.active');
    const isListMode = activePage.querySelector('.page-content').classList.contains('list');

    const _moveRows = (idx, rows) => {
        const col = idx % LB.galleryNumOfCols;
        const row = Math.floor(idx / LB.galleryNumOfCols);
        return Math.min(Math.max((row + rows) * LB.galleryNumOfCols + col, 0), containers.length - 1);
    };

    switch (event.key) {
    case 'ArrowLeft':
        GalleryState.selectedIndex = event.shiftKey
            ? GalleryState.goToPrevPage() || GalleryState.selectedIndex
            : isListMode ? Math.max(GalleryState.selectedIndex - 1, 0) : (GalleryState.selectedIndex - 1 + containers.length) % containers.length;
        break;
    case 'ArrowRight':
        GalleryState.selectedIndex = event.shiftKey
            ? GalleryState.goToNextPage() || GalleryState.selectedIndex
            : isListMode ? Math.min(GalleryState.selectedIndex + 1, containers.length - 1) : (GalleryState.selectedIndex + 1) % containers.length;
        break;
    case 'ArrowUp':
        GalleryState.selectedIndex = isListMode ? Math.max(GalleryState.selectedIndex - 1, 0) : _moveRows(GalleryState.selectedIndex, -1);
        break;
    case 'ArrowDown':
        GalleryState.selectedIndex = isListMode ? Math.min(GalleryState.selectedIndex + 1, containers.length - 1) : _moveRows(GalleryState.selectedIndex, 1);
        break;
    case 'Enter':
        const selectedContainer = containers[GalleryState.selectedIndex];
        if (activePage.dataset.platform === 'settings') {
            openPlatformMenu(selectedContainer.dataset.platform);
        } else {
            if (!selectedContainer.classList.contains('empty-platform-game-container')) launchGame(selectedContainer);
        }
        break;
    case 'Escape':
        initSlideShow(activePage.dataset.platform);
        break;
    }

    containers.forEach((c, i) => c.classList.toggle('selected', i === GalleryState.selectedIndex));
    containers[GalleryState.selectedIndex]?.scrollIntoView({ behavior: 'smooth', block: isListMode ? 'end' : 'center' });
}


export function initGamepad () {
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
                    handleButtonPress(buttonIndex);
                }
            });
        }

        // Continue polling
        animationFrameId = requestAnimationFrame(pollGamepad);
    }

    function handleButtonPress(buttonIndex) {

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
            console.log("3 (triangle)");
            break;
        case 4:
            simulateKeyDown('ArrowLeft', { shift: true });
            break;
        case 5:
            simulateKeyDown('ArrowRight', { shift: true });
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

function showQuitConfirmationDialog() {
    LB.mode = 'quit';

    const overlay = document.getElementById('quit-confirmation-overlay');
    const okButton = document.getElementById('quit-ok-button');
    const cancelButton = document.getElementById('quit-cancel-button');

    function openDialog() {
        overlay.style.display = 'flex';
        okButton.blur();
        cancelButton.focus();
    }

    function closeDialog() {
        overlay.style.display = 'none';
        initSlideShow(LB.currentPlatform);
    }

    window.onQuitKeyDown = function onQuitKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        const buttons = [okButton, cancelButton];
        const currentIndex = buttons.indexOf(document.activeElement);

        switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
            const dir = event.key === 'ArrowRight' ? 1 : -1;
            const nextIndex = (currentIndex + dir + buttons.length) % buttons.length;
            buttons[nextIndex].focus();
            break;
        case 'Escape':
            closeDialog();
            break;
        }
    };

    okButton.addEventListener('click', () => { closeDialog(); ipcRenderer.invoke('quit'); });
    cancelButton.addEventListener('click', closeDialog);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDialog(); });

    openDialog();
}

export function setGalleryView(mode = 'grid') {

    const viewToggleBtn = document.getElementById('view-mode-toggle-button');
    const page = document.querySelector('.page.active');
    if (!page) return;

    const pageContent = page.querySelector('.page-content');
    const gamePane = page.querySelector('.game-pane');
    const selectedContainer = pageContent.querySelector('.game-container.selected') || pageContent.querySelector('.game-container');

    // Clear all view classes
    pageContent.classList.remove('list');
    viewToggleBtn.classList.remove('fa-list', 'fa-th');

    if (mode === 'list') {
        // List view settings
        pageContent.classList.add('list');
        viewToggleBtn.classList.add('fa-th'); // Show grid icon to switch TO grid
        if (gamePane) {
            gamePane.style.display = 'flex';
        }
        if (selectedContainer) {
            updateGamePane(selectedContainer);
        }
    } else {
        // Grid view settings
        viewToggleBtn.classList.add('fa-list'); // Show list icon to switch TO list
        if (gamePane) {
            gamePane.style.display = 'none';
        }
    }
}

function buildGamePane() {
    const gamePane = document.createElement('div');
    gamePane.classList.add('game-pane');

    const imagePane = document.createElement('div');
    imagePane.classList.add('image-pane');

    const paneImage = document.createElement('img');
    paneImage.classList.add('pane-image');

    const paneText = document.createElement('div');
    paneText.classList.add('pane-text');

    const gameTitle = document.createElement('p');
    gameTitle.classList.add('game-title');

    imagePane.appendChild(paneImage);
    paneText.appendChild(gameTitle);

    gamePane.appendChild(imagePane);
    gamePane.appendChild(paneText);

    return gamePane;
}

function ensureGamePane() {
    const page = document.querySelector('.page.active');
    if (!page) return null;

    let gamePane = page.querySelector('.game-pane');
    if (!gamePane) {
        gamePane = buildGamePane();
        page.appendChild(gamePane);
    }

    return gamePane;
}

function updateGamePane(selectedContainer) {
    const gamePane = ensureGamePane();

    const imagePane = gamePane.querySelector('.image-pane');
    const paneText = gamePane.querySelector('.pane-text');

    const imgSrc = selectedContainer.querySelector('img')?.src;
    let paneImage = imagePane.querySelector('.pane-image');
    paneImage.src = imgSrc;

    const gameTitle = paneText.querySelector('.game-title');
    gameTitle.textContent = selectedContainer.dataset.gameName;
}

async function closeSettingsOrPlatformMenu() {

    console.warn('CLOSE called', new Date().toISOString(), new Error().stack);

    const menu = document.getElementById('menu');

    updateFooterControls('dpad', 'same', 'Browse', 'on');
    console.log("menuContainer.dataset.menuContext: ", menu.dataset.menuContext);

    if (menu.dataset.menuContext === 'slideshow') {
        initSlideShow(menu.dataset.menuPlatform);
    } else {
        initGallery('settings');
    }

    menu.innerHTML = '';
    menu.style.height = '0';

}

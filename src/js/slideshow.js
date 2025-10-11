import { getPlatformInfo, PLATFORMS } from './platforms.js';
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

let onGalleryKey, onSlideShowKey, onQuitKey;

export function initSlideShow(platformToDisplay) {

    LB.mode = 'slideshow';

    main.style.top = 0;

    galleries.style.display = 'none';
    slideshow.style.display = 'flex';

    updateHeader('hide');

    const slides = Array.from(document.querySelectorAll('#slideshow .slide'));

    const totalSlides = slides.length;
    const radius = 90 * totalSlides;

    // Find start index - support both name-based and index-based
    let currentIndex = 0;
    if (platformToDisplay) {
        if (typeof platformToDisplay === 'string') {
            // Name-based lookup
            const foundIndex = slides.findIndex(s =>
                s.dataset.platform === platformToDisplay ||
                    s.dataset.name === platformToDisplay
            );
            if (foundIndex !== -1) currentIndex = foundIndex;
        } else {
            // Index-based lookup (legacy)
            const idx = slides.findIndex(s => Number(s.dataset.index) === Number(platformToDisplay));
            if (idx !== -1) currentIndex = idx;
        }
    }

    function updateSlideShow() {
        const angleIncrement = 360 / totalSlides;

        slides.forEach((slide, i) => {
            const angle = angleIncrement * (i - currentIndex);
            slide.style.setProperty('--angle', angle);
            slide.style.setProperty('--radius', radius);

            slide.classList.remove(
                'active', 'prev-slide-3d', 'prev-slide-flat',
                'next-slide-3d', 'next-slide-flat',
                'adjacent-flat', 'adjacent-3d'
            );

            const is3D = (LB.homeMenuTheme === '3D');

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
        currentIndex = (currentIndex + 1) % totalSlides;
        updateSlideShow();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateSlideShow();
    }

    slideshow.addEventListener('wheel', (event) => {
        event.preventDefault();
        event.deltaY > 0 ? nextSlide() : prevSlide();
    });

    slides.forEach((slide, i) => {
        slide.addEventListener('click', (event) => {
            event.stopPropagation();
            event.stopImmediatePropagation();

            const slideDiv = event.target.closest('div.slide');

            if (slideDiv.classList.contains('active')) {
                simulateKeyDown('Enter');
            } else { // Adjacent slide
                initSlideShow(slideDiv.dataset.platform);
            }
        });
    });

    function onSlideShowKeyDown(event) {
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
            const activePlatformName = activeSlide.dataset.platform;

            // Always use platform name for navigation - NO MORE INDICES!
            if (activePlatformName === 'settings' && LB.kioskMode) {
                return;
            }

            console.log("LB.mode: ", LB.mode);
            console.log("activePlatformName: ", activePlatformName);

            // Check if platform is enabled or disabled
            if (activePlatformName === 'recents' || activePlatformName === 'settings') {
                // Special platforms - go directly to gallery
                initGallery(activePlatformName);
            } else if (LB.enabledPlatforms.includes(activePlatformName)) {
                // Enabled platform - go directly to platform gallery
                initGallery(activePlatformName);
            } else {
                // Disabled platform - open menu (if policy allows showing disabled platforms)
                openPlatformMenu(activePlatformName, 'slideshow');
            }

            document.getElementById('slideshow').style.display = 'none';
            document.getElementById('galleries').style.display = "flex";
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
            // event.preventDefault();
            toggleFullScreen();
            break;
        case 'Escape':
            if (LB.mode === 'slideshow') {
                showQuitConfirmationDialog();
            }
            if (LB.mode === 'menu') {
                closeSettingsOrPlatformMenu();
            }
            break;
        case 'q':
            if (event.ctrlKey || event.metaKey) {
                ipcRenderer.invoke('quit').catch(() => window.close());
            }
            break;
        }
    }

    updateFooterControls('dpad', 'button-dpad-ew', 'Platforms', 'on');
    updateFooterControls('shoulders', 'same', 'Platforms', 'off');
    updateFooterControls('west', 'same', 'same', 'off');
    updateFooterControls('east', 'same', 'Exit');

    document.querySelector('footer .back').onclick = function() {
        simulateKeyDown('Escape');
    };

    document.addEventListener('keydown', (event) => {
        if (LB.mode === 'gallery' && onGalleryKey) {
            onGalleryKey(event);
        } else if (LB.mode === 'slideshow') {
            onSlideShowKeyDown(event);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (LB.mode === 'gallery' && onGalleryKey) {
            onGalleryKey(event);
        } else if (LB.mode === 'slideshow') {
            onSlideShowKey(event);
        } else if (LB.mode === 'quit' && onQuitKey) {
            onQuitKey(event);
        }
    });


    // setKeydown(onSlideShowKeyDown);
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

// export const GalleryState = {
//   selectedIndex: 0,
//   currentPageIndex: 0,
//   gameContainers: [],
//   enabledPages: [],
//   goToNextPage: null,
//   goToPrevPage: null
// };

export function initGallery(platformNameOrIndex) {
    LB.mode = 'gallery';
    main.style.top = '100px';

    const galleries = document.getElementById('galleries');
    const header = document.getElementById('header');

    document.getElementById('slideshow').style.display = 'none';
    galleries.style.display = 'flex';

    toggleHeaderNavLinks('show');

    const pages = Array.from(galleries.querySelectorAll('.page'));
    let currentPageIndex = 0;
    let gameContainers = [];

    // --- Find target page
    let targetPage = typeof platformNameOrIndex === 'string'
        ? pages.find(p => p.dataset.platform === platformNameOrIndex)
        : pages.find(p => Number(p.dataset.index) === platformNameOrIndex);

    if (!targetPage) return console.error('Could not find page for:', platformNameOrIndex);

    currentPageIndex = Number(targetPage.dataset.index);

    const enabledPages = pages.filter(p => p.dataset.status !== 'disabled');

    function initCurrentGallery(page) {
        setGalleryFooterControls(page.dataset.platform);

        gameContainers = Array.from(page.querySelectorAll('.game-container') || []);
        gameContainers.forEach(c => c.classList.remove('selected'));

        if (!page.dataset.listenersAttached) {
            gameContainers.forEach(container => {
                container.addEventListener('click', (e) => {
                    if (container.classList.contains('settings')) openPlatformMenu(container.dataset.platform);
                    else if (!container.classList.contains('empty-platform-game-container')) launchGame(container);

                    gameContainers.forEach(c => c.classList.remove('selected'));
                });

                container.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    const parentDiv = e.target.closest('div.game-container');
                    document.querySelectorAll('.game-container').forEach(c => c.classList.remove('selected'));
                    parentDiv.classList.add('selected');
                    openGameMenu(parentDiv);
                });
            });
            page.dataset.listenersAttached = true;
        }

        updateHeader(page.dataset.platform);

        document.querySelector('header .prev-link').onclick = goToPrevPage;
        document.querySelector('header .next-link').onclick = goToNextPage;
    }

    function updateGallery() {
        const sortedEnabled = pages.filter(p => p.dataset.status !== 'disabled')
              .sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));

        const activePos = sortedEnabled.findIndex(p => Number(p.dataset.index) === currentPageIndex);
        const prevPage = sortedEnabled[activePos - 1] || null;
        const nextPage = sortedEnabled[activePos + 1] || null;

        pages.forEach(page => {
            const idx = Number(page.dataset.index);
            page.classList.remove('active', 'prev', 'next', 'adjacent');

            if (page.dataset.status === 'disabled') return;

            if (idx === currentPageIndex) {
                initCurrentGallery(page);
                LB.currentPlatform = page.dataset.platform;
                page.classList.add('active');
                setGalleryView(page.dataset.display);
            } else if (prevPage && Number(prevPage.dataset.index) === idx) page.classList.add('prev');
            else if (nextPage && Number(nextPage.dataset.index) === idx) page.classList.add('next');
            else page.classList.add('adjacent');
        });
    }

    function goToPage(direction = 1) {
        const current = enabledPages.findIndex(p => +p.dataset.index === currentPageIndex);
        const next = (current + direction + enabledPages.length) % enabledPages.length;
        currentPageIndex = +enabledPages[next].dataset.index;
        updateGallery();
    }

    const goToNextPage = () => goToPage(1);
    const goToPrevPage = () => goToPage(-1);

    // --- Gallery wheel
    galleries.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.shiftKey) e.deltaY > 0 ? goToNextPage() : goToPrevPage();
        else simulateKeyDown(e.deltaY > 0 ? 'ArrowDown' : 'ArrowUp');
    });

    header.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.deltaY > 0 ? goToNextPage() : goToPrevPage();
    });

    // --- Gallery keyboard handler (exposed globally)
    let selectedIndex = 0;
    onGalleryKey = (event) => {
        const activePageContent = document.querySelector('.page.active .page-content');
        const listMode = activePageContent?.classList.contains('list');

        const _moveRows = (selectedIndex, rowsToMove) => {
            const col = selectedIndex % LB.galleryNumOfCols;
            const row = Math.floor(selectedIndex / LB.galleryNumOfCols);
            return Math.min(Math.max((row + rowsToMove) * LB.galleryNumOfCols + col, 0), gameContainers.length - 1);
        };

        switch (event.key) {
        case 'ArrowLeft':
            if (event.shiftKey) {
                goToPrevPage();
            } else {
                selectedIndex = listMode ? Math.max(selectedIndex - 1, 0) : (selectedIndex - 1 + gameContainers.length) % gameContainers.length;
            }
            break;
        case 'ArrowRight':
            if (event.shiftKey) {
                goToNextPage();
            } else {
                selectedIndex = listMode ? Math.min(selectedIndex + 1, gameContainers.length - 1) : (selectedIndex + 1) % gameContainers.length;
            }
            break;
        case 'ArrowUp': selectedIndex = listMode ? Math.max(selectedIndex - 1, 0) : _moveRows(selectedIndex, -1); break;
        case 'ArrowDown': selectedIndex = listMode ? Math.min(selectedIndex + 1, gameContainers.length - 1) : _moveRows(selectedIndex, 1); break;
        case 'PageUp': selectedIndex = listMode ? Math.max(selectedIndex - 10, 0) : _moveRows(selectedIndex, -10); break;
        case 'PageDown': selectedIndex = listMode ? Math.min(selectedIndex + 10, gameContainers.length - 1) : _moveRows(selectedIndex, 10); break;
        case 'Home': selectedIndex = listMode ? 0 : 3; break;
        case 'End': selectedIndex = gameContainers.length - 1; break;
        case 'Enter':
            console.log("LB.currentPlatform: ", LB.currentPlatform);
            if (LB.currentPlatform === 'settings') {
                openPlatformMenu(gameContainers[selectedIndex].dataset.platform);
            } else {
                launchGame(gameContainers[selectedIndex]);
            }
            break;
        case 'Escape': initSlideShow(document.querySelector('.page.active').dataset.platform); break;
        }

        gameContainers.forEach((c, i) => c.classList.toggle('selected', i === selectedIndex));
        gameContainers[selectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    updateGallery();
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
    const overlay = document.getElementById('quit-confirmation-overlay');
    const okButton = document.getElementById('quit-ok-button');
    const cancelButton = document.getElementById('quit-cancel-button');

    let selectedButton = 'cancel';

    function openDialog() {
        LB.previousMode = LB.mode;   // Save current mode
        LB.mode = 'quit';             // Switch to quit dialog mode
        overlay.style.display = 'flex';
        okButton.blur();
        cancelButton.focus();
    }

    function closeDialog() {
        overlay.style.display = 'none';
        LB.mode = LB.previousMode;    // Restore previous mode
    }

    function confirmQuit() {
        closeDialog();
        ipcRenderer.invoke('quit');
    }

    function cancelQuit() {
        closeDialog();
    }

    // --- Global keydown handler for quit dialog
    onQuitKey = (event) => {
        event.stopPropagation();
        event.stopImmediatePropagation();

        const buttons = [okButton, cancelButton];
        const currentIndex = buttons.indexOf(document.activeElement);

        switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight': {
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
            buttons[nextIndex].focus();
            selectedButton = buttons[nextIndex] === okButton ? 'ok' : 'cancel';
            break;
        }
        case 'Enter':
            if (selectedButton === 'ok') confirmQuit();
            else cancelQuit();
            break;
        case 'Escape':
            cancelQuit();
            break;
        }
    };

    // --- Button click handlers
    okButton.addEventListener('click', confirmQuit);
    cancelButton.addEventListener('click', cancelQuit);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) cancelQuit();
    });

    openDialog();
}


export function setGalleryView(mode = 'grid') {

    const viewToggleBtn = document.getElementById('view-toggle-btn');
    const page = document.querySelector('.page.active');
    if (!page) return;

    const pageContent = page.querySelector('.page-content');
    const gamePane = page.querySelector('.game-pane');
    const selectedContainer = pageContent.querySelector('.game-container.selected') || pageContent.querySelector('.game-container') ;

    if (mode === 'list') {
        pageContent?.classList.add('list');
        viewToggleBtn.classList.remove('fa-th');
        viewToggleBtn.classList.add('fa-list');
        if (gamePane) {
            gamePane.style.display = 'flex';
        }
    } else {
        viewToggleBtn.classList.remove('fa-list');
        viewToggleBtn.classList.add('fa-th');
        pageContent?.classList.remove('list');
        if (gamePane) {
            gamePane.style.display = 'none';
        }
    }

    if (selectedContainer) {
        if (mode === 'list') {
            updateGamePane(selectedContainer);
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

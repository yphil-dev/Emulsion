import { getPlatformInfo } from './platforms.js';
import { openPlatformMenu, openGameMenu } from './menu.js';
import { getSelectedGameContainer,
         updateFooterControls,
         updateHeader,
         setKeydown,
         simulateKeyDown,
         toggleFullScreen,
         toggleHeaderNavLinks } from './utils.js';

export function initSlideShow(platformToDisplay) {

    const slideshow = document.getElementById("slideshow");
    const galleries = document.getElementById("galleries");

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
            showQuitConfirmationDialog();
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

    setKeydown(onSlideShowKeyDown);
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

export function initGallery(platformNameOrIndex) {

    const viewToggleBtn = document.getElementById('view-toggle-btn');

    viewToggleBtn.addEventListener('click', () => {
        const pageContent = document.querySelector('.page.active .page-content');
        setGalleryView(pageContent.classList.contains('list') ? 'grid' : 'list');
        viewToggleBtn.classList.toggle('fa-list');
        viewToggleBtn.classList.toggle('fa-th');
    });

    toggleHeaderNavLinks('show');

    const galleries = document.getElementById('galleries');
    const pages = Array.from(galleries.querySelectorAll('.page'));
    const header = document.getElementById('header');

    let currentPageIndex = 0;
    let gameContainers = [];

    // Find the target page by platform name or fallback to index
    let targetPage = null;
    if (typeof platformNameOrIndex === 'string') {
        // Name-based lookup (preferred)
        targetPage = pages.find(page => page.dataset.platform === platformNameOrIndex);
    } else if (typeof platformNameOrIndex === 'number') {
        // Index-based lookup (fallback for prev/next navigation only)
        targetPage = pages.find(page => Number(page.dataset.index) === platformNameOrIndex);
    }

    if (!targetPage) {
        console.error('Could not find page for:', platformNameOrIndex);
        return;
    }

    currentPageIndex = Number(targetPage.dataset.index);
    const enabledPages = pages.filter(page => page.dataset.status !== 'disabled');

    function initCurrentGallery(page) {

        // page.scrollIntoView({
        //     behavior: "smooth",
        //     block: "start",
        // });

        setGalleryFooterControls(page.dataset.platform);

        gameContainers = Array.from(page.querySelectorAll('.game-container') || []);

        gameContainers.forEach((container) => {
            container.classList.remove('selected');
        });

        // gameContainers.forEach((container) => {
        //     container.classList.toggle('selected', container.dataset.name === LB.currentPlatform);
        // });

        function onGamecontainerClick(event) {
            if (event.currentTarget.classList.contains('empty-platform-game-container')) {
                return;
            }
            if (event.currentTarget.classList.contains('settings')) {
                const platformName = event.currentTarget.dataset.platform;
                openPlatformMenu(platformName);
            } else {
                launchGame(event.currentTarget);
            }
            gameContainers.forEach((container) => {
                container.classList.remove('selected');
            });
        }

        function onGamecontainerRightClick(event) {
            event.preventDefault(); // Prevent the default context menu
            if (event.currentTarget.classList.contains('empty-platform-game-container') || event.currentTarget.classList.contains('platform-container')) {
                return;
            }
            const parentDiv = event.target.closest('div.game-container');
            console.log("parentDiv: ", parentDiv);
            document.querySelectorAll('.game-container').forEach((container) => {
                container.classList.remove('selected');
            });
            parentDiv.classList.add('selected');
            openGameMenu(parentDiv);
        }

        // Only attach listeners once per page to prevent duplicates
        if (!page.dataset.listenersAttached) {
            gameContainers.forEach((container) => {
                container.addEventListener('click', onGamecontainerClick);
                container.addEventListener('contextmenu', onGamecontainerRightClick);
                container.classList.remove('selected');
            });
            page.setAttribute('data-listeners-attached', true);
        }

        updateHeader(page.dataset.platform);

        document.querySelector('header .prev-link').onclick = function() {
            goToPrevPage();
        };

        document.querySelector('header .next-link').onclick = function() {
            goToNextPage();
        };

    }

    function updateGallery() {

        // Filter out disabled pages and sort by dataset.index
        const enabledPages = pages
              .filter(page => page.dataset.status !== 'disabled')
              .sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));

        // Find the active page's position in the enabled array
        const activePos = enabledPages.findIndex(page => Number(page.dataset.index) === currentPageIndex);

        // Determine immediate neighbors
        const prevPage = enabledPages[activePos - 1] || null;
        const nextPage = enabledPages[activePos + 1] || null;

        pages.forEach(page => {
            const pageIndexNumber = Number(page.dataset.index);

            page.classList.remove('active', 'prev', 'next', 'adjacent');

            if (page.dataset.status === 'disabled') {
                return;
            }

            if (pageIndexNumber === currentPageIndex) {
                initCurrentGallery(page);
                LB.currentPlatform = page.dataset.platform;
                page.classList.add('active');
            } else if (prevPage && Number(prevPage.dataset.index) === pageIndexNumber) {
                page.classList.add('prev');
            } else if (nextPage && Number(nextPage.dataset.index) === pageIndexNumber) {
                page.classList.add('next');
            } else {
                page.classList.add('adjacent');
            }
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

    let selectedIndex = 0;

    const _moveRows = (selectedIndex, rowsToMove) => {
        const col = selectedIndex % LB.galleryNumOfCols;
        const currentRow = Math.floor(selectedIndex / LB.galleryNumOfCols);
        const newIndex = (currentRow + rowsToMove) * LB.galleryNumOfCols + col;
        return Math.min(Math.max(newIndex, 0), gameContainers.length - 1);
    };

    function onGalleryKeyDown(event) {
        // detect if the active page is in list mode
        const activePageContent = document.querySelector('.page.active .page-content');
        const listMode = !!(activePageContent && activePageContent.classList.contains('list'));

        switch (event.key) {
        case 'ArrowRight':
            if (event.shiftKey) {
                goToNextPage();
            } else {
                if (listMode) {
                    // list -> move one down the list (no wrap)
                    selectedIndex = Math.min(selectedIndex + 1, gameContainers.length - 1);
                } else {
                    // grid -> original behavior (wrap)
                    selectedIndex = (selectedIndex + 1) % gameContainers.length;
                }
            }
            break;

        case 'ArrowLeft':
            if (event.shiftKey) {
                goToPrevPage();
            } else {
                if (listMode) {
                    // list -> move one up the list (no wrap)
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                } else {
                    // grid -> original behavior (wrap)
                    selectedIndex = (selectedIndex - 1 + gameContainers.length) % gameContainers.length;
                }
            }
            break;

        case 'ArrowUp':
            if (listMode) {
                // list -> simple up by one
                selectedIndex = Math.max(selectedIndex - 1, 0);
                gameContainers.forEach((container, index) => {
                    container.classList.toggle('selected', index === selectedIndex);
                    if (index === selectedIndex) {
                        updateImagePane(container);
                    }
                });

            } else {
                selectedIndex = _moveRows(selectedIndex, -1);
            }
            break;

        case 'ArrowDown':
            if (listMode) {
                // list -> simple down by one
                selectedIndex = Math.min(selectedIndex + 1, gameContainers.length - 1);

                gameContainers.forEach((container, index) => {
                    container.classList.toggle('selected', index === selectedIndex);
                    if (index === selectedIndex) {
                        console.log("updateImagePane: ");
                        updateImagePane(container);
                    }
                });

            } else {
                selectedIndex = _moveRows(selectedIndex, 1);
            }
            break;

        case 'PageUp':
            if (listMode) {
                selectedIndex = Math.max(selectedIndex - 10, 0);
            } else {
                selectedIndex = _moveRows(selectedIndex, -10);
            }
            break;

        case 'PageDown':
            if (listMode) {
                selectedIndex = Math.min(selectedIndex + 10, gameContainers.length - 1);
            } else {
                selectedIndex = _moveRows(selectedIndex, 10);
            }
            break;

        case 'Home':
            if (listMode) {
                selectedIndex = 0;
            } else {
                selectedIndex = 3;
            }
            break;

        case 'End':
            selectedIndex = gameContainers.length - 1;
            break;

        case 'i':
            if (!LB.kioskMode) {
                openGameMenu(gameContainers[selectedIndex]);
            }
            break;

        case 'F5':
            if (event.shiftKey) {
                ipcRenderer.invoke('restart');
            } else {
                window.location.reload();
            }
            break;

        case 'F11':
            toggleFullScreen();
            break;

        case 'Enter':
            if (currentPageIndex === 0) {
                const selectedPlatformContainer = document.querySelector('.game-container.selected');
                if (selectedPlatformContainer && !selectedPlatformContainer.classList.contains('empty-platform-game-container')) {
                    const platformName = selectedPlatformContainer.dataset.platform;
                    openPlatformMenu(platformName);
                }
            } else {
                const selectedGameContainer = getSelectedGameContainer(gameContainers, selectedIndex);
                if (selectedGameContainer.classList.contains('empty-platform-game-container')) {
                    return;
                }
                launchGame(selectedGameContainer);
            }
            break;

        case 'Escape':
            initSlideShow(document.querySelector('.page.active').dataset.platform);
            break;

        case 'q':
            if (event.ctrlKey) {
                ipcRenderer.invoke('quit');
            }
            break;
        }

        // Update visual selection exactly as before
        gameContainers.forEach((container, index) => {
            container.classList.toggle('selected', index === selectedIndex);
            if (index === selectedIndex && currentPageIndex === 0 && container.dataset.platform) {
                LB.currentPlatform = container.dataset.platform;
            }
        });

        // Keep your existing scroll behavior (unchanged)
        if (!event.shiftKey && selectedIndex < gameContainers.length && selectedIndex > 0) {
            gameContainers[selectedIndex].scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    };

    function onGalleryWheel(event) {
        event.preventDefault();
        if (event.shiftKey) {
            if (event.deltaY > 0) {
                goToNextPage();
            } else if (event.deltaY < 0) {
                goToPrevPage();
            }
        } else {
            if (event.deltaY > 0) {
                simulateKeyDown('ArrowDown');
            } else if (event.deltaY < 0) {
                simulateKeyDown('ArrowUp');
            }
        }
    }

    function onHeaderWheel(event) {
        event.preventDefault();
        if (event.deltaY > 0) {
            goToNextPage();
        } else if (event.deltaY < 0) {
            goToPrevPage();
        }
    }

    galleries.addEventListener('wheel', onGalleryWheel);
    header.addEventListener('wheel', onHeaderWheel);

    LB.onHeaderWheel = onHeaderWheel;

    setKeydown(onGalleryKeyDown);

    updateGallery(true); // Initialize the pages carousel
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
        setKeydown(quitDialogKeyDown);
        overlay.style.display = 'flex';
        okButton.blur();
        cancelButton.focus();
    }

    function closeDialog() {
        overlay.style.display = 'none';
        initSlideShow(LB.currentPlatform);
    }

    function confirmQuit() {
        closeDialog();
        ipcRenderer.invoke('quit');
    }

    function cancelQuit() {
        closeDialog();
    }

    function quitDialogKeyDown(event) {
        // event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const buttons = [okButton, cancelButton];
        const currentIndex = buttons.indexOf(document.activeElement);

        switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
            buttons[nextIndex].focus();
            selectedButton = buttons[nextIndex] === okButton ? 'ok' : 'cancel';
            break;
        case 'Escape':
            cancelQuit();
            break;
        }
    }

    // Button click handlers (but also somehow handles KB input..?)
    okButton.addEventListener('click', confirmQuit);
    cancelButton.addEventListener('click', cancelQuit);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            cancelQuit();
        }
    });

    openDialog();
}

// Toggle between 'grid' (default) and 'list' view on the active page
export function setGalleryView(mode = 'grid') {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;

  const pageContent = activePage.querySelector('.page-content');
  if (!pageContent) return;

  if (mode === 'list') {
    pageContent.classList.add('list');
  } else {
    pageContent.classList.remove('list');
  }

  // Accessibility & focus: focus first tile so keyboard users land sensibly
  const first = pageContent.querySelector('.game-container');
  if (first) {
    // ensure it's focusable
    if (!first.hasAttribute('tabindex')) first.setAttribute('tabindex', '-1');
    first.focus({ preventScroll: true });
    // mark selected visually (you already have .selected)
    pageContent.querySelectorAll('.game-container').forEach(c => c.classList.remove('selected'));
    first.classList.add('selected');
    first.scrollIntoView({ block: 'center', behavior: 'instant' });
  }
}

function ensureImagePane() {
    const page = document.querySelector('.page.active');
    if (!page) return null;

    let imagePane = page.querySelector('.image-pane');
    if (!imagePane) {
        imagePane = document.createElement('div');
        imagePane.classList.add('image-pane');
        page.appendChild(imagePane);
    }
    return imagePane;
}

function updateImagePane(selectedContainer) {
    const imagePane = ensureImagePane();
    if (!imagePane) return;

    if (!selectedContainer) {
        imagePane.innerHTML = '';
        return;
    }

    const imgSrc = selectedContainer.querySelector('img')?.src;
    if (!imgSrc) {
        imagePane.innerHTML = '';
        return;
    }

    // Update or create the image element
    let imgEl = imagePane.querySelector('img');
    if (!imgEl) {
        imgEl = document.createElement('img');
        imgEl.style.width = '100%';
        imgEl.style.height = '100%';
        imgEl.style.objectFit = 'contain';
        imagePane.appendChild(imgEl);
    }
    imgEl.src = imgSrc;
}

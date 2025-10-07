import { getPlatformInfo } from './platforms.js';
import { openPlatformMenu, openGameMenu } from './menu.js';
import { getSelectedGameContainer,
         updateFooterControls,
         updateHeader,
         setKeydown,
         simulateKeyDown,
         toggleHeaderNavLinks,
         toggleHeader } from './utils.js';

export function initSlideShow(platformToDisplay) {

    const slideshow = document.getElementById("slideshow");
    const galleries = document.getElementById("galleries");

    galleries.style.display = 'none';
    slideshow.style.display = 'flex';

    toggleHeader('hide');

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
                window.currentPlatformName = slide.dataset.platform;
                // Set currentPlatform when slide is active
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
            if (slide.classList.contains('active')) {
                simulateKeyDown('Enter');
            }
        });
    });

    function homeKeyDown(event) {
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
                openPlatformMenu(activePlatformName);
            }

            document.getElementById('slideshow').style.display = 'none';
            document.getElementById('galleries').style.display = "flex";
            break;
        }
        case 'F5':
            event.shiftKey ? ipcRenderer.invoke('restart') : window.location.reload();
            break;
        case 'Escape':
            console.log("HOME Escape: ");
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

    setKeydown(homeKeyDown);
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

function setGalleryFooterControls(currentIndex) {
    if (currentIndex === 0) {
        updateFooterControls('dpad', 'button-dpad-nesw', 'Platforms', 'on');
        updateFooterControls('shoulders', 'same', 'Browse<br>Platforms', 'off');
        updateFooterControls('west', 'same', 'Fetch<br>cover', 'off');
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

// Updated launchGame
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

export function initGallery(platformNameOrIndex, disabledPlatform) {

    toggleHeader('show');
    toggleHeaderNavLinks('show');

    const galleries = document.getElementById('galleries');
    const pages = Array.from(galleries.querySelectorAll('.page'));
    const header = document.getElementById('header');

    let currentPlatformName = null;
    let currentPageIndex = 0;
    let gameContainers = [];

    // Find the target page by platform name or fallback to index
    let targetPage = null;
    if (typeof platformNameOrIndex === 'string') {
        // Name-based lookup (preferred)
        targetPage = pages.find(page => page.dataset.platform === platformNameOrIndex);
        currentPlatformName = platformNameOrIndex;
    } else if (typeof platformNameOrIndex === 'number') {
        // Index-based lookup (fallback for prev/next navigation only)
        targetPage = pages.find(page => Number(page.dataset.index) === platformNameOrIndex);
        currentPlatformName = targetPage?.dataset.platform;
    }

    if (!targetPage) {
        console.error('Could not find page for:', platformNameOrIndex);
        return;
    }

    currentPageIndex = Number(targetPage.dataset.index);
    const enabledPages = pages.filter(page => page.dataset.status !== 'disabled');

    function initCurrentGallery(page) {
        page.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        setGalleryFooterControls(page.dataset.platform === 'settings' ? 0 : 1);

        gameContainers = Array.from(page.querySelectorAll('.game-container') || []);

        // Only attach listeners once per page to prevent duplicates
        if (!page.dataset.listenersAttached) {
            gameContainers.forEach((container) => {
                container.addEventListener('click', (event) => {
                    if (event.currentTarget.classList.contains('empty-platform-game-container')) {
                        return;
                    }
                    if (event.currentTarget.classList.contains('settings')) {
                        const platformName = event.currentTarget.dataset.platform;
                        openPlatformMenu(platformName);
                    } else {
                        launchGame(event.currentTarget);
                    }
                });

                // right-click (contextmenu) handler
                container.addEventListener('contextmenu', (event) => {
                    event.preventDefault(); // Prevent the default context menu
                    if (event.currentTarget.classList.contains('empty-platform-game-container')) {
                        return;
                    }

                    const parentDiv = event.target.closest('div.game-container');

                    gameContainers.forEach((container) => {
                        container.classList.toggle('selected', false);
                    });

                    parentDiv.classList.toggle('selected', true);

                    openGameMenu(event.currentTarget);
                });

                container.classList.remove('selected');
            });

            page.setAttribute('data-listeners-attached', true);
        }

        const firstGameContainer = page.querySelector('.game-container');
        firstGameContainer.classList.add('selected');
        firstGameContainer.focus();
        firstGameContainer.scrollIntoView({
            behavior: "instant",
            block: "center"
        });

        // const platformInfo = getPlatformInfo(page.dataset.platform);

        // document.querySelector('header .platform-name').textContent = platformInfo.name;

        // const pluralize = (count, singular, plural = `${singular}s`) =>
        //       count === 1 ? singular : plural;

        // const count = currentPageIndex === 0 ? gameContainers.length - 1 : gameContainers.length;
        // const itemType = currentPageIndex === 0 ? 'platform' : 'game';

        // document.querySelector('header .item-number').textContent = count;
        // document.querySelector('header .item-type').textContent =
        //     ` ${pluralize(count, itemType)}`;

        // document.querySelector('header .platform-image').style.backgroundImage = `url('../../img/platforms/${page.dataset.platform}.png')`;

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


    function goToNextPage() {
        // Find the index of the current page in the enabledPages array
        const currentEnabledIndex = enabledPages.findIndex(page => Number(page.dataset.index) === currentPageIndex);
        const nextEnabledIndex = (currentEnabledIndex + 1) % enabledPages.length;

        // Update currentPageIndex to the next enabled page's dataset.index
        currentPageIndex = Number(enabledPages[nextEnabledIndex].dataset.index);
        currentPlatformName = enabledPages[nextEnabledIndex].dataset.platform;

        // Set currentPlatform when browsing platforms
        LB.currentPlatform = currentPlatformName;

        updateGallery();
    }

    function goToPrevPage() {
        const currentEnabledIndex = enabledPages.findIndex(page => Number(page.dataset.index) === currentPageIndex);
        const prevEnabledIndex = (currentEnabledIndex - 1 + enabledPages.length) % enabledPages.length;
        currentPageIndex = Number(enabledPages[prevEnabledIndex].dataset.index);
        currentPlatformName = enabledPages[prevEnabledIndex].dataset.platform;

        // Set currentPlatform when browsing platforms
        LB.currentPlatform = currentPlatformName;

        updateGallery();
    }

    let selectedIndex = 0;

    if (disabledPlatform) {
        openPlatformMenu(disabledPlatform);
    }


    const _moveRows = (selectedIndex, rowsToMove) => {
        const col = selectedIndex % LB.galleryNumOfCols;
        const currentRow = Math.floor(selectedIndex / LB.galleryNumOfCols);
        const newIndex = (currentRow + rowsToMove) * LB.galleryNumOfCols + col;
        return Math.min(Math.max(newIndex, 0), gameContainers.length - 1);
    };

    function galleryKeyDown(event) {
        switch (event.key) {
        case 'ArrowRight':
            if (event.shiftKey) {
                goToNextPage();
            } else {
                selectedIndex = (selectedIndex + 1) % gameContainers.length;
            }
            break;
        case 'ArrowLeft':
            if (event.shiftKey) {
                goToPrevPage();
            } else {
                selectedIndex = (selectedIndex - 1 + gameContainers.length) % gameContainers.length;
            }
            break;
        case 'ArrowUp':
            selectedIndex = _moveRows(selectedIndex, -1);
            break;
        case 'ArrowDown':
            selectedIndex = _moveRows(selectedIndex, 1);
            break;
        case 'PageUp':
            selectedIndex = _moveRows(selectedIndex, -10);
            break;
        case 'PageDown':
            selectedIndex = _moveRows(selectedIndex, 10);
            break;
        case 'Home':
            selectedIndex = 3;
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
        case 'Enter':
            if (currentPageIndex === 0) {
                // Settings page - find the selected platform container
                const selectedPlatformContainer = document.querySelector('.game-container.selected');
                if (selectedPlatformContainer && !selectedPlatformContainer.classList.contains('empty-platform-game-container')) {
                    const platformName = selectedPlatformContainer.dataset.platform;
                    openPlatformMenu(platformName);
                    // return;
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
            document.getElementById('slideshow').style.display = 'flex';
            document.getElementById('galleries').style.display = 'none';

            const selectedPlatformContainer = document.querySelector('.platform-container.selected');
            const activePage = document.querySelector('.page.active');
            const currentPlatformName = activePage ? activePage.dataset.platform : null;

            if (currentPlatformName) {
                initSlideShow(currentPlatformName === 'settings' ? selectedPlatformContainer.dataset.platform : currentPlatformName);
            } else {
                // Platform is disabled AND policy is "hide", display settings slide
                initSlideShow(0);
            }

            document.querySelector('header .item-number').textContent = '';
            break;
        case 'q':
            if (event.ctrlKey) {
                ipcRenderer.invoke('quit');
            }
            break;
        }

        gameContainers.forEach((container, index) => {
            container.classList.toggle('selected', index === selectedIndex);
            // Set currentPlatform when platform container is selected in settings page
            if (index === selectedIndex && currentPageIndex === 0 && container.dataset.platform) {
                LB.currentPlatform = container.dataset.platform;
            }
        });

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

    setKeydown(galleryKeyDown);

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

        switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
            const buttons = [okButton, cancelButton];
            const currentIndex = buttons.indexOf(document.activeElement);
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


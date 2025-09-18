// document.getElementById('closeAbout').addEventListener('click', () => {
//     document.getElementById('aboutContainer').style.display = 'none';
//     document.getElementById('aboutContent').innerHTML = '';
// });

function initSlideShow(platformToDisplay) {

    console.log("platformToDisplay: ", platformToDisplay);

    const slideshow = document.getElementById("slideshow");

    document.getElementById('header').style.display = 'none';

    document.body.style.display = "block";
    const slides = Array.from(slideshow.querySelectorAll('.slide'));
    const totalSlides = slides.length;
    const radius = 90 * totalSlides;
    let currentIndex = platformToDisplay ? platformToDisplay : 0;

    function updateHomeCarousel(platformIndex) {
        const angleIncrement = 360 / totalSlides;

        slides.forEach((slide, index) => {
            const angle = angleIncrement * (index - currentIndex);
            slide.style.setProperty('--angle', angle);
            slide.style.setProperty('--radius', radius);

            slide.classList.remove('active', 'prev-slide-3d', 'prev-slide-flat', 'next-slide-3d', 'next-slide-flat', 'adjacent-flat', 'adjacent-3d');

            let is3D = false;

            if (LB.homeMenuTheme === '3D') {
                is3D = true;
            }

            if (index === currentIndex) {
                slide.classList.add('active');
            } else if (index === (currentIndex - 1 + totalSlides) % totalSlides) {
                slide.classList.add(is3D ? 'prev-slide-3d' : 'prev-slide-flat');
            } else if (index === (currentIndex + 1) % totalSlides) {
                slide.classList.add(is3D ? 'next-slide-3d' : 'next-slide-flat');
            } else {
                slide.classList.add(is3D ? 'adjacent-3d' : 'adjacent-flat');
            }
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateHomeCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateHomeCarousel();
    }

    slideshow.addEventListener('wheel', (event) => {
        event.preventDefault(); // Prevent default scrolling behavior
        if (event.deltaY > 0) {
            nextSlide();
        } else if (event.deltaY < 0) {
            prevSlide();
        }
    });

    // Click to select adjacent slides
    slides.forEach((slide, index) => {
        slide.addEventListener('click', (event) => {
            event.stopPropagation();
            event.stopImmediatePropagation();
            if (slide.classList.contains('active')) {
                simulateKeyDown('Enter');
            }
        });
    });

    window.addEventListener('keydown', homeKeyDown);

    function homeKeyDown (event) {
        event.stopPropagation();
        event.stopImmediatePropagation(); // Stops other listeners on the same element

        switch (event.key) {
        case 'ArrowRight':
            nextSlide();
            break;
        case 'ArrowLeft':
            prevSlide();
            break;
        case 'Enter':

            let activeGalleryIndex;
            let activePlatformName;
            let isPlatformEnabled;

            slides.forEach((slide, index) => {
                if (slide.classList.contains('active')) {
                    activePlatformName = slide.dataset.platform;
                    activeGalleryIndex = Number(slide.dataset.index);
                    isPlatformEnabled = slide.dataset.isEnabled;
                    // console.assert(index === Number(slide.dataset.index));
                }
            });

            if (activePlatformName === 'recents') {
                initGallery(LB.totalNumberOfPlatforms);
            } else if (LB.enabledPlatforms.includes(activePlatformName)) {
                if (activePlatformName === 'settings' && LB.kidsMode) {
                    return;
                }
                initGallery(activeGalleryIndex);
            } else {
                initGallery(0, activePlatformName);
            }

            document.getElementById('slideshow').style.display = 'none';
            document.getElementById('galleries').style.display = "flex";

            window.removeEventListener('keydown', homeKeyDown);

            break;
        case 'F5':
            if (event.shiftKey) {
                ipcRenderer.invoke('restart');
            } else {
                window.location.reload();
            }
            break;
        case 'Escape':
            ipcRenderer.invoke('quit');
            break;
        case 'q':
            if (event.ctrlKey || event.metaKey) { // metaKey = Command on Mac
                try {
                    ipcRenderer.invoke('quit').catch(() => {
                        window.close();
                    });
                } catch (e) {
                    window.close();
                }
            }
            break;
        }
    }

    LB.utils.updateControls('dpad', 'button-dpad-ew', 'Browse<br>Platforms', 'on');
    LB.utils.updateControls('shoulders', 'same', 'Browse<br>Platforms', 'off');
    LB.utils.updateControls('west', 'same', 'same', 'off');
    LB.utils.updateControls('east', 'same', 'Exit');

    updateHomeCarousel(platformToDisplay);
}

function setGalleryControls(currentIndex) {
    if (currentIndex === 0) {
        LB.utils.updateControls('dpad', 'button-dpad-nesw', 'Browse<br>Platforms', 'on');
        LB.utils.updateControls('shoulders', 'same', 'Browse<br>Platforms', 'off');
        LB.utils.updateControls('west', 'same', 'Fetch<br>cover', 'off');
    } else {
        LB.utils.updateControls('dpad', 'button-dpad-nesw', 'Browse<br>Games', 'on');
        LB.utils.updateControls('west', 'same', 'Fetch<br>cover', 'on');
        LB.utils.updateControls('shoulders', 'same', 'Browse<br>Platforms', 'on');
    }
    LB.utils.updateControls('east', 'same', 'Back');
}

function launchGame(gameContainer) {
    gameContainer.classList.add('launching');

    ipcRenderer.send('run-command', {
        fileName: gameContainer.dataset.gameName,
        filePath: gameContainer.dataset.gamePath,
        gameName: gameContainer.dataset.gameName,
        emulator: gameContainer.dataset.emulator,
        emulatorArgs: gameContainer.dataset.emulatorArgs,
        platform: gameContainer.dataset.platform
    });

    setTimeout(() => {
        gameContainer.classList.remove('launching');
    }, 1000);
}

function initGallery(currentIndex, disabledPlatform) {

    setGalleryControls(currentIndex);

    const header = document.getElementById('header');
    header.style.display = 'flex';

    const galleries = document.getElementById('galleries');
    const pages = Array.from(galleries.querySelectorAll('.page'));
    const totalPages = pages.length;

    let currentPageIndex = currentIndex;
    let gameContainers = [];

    const enabledPages = pages.filter(page => page.dataset.status !== 'disabled');

    function initCurrentGallery(page, index) {

        page.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        setGalleryControls(index);

        currentPageIndex = index;
        gameContainers = Array.from(page.querySelectorAll('.game-container') || []);

        gameContainers.forEach((container, index) => {
            container.addEventListener('click', (event) => {
                console.log("event: ", event.currentTarget);
                if (event.currentTarget.classList.contains('empty-platform-game-container')) {
                    return;
                }
                if (event.currentTarget.classList.contains('settings')) {
                    _toggleMenu(Array.from(document.querySelectorAll('.game-container') || []), event.currentTarget.dataset.index / 1, onGalleryKeyDown, false, disabledPlatform);
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
                _toggleMenu(gameContainers, parseInt(event.currentTarget.dataset.index), onGalleryKeyDown, false);
            });

            container.classList.remove('selected');
        });

        const firstGameContainer = page.querySelector('.game-container');
        firstGameContainer.classList.add('selected');
        firstGameContainer.focus();
        firstGameContainer.scrollIntoView({
            behavior: "instant",
            block: "center"
        });

        const platformInfo = LB.utils.getPlatformInfo(page.dataset.platform);

        document.querySelector('header .platform-name').textContent = platformInfo.name;

        const pluralize = (count, singular, plural = `${singular}s`) =>
              count === 1 ? singular : plural;

        const count = index === 0 ? gameContainers.length - 1 : gameContainers.length;
        const itemType = index === 0 ? 'platform' : 'game';

        document.querySelector('header .item-number').textContent = count;
        document.querySelector('header .item-type').textContent =
            ` ${pluralize(count, itemType)}`;

        document.querySelector('header .platform-image').style.backgroundImage = `url('../../img/platforms/${page.dataset.platform}.png')`;

        document.querySelector('header .prev-link').onclick = function() {
            goToPrevPage();
        };

        document.querySelector('header .next-link').onclick = function() {
            goToNextPage();
        };

    }

    function updatePagesCarousel() {
        // Filter out disabled pages and sort by dataset.index
        const enabledPages = pages
              .filter(page => page.dataset.status !== 'disabled')
              .sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));

        // Find the active page's position in the enabled array
        const activePos = enabledPages.findIndex(page => Number(page.dataset.index) === currentIndex);

        // Determine immediate neighbors
        const prevPage = enabledPages[activePos - 1] || null;
        const nextPage = enabledPages[activePos + 1] || null;

        pages.forEach(page => {
            const pageIndexNumber = Number(page.dataset.index);

            page.classList.remove('active', 'prev', 'next', 'adjacent');

            if (page.dataset.status === 'disabled') {
                return;
            }

            if (pageIndexNumber === currentIndex) {
                initCurrentGallery(page, currentIndex);
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
        const currentEnabledIndex = enabledPages.findIndex(page => Number(page.dataset.index) === currentIndex);
        const nextEnabledIndex = (currentEnabledIndex + 1) % enabledPages.length;

        // Update currentIndex to the next enabled page's dataset.index
        currentIndex = Number(enabledPages[nextEnabledIndex].dataset.index);

        updatePagesCarousel();
    }

    function goToPrevPage() {
        const currentEnabledIndex = enabledPages.findIndex(page => Number(page.dataset.index) === currentIndex);
        const prevEnabledIndex = (currentEnabledIndex - 1 + enabledPages.length) % enabledPages.length;
        currentIndex = Number(enabledPages[prevEnabledIndex].dataset.index);
        updatePagesCarousel();
    }

    let isMenuOpen = false;
    let selectedIndex = 0;

    if (disabledPlatform) {
        _toggleMenu(Array.from(document.querySelectorAll('.game-container') || []), selectedIndex, onGalleryKeyDown, isMenuOpen, disabledPlatform);
    }

    function _toggleMenu(gameContainers, selectedIndex, keyDownListener, isMenuOpen, platformToOpen) {

        const menu = document.getElementById('menu');
        const menuContainer = document.getElementById('menu');

        // const footer = document.getElementById('footer');
        // const footerMenuContainer = document.getElementById('footer-menu-container');

        const controls = document.getElementById('controls');

        let menuSelectedIndex = 1;

        const selectedGame = LB.utils.getSelectedGame(gameContainers, selectedIndex);
        // const selectedGameImg = selectedGame.querySelector('.game-image');

        function onMenuKeyDown(event) {

            event.stopPropagation();
            event.stopImmediatePropagation(); // Stops other listeners on the same element
            const menuGameContainers = Array.from(menu.querySelectorAll('.menu-game-container'));
            // console.log("menuGameContainers len: ", menuGameContainers.length);

            switch (event.key) {
            case 'ArrowRight':
                if (event.shiftKey) {
                    // nextPage();
                } else {
                    menuSelectedIndex = (menuSelectedIndex + 1) % menuGameContainers.length;
                    // selectedIndex = (selectedIndex + 1) % gameContainers.length;
                }
                break;

            case 'ArrowLeft':
                if (event.shiftKey) {
                    // prevPage();
                } else {
                    if (menuSelectedIndex !== 1) {
                        menuSelectedIndex = (menuSelectedIndex - 1 + menuGameContainers.length) % menuGameContainers.length;
                    }
                }
                break;

            case 'ArrowUp':
                if (menuSelectedIndex > LB.galleryNumOfCols) {
                    menuSelectedIndex = Math.max(menuSelectedIndex - LB.galleryNumOfCols, 0);
                }
                break;
            case 'ArrowDown':
                menuSelectedIndex = Math.min(menuSelectedIndex + LB.galleryNumOfCols, menuGameContainers.length);
                break;

            case 'PageUp':
                // 10 rows up
                menuSelectedIndex = Math.max(
                    menuSelectedIndex - LB.galleryNumOfCols * 10,
                    0
                );
                break;

            case 'PageDown':
                // 10 rows down
                menuSelectedIndex = Math.min(
                    menuSelectedIndex + LB.galleryNumOfCols * 10,
                    menuGameContainers.length - 1
                );
                break;

            case 'Home':
                // go to first item
                menuSelectedIndex = 0;
                break;

            case 'End':
                // go to last item
                menuSelectedIndex = menuGameContainers.length - 1;
                break;

            case 'Enter':
                const menuSelectedGame = LB.utils.getSelectedGame(menuGameContainers, menuSelectedIndex);
                const menuSelectedGameImg = menuSelectedGame.querySelector('.game-image');
                _closeMenu(menuSelectedGameImg.src);
                break;

            case 'F5':
                if (event.shiftKey) {
                    ipcRenderer.invoke('restart');
                } else {
                    window.location.reload();
                }
                break;
            case 'Escape':
                window.location.reload();
                // _closeMenu();
                break;
            }

            menuGameContainers.forEach((container, index) => {
                container.classList.toggle('selected', index === menuSelectedIndex);
            });

            // menuGameContainers[menuSelectedIndex].scrollIntoView({
            //     behavior: "smooth",
            //     block: "center"
            // });

        }

        function onMenuClick(event) {
            if (event.target.src) {
                _closeMenu(event.target.src);
            }
        }

        function onMenuWheel(event) {
            // event.preventDefault();
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

        const downloadImage = async (imgSrc, platform, gameName) => {
            try {
                const result = await ipcRenderer.invoke('download-image', imgSrc, platform, gameName);
                if (result.success) {
                    console.log(`Image saved at ${result.path}`);
                    return result.path;  // Return the saved image path on success
                } else {
                    console.error(`Error saving image: ${result.error}`);
                    return null;
                }
            } catch (error) {
                console.error('Error communicating with main process:', error);
                alert('Failed to save image');
                return null;
            }
        };

        function _openMenu(platformToOpen) {

            LB.utils.updateControls('west', 'same', '', 'off');
            LB.utils.updateControls('dpad', 'same', '', 'off');
            LB.utils.updateControls('shoulders', 'same', '', 'off');

            menu.style.height = '85vh';

            document.querySelector('#header .prev-link').style.opacity = 0;
            document.querySelector('#header .next-link').style.opacity = 0;

            menuContainer.innerHTML = '';

            window.removeEventListener('keydown', keyDownListener);
            window.addEventListener('keydown', onMenuKeyDown);
            menuContainer.addEventListener('wheel', onMenuWheel);
            menuContainer.addEventListener('click', onMenuClick);

            gameContainers.forEach(async (container, index) => {
                if (index === selectedIndex) {

                    if (container.classList.contains('settings')) {
                        const platformForm = LB.build.platformForm(platformToOpen || container.dataset.platform);
                        menuContainer.appendChild(platformForm);
                    } else {
                        const gameImage = container.querySelector('img');
                        const gameName = container.dataset.gameName;
                        const platformName = platformToOpen || container.dataset.platform;
                        const gameMenuContainer = LB.build.gameMenu(gameName, gameImage, platformName);
                        menuContainer.appendChild(gameMenuContainer);
                        await LB.build.populateGameMenu(gameMenuContainer, gameName, platformName);

                        document.querySelector('header .platform-name').textContent = LB.utils.cleanFileName(gameName);
                        document.querySelector('header .item-type').textContent = '';
                        document.querySelector('header .item-number').textContent = '';

                    }

                }
            });

        }

        async function _closeMenu(imgSrc) {

            document.getElementById('menu').removeEventListener('click', onMenuClick);

            updatePagesCarousel();

            // LB.utils.updateControls('west', 'same', 'Fetch cover', 'on');
            LB.utils.updateControls('dpad', 'same', 'Browse', 'on');

            document.querySelector('header .prev-link').style.opacity = 1;
            document.querySelector('header .next-link').style.opacity = 1;

            LB.imageSrc = imgSrc;
            document.getElementById('menu').innerHTML = '';
            // footer.style.height = '100px'; // original height

            menu.style.height = '0';

            // controls.style.display = 'flex';
            window.removeEventListener('keydown', onMenuKeyDown);
            window.addEventListener('keydown', keyDownListener);

            selectedGame.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            if (imgSrc) {
                const selectedGameImg = selectedGame.querySelector('.game-image');
                if (!selectedGameImg) return;

                selectedGame.classList.add('loading');

                // Call downloadImage first, and then update the image once it succeeds
                const savedImagePath = await downloadImage(imgSrc, selectedGame.dataset.platform, selectedGame.dataset.gameName);

                if (savedImagePath) {

                    selectedGameImg.src = savedImagePath + '?t=' + new Date().getTime(); // Refresh with timestamp

                    selectedGameImg.onload = () => {
                        selectedGame.classList.remove('loading');
                    };
                }
            }

            isMenuOpen = false;
        }

        if (!isMenuOpen) {
            _openMenu(disabledPlatform);
            isMenuOpen = true;
        } else {
            _closeMenu();
            isMenuOpen = false;
        }
    }

    const _moveRows = (selectedIndex, rowsToMove) => {
        const col = selectedIndex % LB.galleryNumOfCols;
        const currentRow = Math.floor(selectedIndex / LB.galleryNumOfCols);
        const newIndex = (currentRow + rowsToMove) * LB.galleryNumOfCols + col;
        return Math.min(Math.max(newIndex, 0), gameContainers.length - 1);
    };

    function onGalleryKeyDown(event) {
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
            _toggleMenu(gameContainers, selectedIndex, onGalleryKeyDown, isMenuOpen);
            break;
        case 'F5':
            if (event.shiftKey) {
                ipcRenderer.invoke('restart');
            } else {
                window.location.reload();
            }
            break;
        case 'Enter':
            const selectedGameContainer = LB.utils.getSelectedGame(gameContainers, selectedIndex);
            if (selectedGameContainer.classList.contains('empty-platform-game-container')) {
                return;
            }
            if (currentPageIndex === 0) {
                _toggleMenu(gameContainers, selectedIndex, onGalleryKeyDown, isMenuOpen);
            } else {
                launchGame(selectedGameContainer);
            }
            break;
        case 'Escape':
            document.getElementById('slideshow').style.display = 'flex';
            document.getElementById('galleries').style.display = 'none';
            window.removeEventListener('keydown', onGalleryKeyDown);

            const index = Number(document.querySelector('.page.active').getAttribute('data-index'));
            const trueIndex = Number(document.querySelector('.page.active').getAttribute('data-trueindex'));

            LB.control.initSlideShow(LB.disabledPlatformsPolicy === "hide" || LB.kidsMode ? trueIndex : index);
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
        });

        if (!event.shiftKey && selectedIndex < gameContainers.length && selectedIndex > 0) {
            gameContainers[selectedIndex].scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }

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

    galleries.addEventListener('wheel', onGalleryWheel);

    window.addEventListener('keydown', onGalleryKeyDown);
    updatePagesCarousel(); // Initialize the pages carousel
}

function simulateKeyDown(key, modifiers = {}) {
    const keyCodes = {
        ArrowLeft: 37,
        ArrowRight: 39,
        ArrowUp: 38,
        ArrowDown: 40,
        Shift: 16,
        Enter: 13,
        Escape: 27
    };

    const keyboardEvent = new KeyboardEvent('keydown', {
        key,
        code: key,
        keyCode: keyCodes[key] || 0,
        which: keyCodes[key] || 0,
        shiftKey: modifiers.shift || false,
        ctrlKey: modifiers.ctrl || false,
        altKey: modifiers.alt || false,
        metaKey: modifiers.meta || false,
        bubbles: true
    });

    document.dispatchEvent(keyboardEvent);
}

function initGamepad () {
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

LB.control = {
    initGallery: initGallery,
    initSlideShow: initSlideShow,
    initGamepad: initGamepad
};

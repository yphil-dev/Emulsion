// document.getElementById('closeAbout').addEventListener('click', () => {
//     document.getElementById('aboutContainer').style.display = 'none';
//     document.getElementById('aboutContent').innerHTML = '';
// });

function initSlideShow(platformToDisplay) {

    LB.enabledPlatforms.forEach((platform, i) => {
        console.log(i, platform);
    });

    const slideshow = document.getElementById("slideshow");
    document.getElementById('header').style.display = 'none';
    document.body.style.display = "block";

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

    function updateHomeCarousel() {
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
        updateHomeCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateHomeCarousel();
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
                LB.utils.simulateKeyDown('Enter');
            }
        });
    });

    // Make homeKeyDown globally accessible for dialog cleanup
    window.currentHomeKeyDown = homeKeyDown;
    window.addEventListener('keydown', homeKeyDown);

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
                initGallery('settings', activePlatformName);
            }

            document.getElementById('slideshow').style.display = 'none';
            document.getElementById('galleries').style.display = "flex";
            window.removeEventListener('keydown', homeKeyDown);
            break;
        }
        case 'F5':
            event.shiftKey ? ipcRenderer.invoke('restart') : window.location.reload();
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

    LB.utils.updateControls('dpad', 'button-dpad-ew', 'Browse<br>Platforms', 'on');
    LB.utils.updateControls('shoulders', 'same', 'Browse<br>Platforms', 'off');
    LB.utils.updateControls('west', 'same', 'same', 'off');
    LB.utils.updateControls('east', 'same', 'Exit');

    updateHomeCarousel();
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

function initGallery(platformNameOrIndex, disabledPlatform) {
    const header = document.getElementById('header');
    header.style.display = 'flex';

    const galleries = document.getElementById('galleries');
    const pages = Array.from(galleries.querySelectorAll('.page'));
    
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

        // Set controls based on platform type
        const isSettingsPage = page.dataset.platform === 'settings';
        setGalleryControls(isSettingsPage ? 0 : 1);
        gameContainers = Array.from(page.querySelectorAll('.game-container') || []);

        // Only attach listeners once per page to prevent duplicates
        if (!page.dataset.listenersAttached) {
            gameContainers.forEach((container) => {
            container.addEventListener('click', (event) => {
                console.log("event: ", event.currentTarget);
                if (event.currentTarget.classList.contains('empty-platform-game-container')) {
                    return;
                }
                if (event.currentTarget.classList.contains('settings')) {
                    // Get platform name directly from the clicked element's dataset
                    const platformName = event.currentTarget.dataset.platform;
                    console.log('Opening settings menu for platform:', platformName);
                    
                    // Find the actual index in gameContainers by matching platform name
                    const actualIndex = gameContainers.findIndex(c => c.dataset.platform === platformName);
                    console.log('Found container at index:', actualIndex);
                    
                    _toggleMenu(gameContainers, actualIndex, onGalleryKeyDown, false, platformName);
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
            
            // Mark that listeners have been attached
            page.dataset.listenersAttached = 'true';
        }

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

        const count = currentPageIndex === 0 ? gameContainers.length - 1 : gameContainers.length;
        const itemType = currentPageIndex === 0 ? 'platform' : 'game';

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

        updatePagesCarousel();
    }

    function goToPrevPage() {
        const currentEnabledIndex = enabledPages.findIndex(page => Number(page.dataset.index) === currentPageIndex);
        const prevEnabledIndex = (currentEnabledIndex - 1 + enabledPages.length) % enabledPages.length;
        currentPageIndex = Number(enabledPages[prevEnabledIndex].dataset.index);
        currentPlatformName = enabledPages[prevEnabledIndex].dataset.platform;
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
        let currentMenuPlatform = null; // Track the current platform for this menu

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
                // Smart navigation - close menu and return to appropriate view
                _closeMenu();
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
                    LB.utils.simulateKeyDown('ArrowDown');
                } else if (event.deltaY < 0) {
                    LB.utils.simulateKeyDown('ArrowUp');
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
                        const platformName = platformToOpen || container.dataset.platform;
                        // Store platform name in menu container for reliable access later
                        menuContainer.dataset.menuPlatform = platformName;
                        console.log('Opening menu for platform:', platformName, 'stored in menu container');
                        const platformForm = LB.build.platformForm(platformName);
                        menuContainer.appendChild(platformForm);
                    } else {
                        const gameImage = container.querySelector('img');
                        const gameName = container.dataset.gameName;
                        const platformName = platformToOpen || container.dataset.platform;
                        // Store platform name in menu container for reliable access later
                        menuContainer.dataset.menuPlatform = platformName;
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

            // Check if we're closing a platform menu and should navigate to platform gallery
            const menuContainer = document.getElementById('menu');
            const platformForm = menuContainer.querySelector('.platform-menu-container');
            
            if (platformForm) {
                // Get platform name directly from the selected game container's dataset
                const selectedGameContainer = LB.utils.getSelectedGame(gameContainers, selectedIndex);
                const platformNameFromDOM = selectedGameContainer ? selectedGameContainer.dataset.platform : null;
                
                console.log('Closing menu for platform:', platformNameFromDOM, 'from DOM element');
                
                if (platformNameFromDOM && platformNameFromDOM !== 'settings') {
                    try {
                        const isEnabled = await LB.prefs.getValue(platformNameFromDOM, 'isEnabled');
                        if (isEnabled) {
                            // Platform is enabled, navigate to its gallery using NAME-BASED navigation
                            // Clean up menu first
                            LB.imageSrc = imgSrc;
                            document.getElementById('menu').innerHTML = '';
                            menu.style.height = '0';
                            window.removeEventListener('keydown', onMenuKeyDown);
                            isMenuOpen = false;
                            
                            // Switch to gallery view and navigate to this platform BY NAME
                            document.getElementById('slideshow').style.display = 'none';
                            document.getElementById('galleries').style.display = 'flex';
                            
                            // Initialize gallery for this platform using PLATFORM NAME - NO INDICES!
                            console.log('Navigating to platform gallery:', platformNameFromDOM);
                            initGallery(platformNameFromDOM);
                            return;
                        }
                    } catch (error) {
                        console.error('Error checking platform status:', error);
                    }
                }
            }

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
            if (!LB.kioskMode) {
                _toggleMenu(gameContainers, selectedIndex, onGalleryKeyDown, isMenuOpen);
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
                    const actualIndex = gameContainers.findIndex(c => c.dataset.platform === platformName);
                    _toggleMenu(gameContainers, actualIndex, onGalleryKeyDown, isMenuOpen, platformName);
                }
            } else {
                const selectedGameContainer = LB.utils.getSelectedGame(gameContainers, selectedIndex);
                if (selectedGameContainer.classList.contains('empty-platform-game-container')) {
                    return;
                }
                launchGame(selectedGameContainer);
            }
            break;
        case 'Escape':
            document.getElementById('slideshow').style.display = 'flex';
            document.getElementById('galleries').style.display = 'none';
            window.removeEventListener('keydown', onGalleryKeyDown);

            // Smart navigation - return to current platform using name-based navigation
            const activePage = document.querySelector('.page.active');
            const currentPlatformName = activePage ? activePage.dataset.platform : null;

            if (currentPlatformName) {
                initSlideShow(currentPlatformName);
            } else {
                // Fallback to first platform
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
                LB.utils.simulateKeyDown('ArrowDown');
            } else if (event.deltaY < 0) {
                LB.utils.simulateKeyDown('ArrowUp');
            }
        }
    }

    galleries.addEventListener('wheel', onGalleryWheel);

    window.addEventListener('keydown', onGalleryKeyDown);
    updatePagesCarousel(); // Initialize the pages carousel
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
            LB.utils.simulateKeyDown('Enter');
            break;
        case 1:
            LB.utils.simulateKeyDown('Escape');
            break;
        case 2:
            LB.utils.simulateKeyDown('i');
            break;
        case 3:
            console.log("3 (triangle)");
            break;
        case 4:
            LB.utils.simulateKeyDown('ArrowLeft', { shift: true });
            break;
        case 5:
            LB.utils.simulateKeyDown('ArrowRight', { shift: true });
            break;
        case 12:
            LB.utils.simulateKeyDown('ArrowUp');
            break;
        case 13:
            LB.utils.simulateKeyDown('ArrowDown');
            break;
        case 14:
            LB.utils.simulateKeyDown('ArrowLeft');
            break;
        case 15:
            LB.utils.simulateKeyDown('ArrowRight');
            break;
        }
    }

}

function showQuitConfirmationDialog() {
    // Store reference to current slideshow handler
    const currentHomeKeyDown = window.homeKeyDownHandler || null;
    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.id = 'quit-confirmation-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    `;

    // Create dialog box
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: linear-gradient(135deg, #2c3e50, #34495e);
        border: 2px solid #3498db;
        border-radius: 15px;
        padding: 30px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        max-width: 400px;
        width: 90%;
    `;

    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Really quit?';
    title.style.cssText = `
        color: #ecf0f1;
        margin: 0 0 20px 0;
        font-size: 24px;
        font-weight: bold;
    `;

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 20px;
    `;

    // Create OK button
    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.id = 'quit-ok-button';
    okButton.style.cssText = `
        background: #e74c3c;
        color: white;
        border: 2px solid #c0392b;
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 80px;
    `;

    // Create Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.id = 'quit-cancel-button';
    cancelButton.style.cssText = `
        background: #95a5a6;
        color: white;
        border: 2px solid #7f8c8d;
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 80px;
    `;

    // Add hover effects
    const addHoverEffect = (button, hoverColor, normalColor) => {
        button.addEventListener('mouseenter', () => {
            button.style.background = hoverColor;
            button.style.transform = 'scale(1.05)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.background = normalColor;
            button.style.transform = 'scale(1)';
        });
    };

    addHoverEffect(okButton, '#c0392b', '#e74c3c');
    addHoverEffect(cancelButton, '#7f8c8d', '#95a5a6');

    // Assemble dialog
    buttonContainer.appendChild(okButton);
    buttonContainer.appendChild(cancelButton);
    dialog.appendChild(title);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);

    // Add to document
    document.body.appendChild(overlay);

    // Dialog state
    let selectedButton = 'cancel'; // Default to cancel for safety
    
    function updateButtonSelection() {
        // Reset both buttons
        okButton.style.background = '#e74c3c';
        okButton.style.transform = 'scale(1)';
        cancelButton.style.background = '#95a5a6';
        cancelButton.style.transform = 'scale(1)';
        
        // Highlight selected button
        if (selectedButton === 'ok') {
            okButton.style.background = '#c0392b';
            okButton.style.transform = 'scale(1.1)';
            okButton.style.boxShadow = '0 0 15px rgba(231, 76, 60, 0.6)';
            cancelButton.style.boxShadow = 'none';
        } else {
            cancelButton.style.background = '#7f8c8d';
            cancelButton.style.transform = 'scale(1.1)';
            cancelButton.style.boxShadow = '0 0 15px rgba(149, 165, 166, 0.6)';
            okButton.style.boxShadow = 'none';
        }
    }

    function closeDialog() {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', onDialogKeyDown, true);
        window.removeEventListener('keydown', onDialogKeyDown, true);
    }

    function confirmQuit() {
        closeDialog();
        ipcRenderer.invoke('quit');
    }

    function cancelQuit() {
        closeDialog();
        // Restore slideshow keyboard listener using global reference
        if (window.currentHomeKeyDown) {
            window.addEventListener('keydown', window.currentHomeKeyDown);
        }
    }

    // Keyboard and gamepad handler - CAPTURE ALL EVENTS
    function onDialogKeyDown(event) {
        // STOP ALL KEYBOARD EVENTS from propagating
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
                selectedButton = selectedButton === 'ok' ? 'cancel' : 'ok';
                updateButtonSelection();
                break;
            case 'Enter':
                if (selectedButton === 'ok') {
                    confirmQuit();
                } else {
                    cancelQuit();
                }
                break;
            case 'Escape':
                cancelQuit();
                break;
            default:
                // Block ALL other keys
                break;
        }
    }

    // Button click handlers
    okButton.addEventListener('click', confirmQuit);
    cancelButton.addEventListener('click', cancelQuit);
    
    // Overlay click to cancel
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            cancelQuit();
        }
    });

    // COMPLETELY BLOCK ALL KEYBOARD EVENTS
    // Remove ALL existing listeners
    const allListeners = window.getEventListeners ? window.getEventListeners(window) : null;
    
    // Brute force: remove all keydown listeners using the global reference
    if (window.currentHomeKeyDown) {
        window.removeEventListener('keydown', window.currentHomeKeyDown);
        document.removeEventListener('keydown', window.currentHomeKeyDown);
    }
    
    // Add dialog listener with capture=true for ABSOLUTE highest priority
    document.addEventListener('keydown', onDialogKeyDown, true);
    window.addEventListener('keydown', onDialogKeyDown, true);
    
    // Initialize button selection
    updateButtonSelection();
    
    // Focus the dialog for accessibility
    dialog.focus();
}

LB.control = {
    initGallery: initGallery,
    initSlideShow: initSlideShow,
    initGamepad: initGamepad
};

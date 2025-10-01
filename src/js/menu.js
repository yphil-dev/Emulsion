// menu.js - Clean menu management module
// No imports - uses global LB object

let menuState = {
    isOpen: false,
    selectedIndex: 1,
    menuType: null, // 'platform' or 'game'
    previousKeyDownListener: null // Store the previous listener to restore
};

// Global current platform - always tracked except in slideshow/settings
if (!window.LB.currentPlatform) {
    window.LB.currentPlatform = null;
}

// Menu keyboard navigation handler
function onMenuKeyDown(event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    const menu = document.getElementById('menu');
    const menuGameContainers = Array.from(menu.querySelectorAll('.menu-game-container'));
    const galleryNumOfCols = window.LB.galleryNumOfCols;

    switch (event.key) {
        case 'ArrowRight':
            if (!event.shiftKey) {
                menuState.selectedIndex = (menuState.selectedIndex + 1) % menuGameContainers.length;
            }
            break;

        case 'ArrowLeft':
            if (!event.shiftKey && menuState.selectedIndex !== 1) {
                menuState.selectedIndex = (menuState.selectedIndex - 1 + menuGameContainers.length) % menuGameContainers.length;
            }
            break;

        case 'ArrowUp':
            if (menuState.selectedIndex > galleryNumOfCols) {
                menuState.selectedIndex = Math.max(menuState.selectedIndex - galleryNumOfCols, 0);
            }
            break;

        case 'ArrowDown':
            menuState.selectedIndex = Math.min(menuState.selectedIndex + galleryNumOfCols, menuGameContainers.length - 1);
            break;

        case 'PageUp':
            menuState.selectedIndex = Math.max(menuState.selectedIndex - galleryNumOfCols * 10, 0);
            break;

        case 'PageDown':
            menuState.selectedIndex = Math.min(menuState.selectedIndex + galleryNumOfCols * 10, menuGameContainers.length - 1);
            break;

        case 'Home':
            menuState.selectedIndex = 0;
            break;

        case 'End':
            menuState.selectedIndex = menuGameContainers.length - 1;
            break;

        case 'Enter':
            const selectedGame = LB.utils.getSelectedGame(menuGameContainers, menuState.selectedIndex);
            const selectedImg = selectedGame.querySelector('.game-image');
            if (menuState.menuType === 'platform') {
                LB.menu.closePlatformMenu();
            } else {
                LB.menu.closeGameMenu(selectedImg.src);
            }
            break;

        case 'F5':
            if (event.shiftKey) {
                ipcRenderer.invoke('restart');
            } else {
                window.location.reload();
            }
            break;

        case 'Escape':
            if (menuState.menuType === 'platform') {
                LB.menu.closePlatformMenu();
            } else {
                LB.menu.closeGameMenu();
            }
            break;
    }

    // Update visual selection
    menuGameContainers.forEach((container, index) => {
        container.classList.toggle('selected', index === menuState.selectedIndex);
    });
}

// Menu click handler
function onMenuClick(event) {
    if (event.target.src) {
        if (menuState.menuType === 'platform') {
            LB.menu.closePlatformMenu();
        } else {
            LB.menu.closeGameMenu(event.target.src);
        }
    }
}

// Menu scroll handler
function onMenuWheel(event) {
    if (event.shiftKey) {
        return;
    }
    
    if (event.deltaY > 0) {
        LB.utils.simulateKeyDown('ArrowDown');
    } else if (event.deltaY < 0) {
        LB.utils.simulateKeyDown('ArrowUp');
    }
}

// Download image helper
async function downloadImage(imgSrc, platform, gameName) {
    const gamesDir = window.LB.preferences[platform]?.gamesDir;
    if (!gamesDir) {
        console.error('No games directory found for platform:', platform);
        return null;
    }

    try {
        const result = await ipcRenderer.invoke('download-image', imgSrc, platform, gameName, gamesDir);
        if (result.success) {
            console.log(`Image saved at ${result.path}`);
            return result.path;
        } else {
            console.error(`Error saving image: ${result.error}`);
            return null;
        }
    } catch (error) {
        console.error('Error communicating with main process:', error);
        alert('Failed to save image');
        return null;
    }
}

/**
 * Open menu for a platform settings page
 * @param {string} platformName - Name of the platform
 */
async function openPlatformMenu(platformName) {
    if (menuState.isOpen) {
        console.warn('Menu already open');
        return;
    }

    const menu = document.getElementById('menu');
    const menuContainer = document.getElementById('menu');
    
    // Store state
    menuState.isOpen = true;
    menuState.menuType = 'platform';
    menuState.selectedIndex = 1;

    // Update UI
    LB.utils.updateControls('west', 'same', '', 'off');
    LB.utils.updateControls('dpad', 'same', '', 'off');
    LB.utils.updateControls('shoulders', 'same', '', 'off');
    
    menu.style.height = '85vh';
    document.querySelector('#header .prev-link').style.opacity = 0;
    document.querySelector('#header .next-link').style.opacity = 0;

    // Clear and populate menu
    menuContainer.innerHTML = '';
    menuContainer.dataset.menuPlatform = platformName;
    
    const platformForm = window.LB.build.platformForm(platformName);
    menuContainer.appendChild(platformForm);

    // Remove current keyboard listener (typically gallery handler)
    if (window.currentGalleryKeyDown) {
        window.removeEventListener('keydown', window.currentGalleryKeyDown);
    }
    
    // Attach event listeners
    window.addEventListener('keydown', onMenuKeyDown);
    menuContainer.addEventListener('wheel', onMenuWheel);
    menuContainer.addEventListener('click', onMenuClick);
    
    console.log('Platform menu opened for:', platformName);
}

/**
 * Open menu for a game cover art selection
 * @param {HTMLElement} gameContainer - The game container element
 */
async function openGameMenu(gameContainer) {
    if (menuState.isOpen) {
        console.warn('Menu already open');
        return;
    }

    const menu = document.getElementById('menu');
    const menuContainer = document.getElementById('menu');
    
    const gameName = gameContainer.dataset.gameName;
    const platformName = gameContainer.dataset.platform;
    const gameImage = gameContainer.querySelector('img');

    // Store state
    menuState.isOpen = true;
    menuState.menuType = 'game';
    menuState.selectedIndex = 1;

    // Update UI
    LB.utils.updateControls('west', 'same', '', 'off');
    LB.utils.updateControls('dpad', 'same', '', 'off');
    LB.utils.updateControls('shoulders', 'same', '', 'off');
    
    menu.style.height = '85vh';
    document.querySelector('#header .prev-link').style.opacity = 0;
    document.querySelector('#header .next-link').style.opacity = 0;

    // Clear and populate menu
    menuContainer.innerHTML = '';
    menuContainer.dataset.menuPlatform = platformName;
    
    const gameMenuContainer = window.LB.build.gameMenu(gameName, gameImage, platformName);
    menuContainer.appendChild(gameMenuContainer);
    await window.LB.build.populateGameMenu(gameMenuContainer, gameName, platformName);

    // Update header
    document.querySelector('header .platform-name').textContent = LB.utils.cleanFileName(gameName);
    document.querySelector('header .item-type').textContent = '';
    document.querySelector('header .item-number').textContent = '';

    // Remove current keyboard listener (typically gallery handler)
    if (window.currentGalleryKeyDown) {
        window.removeEventListener('keydown', window.currentGalleryKeyDown);
    }
    
    // Attach event listeners
    window.addEventListener('keydown', onMenuKeyDown);
    menuContainer.addEventListener('wheel', onMenuWheel);
    menuContainer.addEventListener('click', onMenuClick);
    
    console.log('Game menu opened for:', gameName, 'platform:', platformName);
}

/**
 * Close platform settings menu
 */
async function closePlatformMenu() {
    if (!menuState.isOpen || menuState.menuType !== 'platform') {
        console.warn('No platform menu to close');
        return;
    }

    const menu = document.getElementById('menu');
    const menuContainer = document.getElementById('menu');

    // Get the platform name from the menu
    const platformName = menuContainer.dataset.menuPlatform;

    // Remove event listeners
    window.removeEventListener('keydown', onMenuKeyDown);
    menuContainer.removeEventListener('wheel', onMenuWheel);
    menuContainer.removeEventListener('click', onMenuClick);

    // Check if platform was enabled
    if (platformName && platformName !== 'settings') {
        try {
            const isEnabled = await LB.prefs.getValue(platformName, 'isEnabled');
            if (isEnabled) {
                // Platform was enabled - navigate to it
                menuContainer.innerHTML = '';
                menu.style.height = '0';
                menuState.isOpen = false;
                menuState.menuType = null;
                
                // Update global current platform
                window.LB.currentPlatform = platformName;
                
                console.log('Navigating to enabled platform:', platformName);
                
                // Switch to gallery view
                document.getElementById('slideshow').style.display = 'none';
                document.getElementById('galleries').style.display = 'flex';
                LB.control.initGallery(platformName);
                return;
            }
        } catch (error) {
            console.error('Error checking platform status:', error);
        }
    }

    // Normal close - stay on current page and restore gallery handler
    LB.utils.updateControls('dpad', 'same', 'Browse', 'on');
    document.querySelector('header .prev-link').style.opacity = 1;
    document.querySelector('header .next-link').style.opacity = 1;

    menuContainer.innerHTML = '';
    menu.style.height = '0';
    menuState.isOpen = false;
    menuState.menuType = null;
    
    // Restore gallery keyboard handler
    if (window.currentGalleryKeyDown) {
        window.addEventListener('keydown', window.currentGalleryKeyDown);
    }
    
    console.log('Platform menu closed');
}

/**
 * Close game cover art menu
 * @param {string} imgSrc - Optional image source to save
 */
async function closeGameMenu(imgSrc) {
    if (!menuState.isOpen || menuState.menuType !== 'game') {
        console.warn('No game menu to close');
        return;
    }

    const menu = document.getElementById('menu');
    const menuContainer = document.getElementById('menu');

    // Remove event listeners
    window.removeEventListener('keydown', onMenuKeyDown);
    menuContainer.removeEventListener('wheel', onMenuWheel);
    menuContainer.removeEventListener('click', onMenuClick);

    // Normal menu close and restore gallery handler
    LB.utils.updateControls('dpad', 'same', 'Browse', 'on');
    document.querySelector('header .prev-link').style.opacity = 1;
    document.querySelector('header .next-link').style.opacity = 1;

    window.LB.imageSrc = imgSrc;
    menuContainer.innerHTML = '';
    menu.style.height = '0';
    
    // Restore gallery keyboard handler
    if (window.currentGalleryKeyDown) {
        window.addEventListener('keydown', window.currentGalleryKeyDown);
    }

    // Download and update image if provided
    if (imgSrc && window.LB.currentPlatform) {
        const gameContainers = Array.from(document.querySelectorAll('.game-container'));
        const selectedGame = gameContainers.find(c => c.classList.contains('selected'));
        
        if (selectedGame) {
            const selectedGameImg = selectedGame.querySelector('.game-image');
            if (selectedGameImg) {
                selectedGame.classList.add('loading');
                
                const savedImagePath = await downloadImage(
                    imgSrc, 
                    selectedGame.dataset.platform, 
                    selectedGame.dataset.gameName
                );

                if (savedImagePath) {
                    selectedGameImg.src = savedImagePath + '?t=' + new Date().getTime();
                    selectedGameImg.onload = () => {
                        selectedGame.classList.remove('loading');
                    };
                }
            }
            
            selectedGame.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }

    menuState.isOpen = false;
    menuState.menuType = null;
    
    console.log('Game menu closed');
}

/**
 * Check if menu is currently open
 * @returns {boolean}
 */
function isMenuOpen() {
    return menuState.isOpen;
}

// Export to global LB object
LB.menu = {
    openPlatformMenu,
    openGameMenu,
    closePlatformMenu,
    closeGameMenu,
    isMenuOpen
};

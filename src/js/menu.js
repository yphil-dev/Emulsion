import { getPlatformInfo } from './platforms.js';
import { initSlideShow } from './slideshow.js';
import { updatePreference, getPreference } from './preferences.js';
import { getSelectedGameContainer,
         updateFooterControls,
         updateHeader,
         notify,
         applyTheme,
         simulateKeyDown,
         simulateTabNavigation,
         setKeydown,
         setFooterSize,
         toggleHeaderNavLinks } from './utils.js';

let menuState = {
    isOpen: false,
    selectedIndex: 1,
    menuType: null, // 'platform' or 'game'
    previousKeyDownListener: null // Store the previous listener to restore
};

function platformMenuKeyDown(event) {

    event.stopPropagation();
    event.stopImmediatePropagation();

    switch (event.key) {
    case 'ArrowRight':
        console.log("ArrowRight: ");
        simulateTabNavigation();
        break;

    case 'ArrowLeft':
        simulateTabNavigation(true);
        break;

    case 'Escape':
        closePlatformMenu();
        break;
    }

}

function gameMenuKeyDown(event) {

    event.stopPropagation();
    event.stopImmediatePropagation();

    const menu = document.getElementById('menu');
    const menuGameContainers = Array.from(menu.querySelectorAll('.menu-game-container'));
    const galleryNumOfCols = LB.galleryNumOfCols;

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
        const selectedGameContainer = getSelectedGameContainer(menuGameContainers, menuState.selectedIndex);
        const selectedImg = selectedGameContainer.querySelector('.game-image');
        if (menuState.menuType === 'platform') {
            closePlatformMenu();
        } else {
            closeGameMenu(selectedImg.src);
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
            closePlatformMenu();
        } else {
            closeGameMenu();
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
            closePlatformMenu();
        } else {
            closeGameMenu(event.target.src);
        }
    }
}

// Menu scroll handler
function onMenuWheel(event) {
    if (event.shiftKey) {
        return;
    }

    if (event.deltaY > 0) {
        simulateKeyDown('ArrowDown');
    } else if (event.deltaY < 0) {
        simulateKeyDown('ArrowUp');
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
            notify(`Image saved at ${result.path}`);
            return result.path;
        } else {
            console.error(`Error saving image: ${result.error}`);
            notify(`Error saving image: ${result.error}`);
            return null;
        }
    } catch (error) {
        console.error('Error communicating with main process:', error);
        alert('Failed to save image');
        return null;
    }
}


function buildPrefsFormItem(name, iconName, type, description, shortDescription, value, onChangeFct) {

    let input;
    const group = document.createElement('div');

    const radios = [];

    if (typeof type === 'object') {
        const types = type;

        const inputCtn = document.createElement('div');
        inputCtn.classList.add('input-ctn');

        const radiosContainer = document.createElement('div');
        radiosContainer.classList.add('radio-container');

        types.forEach((type, index) => {

            const label = document.createElement('label');

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = name;
            radio.value = type;
            radio.checked = type === value;

            const radioBox = document.createElement('div');
            radioBox.classList.add('radio-box');
            radioBox.textContent = type;

            if (index === types.length - 1) {
                radioBox.classList.add('last');
            }

            radios.push(radio);

            const text = document.createTextNode(type.charAt(0).toUpperCase() + type.slice(1));

            radio.addEventListener('change', () => {
                console.log("change!: ");
                if (radio.checked && onChangeFct) onChangeFct(type);
            });

            label.appendChild(radio);
            label.appendChild(radioBox);
            radiosContainer.appendChild(label);

        });

        inputCtn.appendChild(radiosContainer);

        input = inputCtn;

    } else if (type === 'menu') {

    } else {

        input = document.createElement('input');
        input.type = type;
        input.id = name;
        input.name = name;
        input.min = '2';
        input.max = '12';
        input.placeholder = description;

        input.classList.add('input');
        input.value = value;

    }

    const icon = document.createElement('div');
    icon.classList.add('form-icon');
    icon.innerHTML = `<i class="form-icon fa fa-2x fa-${iconName}" aria-hidden="true"></i>`;

    const label = document.createElement('label');
    label.textContent = shortDescription;

    const SubLabel = document.createElement('label');
    SubLabel.id = 'num-cols-sub-label';
    SubLabel.classList.add('sub-label');

    const ctn = document.createElement('div');
    ctn.classList.add('dual-ctn');

    ctn.appendChild(icon);
    ctn.appendChild(input);

    group.appendChild(label);
    group.appendChild(ctn);

    return { group, input, radios };
}

function buildSettingsMenu() {

    // Image
    const formContainer = document.createElement('div');
    formContainer.classList.add('platform-menu-container');
    const platformMenuImageCtn = document.createElement('div');
    platformMenuImageCtn.classList.add('platform-menu-image-ctn');
    const platformMenuImage = document.createElement('img');
    platformMenuImage.src = path.join(LB.baseDir, 'img', 'platforms', `settings.png`);
    platformMenuImage.title = `Emulsion version ${LB.versionNumber}`;

    platformMenuImage.width = '250';
    platformMenuImageCtn.appendChild(platformMenuImage);

    // Rows
    const numberOfColumns = buildPrefsFormItem('numberOfColumns', 'th', 'number', 'The number of columns in each platform gallery', 'Number of columns', LB.galleryNumOfCols);
    const numberOfColumnsGroup = numberOfColumns.group;
    const numberOfColumnsInput = numberOfColumns.input;

    const footerSize = buildPrefsFormItem('footerSize', 'arrows', ['small', 'medium', 'big'], '', 'Footer menu size', LB.footerSize, setFooterSize);
    const footerSizeGroup = footerSize.group;
    const footerSizeRadios = footerSize.radios;

    const homeMenuTheme = buildPrefsFormItem('homeMenuTheme', 'arrows-h', ['flat', '3D'], '', 'Home menu style', LB.homeMenuTheme);
    const homeMenuThemeGroup = homeMenuTheme.group;
    const homeMenuThemeRadios = homeMenuTheme.radios;

    const theme = buildPrefsFormItem('theme', 'eyedropper', ['default', 'day', 'night'], '', 'Emulsion Theme', LB.theme, applyTheme);
    const themeGroup = theme.group;
    const themeRadios = theme.radios;

    const disabledPlatformsPolicy = buildPrefsFormItem('disabledPlatformsPolicy', 'check-square-o', ['show', 'hide'], '', 'Disabled Platforms', LB.disabledPlatformsPolicy);
    const disabledPlatformsPolicyGroup = disabledPlatformsPolicy.group;
    const disabledPlatformsPolicyRadios = disabledPlatformsPolicy.radios;

    const recentlyPlayedPolicy = buildPrefsFormItem('recentlyPlayedPolicy', 'clock-o', ['show', 'hide'], '', 'Recently Played', LB.recentlyPlayedPolicy);
    const recentlyPlayedPolicyGroup = recentlyPlayedPolicy.group;
    const recentlyPlayedPolicyRadios = recentlyPlayedPolicy.radios;

    const steamGridAPIKey = buildPrefsFormItem('steamGridAPIKey', 'steam-square', 'text', 'Your SteamGrid API Key', 'SteamGrid API Key', LB.steamGridAPIKey || '');
    const steamGridAPIKeyGroup = steamGridAPIKey.group;
    const steamGridAPIKeyInput = steamGridAPIKey.input;

    const giantBombAPIKey = buildPrefsFormItem('giantBombAPIKey', 'bomb', 'text', 'Your GiantBomb API Key', 'GiantBomb API Key', LB.giantBombAPIKey || '');
    const giantBombAPIKeyGroup = giantBombAPIKey.group;
    const giantBombAPIKeyInput = giantBombAPIKey.input;

    // formContainer.appendChild(platformMenuImageCtn);
    formContainer.appendChild(numberOfColumnsGroup);
    formContainer.appendChild(homeMenuThemeGroup);
    formContainer.appendChild(themeGroup);
    formContainer.appendChild(footerSizeGroup);
    formContainer.appendChild(disabledPlatformsPolicyGroup);
    formContainer.appendChild(recentlyPlayedPolicyGroup);
    formContainer.appendChild(steamGridAPIKeyGroup);
    formContainer.appendChild(giantBombAPIKeyGroup);

    // Buttons
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.classList.add('button');
    saveButton.textContent = 'Save';

    const aboutButton = document.createElement('button');
    aboutButton.type = 'button';
    aboutButton.className = 'button';
    aboutButton.textContent = 'About';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('is-info', 'button');
    cancelButton.textContent = 'Cancel';

    const formContainerButtons = document.createElement('div');
    formContainerButtons.classList.add('cancel-save-buttons');
    formContainerButtons.appendChild(cancelButton);
    formContainerButtons.appendChild(aboutButton);
    formContainerButtons.appendChild(saveButton);

    formContainer.appendChild(formContainerButtons);

    const formContainerVSpacerDiv = document.createElement('div');
    formContainerVSpacerDiv.classList.add('spacer-div');

    formContainer.appendChild(formContainerVSpacerDiv);

    cancelButton.addEventListener('click', _cancelButtonClick);

    aboutButton.addEventListener('click', () => {
        ipcRenderer.invoke('open-about-window');
    });

    saveButton.addEventListener('click', _saveButtonClick);

    function _cancelButtonClick(event) {
        // Smart navigation - return to slideshow without reload
        initSlideShow('settings');
    }

    async function _saveButtonClick() {
        try {
            let numberOfColumns = parseInt(numberOfColumnsInput.value, 10);

            if (numberOfColumns < 2) {
                numberOfColumns = 2;
            } else if (numberOfColumns > 12) {
                numberOfColumns = 12;
            }

            // Collect new values
            const newPrefs = {
                numberOfColumns,
                footerSize: footerSizeRadios.find(radio => radio.checked)?.value,
                homeMenuTheme: homeMenuThemeRadios.find(radio => radio.checked)?.value,
                theme: themeRadios.find(radio => radio.checked)?.value,
                disabledPlatformsPolicy: disabledPlatformsPolicyRadios.find(radio => radio.checked)?.value,
                recentlyPlayedPolicy: recentlyPlayedPolicyRadios.find(radio => radio.checked)?.value,
                steamGridAPIKey: steamGridAPIKeyInput.value,
                giantBombAPIKey: giantBombAPIKeyInput.value
            };

            // Save preferences
            await updatePreference('settings', 'numberOfColumns', newPrefs.numberOfColumns);
            await updatePreference('settings', 'footerSize', newPrefs.footerSize);
            await updatePreference('settings', 'homeMenuTheme', newPrefs.homeMenuTheme);
            await updatePreference('settings', 'theme', newPrefs.theme);
            await updatePreference('settings', 'disabledPlatformsPolicy', newPrefs.disabledPlatformsPolicy);
            await updatePreference('settings', 'recentlyPlayedPolicy', newPrefs.recentlyPlayedPolicy);
            await updatePreference('settings', 'steamGridAPIKey', newPrefs.steamGridAPIKey);
            await updatePreference('settings', 'giantBombAPIKey', newPrefs.giantBombAPIKey);

            // Detect changes that require reload
            const somethingImportantChanged =
                  newPrefs.numberOfColumns !== LB.galleryNumOfCols ||
                  newPrefs.disabledPlatformsPolicy !== LB.disabledPlatformsPolicy ||
                  newPrefs.recentlyPlayedPolicy !== LB.recentlyPlayedPolicy ||
                  newPrefs.steamGridAPIKey !== (LB.steamGridAPIKey || '') ||
                  newPrefs.giantBombAPIKey !== (LB.giantBombAPIKey || '');

            // Update LB to reflect changes
            Object.assign(LB, {
                galleryNumOfCols: newPrefs.numberOfColumns,
                footerSize: newPrefs.footerSize,
                homeMenuTheme: newPrefs.homeMenuTheme,
                theme: newPrefs.theme,
                disabledPlatformsPolicy: newPrefs.disabledPlatformsPolicy,
                recentlyPlayedPolicy: newPrefs.recentlyPlayedPolicy,
                steamGridAPIKey: newPrefs.steamGridAPIKey,
                giantBombAPIKey: newPrefs.giantBombAPIKey
            });

            if (somethingImportantChanged) {
                window.location.reload();
            } else {
                // Smart navigation - return to slideshow without reload
                initSlideShow('settings');
            }
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    return formContainer;
}

function buildPlatformForm(platformName) {

    if (platformName === 'settings') {
        return buildSettingsMenu();
    }

    const formContainer = document.createElement('div');
    formContainer.classList.add('platform-menu-container');

    const platformMenuImageCtn = document.createElement('div');
    platformMenuImageCtn.classList.add('platform-menu-image-ctn');
    const platformMenuImage = document.createElement('img');
    platformMenuImage.src = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
    platformMenuImage.width = '250';

    platformMenuImageCtn.appendChild(platformMenuImage);

    const statusCheckBox = document.createElement('input');
    statusCheckBox.type = 'checkbox';
    statusCheckBox.id = 'input-platform-toggle-checkbox';
    statusCheckBox.classList.add('checkbox');

    const statusLabel = document.createElement('label');
    statusLabel.classList.add('checkbox');
    statusLabel.id = 'form-status-label';

    const statusLabelPlatormName = document.createElement('span');
    statusLabelPlatormName.id = 'form-status-label-platform-name';

    const platformInfo = getPlatformInfo(platformName);

    statusLabelPlatormName.innerHTML = `${platformInfo.name} is&nbsp;`;

    const statusLabelPlatormStatus = document.createElement('span');
    statusLabelPlatormStatus.id = 'form-status-label-platform-status';

    statusLabel.appendChild(statusCheckBox);
    statusLabel.appendChild(statusLabelPlatormName);
    statusLabel.appendChild(statusLabelPlatormStatus);

    const gamesDirGroup = document.createElement('div');

    const gamesDirInput = document.createElement('input');
    gamesDirInput.type = 'text';
    gamesDirInput.classList.add('input');
    gamesDirInput.placeholder = `Your ${platformInfo.name} games directory`;

    const gamesDirLabel = document.createElement('label');
    gamesDirLabel.textContent = 'Games directory';

    const gamesDirSubLabel = document.createElement('span');
    gamesDirSubLabel.id = 'games-dir-sub-label';
    gamesDirSubLabel.classList.add('sub-label');

    gamesDirLabel.appendChild(gamesDirSubLabel);

    const gamesDirButton = document.createElement('button');
    gamesDirButton.classList.add('button', 'button-browse', 'info');
    gamesDirButton.textContent = 'Browse';

    const gamesDirCtn = document.createElement('div');
    gamesDirCtn.classList.add('dual-ctn');

    const gamesDirIcon = document.createElement('div');
    gamesDirIcon.classList.add('form-icon');
    gamesDirIcon.innerHTML = '<i class="form-icon fa fa-2x fa-folder-open-o" aria-hidden="true"></i>';

    gamesDirCtn.appendChild(gamesDirIcon);
    gamesDirCtn.appendChild(gamesDirInput);
    gamesDirCtn.appendChild(gamesDirButton);

    gamesDirGroup.appendChild(gamesDirLabel);
    gamesDirGroup.appendChild(gamesDirCtn);

    const emulatorGroup = document.createElement('div');

    const emulatorIcon = document.createElement('div');
    emulatorIcon.classList.add('form-icon');
    emulatorIcon.innerHTML = '<i class="form-icon fa fa-2x fa-gamepad" aria-hidden="true"></i>';

    const emulatorInputLabel = document.createElement('label');
    emulatorInputLabel.textContent = "Emulator";

    const emulatorSubLabel = document.createElement('span');
    emulatorSubLabel.id = 'emulator-sub-label';
    emulatorSubLabel.classList.add('sub-label');

    emulatorInputLabel.appendChild(emulatorSubLabel);

    const emulatorInput = document.createElement('input');
    emulatorInput.type = 'text';
    emulatorInput.classList.add('input');
    emulatorInput.placeholder = `Your ${platformInfo.name} emulator`;

    const emulatorCtn = document.createElement('div');
    emulatorCtn.classList.add('dual-ctn');

    const emulatorButton = document.createElement('button');
    emulatorButton.classList.add('button', 'button-browse');
    emulatorButton.textContent = 'Browse';

    emulatorCtn.appendChild(emulatorIcon);
    emulatorCtn.appendChild(emulatorInput);
    emulatorCtn.appendChild(emulatorButton);

    emulatorGroup.appendChild(emulatorInputLabel);
    emulatorGroup.appendChild(emulatorCtn);

    // ======== BATCH DOWNLOAD SECTION ========
    const batchGroup = document.createElement('div');

    const batchIcon = document.createElement('div');
    batchIcon.classList.add('form-icon');
    batchIcon.innerHTML = '<i class="form-icon fa fa-2x fa-file-image-o" aria-hidden="true"></i>';

    const batchInputLabel = document.createElement('label');
    batchInputLabel.textContent = "Get all cover images";

    const batchSubLabel = document.createElement('span');
    batchSubLabel.id = 'batch-sub-label';
    batchSubLabel.classList.add('sub-label');

    const batchInput = createProgressBar();
    batchInput.classList.add('input');

    const batchCtn = document.createElement('div');
    batchCtn.classList.add('dual-ctn');

    const batchButton = document.createElement('button');
    batchButton.classList.add('button', 'button-browse');
    batchButton.textContent = 'Go';

    batchButton.addEventListener('click', batchButtonClick);

    batchCtn.appendChild(batchIcon);
    batchCtn.appendChild(batchInput);
    batchCtn.appendChild(batchButton);

    batchInputLabel.appendChild(batchSubLabel);
    batchGroup.appendChild(batchInputLabel);
    batchGroup.appendChild(batchCtn);

    // ======== NEW EXTENSIONS SECTION ========
    const extensionsGroup = document.createElement('div');

    // Label
    const extensionsLabel = document.createElement('label');
    extensionsLabel.textContent = 'File Extensions';

    // Container for icon + inputs
    const extensionsCtn = document.createElement('div');
    extensionsCtn.classList.add('dual-ctn');

    // Icon
    const extensionsIcon = document.createElement('div');
    extensionsIcon.classList.add('form-icon');
    extensionsIcon.innerHTML = '<i class="form-icon fa fa-2x fa-file-archive-o" aria-hidden="true"></i>';

    // Inputs wrapper
    const extensionsInputsContainer = document.createElement('div');
    extensionsInputsContainer.classList.add('extensions-inputs-container');

    // Helper to enable/disable the “+” button based on row count
    function updateAddExtensionBtn() {
        // Count only the input rows (total children minus the add button itself)
        const rowCount = extensionsInputsContainer.children.length - 1;
        addExtensionBtn.disabled = rowCount >= 3;
        addExtensionBtn.style.opacity = addExtensionBtn.disabled ? '0.5' : '1';
    }

    // Create the “Select +” button wired to add a new row
    const addExtensionBtn = document.createElement('button');
    addExtensionBtn.classList.add('button', 'small');
    addExtensionBtn.innerHTML = '<i class="form-icon emulator-args-icon fa fa-plus" aria-hidden="true"></i>';
    addExtensionBtn.addEventListener('click', () => {
        // Guard so we never exceed 3
        if (extensionsInputsContainer.children.length - 1 < 3) {
            const newRow = _createExtensionInputRow('', false);
            // Insert before the button
            extensionsInputsContainer.insertBefore(newRow, addExtensionBtn);
            updateAddExtensionBtn();
        }
    });

    // Load existing extensions from preferences
    getPreference(platformName, 'extensions')
        .then(extensions => {
            const initialExtensions = extensions || ['.iso'];
            initialExtensions.forEach((ext, index) => {
                const inputRow = _createExtensionInputRow(ext, index === 0);
                extensionsInputsContainer.appendChild(inputRow);
            });
            // Finally append the add button and update its state
            extensionsInputsContainer.appendChild(addExtensionBtn);
            updateAddExtensionBtn();
        })
        .catch(console.error);

    // Assemble the full group
    extensionsCtn.appendChild(extensionsIcon);
    extensionsCtn.appendChild(extensionsInputsContainer);
    extensionsGroup.appendChild(extensionsLabel);
    extensionsGroup.appendChild(extensionsCtn);
    // ======== END EXTENSIONS SECTION ========

    const emulatorArgsGroup = document.createElement('div');

    const emulatorArgsCtn = document.createElement('div');
    emulatorArgsCtn.classList.add('dual-ctn');

    const emulatorArgsIcon = document.createElement('div');
    emulatorArgsIcon.classList.add('form-icon');
    emulatorArgsIcon.innerHTML = '<i class="form-icon emulator-args-icon fa fa-2x fa-rocket" aria-hidden="true"></i>';

    const emulatorArgsLabel = document.createElement('label');
    emulatorArgsLabel.textContent = 'Emulator Arguments';

    const emulatorArgsInput = document.createElement('input');
    emulatorArgsInput.classList.add('input');
    emulatorArgsInput.type = 'text';
    emulatorArgsInput.placeholder = `Your ${platformInfo.name} emulator arguments`;

    emulatorArgsCtn.appendChild(emulatorArgsIcon);
    emulatorArgsCtn.appendChild(emulatorArgsInput);
    emulatorArgsGroup.appendChild(emulatorArgsLabel);
    emulatorArgsGroup.appendChild(emulatorArgsCtn);

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.classList.add('button');
    saveButton.textContent = 'Save';

    const helpButton = document.createElement('button');
    helpButton.type = 'button';
    helpButton.classList.add('button');
    helpButton.textContent = 'Help';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('button');
    cancelButton.textContent = 'Cancel';

    getPreference(platformName, 'gamesDir')
        .then((value) => {
            gamesDirInput.value = value;
        })
        .catch((error) => {
            console.error('Failed to get platform preference:', error);
        });

    getPreference(platformName, 'emulator')
        .then((value) => {
            emulatorInput.value = value;
        })
        .catch((error) => {
            console.error('Failed to get platform preference:', error);
        });

    getPreference(platformName, 'emulatorArgs')
        .then((value) => {
            emulatorArgsInput.value = value;
        })
        .catch((error) => {
            console.error('Failed to get platform preference:', error);
        });


    gamesDirButton.addEventListener('click', _gamesDirButtonClick);
    emulatorButton.addEventListener('click', _emulatorButtonClick);

    async function _gamesDirButtonClick(event) {
        event.stopPropagation();
        const selectedPath = await ipcRenderer.invoke('select-file-or-directory', 'openDirectory');
        if (selectedPath) {
            gamesDirInput.value = selectedPath;
        }
    }

    async function _emulatorButtonClick(event) {
        event.stopPropagation();
        const selectedPath = await ipcRenderer.invoke('select-file-or-directory', 'openFile');
        if (selectedPath) {
            emulatorInput.value = selectedPath;
        }
    }

    formContainer.appendChild(platformMenuImageCtn);
    formContainer.appendChild(statusLabel);
    formContainer.appendChild(gamesDirGroup);
    formContainer.appendChild(emulatorGroup);
    formContainer.appendChild(batchGroup);
    formContainer.appendChild(extensionsGroup);
    formContainer.appendChild(emulatorArgsGroup);

    const formContainerButtons = document.createElement('div');
    formContainerButtons.classList.add('cancel-save-buttons');
    formContainerButtons.appendChild(cancelButton);
    formContainerButtons.appendChild(helpButton);
    formContainerButtons.appendChild(saveButton);

    getPreference(platformName, 'isEnabled')
        .then((value) => {
            statusCheckBox.checked = value;
            statusLabelPlatormStatus.textContent = value ? 'On' : 'Off';
            statusLabelPlatormStatus.classList.add(value ? 'on' : 'off');
        })
        .catch((error) => {
            console.error('Failed to get platform preference:', error);
        });

    statusCheckBox.addEventListener('change', (event) => {
        console.log("event: ", event);
        const isNotEnablable = !gamesDirInput.value || !emulatorInput.value;
        const isEnabling = statusCheckBox.checked;

        gamesDirSubLabel.textContent = '';
        emulatorSubLabel.textContent = '';

        if (isEnabling) {
            if (!gamesDirInput.value) {
                gamesDirSubLabel.textContent = 'Please enter a game directory';
            }
            if (!emulatorInput.value) {
                emulatorSubLabel.textContent = 'Please enter an emulator (name or path)';
            }
        }

        if (isEnabling && isNotEnablable) {
            event.preventDefault();
            statusCheckBox.checked = false;
            console.log("Cannot enable platform - missing requirements");
        }
        else {
            // Only modify classes and text if requirements are met
            statusLabelPlatormStatus.classList.remove('on', 'off');
            statusLabelPlatormStatus.textContent = statusCheckBox.checked ? 'On' : 'Off';
            statusLabelPlatormStatus.classList.add(statusCheckBox.checked ? 'on' : 'off');
        }
    });

    cancelButton.addEventListener('click', _cancelButtonClick);

    helpButton.addEventListener('click', () => {
        ipcRenderer.invoke('go-to-url', 'https://gitlab.com/yphil/emulsion/-/blob/master/README.md#usage');
    });

    saveButton.addEventListener('click', _saveButtonClick);

    function _cancelButtonClick() {
        closePlatformMenu();
        initSlideShow(platformName);
    }

    async function _saveButtonClick() {
        console.log("emulatorInput.value:", emulatorInput.value);
        console.log("gamesDirInput.value:", gamesDirInput.value);

        function validateForm() {
            let valid = true;

            if (!gamesDirInput.value.trim()) {
                gamesDirSubLabel.textContent = 'This field cannot be empty';
                valid = false;
            } else {
                gamesDirSubLabel.textContent = '';
            }

            if (!emulatorInput.value.trim()) {
                emulatorSubLabel.textContent = 'This field cannot be empty';
                valid = false;
            } else {
                emulatorSubLabel.textContent = '';
            }

            return valid;
        }

        if (!validateForm()) return;

        // Normalize extensions
        const extensions = Array.from(
            extensionsInputsContainer.querySelectorAll('input')
        )
              .map(input => {
                  let val = input.value.trim().toLowerCase();
                  if (!val.startsWith('.')) val = '.' + val;
                  return val.replace(/[^a-z0-9.]/gi, '');
              })
              .filter(ext => ext.length > 1);

        try {
            // Fetch current preferences in parallel
            const [
                prevEnabled,
                prevGamesDir,
                prevEmulator,
                prevExtensions,
                prevArgs
            ] = await Promise.all([
                getPreference(platformName, 'isEnabled').catch(() => false),
                getPreference(platformName, 'gamesDir').catch(() => ''),
                getPreference(platformName, 'emulator').catch(() => ''),
                getPreference(platformName, 'extensions').catch(() => []),
                getPreference(platformName, 'emulatorArgs').catch(() => '')
            ]);

            const nextEnabled = statusCheckBox.checked;
            const nextGamesDir = gamesDirInput.value.trim();
            const nextEmulator = emulatorInput.value.trim();
            const nextExtensions = extensions;
            const nextArgs = emulatorArgsInput.value.trim();

            // Compare deep equality for arrays
            const arraysEqual = (a, b) =>
                  Array.isArray(a) &&
                  Array.isArray(b) &&
                  a.length === b.length &&
                  a.every((v, i) => v === b[i]);

            const changed =
                  prevEnabled !== nextEnabled ||
                  prevGamesDir !== nextGamesDir ||
                  prevEmulator !== nextEmulator ||
                  !arraysEqual(prevExtensions, nextExtensions) ||
                prevArgs !== nextArgs;

            if (!changed) {
                console.log('No changes detected. Skipping reload.');
                return;
            }

            // Save all preferences
            await Promise.all([
                updatePreference(platformName, 'isEnabled', nextEnabled),
                updatePreference(platformName, 'gamesDir', nextGamesDir),
                updatePreference(platformName, 'emulator', nextEmulator),
                updatePreference(platformName, 'extensions', nextExtensions),
                updatePreference(platformName, 'emulatorArgs', nextArgs)
            ]);

            window.location.reload();
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }


    // EXTENSION INPUT ROW CREATOR
    function _createExtensionInputRow(value, isFirst) {
        const row = document.createElement('div');
        row.classList.add('extension-input-row');

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.placeholder = '.ext';
        input.classList.add('input', 'small');

        // Auto-format on blur
        input.addEventListener('blur', () => {
            let val = input.value.trim().toLowerCase();
            if (!val.startsWith('.')) val = '.' + val;
            input.value = val.replace(/[^a-z0-9.]/gi, '');
        });

        if (!isFirst) {
            const removeBtn = document.createElement('button');
            removeBtn.classList.add('button', 'small', 'danger');
            removeBtn.innerHTML = '<i class="form-icon emulator-args-icon fa fa-remove" aria-hidden="true"></i>';
            removeBtn.addEventListener('click', () => row.remove());
            row.appendChild(removeBtn);
        }

        row.appendChild(input);
        return row;
    }

    function createProgressBar() {

        const container = document.createElement("div");
        container.classList.add("progress-container", "input");
        const fill = document.createElement("div");
        fill.classList.add("progress-fill");
        const text = document.createElement("div");
        text.classList.add("progress-text", "success");

        container.appendChild(fill);
        container.appendChild(text);

        return container;
    }

    // Helper to update progress
    function setProgress(current, total) {
        const fills = document.querySelectorAll(".progress-fill");

        if (total > 0) {
            const percent = Math.round((current / total) * 100);

            fills.forEach(fill => {
                fill.style.width = `${percent}%`;
            });

        }
    }

    async function batchButtonClick(event) {
        console.log("Batch download started");

        // document.getElementById('notifications').append(createProgressBar());

        // Find games with missing images in the current platform
        const pages = document.querySelectorAll('#galleries .page');
        const currentPlatformPage = Array.from(pages).find(page =>
            page.dataset.platform === platformName
        );

        if (!gamesDirInput.value) {
            gamesDirSubLabel.textContent = 'This field cannot be empty';
            return;
        }

        console.log("currentPlatformPage: ", currentPlatformPage.dataset.platform);

        if (!currentPlatformPage) {
            console.error("Platform page not found");
            return;
        }

        const games = currentPlatformPage.querySelectorAll(".game-container[data-missing-image]");
        if (!games.length) {
            console.warn("No games with missing images found");
            batchSubLabel.textContent = 'No missing images found';
            return;
        }

        console.log(`Found ${games.length} games with missing images`);

        const progressTexts = document.querySelectorAll(".progress-text");

        for (let i = 0; i < games.length; i++) {
            setProgress(i + 1, games.length);

            const gameContainer = games[i];
            const gameName = gameContainer.dataset.gameName;

            function setProgressTexts(newText, success) {
                progressTexts.forEach(text => {
                    if (success) {
                        text.classList.add('success');
                    } else {
                        text.classList.remove('success');
                    }
                    text.textContent = newText;
                });
            }


            try {

                const urls = await new Promise((resolve) => {
                    ipcRenderer.send('fetch-images', gameName, platformName, LB.steamGridAPIKey, LB.giantBombAPIKey);
                    ipcRenderer.once('image-urls', (event, urls) => resolve(urls));
                });

                console.log("urls.length, gameName: ", urls.length, gameName);

                if (!urls.length) {
                    setProgressTexts(`Not Found: ${gameName}`, false);
                    console.warn(`No image found for ${gameName}`);
                    continue;
                }

                setProgressTexts(`${gameName}`, true);


                const url = typeof urls[0] === 'string' ? urls[0] : urls[0]?.url;
                if (!url) continue;

                const result = await downloadImage(
                    url,
                    platformName,
                    gameName
                );

                if (result) {
                    const imgEl = gameContainer.querySelector("img");
                    if (imgEl) {
                        imgEl.src = result + '?t=' + Date.now();
                        gameContainer.removeAttribute('data-missing-image');
                    }
                }

            } catch (err) {
                console.error(`Failed batch Dload for ${gameName}:`, err);
            }
        }

        progressTexts.forEach(text => {
            text.classList.add('success');
            text.textContent = `Batch download complete!`;
        });

        console.log("✅ Batch download finished");

    }

    formContainer.appendChild(formContainerButtons);

    const formContainerVSpacerDiv = document.createElement('div');
    formContainerVSpacerDiv.classList.add('spacer-div');
    formContainer.appendChild(formContainerVSpacerDiv);

    return formContainer;
}

export function openPlatformMenu(platformName) {

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
    updateFooterControls('west', 'same', '', 'off');
    updateFooterControls('dpad', 'same', '', 'off');
    updateFooterControls('shoulders', 'same', '', 'off');

    menu.style.height = '85vh';

    toggleHeaderNavLinks('hide');

    // Clear and populate menu
    menuContainer.innerHTML = '';
    menuContainer.dataset.menuPlatform = platformName;

    const platformForm = buildPlatformForm(platformName);
    menuContainer.appendChild(platformForm);

    setKeydown(platformMenuKeyDown);

    menuContainer.addEventListener('wheel', onMenuWheel);
    menuContainer.addEventListener('click', onMenuClick);

    console.log('Platform menu opened for:', platformName);
}

export async function openGameMenu(gameContainer) {
    if (menuState.isOpen) {
        console.warn('Menu already open');
        return;
    }

    const menu = document.getElementById('menu');
    const menuContainer = document.getElementById('menu');
    const gameName = gameContainer.dataset.gameName;
    const platformName = gameContainer.dataset.platform;
    const gameImage = gameContainer.querySelector('img');

    updateHeader(platformName, gameName);

    // Store state
    menuState.isOpen = true;
    menuState.menuType = 'game';
    menuState.selectedIndex = 1;

    // Update UI
    updateFooterControls('west', 'same', '', 'off');
    updateFooterControls('dpad', 'same', '', 'off');
    updateFooterControls('shoulders', 'same', '', 'off');

    menu.style.height = '85vh';
    document.querySelector('#header .prev-link').style.opacity = 0;
    document.querySelector('#header .next-link').style.opacity = 0;

    // Clear and populate menu
    menuContainer.innerHTML = '';
    menuContainer.dataset.menuPlatform = platformName;

    const currentGameImgContainer = buildCurrentGameImgContainer(gameName, gameImage, platformName);
    menuContainer.appendChild(currentGameImgContainer);
    await populateGameMenu(currentGameImgContainer, gameName, platformName);

    setKeydown(gameMenuKeyDown);

    menuContainer.addEventListener('wheel', onMenuWheel);
    menuContainer.addEventListener('click', onMenuClick);

}

async function populateGameMenu(gameMenuContainer, gameName, platformName) {
    const dummyContainer = gameMenuContainer.querySelector('.dummy-game-container');
    const currentImageElem = gameMenuContainer.querySelector('img.current-image');

    ipcRenderer.send('fetch-images', gameName, platformName, LB.steamGridAPIKey, LB.giantBombAPIKey);

    ipcRenderer.once('image-urls', (event, urls) => {
        if (urls.length === 0) {
            // Clear placeholder
            dummyContainer.textContent = '';

            // Icon + message
            const iconP = document.createElement('p');
            iconP.innerHTML = `<i class="fa fa-binoculars fa-5x" aria-hidden="true"></i>`;
            const msgP  = document.createElement('p');
            msgP.textContent = `No cover art found`;

            // Layout
            dummyContainer.append(iconP, msgP);
            dummyContainer.style.gridColumn = `2 / calc(${LB.galleryNumOfCols} + 1)`;
            dummyContainer.style.animation = 'unset';
        } else {
            // Replace placeholder with real results
            dummyContainer.remove();

            let i = 0;

            urls.forEach(({ url, source }) => {

                document.querySelector('header .item-number').textContent = i++;

                const img = new Image();
                img.src = url;
                img.title = `${gameName}\n\n- Found on ${source}\n- Click to download and save`;
                img.classList.add('game-image');
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease-in';

                const menuGameContainer = document.createElement('div');
                menuGameContainer.classList.add('menu-game-container');
                menuGameContainer.setAttribute('data-platform', platformName);
                menuGameContainer.setAttribute('data-game-name', gameName);

                menuGameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
                menuGameContainer.appendChild(img);

                // Add source icon overlay
                const sourceIcon = document.createElement('div');
                sourceIcon.classList.add('source-icon');

                // Map source names to FontAwesome icons
                let iconClass = 'fa-question'; // default fallback
                switch (source.toLowerCase()) {
                case 'wikipedia':
                    iconClass = 'fa-wikipedia-w';
                    break;
                case 'giantbomb':
                    iconClass = 'fa-bomb';
                    break;
                case 'steamgriddb':
                case 'steamgrid':
                    iconClass = 'fa-steam';
                    break;
                }

                sourceIcon.innerHTML = `<i class="fa ${iconClass}" aria-hidden="true"></i>`;
                sourceIcon.title = `Source: ${source}`;
                menuGameContainer.appendChild(sourceIcon);

                gameMenuContainer.appendChild(menuGameContainer);

                img.onload = () => requestAnimationFrame(() => { img.style.opacity = '1'; });
                img.onerror = () => console.warn('Failed to load image:', url);

            });
        }
    });
}

function createManualSelectButton(gameName, platformName, imgElem) {
    const btn = document.createElement('button');
    btn.classList.add('button');
    btn.title = 'Select image';
    btn.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';

    btn.addEventListener('click', async e => {
        e.stopPropagation();

        // Ask the main process to show a file picker
        const srcPath = await ipcRenderer.invoke('pick-image');
        if (!srcPath) return;  // user cancelled

        // Destination in user data covers folder
        const destPath = path.join(
            LB.userDataPath,
            'covers',
            platformName,
            `${gameName}.jpg`
        );

        // Update the img element to the new file (with cache‐bust)
        imgElem.src = `file://${destPath}?${Date.now()}`;

        // Tell main to copy the file
        const ok = await ipcRenderer.invoke('save-cover', srcPath, destPath);
        console.log(ok
                    ? `Cover saved to ${destPath}`
                    : 'Failed to save cover');
    });

    return btn;
}

function buildCurrentGameImgContainer(gameName, image, platformName) {
    const gameMenuContainer = document.createElement('div');
    gameMenuContainer.classList.add('page-content');
    gameMenuContainer.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    const currentImageContainer = document.createElement('div');
    currentImageContainer.classList.add('menu-game-container');
    currentImageContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';

    const currentImage = document.createElement('img');
    currentImage.src = image.src;
    currentImage.className = 'current-image';
    currentImage.alt = 'Current game image';

    const gameLabel = document.createElement('div');
    gameLabel.classList.add('game-label');
    // gameLabel.textContent = 'Current Image';

    const manualBtn = createManualSelectButton(gameName, platformName, currentImage);

    gameLabel.appendChild(manualBtn);

    currentImageContainer.appendChild(currentImage);
    currentImageContainer.appendChild(gameLabel);

    gameMenuContainer.appendChild(currentImageContainer);

    const dummyGameContainer = document.createElement('div');
    dummyGameContainer.classList.add('menu-game-container', 'dummy-game-container');
    dummyGameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
    dummyGameContainer.innerHTML = `Searching...`;

    gameMenuContainer.appendChild(dummyGameContainer);

    return gameMenuContainer;
}

// Close platform settings menu
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
    // window.removeEventListener('keydown', gameMenuKeyDown);
    menuContainer.removeEventListener('wheel', onMenuWheel);
    menuContainer.removeEventListener('click', onMenuClick);

    // Normal close - stay on current page and restore gallery handler
    updateFooterControls('dpad', 'same', 'Browse', 'on');

    document.querySelector('header .prev-link').style.opacity = 1;
    document.querySelector('header .next-link').style.opacity = 1;

    initSlideShow(platformName);

    menuContainer.innerHTML = '';
    menu.style.height = '0';
    menuState.isOpen = false;
    menuState.menuType = null;

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
    // window.removeEventListener('keydown', gameMenuKeyDown);
    menuContainer.removeEventListener('wheel', onMenuWheel);
    menuContainer.removeEventListener('click', onMenuClick);

    // Normal menu close and restore gallery handler
    updateFooterControls('dpad', 'same', 'Browse', 'on');
    document.querySelector('header .prev-link').style.opacity = 1;
    document.querySelector('header .next-link').style.opacity = 1;

    window.LB.imageSrc = imgSrc;
    menuContainer.innerHTML = '';
    menu.style.height = '0';

    // Download and update image if provided
    if (imgSrc && LB.currentPlatform) {
        const gameContainers = Array.from(document.querySelectorAll('.game-container'));
        const selectedGame = gameContainers.find(c => c.classList.contains('selected'));

        if (selectedGame) {
            const selectedGameImg = selectedGame.querySelector('.game-image');
            if (selectedGameImg) {
                selectedGame.classList.add('loading');

                const gameName = selectedGame.dataset.gameName;

                const savedImagePath = await downloadImage(
                    imgSrc,
                    selectedGame.dataset.platform,
                    gameName
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

    setKeydown('previous');
}

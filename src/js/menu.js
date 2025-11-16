import { PLATFORMS, getPlatformInfo } from './platforms.js';
import { initSlideShow, initGallery } from './slideshow.js';
import { updatePreference, getPreference } from './preferences.js';
import { getSelectedGameContainer,
         updateFooterControlsFor,
         updateHeader,
         cleanFileName,
         applyTheme,
         downloadImage,
         simulateKeyDown,
         batchDownload,
         simulateTabNavigation,
         setFooterSize,
         toggleHeaderNavLinks } from './utils.js';
import { helpDialog, installEmulatorsDialog, systemDialog } from './dialog.js';

let menuState = {
    selectedIndex: 1,
};

// Only assign to window if it exists (renderer context)
if (typeof window !== 'undefined') {
    window.onMenuKeyDown = function onMenuKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();

        const menu = document.getElementById('menu');
        const active = document.activeElement;

        const isTextInput = (el) =>
              el.tagName === 'INPUT' && el.type === 'text' ||
              el.tagName === 'TEXTAREA';

        switch (event.key) {
        case 'ArrowRight':
        case 'ArrowLeft':
            if (!isTextInput(active)) {
                simulateTabNavigation(menu, event.key === 'ArrowLeft');
                event.preventDefault();
            }
            break;

        case 'ArrowDown':
            simulateTabNavigation(menu);
            event.preventDefault();
            break;

        case 'ArrowUp':
            simulateTabNavigation(menu, true);
            event.preventDefault();
            break;

        case 's':
            if (event.ctrlKey) {
                menu.querySelector('button.save')?.click();
            }
            break;

        case 'i':
            if (event.ctrlKey) {
                menu.querySelector('button.install')?.click();
            }
            break;

        case 'Escape':
            menu.querySelector('button.cancel')?.click();
            break;

        case '/':
            systemDialog('quit');
            break;

        case '?':
            helpDialog('shortcuts');
            break;
        case 'Enter':
            document.activeElement.click();
            break;
        }
    };

    window.onGameMenuKeyDown = function onGameMenuKeyDown(event) {

    console.log("event: ", event);

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
        closeGameMenu(selectedImg.src);
        initGallery(LB.currentPlatform);
        break;
    case 'Escape':
        closeGameMenu();
        initGallery(LB.currentPlatform);
        break;
    }

    menuGameContainers.forEach((container, index) => {
        container.classList.toggle('selected', index === menuState.selectedIndex);
    });

    if (event.key.startsWith('Arrow')) {
        const selectedContainer = menuGameContainers.find((container, index) => index === menuState.selectedIndex);

        // Manual scroll to replace scrollIntoView
        if (selectedContainer) {
            const containerRect = menu.getBoundingClientRect();
            const itemRect = selectedContainer.getBoundingClientRect();
            const scrollTop = menu.scrollTop;
            const itemTop = itemRect.top - containerRect.top + scrollTop;
            const itemHeight = itemRect.height;
            const containerHeight = containerRect.height;
            const newScrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2);
            menu.scrollTop = Math.max(0, newScrollTop);
        }
    }

};
}

function onGameMenuClick(event) {
    const img = event.target.closest('img');
    if (img) {
        closeGameMenu(img.src);
    }
}

function onGameMenuWheel(event) {
    if (event.shiftKey) {
        return;
    }

    if (event.deltaY > 0) {
        simulateKeyDown('ArrowDown');
    } else if (event.deltaY < 0) {
        simulateKeyDown('ArrowUp');
    }
}

function buildPrefsFormItem(name, iconName, type, description, shortDescription, value, onChangeFct) {

    let input;
    let inputValueDisplay;
    const group = document.createElement('div');
    group.classList.add('input-group');
    const radios = [];

    if (typeof type === 'object') {
        const types = type;

        const inputCtn = document.createElement('div');
        inputCtn.classList.add('input-ctn');

        const radiosContainer = document.createElement('div');
        radiosContainer.classList.add('radio-container');

        types.forEach((type, index) => {
            const label = document.createElement('label');
            label.classList.add('form-label');
            label.tabIndex = 0;  // Make the LABEL focusable

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = name;
            radio.value = type;
            radio.checked = type === value;
            // radio stays display: none - no tabindex needed

            const radioBox = document.createElement('div');
            radioBox.classList.add('radio-box');
            radioBox.textContent = type;

            if (index === types.length - 1) {
                radioBox.classList.add('last');
            }

            // Handle keyboard on the label
            label.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    radio.checked = true;
                    if (onChangeFct) onChangeFct(type);
                }
            });

            // Click still works naturally
            label.addEventListener('click', () => {
                radio.checked = true;
                if (onChangeFct) onChangeFct(type);
            });

            radios.push(radio);

            label.appendChild(radio);
            label.appendChild(radioBox);
            radiosContainer.appendChild(label);
        });

        inputCtn.appendChild(radiosContainer);

        input = inputCtn;

    } else {

        input = document.createElement('input');
        input.type = type;
        input.id = name;
        input.name = name;
        input.min = '2';
        input.max = '24';
        input.placeholder = description;
        input.tabIndex = 0;
        input.classList.add('input');
        input.value = value;

        if (type === 'range') {

            inputValueDisplay = document.createElement('span');
            inputValueDisplay.classList.add('range-value');
            inputValueDisplay.textContent = value;

            input.addEventListener('input', () => {
                inputValueDisplay.textContent = input.value;
            });

        }

    }

    const icon = document.createElement('div');
    icon.classList.add('form-icon');
    // icon.innerHTML = `<i class="form-icon fa fa-2x fa-${iconName}" aria-hidden="true"></i>`;
    icon.innerHTML = `<svg class="medium icon"><use href="#${iconName}"></use></svg>`;

    const label = document.createElement('label');
    label.textContent = shortDescription;
    label.classList.add('form-label');

    const SubLabel = document.createElement('label');
    SubLabel.id = 'num-cols-sub-label';
    SubLabel.classList.add('sub-label');

    const ctn = document.createElement('div');
    ctn.classList.add('dual-ctn');

    ctn.appendChild(icon);
    if (type === 'range') {
        ctn.appendChild(inputValueDisplay);
    }
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
    const numberOfColumns = buildPrefsFormItem('numberOfColumns', 'grid', 'range', 'The number of columns in each platform gallery', 'Number of columns', LB.galleryNumOfCols);
    const numberOfColumnsGroup = numberOfColumns.group;
    const numberOfColumnsInput = numberOfColumns.input;

    const footerSize = buildPrefsFormItem('footerSize', 'size', ['small', 'medium', 'big'], '', 'Footer size', LB.footerSize, setFooterSize);
    const footerSizeGroup = footerSize.group;
    const footerSizeRadios = footerSize.radios;

    const theme = buildPrefsFormItem('theme', 'swatchbook', ['default', 'day', 'night'], '', 'Theme', LB.theme, applyTheme);
    const themeGroup = theme.group;
    const themeRadios = theme.radios;

    const disabledPlatformsPolicy = buildPrefsFormItem('disabledPlatformsPolicy', 'check', ['show', 'hide'], '', 'Disabled Platforms', LB.disabledPlatformsPolicy);
    const disabledPlatformsPolicyGroup = disabledPlatformsPolicy.group;
    const disabledPlatformsPolicyRadios = disabledPlatformsPolicy.radios;

    const recentlyPlayedPolicy = buildPrefsFormItem('recentlyPlayedPolicy', 'clock', ['show', 'hide'], '', 'Recently Played', LB.recentlyPlayedPolicy);
    const recentlyPlayedPolicyGroup = recentlyPlayedPolicy.group;
    const recentlyPlayedPolicyRadios = recentlyPlayedPolicy.radios;

    const favoritesPolicy = buildPrefsFormItem('favoritesPolicy', 'like', ['show', 'hide'], '', 'Favorites', LB.favoritesPolicy);
    const favoritesPolicyGroup = favoritesPolicy.group;
    const favoritesPolicyRadios = favoritesPolicy.radios;

    const steamGridAPIKey = buildPrefsFormItem('steamGridAPIKey', 'steam', 'text', 'Your SteamGrid API Key', 'SteamGrid API Key', LB.steamGridAPIKey || '');
    const steamGridAPIKeyGroup = steamGridAPIKey.group;
    const steamGridAPIKeyInput = steamGridAPIKey.input;

    const giantBombAPIKey = buildPrefsFormItem('giantBombAPIKey', 'bomb', 'text', 'Your GiantBomb API Key', 'GiantBomb API Key', LB.giantBombAPIKey || '');
    const giantBombAPIKeyGroup = giantBombAPIKey.group;
    const giantBombAPIKeyInput = giantBombAPIKey.input;

    // formContainer.appendChild(platformMenuImageCtn);
    formContainer.appendChild(numberOfColumnsGroup);
    formContainer.appendChild(themeGroup);
    formContainer.appendChild(footerSizeGroup);
    formContainer.appendChild(disabledPlatformsPolicyGroup);
    formContainer.appendChild(recentlyPlayedPolicyGroup);
    formContainer.appendChild(favoritesPolicyGroup);
    formContainer.appendChild(steamGridAPIKeyGroup);
    formContainer.appendChild(giantBombAPIKeyGroup);

    // Buttons
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.classList.add('button', 'save');
    saveButton.textContent = 'Save';

    const aboutButton = document.createElement('button');
    aboutButton.type = 'button';
    aboutButton.className = 'button';
    aboutButton.textContent = 'About';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('button', 'cancel');
    cancelButton.textContent = 'Cancel';

    const formContainerButtons = document.createElement('div');
    formContainerButtons.classList.add('bottom-buttons-menu', 'bottom-buttons');
    formContainerButtons.appendChild(cancelButton);
    formContainerButtons.appendChild(aboutButton);
    formContainerButtons.appendChild(saveButton);

    formContainer.appendChild(formContainerButtons);

    const formContainerVSpacerDiv = document.createElement('div');
    formContainerVSpacerDiv.classList.add('spacer-div');

    formContainer.appendChild(formContainerVSpacerDiv);

    cancelButton.addEventListener('click', onSettingsMenuCancel);

    aboutButton.addEventListener('click', async () => {
        helpDialog('about');
    });

    saveButton.addEventListener('click', onSettingsMenuSave);

    function onSettingsMenuCancel() {
        if (themeRadios.find(radio => radio.checked)?.value !== LB.theme) {
            applyTheme(LB.theme);
        }
        if (themeRadios.find(radio => radio.checked)?.value !== LB.footerSize) {
            setFooterSize(LB.footerSize);
        }
        closeSettingsOrPlatformMenu();
    }

    async function onSettingsMenuSave() {
        try {
            let numberOfColumns = parseInt(numberOfColumnsInput.value, 10);

            console.log("numberOfColumns: ", numberOfColumns);

            // Collect new values
            const newPrefs = {
                numberOfColumns,
                footerSize: footerSizeRadios.find(radio => radio.checked)?.value,
                theme: themeRadios.find(radio => radio.checked)?.value,
                disabledPlatformsPolicy: disabledPlatformsPolicyRadios.find(radio => radio.checked)?.value,
                recentlyPlayedPolicy: recentlyPlayedPolicyRadios.find(radio => radio.checked)?.value,
                favoritesPolicy: favoritesPolicyRadios.find(radio => radio.checked)?.value,
                steamGridAPIKey: steamGridAPIKeyInput.value,
                giantBombAPIKey: giantBombAPIKeyInput.value
            };

            // Save preferences
            await updatePreference('settings', 'numberOfColumns', newPrefs.numberOfColumns);
            await updatePreference('settings', 'footerSize', newPrefs.footerSize);
            await updatePreference('settings', 'theme', newPrefs.theme);
            await updatePreference('settings', 'disabledPlatformsPolicy', newPrefs.disabledPlatformsPolicy);
            await updatePreference('settings', 'recentlyPlayedPolicy', newPrefs.recentlyPlayedPolicy);
            await updatePreference('settings', 'favoritesPolicy', newPrefs.favoritesPolicy);
            await updatePreference('settings', 'steamGridAPIKey', newPrefs.steamGridAPIKey);
            await updatePreference('settings', 'giantBombAPIKey', newPrefs.giantBombAPIKey);

            // Detect changes that require reload
            const somethingImportantChanged =
                  newPrefs.numberOfColumns !== LB.galleryNumOfCols ||
                  newPrefs.disabledPlatformsPolicy !== LB.disabledPlatformsPolicy ||
                  newPrefs.recentlyPlayedPolicy !== LB.recentlyPlayedPolicy ||
                  newPrefs.favoritesPolicy !== LB.favoritesPolicy ||
                  newPrefs.steamGridAPIKey !== (LB.steamGridAPIKey || '') ||
                  newPrefs.giantBombAPIKey !== (LB.giantBombAPIKey || '');

            // Update LB to reflect changes
            Object.assign(LB, {
                galleryNumOfCols: newPrefs.numberOfColumns,
                footerSize: newPrefs.footerSize,
                theme: newPrefs.theme,
                disabledPlatformsPolicy: newPrefs.disabledPlatformsPolicy,
                recentlyPlayedPolicy: newPrefs.recentlyPlayedPolicy,
                favoritesPolicy: newPrefs.favoritesPolicy,
                steamGridAPIKey: newPrefs.steamGridAPIKey,
                giantBombAPIKey: newPrefs.giantBombAPIKey
            });

            if (somethingImportantChanged) {
                window.location.reload();
            } else {
                closeSettingsMenu();
            }
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    return formContainer;
}

function buildPlatformMenuForm(platformName) {

    if (platformName === 'settings') {
        return buildSettingsMenu();
    }

    const formContainer = document.createElement('div');
    formContainer.classList.add('platform-menu-container');

    const platformMenuImageCtn = document.createElement('div');
    platformMenuImageCtn.classList.add('platform-menu-image-ctn');
    platformMenuImageCtn.style.backgroundImage = `url("file://${path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`)}")`;
    platformMenuImageCtn.style.backgroundSize = 'cover';
    platformMenuImageCtn.style.backgroundRepeat = 'no-repeat';
    platformMenuImageCtn.style.backgroundPosition = 'center';

    // platformMenuImageCtn.appendChild(platformMenuImage);

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

    statusLabelPlatormName.innerHTML = `${platformInfo.vendor} ${platformInfo.name} is&nbsp;`;

    const statusLabelPlatormStatus = document.createElement('span');
    statusLabelPlatormStatus.id = 'form-status-label-platform-status';

    statusLabel.appendChild(statusCheckBox);
    statusLabel.appendChild(statusLabelPlatormName);
    statusLabel.appendChild(statusLabelPlatormStatus);

    const gamesDirGroup = document.createElement('div');
    gamesDirGroup.classList.add('input-group');

    const gamesDirInput = document.createElement('input');
    gamesDirInput.type = 'text';
    gamesDirInput.classList.add('input');
    gamesDirInput.placeholder = `Your ${platformInfo.name} games directory`;

    const gamesDirLabel = document.createElement('label');
    gamesDirLabel.textContent = 'Games directory';
    gamesDirLabel.classList.add('form-label');

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
    gamesDirIcon.innerHTML = '<svg class="medium icon"><use href="#folder-open"></use></svg>';

    gamesDirCtn.appendChild(gamesDirIcon);
    gamesDirCtn.appendChild(gamesDirInput);
    gamesDirCtn.appendChild(gamesDirButton);

    gamesDirGroup.appendChild(gamesDirLabel);
    gamesDirGroup.appendChild(gamesDirCtn);

    const emulatorGroup = document.createElement('div');
    emulatorGroup.classList.add('input-group');

    const emulatorIcon = document.createElement('div');
    emulatorIcon.classList.add('form-icon');
    emulatorIcon.innerHTML = '<svg class="medium icon"><use href="#cubes"></use></svg>';

    const emulatorInputLabel = document.createElement('label');
    emulatorInputLabel.textContent = "Emulator";
    emulatorInputLabel.classList.add('form-label');

    const emulatorSubLabel = document.createElement('span');
    emulatorSubLabel.id = 'emulator-sub-label';
    emulatorSubLabel.classList.add('sub-label');

    emulatorInputLabel.appendChild(emulatorSubLabel);

    const emulatorInput = document.createElement('input');
    emulatorInput.type = 'text';
    emulatorInput.classList.add('emulator', 'input');
    emulatorInput.placeholder = `Your ${platformInfo.name} emulator`;

    const emulatorCtn = document.createElement('div');
    emulatorCtn.classList.add('dual-ctn');

    const emulatorButton = document.createElement('button');
    emulatorButton.classList.add('button', 'button-browse');
    emulatorButton.textContent = 'Browse';

    const installEmulatorsButton = document.createElement('button');
    installEmulatorsButton.classList.add('button', 'install');
    installEmulatorsButton.textContent = 'Install';

    emulatorCtn.appendChild(emulatorIcon);
    emulatorCtn.appendChild(emulatorInput);
    emulatorCtn.appendChild(installEmulatorsButton);
    emulatorCtn.appendChild(emulatorButton);

    emulatorGroup.appendChild(emulatorInputLabel);
    emulatorGroup.appendChild(emulatorCtn);

    // ======== NEW EXTENSIONS SECTION ========
    const extensionsGroup = document.createElement('div');
    extensionsGroup.classList.add('input-group');

    // Label
    const extensionsLabel = document.createElement('label');
    extensionsLabel.textContent = 'File Extensions';
    extensionsLabel.classList.add('form-label');

    // Container for icon + inputs
    const extensionsCtn = document.createElement('div');
    extensionsCtn.classList.add('dual-ctn');

    // Icon
    const extensionsIcon = document.createElement('div');
    extensionsIcon.classList.add('form-icon');
    extensionsIcon.innerHTML = '<svg class="medium icon"><use href="#file-zipper"></use></svg>';

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
    addExtensionBtn.classList.add('button');
    addExtensionBtn.innerHTML = '<svg class="icon"><use href="#plus"></use></svg>';
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
    emulatorArgsGroup.classList.add('input-group');

    const emulatorArgsCtn = document.createElement('div');
    emulatorArgsCtn.classList.add('dual-ctn');

    const emulatorArgsIcon = document.createElement('div');
    emulatorArgsIcon.classList.add('form-icon');
    emulatorArgsIcon.innerHTML = '<svg class="medium icon"><use href="#terminal"></use></svg>';

    const emulatorArgsLabel = document.createElement('label');
    emulatorArgsLabel.textContent = 'Emulator Arguments';
    emulatorArgsLabel.classList.add('form-label');

    const emulatorArgsInput = document.createElement('input');
    emulatorArgsInput.classList.add('args', 'input');
    emulatorArgsInput.type = 'text';
    emulatorArgsInput.placeholder = `Your ${platformInfo.name} emulator arguments`;

    emulatorArgsCtn.appendChild(emulatorArgsIcon);
    emulatorArgsCtn.appendChild(emulatorArgsInput);
    emulatorArgsGroup.appendChild(emulatorArgsLabel);
    emulatorArgsGroup.appendChild(emulatorArgsCtn);

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.classList.add('button', 'save');
    saveButton.textContent = 'Save';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('button', 'cancel');
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
    // formContainer.appendChild(batchGroup);
    formContainer.appendChild(emulatorArgsGroup);
    formContainer.appendChild(extensionsGroup);

    const formContainerButtons = document.createElement('div');
    formContainerButtons.classList.add('bottom-buttons-menu', 'bottom-buttons');
    formContainerButtons.appendChild(cancelButton);
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

    cancelButton.addEventListener('click', closeSettingsOrPlatformMenu);

    installEmulatorsButton.addEventListener('click', () => {

        const platform = PLATFORMS.find(p => p.name === platformName);

        console.log("platform.emulators: ", platform.emulators);

        installEmulatorsDialog(platform.emulators);
        // ipcRenderer.invoke('go-to-url', 'https://gitlab.com/yphil/emulsion/-/blob/master/README.md#usage');
    });

    saveButton.addEventListener('click', onPlatformMenuSaveButtonClick);

    async function onPlatformMenuSaveButtonClick() {

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

            // Serialize the updates, not promise all them
            await updatePreference(platformName, 'isEnabled', nextEnabled);
            await updatePreference(platformName, 'gamesDir', nextGamesDir);
            await updatePreference(platformName, 'emulator', nextEmulator);
            await updatePreference(platformName, 'extensions', nextExtensions);
            await updatePreference(platformName, 'emulatorArgs', nextArgs);

            // Update DOM status for immediate feedback
            const page = document.querySelector(`.page[data-platform="${platformName}"]`);
            if (page) page.dataset.status = nextEnabled ? '' : 'disabled';
            const slide = document.querySelector(`.slide[data-platform="${platformName}"]`);
            if (slide) {
                if (!nextEnabled && LB.disabledPlatformsPolicy === 'hide') {
                    slide.style.display = 'none';
                } else {
                    slide.style.display = 'block';
                }
            }

            // Update memory for LB.enabledPlatforms
            if (nextEnabled) {
                if (!LB.enabledPlatforms.includes(platformName)) LB.enabledPlatforms.push(platformName);
            } else {
                LB.enabledPlatforms = LB.enabledPlatforms.filter(p => p !== platformName);
            }

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
            removeBtn.classList.add('button');
            removeBtn.innerHTML = '<svg class="icon"><use href="#xmark"></use></svg>';
            removeBtn.addEventListener('click', () => row.remove());
            row.appendChild(removeBtn);
        }

        row.appendChild(input);
        return row;
    }

    formContainer.appendChild(formContainerButtons);

    const formContainerVSpacerDiv = document.createElement('div');
    formContainerVSpacerDiv.classList.add('spacer-div');
    formContainer.appendChild(formContainerVSpacerDiv);

    return formContainer;
}

export function openPlatformMenu(platformName, context, eltToFocus) {

    console.log("platformName, context, eltToFocus: ", platformName, context, eltToFocus);

    LB.mode = 'menu';
    LB.currentPlatform = platformName;

    const menu = document.getElementById('menu');
    const galleries = document.getElementById('galleries');

    menu.innerHTML = '';

    updateFooterControlsFor('platform-menu');

    menu.dataset.menuPlatform = platformName;
    menu.dataset.context = context || null;

    const platformMenuForm = buildPlatformMenuForm(platformName);
    menu.appendChild(platformMenuForm);

    const header = document.getElementById('header');

    if (LB.onHeaderWheel) {
        header.removeEventListener('wheel', LB.onHeaderWheel);
    }

    galleries.style.display = 'none';
    menu.style.display = 'flex';
    menu.style.height = '100vh';

    updateHeader(platformName);
    toggleHeaderNavLinks('hide');

    if (platformName === 'settings' && eltToFocus) {
        const fieldToFocus = document.getElementById(eltToFocus === 'GiantBomb' ? 'giantBombAPIKey' : 'steamGridAPIKey');
        if (fieldToFocus) {
            fieldToFocus.focus();
        }
    }
}

async function closeSettingsOrPlatformMenu() {

    const menu = document.getElementById('menu');

    // updateFooterControls('dpad', 'same', 'Browse', 'on');

    if (menu.dataset.context === 'slideshow') {
        initSlideShow(LB.currentPlatform);
    } else if (menu.dataset.context === 'gallery') {
        initGallery(LB.currentPlatform);
    } else {
        initGallery('settings');
    }

    menu.innerHTML = '';
    menu.style.height = '0';

}

export async function openGameMenu(container) {

    LB.mode = 'gameMenu';

    const menu = document.getElementById('menu');
    const menuContainer = document.getElementById('menu');
    const gameName = container.dataset.gameName;
    const cleanName = container.dataset.cleanName;
    const platformName = container.dataset.platform;
    const gameImage = container.querySelector('img');

    updateHeader(platformName, cleanFileName(gameName));

    // Store state
    menuState.selectedIndex = 1;

    // Update UI
    // updateFooterControls('west', 'same', '', 'off');
    // updateFooterControls('dpad', 'button-dpad-nesw', 'Images', 'on');
    // updateFooterControls('shoulders', 'same', '', 'off');

    updateFooterControlsFor('game-menu');


    menu.style.height = '100vh';
    menu.style.display = 'flex';

    toggleHeaderNavLinks('hide');

    // Clear and populate menu
    menuContainer.innerHTML = '';
    menuContainer.dataset.menuPlatform = platformName;

    const currentGameImgContainer = buildCurrentGameImgContainer(gameName, gameImage, platformName);
    menuContainer.appendChild(currentGameImgContainer);
    await populateGameMenu(currentGameImgContainer, cleanName, platformName);

    // menuContainer.addEventListener('wheel', onGameMenuWheel);
    // menuContainer.addEventListener('click', onGameMenuClick);

}

async function populateGameMenu(menuContainer, gameName, platformName) {
    const dummyContainer = menuContainer.querySelector('.dummy-game-container');
    const currentImageElem = menuContainer.querySelector('img.current-image');
    const headerNbOfItems = document.querySelector('header .item-number');

    ipcRenderer.send('fetch-images', gameName, platformName, LB.steamGridAPIKey, LB.giantBombAPIKey);

    headerNbOfItems.textContent = 0;

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

            let nbOfImages = 0;

            urls.forEach(({ url, source }) => {

                headerNbOfItems.textContent = nbOfImages++;

                const img = new Image();
                img.src = url;
                img.title = `${gameName}\n\n- Found on ${source}\n- Click to download and save\n URL: ${url}`;
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


                menuGameContainer.addEventListener('click', onGameMenuClick);

                menuContainer.appendChild(menuGameContainer);

                img.onload = () => requestAnimationFrame(() => { img.style.opacity = '1'; });
                img.onerror = () => console.warn('Failed to load image:', url);

            });
        }
    });
}

function buildManualSelectButton(gameName, platformName, imgElem) {

    const button = document.createElement('button');
    button.classList.add('button', 'very-small', 'manual-select-button');
    button.title = 'Select image';
    // btn.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';
    button.textContent = 'Browse';

    button.addEventListener('click', async e => {
        e.stopPropagation();

        // Ask the main process to show a file picker
        const srcPath = await ipcRenderer.invoke('pick-image');
        if (!srcPath) return;  // user cancelled

        const gamesDir = window.LB.preferences[platformName].gamesDir;

        const extension = srcPath.split('.').pop();

        // Destination in user data covers folder
        const destPath = path.join(gamesDir, 'images', `${gameName}.${extension}`);

        // Tell main to copy the file
        const success = await ipcRenderer.invoke('save-cover', srcPath, destPath);

        console.log("imgSrc: ", success);

        if (success) {
            imgElem.src = `file://${destPath}?${Date.now()}`;
            console.log(`Cover saved to ${destPath}`);
        } else {
            console.log('Failed to save cover');
        }

    });

    return button;
}

function buildRemoveButton(img) {
    const button = document.createElement('button');
    button.classList.add('button', 'very-small', 'remove-button');
    button.title = 'Delete image';
    button.textContent = 'Remove';

    button.addEventListener('click', async e => {
        const fileName = new URL(img.src).pathname.split('/').pop();

        if (fileName === 'missing.png') {
            return; // don't show button for missing image
        }

        // ask user before deleting
        const confirmed = confirm(`Delete "${decodeURIComponent(fileName)}"?`);
        if (!confirmed) return;

        const success = await ipcRenderer.invoke(
            'delete-image',
            decodeURIComponent(img.src.replace('file://', ''))
        );

        if (success) {
            img.src = path.join(LB.baseDir, 'img', 'missing.png');
        } else {
            console.log('Failed to delete cover');
        }
    });

    const fileName = new URL(img.src).pathname.split('/').pop();
    return fileName !== 'missing.png' ? button : null;
}


function buildCurrentGameImgContainer(gameName, image, platformName) {
    const gameMenuContainer = document.createElement('div');
    gameMenuContainer.classList.add('page-content');
    gameMenuContainer.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    const currentImageContainer = document.createElement('div');
    currentImageContainer.classList.add('menu-game-container', 'menu-current-image-container');
    currentImageContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';

    const currentImage = document.createElement('img');
    currentImage.src = image.src;
    currentImage.className = 'current-image';
    currentImage.alt = 'Current game image';

    const gameLabel = document.createElement('div');
    gameLabel.classList.add('game-label');
    // gameLabel.textContent = 'Current Image';

    const buttons = document.createElement('div');
    buttons.className = 'current-image-buttons';

    const manualSelectButton = buildManualSelectButton(gameName, platformName, currentImage);
    const removeButton = buildRemoveButton(currentImage);

    buttons.appendChild(manualSelectButton);
    if (removeButton) {
        buttons.appendChild(removeButton);
    }

    currentImageContainer.append(currentImage, buttons);

    gameMenuContainer.appendChild(currentImageContainer);

    const dummyGameContainer = document.createElement('div');
    dummyGameContainer.classList.add('menu-game-container', 'dummy-game-container');
    dummyGameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
    dummyGameContainer.innerHTML = `<h4>Searching...</h4>`;

    gameMenuContainer.appendChild(dummyGameContainer);

    return gameMenuContainer;
}

async function closeSettingsMenu() {

    const menu = document.getElementById('menu');
    const menuContainer = document.getElementById('menu');
    initGallery('settings');

    menuContainer.innerHTML = '';
    menu.style.height = '0';

}

export async function closeGameMenu(imgSrc) {

    const menu = document.getElementById('menu');
    const menuContainer = document.getElementById('menu');

    // updateFooterControls('dpad', 'same', 'Browse', 'on');
    toggleHeaderNavLinks('show');

    menuContainer.innerHTML = '';
    menu.style.height = '0';

    const activePage = document.querySelector('.page.active');
    const gameContainers = Array.from(activePage.querySelectorAll('.game-container'));

    let selectedGame = null;
    let selectedIndex = -1;

    for (let i = 0; i < gameContainers.length; i++) {
        const c = gameContainers[i];
        if (c.classList.contains('selected')) {
            selectedGame = c;
            selectedIndex = i;
            break; // stop immediately — minimal overhead
        }
    }

    if (imgSrc) {

        if (selectedGame) {
            const selectedGameImg = selectedGame.querySelector('.game-image');
            if (selectedGameImg) {
                selectedGameImg.classList.add('loading');

                const gameName = selectedGame.dataset.gameName;

                const savedImagePath = await downloadImage(
                    imgSrc,
                    selectedGame.dataset.platform,
                    gameName
                );

                if (savedImagePath) {
                    selectedGameImg.src = savedImagePath + '?t=' + new Date().getTime();
                    selectedGameImg.onload = () => {
                        selectedGame.removeAttribute('data-missing-image');
                        selectedGameImg.classList.remove('loading');
                    };
                }
            }

            // Manual scroll to replace scrollIntoView
            const isListMode = activePage.querySelector('.page-content').classList.contains('list');
            const scrollContainer = isListMode ? activePage.querySelector('.page-content') : activePage;
            if (scrollContainer && selectedGame) {
                const containerRect = scrollContainer.getBoundingClientRect();
                const itemRect = selectedGame.getBoundingClientRect();
                const scrollTop = scrollContainer.scrollTop;
                const itemTop = itemRect.top - containerRect.top + scrollTop;
                const itemHeight = itemRect.height;
                const containerHeight = containerRect.height;
                const newScrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2);
                scrollContainer.scrollTop = Math.max(0, newScrollTop);
            }
        }
    }

    // menuContainer.removeEventListener('wheel', onGameMenuWheel);
    // menuContainer.removeEventListener('click', onGameMenuClick);

    initGallery(LB.currentPlatform, selectedIndex);

}

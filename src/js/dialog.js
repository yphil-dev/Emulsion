import { initSlideShow, initGallery } from './slideshow.js';
import { displayMetaData } from './metadata.js';
import { PLATFORMS, getPlatformInfo } from './platforms.js';
import { simulateTabNavigation, launchGame, buildIcon, switchIcon } from './utils.js';
import { updatePreference } from './preferences.js';
import { openPlatformMenu } from './menu.js';

const DialogManager = {
    currentDialog: null,
    previousMode: null,
    mainMode: null, // Track the main non-dialog mode

    open(dialogElement, mode) {
        console.log("dialogElement: ", dialogElement);
        this.closeCurrent();
        this.previousMode = LB.mode;

        // If we're opening from a main mode, store it
        if (this.isMainMode(LB.mode)) {
            this.mainMode = LB.mode;
        }

        this.currentDialog = dialogElement;
        LB.mode = mode;
        dialogElement.style.display = 'flex';
        dialogElement.style.visibility = 'visible';
        return dialogElement;
    },

    closeCurrent() {
        if (this.currentDialog) {
            this.currentDialog.style.display = 'none';
            // this.currentDialog.classList.remove('active');
            this.currentDialog = null;
        }
    },

    closeAll() {
        document.querySelectorAll('div.overlay').forEach(div => {
            div.style.display = 'none';
        });
        this.currentDialog = null;
    },

    restoreMode() {
        // Always restore to the main mode, not the previous mode
        if (this.mainMode) {
            LB.mode = this.mainMode;
        }
    },

    isMainMode(mode) {
        const mainModes = ['slideshow', 'gallery', 'menu', 'gameMenu'];
        return mainModes.includes(mode);
    }
};

function createEditMetaForm(params, gameMetaData) {

    const form = document.createElement('form');

    const fields = [
        { label: 'Genre', name: 'genre', type: 'text' },
        { label: 'Developers (comma-separated)', name: 'developers', type: 'text' },
        { label: 'Publisher', name: 'publisher', type: 'text' },
        { label: 'Release Date', name: 'releaseDate', type: 'date' },
        { label: 'Platforms (comma-separated)', name: 'platforms', type: 'text' },
        { label: 'Description', name: 'description', type: 'textarea' },
    ];

    fields.forEach(field => {
        const label = document.createElement('label');
        label.className = 'form-label title';
        label.textContent = field.label;
        form.appendChild(label);

        let input;
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 12;
        } else {
            input = document.createElement('input');
            input.type = field.type;
        }
        input.name = field.name;
        input.classList.add('input', 'text');

        if (field.name === 'developers') input.value = (gameMetaData.developers || []).join(', ');
        else if (field.name === 'platforms') input.value = (gameMetaData.platforms || []).join(', ');
        else if (field.name === 'genre') input.value = gameMetaData.genre || '';
        else if (field.name === 'description') input.value = gameMetaData.description || '';
        else if (field.name === 'releaseDate') {
            console.log("gameMetaData.releaseDate: ", gameMetaData.releaseDate);
            // Format the date for HTML date input
            if (gameMetaData.releaseDate) {
                // If it's just a year like "2008", convert to "2008-01-01"
                if (/^\d{4}$/.test(gameMetaData.releaseDate.toString())) {
                    input.value = `${gameMetaData.releaseDate}-01-01`;
                }
                // If it's already in YYYY-MM-DD format, use as-is
                else if (/^\d{4}-\d{2}-\d{2}$/.test(gameMetaData.releaseDate.toString())) {
                    input.value = gameMetaData.releaseDate;
                }
                // If it's any other format, try to parse it
                else {
                    const date = new Date(gameMetaData.releaseDate);
                    if (!isNaN(date)) {
                        input.value = date.toISOString().split('T')[0];
                    } else {
                        input.value = '';
                    }
                }
            } else {
                input.value = '';
            }
        }
        else input.value = gameMetaData[field.name] || '';

        form.appendChild(input);
    });

    return form;
}

export function editMetaDialog(params, gameMetaData) {

    LB.mode = 'metaEdit';

    const overlay = document.getElementById('edit-meta-overlay');
    const dialog = overlay.querySelector('.dialog');
    const dialogBody = dialog.querySelector('div.dialog-body');

    const title = dialog.querySelector('.dialog-title');

    title.textContent = params.cleanName;

    const cancelButton = dialog.querySelector('button.cancel');
    const okButton = dialog.querySelector('button.ok');

    const form = createEditMetaForm(params, gameMetaData);
    dialogBody.innerHTML = '';
    dialogBody.appendChild(form);

    function closeDialog() {
        DialogManager.closeCurrent();
        DialogManager.restoreMode();
        initGallery(LB.currentPlatform);
    }

    // Add form submit handler that includes closeDialog
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const editedData = {
            genre: form.genre.value,
            developers: form.developers.value.split(',').map(s => s.trim()).filter(Boolean),
            publisher: form.publisher.value,
            releaseDate: form.releaseDate.value,
            platforms: form.platforms.value.split(',').map(s => s.trim()).filter(Boolean),
            description: form.description.value
        };
        ipcRenderer.send('save-meta', params, editedData);
        form.closest('.popup-overlay')?.remove();
        displayMetaData(params, editedData);
        LB.mode = 'gallery';
        closeDialog(); // Close the dialog after submitting
    });

    DialogManager.open(overlay, 'metaEdit');
    cancelButton.focus();

    window.onMetaEditKeyDown = function onMetaEditKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        switch (event.key) {

        case 's':
            if (event.ctrlKey) {
                dialog.querySelector('button.ok').click();
            }
            break;

        case 'Escape':
            closeDialog();
            break;

        case '/':
            systemDialog('quit');
            break;

        case '?':
            helpDialog('shortcuts');
            break;
        }

    };

    okButton.addEventListener('click', () => {
        form.requestSubmit();
    });

    cancelButton.addEventListener('click', closeDialog);
    overlay.onclick = (e) => { if (e.target === overlay) closeDialog();};
}

export function toggleFavDialog(message) {

    const existingDialog = document.getElementById('favorite-confirmation');
    if (existingDialog) {
        existingDialog.remove();
    }

    const dialog = document.createElement('div');

    const dialogTitle = document.createElement('h3');
    dialogTitle.textContent = 'Favorites';

    const dialogText = document.createElement('h4');
    dialogText.innerHTML = message;

    dialog.id = 'favorite-confirmation';
    dialog.className = 'dialog';

    dialog.appendChild(dialogTitle);
    dialog.appendChild(dialogText);
    document.body.appendChild(dialog);

    setTimeout(() => {
        if (document.body.contains(dialog)) {
            dialog.remove();
            LB.favoritePendingAction = null;
        }
    }, 5000);
}

function versioncheck(current, latest) {
    const c = current.split('.').map(Number);
    const l = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(c.length, l.length); i++) {
        const a = c[i] || 0;
        const b = l[i] || 0;
        if (a < b) return false;
        if (a > b) return true;
    }
    return true; // equal or newer
}

export async function helpDialog(defaultTabId = null) {
    const overlay = document.getElementById('help-overlay');
    const dialog = overlay.querySelector('.dialog');
    const okButton = dialog.querySelector('button.ok');
    const dialogTitle = dialog.querySelector('.dialog-title');

    const versions = await ipcRenderer.invoke('get-versions');

    dialog.querySelector('.current-version').textContent = versions.current;
    dialog.querySelector('.latest-version').textContent = versions.latest;

    const isUpToDate = versioncheck(versions.current, versions.latest);

    if (isUpToDate) {
        dialog.querySelector('.up-to-date').style.display = 'inline-block';
    } else {
        dialog.querySelector('.update-available').style.display = 'block';
    }

    dialog.querySelector('button.upgrade').addEventListener('click', () => {
        ipcRenderer.invoke('go-to-url', 'https://github.com/yPhil-gh/Emulsion/releases');
    });

    dialog.querySelector('button.btn-liberapay').addEventListener('click', () => {
        ipcRenderer.invoke('go-to-url', 'https://liberapay.com/yPhil/');
    });

    dialog.querySelector('button.btn-ko-fi').addEventListener('click', () => {
        ipcRenderer.invoke('go-to-url', 'https://ko-fi.com/yphil');
    });

    dialog.querySelector('button.btn-patreon').addEventListener('click', () => {
        ipcRenderer.invoke('go-to-url', 'https://www.patreon.com/yphil');
    });

    overlay.style.alignItems = 'flex-start';
    overlay.style.paddingTop = '20px';

    const platformNames = dialog.querySelector('#platform-names');

    if (platformNames) {
        platformNames.textContent = PLATFORMS.map(platform => platform.name).join(', ');
    }

    function setupTabs(initialTabId) {
        const tabButtons = overlay.querySelectorAll('.tab-button');
        const tabContents = overlay.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // deactivate everything
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // activate this one
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                const content = overlay.querySelector(`#${tabId}`);
                if (content) content.classList.add('active');
                dialogTitle.textContent = content.dataset.description;
            });
        });

        if (initialTabId) {
            const initialButton = overlay.querySelector(`.tab-button[data-tab="${initialTabId}"]`);
            if (initialButton) {
                initialButton.click();
                return;
            }
        }

        const firstTab = tabButtons[0];
        if (firstTab && !overlay.querySelector('.tab-button.active')) {
            firstTab.click();
        }
    }

    function closeDialog() {
        if (!document.getElementById('open-dialog-at-startup').checked) {
            updatePreference('settings', 'startupDialogPolicy', 'hide');
            LB.startupDialogPolicy = 'hide';
        } else {
            updatePreference('settings', 'startupDialogPolicy', 'show');
            LB.startupDialogPolicy = 'show';
        }

        DialogManager.closeCurrent();
        DialogManager.restoreMode();
    }

    window.onKBHelpKeyDown = function onKBHelpKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();

        const tabButtons = dialog.querySelectorAll('.tab-button');
        const scrollableContainer = dialog.querySelector('div.shortcuts');

        switch (event.key) {
        case 'ArrowUp':
            if (scrollableContainer) {
                scrollableContainer.scrollBy({ top: -40, behavior: 'smooth' });
                event.preventDefault();
            }
            break;

        case 'ArrowDown':
            if (scrollableContainer) {
                scrollableContainer.scrollBy({ top: 40, behavior: 'smooth' });
                event.preventDefault();
            }
            break;

        case 'ArrowLeft':
            const activeLeft = dialog.querySelector('.tab-button.active');
            let currentIndexLeft = Array.from(tabButtons).indexOf(activeLeft);
            currentIndexLeft = (currentIndexLeft - 1 + tabButtons.length) % tabButtons.length;
            tabButtons[currentIndexLeft].click();
            break;

        case 'ArrowRight':
            const activeRight = dialog.querySelector('.tab-button.active');
            let currentIndexRight = Array.from(tabButtons).indexOf(activeRight);
            currentIndexRight = (currentIndexRight + 1) % tabButtons.length;
            tabButtons[currentIndexRight].click();
            break;

        case '/':
            systemDialog('quit');
            break;

        case '?':
            helpDialog('shortcuts');
            break;

        case 'Escape':
            closeDialog();
            break;

        case 'Enter':
            document.activeElement.click();
            break;

        default:
            break;
        }

    };

    okButton.addEventListener('click', closeDialog);
    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeDialog();
    });

    document.getElementById('open-dialog-at-startup').checked = LB.startupDialogPolicy === 'show' ? true : false;
    dialog.style.visibility = 'visible';
    DialogManager.open(overlay, 'kbHelp');

    setupTabs(defaultTabId);

    okButton.focus();
}

export async function downloadMetaDialog(imagesCount, metaCount) {
    console.log("downloadMetaDialog: ");
    const overlay = document.getElementById('download-meta-overlay');
    const dialog = overlay.querySelector('.dialog');
    const dialogTitle = dialog.querySelector('.dialog-title');
    const dialogBody = dialog.querySelector('.dialog-body');

    const okButton = dialog.querySelector('button.ok');
    const cancelButton = dialog.querySelector('button.cancel');

    if (!dialog) {
        console.error(".dialog element not found!");
        return null;
    }

    return new Promise((resolve) => {
        try {
            function closeDialog() {
                DialogManager.closeCurrent();
                DialogManager.restoreMode();
            }

            window.onDownloadMetaKeyDown = function onDownloadMetaKeyDown(event) {
                event.stopPropagation();
                event.stopImmediatePropagation();

                switch (event.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    simulateTabNavigation(dialog, true);
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    simulateTabNavigation(dialog);
                    break;
                case 'Escape':
                    closeDialog();
                    resolve(null);
                    break;
                case 'Enter':
                    document.activeElement.click();
                    break;
                case '/':
                    systemDialog('quit');
                    break;

                case '?':
                    helpDialog('shortcuts');
                    break;

                }
            };

            const handleCancel = () => {
                closeDialog();
                resolve(null);
            };
            cancelButton.addEventListener('click', handleCancel);

            dialogTitle.innerHTML = `Download <span class="title-name">${getPlatformInfo(LB.currentPlatform).name}</span> games meta data`;

            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'batch-options';

            // --- helper ---
            const makeCheckboxOption = (id, label, checked, disabled) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'batch-option';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = id;
                checkbox.checked = checked;
                checkbox.disabled = disabled;

                const labelElement = document.createElement('label');
                labelElement.htmlFor = id;
                labelElement.className = 'form-label';

                labelElement.innerHTML = label;

                wrapper.append(checkbox, labelElement);
                return wrapper;
            };

            const hasImages = imagesCount > 0;
            const hasMeta = metaCount > 0;

            // const imgLabel = hasImages ? `Download missing images` : `No missing images`;
            // const metaLabel = hasMeta ? `Download missing metadata` : `No missing metadata`;

            const imgSourcesTable = document.createElement('table');
            imgSourcesTable.className = 'sources-table';

            // Create thead
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            const headerCell = document.createElement('th');
            headerCell.innerHTML = '<h3>Images sources</h3>';
            headerCell.colSpan = 3; // Span both columns
            headerRow.appendChild(headerCell);
            thead.appendChild(headerRow);

            // Create tbody
            const tbody = document.createElement('tbody');

            function createSourceRow(sourceName, isEnabled) {
                const row = document.createElement('tr');

                const iconCell = document.createElement('td');
                const icon = buildIcon("checkmark");
                if (isEnabled) {
                    switchIcon(icon, 'check');
                    // icon.classList.add('fa-check', 'success');
                } else {
                    switchIcon(icon, 'xmark');
                    // icon.classList.add('fa-close', 'error');
                }
                iconCell.appendChild(icon);

                const textCell = document.createElement('td');
                textCell.textContent = sourceName;
                if (!isEnabled) {
                    textCell.classList.add('disabled');
                }

                const buttonCell = document.createElement('td');

                const setupButton = document.createElement('button');
                setupButton.textContent = 'Setup';
                setupButton.className = 'small button';

                setupButton.addEventListener('click', () => {
                    closeDialog();
                    resolve(null);
                    openPlatformMenu('settings', 'gallery', sourceName);
                });

                if (!isEnabled) {
                    buttonCell.appendChild(setupButton);
                }

                row.append(iconCell, textCell, buttonCell);
                return row;
            }

            // Add rows to tbody
            tbody.append(
                createSourceRow('Wikipedia', true),
                createSourceRow('SteamGridDB', LB.steamGridAPIKey),
                createSourceRow('GiantBomb', LB.giantBombAPIKey)
            );

            // Assemble table
            imgSourcesTable.append(thead, tbody);

            const textSources = document.createElement('table');
            textSources.className = 'sources-table';

            // Create thead for text sources
            const textThead = document.createElement('thead');
            const textHeaderRow = document.createElement('tr');
            const textHeaderCell = document.createElement('th');
            textHeaderCell.innerHTML = '<h3>Text sources</h3>';
            textHeaderCell.colSpan = 2;
            textHeaderRow.appendChild(textHeaderCell);
            textThead.appendChild(textHeaderRow);

            // Create tbody for text sources
            const textTbody = document.createElement('tbody');
            textTbody.appendChild(createSourceRow('Wikipedia', true));

            // Assemble text sources table
            textSources.append(textThead, textTbody);

            const imgLabel = `Download <span class="accent">${imagesCount}</span> missing images`;
            const metaLabel = `Download <span class="accent">${metaCount}</span> missing metadata`;

            // --- append checkboxes and sources ---
            if (hasImages) optionsContainer.appendChild(imgSourcesTable);
            optionsContainer.appendChild(
                makeCheckboxOption('batch-images', imgLabel, hasImages, !hasImages)
            );

            if (hasMeta) optionsContainer.appendChild(textSources);
            optionsContainer.appendChild(
                makeCheckboxOption('batch-metadata', metaLabel, hasMeta, !hasMeta)
            );

            dialogBody.innerHTML = '';
            dialogBody.appendChild(optionsContainer);

            const showOk = hasImages || hasMeta;
            okButton.style.display = showOk ? 'block' : 'none';
            cancelButton.textContent = showOk ? 'Cancel' : 'Close';

            const onOk = () => {
                const imagesChecked = document.getElementById('batch-images')?.checked || false;
                const metadataChecked = document.getElementById('batch-metadata')?.checked || false;

                closeDialog();
                resolve({
                    imageBatch: imagesChecked,
                    metaBatch: metadataChecked
                });
            };

            okButton.onclick = onOk;

            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    closeDialog();
                    resolve(null);
                }
            };

            DialogManager.open(overlay, 'downloadMetaDialog');
            cancelButton.focus();

        } catch (error) {
            console.error("ERROR IN DOWNLOADMETADIALOG PROMISE:", error);
            console.error("Error stack:", error.stack);
            resolve(null);
        }
    });
}

export function systemDialog(focusButton = 'cancel') {
    const overlay = document.getElementById('system-dialog-overlay');
    const dialog = overlay.querySelector('.dialog');
    const restartButton = dialog.querySelector('.restart');
    const configButton = dialog.querySelector('.config');
    const quitButton = dialog.querySelector('.quit');
    const cancelButton = dialog.querySelector('.cancel');
    const helpButton = dialog.querySelector('.help');

    // Map button names to elements
    const buttonMap = {
        'cancel': cancelButton,
        'restart': restartButton,
        'config': configButton,
        'quit': quitButton,
        'help': helpButton
    };

    function closeDialog() {
        DialogManager.closeCurrent();
        DialogManager.restoreMode();
    }

    window.onSystemDialogKeyDown = function onSystemDialogKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
            simulateTabNavigation(dialog);
            break;
        case 'ArrowLeft':
        case 'ArrowUp':
            simulateTabNavigation(dialog, true);
            break;

        case '?':
            helpDialog('shortcuts');
            break;

        case '/':
        case 'Enter':
            document.activeElement.click();
            break;
        case 'Escape':
            closeDialog();
            break;
        }
    };

    restartButton.addEventListener('click', () => window.location.reload());
    quitButton.addEventListener('click', () => ipcRenderer.invoke('quit'));
    cancelButton.addEventListener('click', () => closeDialog());
    configButton.addEventListener('click', () => initGallery('settings'));

    if (!LB.kioskMode) {
        configButton.addEventListener('click', () => {
            closeDialog();
            initGallery('settings');
        });
    } else {
        configButton.style.display = 'none';
    }

    helpButton.addEventListener('click', (e) => {
        closeDialog();
        helpDialog();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDialog();
    });

    // Open the dialog using DialogManager
    DialogManager.open(overlay, 'systemDialog');

    // Focus the specified button, fallback to cancel if invalid
    const buttonToFocus = buttonMap[focusButton] || cancelButton;
    if (buttonToFocus && buttonToFocus.style.display !== 'none') {
        buttonToFocus.focus();
    } else {
        cancelButton.focus(); // Final fallback
    }
}

export function launchGameDialog(gameContainer) {
    const overlay = document.getElementById('launch-game-overlay');
    const dialog = overlay.querySelector('div.dialog');
    const okButton = dialog.querySelector('.ok');
    const cancelButton = dialog.querySelector('.cancel');
    const checkbox = document.getElementById('open-dialog-at-launch');

    // Set dialog content
    dialog.querySelector('img').src = gameContainer.querySelector('img').src;
    dialog.querySelector('.dialog-title').textContent = gameContainer.dataset.cleanName || gameContainer.dataset.gameName;
    dialog.querySelector('.emulator-name').textContent = gameContainer.dataset.emulator;

    function closeDialog() {
        DialogManager.closeCurrent();
        DialogManager.restoreMode();
        gameContainer = null;
    }

    window.onLaunchGameKeyDown = function onLaunchGameKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
            simulateTabNavigation(dialog);
            break;
        case 'ArrowLeft':
        case 'ArrowUp':
            simulateTabNavigation(dialog, true);
            break;
        case 'Escape':
            closeDialog();
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

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDialog();
    });

    cancelButton.addEventListener('click', closeDialog);

    okButton.addEventListener('click', () => {
        console.log("gameContainer: ", gameContainer);
        if (gameContainer) {
            launchGame(gameContainer);
        }
        if (!checkbox.checked) {
            updatePreference('settings', 'launchDialogPolicy', 'hide');
            LB.launchDialogPolicy = 'hide';
        }
        closeDialog();
    });

    // Open the dialog using DialogManager
    DialogManager.open(overlay, 'launchGame');
    okButton.focus();
}

export function preferencesErrorDialog(errorMessage) {
    const overlay = document.getElementById('preferences-error-overlay');

    // Create overlay if it doesn't exist
    if (!overlay) {
        const newOverlay = document.createElement('div');
        newOverlay.id = 'preferences-error-overlay';
        newOverlay.className = 'overlay popup-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'dialog preferences-error-dialog';

        const title = document.createElement('h2');
        title.className = 'dialog-title';
        title.textContent = 'Preferences Error';

        const body = document.createElement('div');
        body.className = 'dialog-body';

        const message = document.createElement('p');
        message.className = 'error-message';
        body.appendChild(message);

        const buttons = document.createElement('div');
        buttons.className = 'dialog-buttons';

        const resetButton = document.createElement('button');
        resetButton.className = 'button reset';
        resetButton.textContent = 'Reset Preferences';

        const quitButton = document.createElement('button');
        quitButton.className = 'button quit';
        quitButton.textContent = 'Quit';

        buttons.appendChild(resetButton);
        buttons.appendChild(quitButton);

        dialog.appendChild(title);
        dialog.appendChild(body);
        dialog.appendChild(buttons);
        newOverlay.appendChild(dialog);

        document.body.appendChild(newOverlay);

        return new Promise((resolve) => {
            resetButton.addEventListener('click', () => {
                DialogManager.closeCurrent();
                resolve('reset');
            });

            quitButton.addEventListener('click', () => {
                DialogManager.closeCurrent();
                resolve('quit');
            });

            newOverlay.addEventListener('click', (e) => {
                if (e.target === newOverlay) {
                    // Don't close on overlay click for error dialogs
                }
            });

            DialogManager.open(newOverlay, 'preferencesError');
            resetButton.focus();

            window.onPreferencesErrorKeyDown = function(event) {
                event.stopPropagation();
                event.stopImmediatePropagation();

                switch (event.key) {
                case 'ArrowLeft':
                case 'ArrowRight':
                    simulateTabNavigation(dialog);
                    break;
                case 'Enter':
                    document.activeElement.click();
                    break;
                case 'Escape':
                    // Don't allow escape for error dialogs
                    break;
                }
            };
        });
    } else {
        // Update existing overlay
        const message = overlay.querySelector('.error-message');
        if (message) {
            message.textContent = errorMessage;
        }

        return new Promise((resolve) => {
            const resetButton = overlay.querySelector('.reset');
            const quitButton = overlay.querySelector('.quit');

            resetButton.addEventListener('click', () => {
                DialogManager.closeCurrent();
                resolve('reset');
            });

            quitButton.addEventListener('click', () => {
                DialogManager.closeCurrent();
                resolve('quit');
            });

            DialogManager.open(overlay, 'preferencesError');
            resetButton.focus();
        });
    }
}

export function resetPrefsDialog(errorMessage) {
    const overlay = document.getElementById('reset-prefs-overlay');
    const dialog = overlay.querySelector('#reset-prefs-dialog');
    const resetButton = dialog.querySelector('.reset');
    const quitButton = dialog.querySelector('.quit');
    const messageElement = dialog.querySelector('.error-message');

    messageElement.textContent = errorMessage;

    function closeDialog() {
        DialogManager.closeCurrent();
        DialogManager.restoreMode();
    }

    resetButton.addEventListener('click', async () => {
        try {
            await ipcRenderer.invoke('reset-preferences');
            closeDialog();
            // Reload the app to use the new preferences
            window.location.reload();
        } catch (error) {
            console.error('Failed to reset preferences:', error);
        }
    });

    quitButton.addEventListener('click', () => {
        ipcRenderer.invoke('quit');
    });

    DialogManager.open(overlay, 'resetPrefs');
    resetButton.focus();

    window.onResetPrefsKeyDown = function(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
            simulateTabNavigation(dialog);
            break;
        case 'Enter':
            document.activeElement.click();
            break;
        case 'Escape':
            // Don't allow escape for error dialogs
            break;
        }
    };
}

export function installEmulatorsDialog(emulators) {
    const overlay = document.getElementById('install-emulators-dialog-overlay');
    const dialog = overlay.querySelector('div.dialog');
    const closeButton = dialog.querySelector('.cancel');

    dialog.querySelector('.title-name').textContent = getPlatformInfo(LB.currentPlatform).name;

    const menu = document.getElementById('menu');
    const emulatorInput = menu.querySelector('input.emulator');
    const argsInput = menu.querySelector('input.args');

    const body = dialog.querySelector('div.body');

    const emulatorsCtn = document.createElement('div');
    emulatorsCtn.classList.add('emulators', 'text');

    // Flathub status display
    const flathubStatus = document.createElement('div');
    flathubStatus.classList.add('flathub-status');
    flathubStatus.textContent = 'Checking Flatpak / Flathub status...';
    emulatorsCtn.appendChild(flathubStatus);

    const emulatorsTable = document.createElement('table');
    emulatorsTable.id = 'emulators-table';
    emulatorsTable.classList.add('emulators-table');

    // Body
    const tbody = document.createElement('tbody');
    emulatorsTable.appendChild(tbody);
    emulatorsCtn.appendChild(emulatorsTable);

    // Store row data for easy access
    const rowData = new Map();

    async function checkFlathubStatus() {
        try {
            const flatpakAvailable = await ipcRenderer.invoke('is-flatpak-available');
            const flathubConfigured = await ipcRenderer.invoke('is-flathub-configured');

            if (!flatpakAvailable) {
                flathubStatus.innerHTML = `<svg class="icon"><use href="#xmark"></use></svg> Flatpak not installed on system`;
            } else if (!flathubConfigured) {
                flathubStatus.innerHTML = `<svg class="icon"><use href="#warning"></use></svg> Flathub remote not configured (will be added automatically during installation)`;
            } else {
                flathubStatus.innerHTML = `<svg class="icon success"><use href="#checkmark"></use></svg> Flatpak and Flathub configured`;
            }
        } catch (error) {
            flathubStatus.innerHTML = `<svg class="icon"><use href="#xmark"></use></svg> Error checking Flatpak status`;
        }
    }

    // Check installation status for all emulators
    async function checkAllEmulatorsStatus() {
        const flatpakAvailable = await ipcRenderer.invoke('is-flatpak-available');

        for (const [flatpakId, data] of rowData) {
            const { statusCell, selectButton, checkButton, installButton } = data;

            if (!flatpakAvailable) {
                statusCell.textContent = 'Flatpak not available';
                installButton.disabled = true;
                continue;
            }

            try {
                const isInstalled = await ipcRenderer.invoke('is-flatpak-package-installed', flatpakId);
                const isInstalling = await ipcRenderer.invoke('is-flatpak-installing', flatpakId);

                console.log("isInstalling: ", isInstalling, flatpakId);

                if (isInstalled) {
                    // statusCell.innerHTML = `<i class="fa fa-check success" aria-hidden="true"></i> Installed`;
                    statusCell.innerHTML = `<svg class="icon success"><use href="#checkmark"></use></svg> Installed`;

                    selectButton.style.display = 'inline-block';
                    installButton.style.display = 'none';
                } else {

                    selectButton.style.display = 'none';

                    const notInstalled = `<svg class="icon error"><use href="#xmark"></use></svg> Not installed`;
                    const installing = `<svg class="icon success"><use href="#clock"></use></svg> Installing`;

                    statusCell.innerHTML = isInstalling ? installing : notInstalled;

                    if (isInstalling) {
                        checkButton.style.display = 'inline-block';
                        checkButton.dataset.flatpakId = flatpakId;
                        installButton.style.display = 'none';
                    } else {
                        installButton.style.display = 'inline-block';
                        installButton.disabled = false;
                    }
                }
            } catch (error) {
                statusCell.textContent = 'Error checking status';
            }
        }
    }

    // Build rows
    emulators.forEach(emulator => {
        const { name, flatpak, args, url } = emulator;

        const row = document.createElement('tr');

        // Name cell
        const nameCell = document.createElement('td');
        nameCell.classList.add('name');
        nameCell.innerHTML = `<strong title="${flatpak}">${name}</strong>`;

        const loader = document.createElement('span');
        loader.className = 'loader';
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-live', 'polite');
        loader.setAttribute('aria-label', 'Checking installation status');

        // Create hidden text for screen readers
        const hiddenText = document.createElement('span');
        hiddenText.className = 'visually-hidden';
        hiddenText.textContent = 'Checking installation status...';

        // Status cell
        const statusCell = document.createElement('td');
        statusCell.classList.add('status');
        // statusCell.textContent = 'Checking...';
        statusCell.textContent = '';
        // statusCell.append(loader, hiddenText);

        // Actions
        const actionCell = document.createElement('td');
        actionCell.classList.add('action');
        const buttons = document.createElement('div');
        buttons.className = 'buttons';

        const selectButton = document.createElement('button');
        // selectButton.innerHTML = '<i class="fa fa-bolt success" aria-hidden="true"></i> Select';
        selectButton.innerHTML = `<svg class="icon success"><use href="#bolt"></use></svg> Select`;
        selectButton.classList.add('button');
        selectButton.style.display = 'none'; // Hidden by default

        const checkButton = document.createElement('button');
        // checkButton.innerHTML = '<i class="fa fa-refresh" aria-hidden="true"></i> Check';
        checkButton.innerHTML = `<svg class="icon"><use href="#refresh"></use></svg> Check`;
        checkButton.classList.add('button');
        checkButton.style.display = 'none'; // Hidden by default

        const installButton = document.createElement('button');
        installButton.textContent = 'Install';
        installButton.classList.add('button', 'install');
        installButton.disabled = true;
        installButton.style.display = 'inline-block'; // Visible by default

        buttons.append(selectButton, checkButton, installButton);
        actionCell.append(buttons);
        row.append(nameCell, statusCell, actionCell);
        tbody.appendChild(row);

        // Disable if no flatpak
        if (!flatpak) {
            console.log("no flatpak: ");
            statusCell.textContent = 'No FlatPak available yet';
            selectButton.disabled = true;
            installButton.textContent = 'Manual install';
            // return;
        }

        // Store row data for status checking
        rowData.set(flatpak, { statusCell, selectButton, checkButton, installButton });

        selectButton.addEventListener('click', () => {
            console.log(`Selected emulator: ${name} (${flatpak}) args: ${args}`);
            emulatorInput.value = `flatpak run ${flatpak}`;
            argsInput.value = args;
            closeDialog();
        });

        checkButton.addEventListener('click', async () => {
            const isInstalled = await ipcRenderer.invoke('is-flatpak-package-installed', checkButton.dataset.flatpakId);
            if (isInstalled) {
                // statusCell.innerHTML = '<i class="fa fa-check success" aria-hidden="true"></i> Installed';
                statusCell.innerHTML = `<svg class="icon success"><use href="#checkmark"></use></svg> Installed`;

                installButton.textContent = 'Install';
            } else {
                // statusCell.innerHTML = '<i class="fa fa-check success" aria-hidden="true"></i> Checking';
                statusCell.innerHTML = `<svg class="icon success"><use href="#checkmark"></use></svg> Checking`;
                setTimeout(() => {
                    // statusCell.innerHTML = '<i class="fa fa-check success" aria-hidden="true"></i> Installing';
                    statusCell.innerHTML = `<svg class="icon success"><use href="#checkmark"></use></svg> Installing`;
                    console.log("Still installing: ");
                }, 500);
            }
        });

        installButton.addEventListener('click', async () => {
            if (!flatpak) {
                ipcRenderer.invoke('go-to-url', url);
                closeDialog();
                return;
            }

            installButton.disabled = true;
            // statusCell.innerHTML = '<i class="fa fa-clock-o success" aria-hidden="true"></i> Installing';
            statusCell.innerHTML = `<svg class="icon success"><use href="#clock"></use></svg> Installing`;
            installButton.textContent = '';
            installButton.appendChild(loader);
            // hiddenText.textContent = 'Installing FlatPak';
            // loader.setAttribute('aria-label', 'Installing FlatPak');
            // statusCell.textContent = '';
            // statusCell.append(loader, hiddenText);

            try {
                await ipcRenderer.invoke('install-flatpak', flatpak);
                // statusCell.innerHTML = '<i class="fa fa-check success" aria-hidden="true"></i> Installed';
                statusCell.innerHTML = `<svg class="icon success"><use href="#checkmark"></use></svg> Installed`;
                installButton.style.display = 'none';
                selectButton.style.display = 'inline-block';
            } catch (error) {
                // statusCell.innerHTML = '<i class="fa fa-close error" aria-hidden="true"></i> Failed';
                statusCell.innerHTML = `<svg class="icon error"><use href="#xmark"></use></svg> Failed`;
                installButton.disabled = false;
                installButton.textContent = 'Install';
                console.error('Installation failed:', error);
            }
        });
    });

    body.textContent = '';
    body.appendChild(emulatorsCtn);

    // Check Flathub status and emulator status when dialog opens
    async function initializeDialog() {
        await checkFlathubStatus();
        await checkAllEmulatorsStatus();
    }

    initializeDialog();

    function closeDialog() {
        DialogManager.closeCurrent();
        DialogManager.restoreMode();
    }

    window.onInstallKeyDown = function (event) {
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
            simulateTabNavigation(dialog);
            break;
        case 'ArrowLeft':
        case 'ArrowUp':
            simulateTabNavigation(dialog, true);
            break;
        case 'Escape':
            closeDialog();
            break;
        case '/':
            systemDialog('quit');
            break;
        case '?':
            helpDialog('shortcuts');
            break;

        }
    };

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDialog();
    });

    closeButton.addEventListener('click', closeDialog);

    DialogManager.open(overlay, 'installDialog');
    closeButton.focus();
}

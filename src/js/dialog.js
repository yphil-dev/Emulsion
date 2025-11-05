import { initSlideShow, initGallery } from './slideshow.js';
import { displayMetaData } from './metadata.js';
import { PLATFORMS, getPlatformInfo } from './platforms.js';
import { simulateTabNavigation, launchGame } from './utils.js';
import { updatePreference } from './preferences.js';

const DialogManager = {
    currentDialog: null,
    previousMode: null,
    mainMode: null, // Track the main non-dialog mode

    open(dialogElement, mode) {
        this.closeCurrent();
        this.previousMode = LB.mode;

        // If we're opening from a main mode, store it
        if (this.isMainMode(LB.mode)) {
            this.mainMode = LB.mode;
        }

        this.currentDialog = dialogElement;
        LB.mode = mode;
        dialogElement.style.display = 'flex';
        return dialogElement;
    },

    closeCurrent() {
        if (this.currentDialog) {
            this.currentDialog.style.display = 'none';
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
            console.log("Restored to main mode: ", LB.mode);
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
        label.className = 'form-label';
        label.textContent = field.label;
        form.appendChild(label);

        let input;
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 15;
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

    const dialogText = document.createElement('div');
    dialogText.textContent = message;

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

        case 'Escape':
        case 'Enter':
            closeDialog();
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
    DialogManager.open(overlay, 'kbHelp');

    setupTabs(defaultTabId);

    okButton.focus();
}

export async function downloadMetaDialog(imagesCount, metaCount) {
    const overlay = document.getElementById('download-meta-overlay');
    const dialog = overlay.querySelector('.dialog');
    const dialogTitle = dialog.querySelector('.dialog-title');
    const dialogBody = dialog.querySelector('.dialog-body');

    const okButton = dialog.querySelector('button.ok');
    const cancelButton = dialog.querySelector('button.cancel');

    return new Promise((resolve) => {
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
                    if (!cancelButton.matches(':focus')) {
                        onOk();
                    }
                    break;
            }
        };

        const handleCancel = () => {
            closeDialog();
            resolve(null);
        };
        cancelButton.addEventListener('click', handleCancel);

        dialogTitle.innerHTML = `Download <span>${getPlatformInfo(LB.currentPlatform).name}</span> games meta data`;

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'batch-options';

        // --- helper ---
        const makeCheckboxOption = (id, label, count, checked, disabled) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'batch-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = id;
            checkbox.classList.add('input');
            checkbox.checked = checked;
            checkbox.disabled = disabled;

            const labelElement = document.createElement('label');
            labelElement.htmlFor = id;
            labelElement.className = 'form-label';

            const countText = count ? ` (${count})` : '';
            labelElement.textContent = `${label}${countText}`;

            wrapper.append(checkbox, labelElement);
            return wrapper;
        };

        const hasImages = imagesCount > 0;
        const hasMeta = metaCount > 0;

        const imgLabel = hasImages ? `Download missing images` : `No missing images`;
        const metaLabel = hasMeta ? `Download missing metadata` : `No missing metadata`;

        const imgSources = document.createElement('dl');
        const imgSourcesDT = document.createElement('dt');
        imgSourcesDT.textContent = 'Sources';

        function createSourceDd(text, isEnabled) {
            const dd = document.createElement('dd');
            if (!isEnabled) dd.classList.add('disabled');

            const icon = document.createElement('i');
            icon.className = 'form-icon fa fa-2x';
            icon.classList.add(isEnabled ? 'fa-check-square-o' : 'fa-square-o');
            icon.setAttribute('aria-hidden', 'true');

            const span = document.createElement('span');
            span.textContent = text;

            dd.append(icon, span);
            return dd;
        }

        imgSources.append(
            imgSourcesDT,
            createSourceDd('Wikipedia', true),
            createSourceDd('SteamGridDB', LB.steamGridAPIKey),
            createSourceDd('GiantBomb', LB.giantBombAPIKey)
        );

        const textSources = document.createElement('dl');
        const textSourcesDT = document.createElement('dt');
        textSourcesDT.textContent = 'Sources';
        textSources.append(textSourcesDT, createSourceDd('Wikipedia', true));

        // --- append checkboxes and sources ---
        optionsContainer.appendChild(
            makeCheckboxOption('batch-images', imgLabel, hasImages ? imagesCount : 0, hasImages, !hasImages)
        );
        if (hasImages) optionsContainer.appendChild(imgSources);

        optionsContainer.appendChild(
            makeCheckboxOption('batch-metadata', metaLabel, hasMeta ? metaCount : 0, hasMeta, !hasMeta)
        );
        if (hasMeta) optionsContainer.appendChild(textSources);

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
        case 'Enter':
            const focusedButton = document.activeElement;
            if (focusedButton === quitButton) {
                ipcRenderer.invoke('quit');
            } else if (focusedButton === cancelButton) {
                closeDialog();
            } else if (focusedButton === restartButton) {
                window.location.reload();
            } else if (focusedButton === configButton && !LB.kioskMode) {
                initGallery('settings');
                closeDialog();
            }
            break;
        case 'Escape':
            closeDialog();
            break;
        }
    };

    restartButton.addEventListener('click', () => window.location.reload());

    if (!LB.kioskMode) {
        configButton.addEventListener('click', () => {
            initGallery('settings');
            closeDialog();
        });
    } else {
        configButton.style.display = 'none';
    }

    quitButton.addEventListener('click', () => ipcRenderer.invoke('quit'));
    cancelButton.addEventListener('click', closeDialog);

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
        if (!document.getElementById('open-dialog-at-launch').checked) {
            updatePreference('settings', 'launchDialogPolicy', 'hide');
            LB.launchDialogPolicy = 'hide';
        }
        closeDialog();
    });

    // Open the dialog using DialogManager
    DialogManager.open(overlay, 'launchGame');
    okButton.focus();
}

export function installEmulatorsDialog(emulators) {
    const overlay = document.getElementById('install-emulators-dialog-overlay');
    const dialog = overlay.querySelector('div.dialog');
    const closeButton = dialog.querySelector('.cancel');

    const menu = document.getElementById('menu');
    const emulatorInput = menu.querySelector('input.emulator');
    const argsInput = menu.querySelector('input.args');

    const body = dialog.querySelector('div.body');
    body.textContent = '';

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
                flathubStatus.textContent = '❌ Flatpak not installed on system';
            } else if (!flathubConfigured) {
                flathubStatus.textContent = '⚠️ Flathub remote not configured (will be added automatically during installation)';
            } else {
                flathubStatus.textContent = '✅ Flatpak and Flathub configured';
            }
        } catch (error) {
            flathubStatus.textContent = '❌ Error checking Flatpak status';
        }
    }

    // Check installation status for all emulators
    async function checkAllEmulatorsStatus() {
        const flatpakAvailable = await ipcRenderer.invoke('is-flatpak-available');

        for (const [flatpakId, data] of rowData) {
            const { statusCell, selectButton, installButton } = data;

            if (!flatpakAvailable) {
                statusCell.textContent = 'Flatpak not available';
                statusCell.className = 'status unavailable';
                installButton.disabled = true;
                continue;
            }

            try {
                const isInstalled = await ipcRenderer.invoke('is-flatpak-installed', flatpakId);

                if (isInstalled) {
                    statusCell.textContent = '✅ Installed';
                    statusCell.className = 'status installed';
                    selectButton.style.display = 'inline-block';
                    installButton.style.display = 'none';
                } else {

                    statusCell.textContent = 'Not installed';
                    statusCell.className = 'status not-installed';
                    selectButton.style.display = 'none';
                    installButton.style.display = 'inline-block';
                    installButton.disabled = false;
                }
            } catch (error) {
                statusCell.textContent = 'Error checking status';
                statusCell.className = 'status error';
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
        nameCell.textContent = flatpak ? `${name} (${flatpak})` : name;

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
        statusCell.innerHTML = '';
        // statusCell.append(loader, hiddenText);

        // Actions
        const actionCell = document.createElement('td');
        actionCell.classList.add('action');
        const buttons = document.createElement('div');
        buttons.className = 'buttons';

        const selectButton = document.createElement('button');
        selectButton.textContent = 'Select';
        selectButton.classList.add('button', 'small');
        selectButton.style.display = 'none'; // Hidden by default

        const installButton = document.createElement('button');
        installButton.textContent = 'Install';
        installButton.classList.add('button', 'small');
        installButton.disabled = true;
        installButton.style.display = 'inline-block'; // Visible by default

        buttons.append(selectButton, installButton);
        actionCell.append(buttons);
        row.append(nameCell, statusCell, actionCell);
        tbody.appendChild(row);

        // Disable if no flatpak
        if (!flatpak) {
            console.log("no flatpak: ");
            statusCell.textContent = 'No FlatPak available yet';
            statusCell.className = 'status unavailable';
            selectButton.disabled = true;
            installButton.textContent = 'Manual install';
            // return;
        }

        // Store row data for status checking
        rowData.set(flatpak, { statusCell, selectButton, installButton });

        selectButton.addEventListener('click', () => {
            console.log(`Selected emulator: ${name} (${flatpak}) args: ${args}`);
            emulatorInput.value = `flatpak run ${flatpak}`;
            argsInput.value = args;
            closeDialog();
        });

        installButton.addEventListener('click', async () => {
            if (!flatpak) {
                ipcRenderer.invoke('go-to-url', url);
                closeDialog();
                return;
            }

            installButton.disabled = true;
            // statusCell.textContent = 'Installing...';

            hiddenText.textContent = 'Installing FlatPak';
            loader.setAttribute('aria-label', 'Installing FlatPak');
            statusCell.innerHTML = '';
            statusCell.append(loader, hiddenText);

            statusCell.className = 'status installing';

            try {
                await ipcRenderer.invoke('install-flatpak', flatpak);
                statusCell.textContent = '✅ Installed';
                statusCell.className = 'status installed';
                installButton.style.display = 'none';
                selectButton.style.display = 'inline-block';
            } catch (error) {
                statusCell.textContent = '❌ Failed';
                statusCell.className = 'status error';
                installButton.disabled = false;
                console.error('Installation failed:', error);
            }
        });
    });

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
        }
    };

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDialog();
    });

    closeButton.addEventListener('click', closeDialog);

    DialogManager.open(overlay, 'installDialog');
    closeButton.focus();
}


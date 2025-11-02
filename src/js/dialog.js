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

export function helpDialog() {
    const overlay = document.getElementById('help-overlay');
    const dialog = overlay.querySelector('.dialog');
    const okButton = dialog.querySelector('button.ok');

    overlay.style.alignItems = 'flex-start';
    overlay.style.paddingTop = '50px';

    const platformNames = dialog.querySelector('#platform-names');
    if (platformNames) {
        platformNames.textContent = PLATFORMS.map(platform => platform.name).join(', ');
    }

    function setupTabs() {
        const tabButtons = overlay.querySelectorAll('.tab-button');
        const tabContents = overlay.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {

                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                const content = overlay.querySelector(`#${tabId}`);
                if (content) {
                    content.classList.add('active');
                }
            });
        });
    }

    function closeDialog() {
        DialogManager.closeCurrent();
        DialogManager.restoreMode();

        // Reset styles
        overlay.style.alignItems = '';
        overlay.style.paddingTop = '';
    }

    window.onKBHelpKeyDown = function onKBHelpKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();

        const kbOverlay = document.getElementById('help-overlay');
        if (kbOverlay && kbOverlay.style.display === 'flex') {
            const tabButtons = kbOverlay.querySelectorAll('.tab-button');
            if (tabButtons.length > 0) {
                switch (event.key) {
                case 'ArrowLeft':
                    const activeLeft = kbOverlay.querySelector('.tab-button.active');
                    let currentIndexLeft = Array.from(tabButtons).indexOf(activeLeft);
                    currentIndexLeft = (currentIndexLeft - 1 + tabButtons.length) % tabButtons.length;
                    tabButtons[currentIndexLeft].click();
                    break;
                case 'ArrowRight':
                    const activeRight = kbOverlay.querySelector('.tab-button.active');
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
            } else if (event.key === 'Escape' || event.key === 'Enter') {
                closeDialog();
            }
        } else if (event.key === 'Escape' || event.key === 'Enter') {
            closeDialog();
        }
    };

    // Set up event listeners
    okButton.addEventListener('click', closeDialog);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDialog();
    });

    // Open the dialog using DialogManager
    DialogManager.open(overlay, 'kbHelp');
    setupTabs();
    okButton.focus();
}

export async function downloadMetaDialog(imagesCount, metaCount) {
    const overlay = document.getElementById('download-meta-overlay');
    const dialog = overlay.querySelector('.dialog');
    const dialogTitle = dialog.querySelector('.dialog-title');
    const dialogBody = dialog.querySelector('.dialog-body');

    const okButton = dialog.querySelector('button.ok');
    const cancelButton = dialog.querySelector('button.cancel');

    // Return a Promise that resolves with the user's choice
    return new Promise((resolve) => {
        function closeDialog() {
            DialogManager.closeCurrent();
            DialogManager.restoreMode(); // Use the proper restore
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
                resolve(null); // Resolve with null on escape
                break;
            case 'Enter':
                if (!cancelButton.matches(':focus')) {
                    onOk();
                }
                break;
            default:
                break;
            }
        };

        const handleCancel = () => {
            closeDialog();
            resolve(null); // Resolve with null on cancel
        };

        cancelButton.addEventListener('click', handleCancel);

        dialogTitle.innerHTML = `Download <span>${getPlatformInfo(LB.currentPlatform).name}</span> games meta data`;

        // --- Build dialog options dynamically ---
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'batch-options';

        const makeRadioOption = (id, label, count, checked, disabled, name) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'batch-option';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.id = id;
            radio.name = name;
            radio.classList.add('input');
            radio.checked = checked;
            radio.disabled = disabled;

            const labelElement = document.createElement('label');
            labelElement.htmlFor = id;
            labelElement.className = 'form-label';

            const countText = count ? ` (${count})` : '';
            labelElement.textContent = `${label}${countText}`;

            wrapper.appendChild(radio);
            wrapper.appendChild(labelElement);

            return wrapper;
        };

        const hasImages = imagesCount > 0;
        const hasMeta = metaCount > 0;

        // Build radio options for singly selected type
        const imgLabel = hasImages ? `Download missing images` : `No missing images`;
        const metaLabel = hasMeta ? `Download missing metadata` : `No missing metadata`;

        const imgSources = document.createElement('dl');

        const imgSourcesDT = document.createElement('dt');
        imgSourcesDT.textContent = 'Sources';

        // Helper function to create icon-span pairs
        function createSourceDd(iconClass, text) {
            const dd = document.createElement('dd');

            const icon = document.createElement('i');
            icon.className = `form-icon fa fa-2x ${iconClass}`;
            icon.setAttribute('aria-hidden', 'true');

            const span = document.createElement('span');
            span.textContent = text;

            dd.append(icon, span);
            return dd;
        }

        imgSources.append(
            imgSourcesDT,
            createSourceDd('fa-square-o', 'Wikipedia'),
            createSourceDd('fa-check-square-o', 'SteamGridDB'),
            createSourceDd('fa-check-square-o', 'GiantBomb')
        );

        const textSources = document.createElement('dl');

        const textSourcesDT = document.createElement('dt');
        textSourcesDT.textContent = 'Sources';

        textSources.append(textSourcesDT, createSourceDd('fa-square-o', 'Wikipedia'));

        optionsContainer.appendChild(
            makeRadioOption('batch-images', imgLabel, hasImages ? imagesCount : 0, hasImages, !hasImages, 'batch-type')
        );

        if (hasImages) {
            optionsContainer.appendChild(imgSources);
        }

        optionsContainer.appendChild(
            makeRadioOption('batch-metadata', metaLabel, hasMeta ? metaCount : 0, hasImages && !hasMeta, !hasMeta, 'batch-type')
        );

        if (hasMeta) {
            optionsContainer.appendChild(textSources);
        }

        dialogBody.innerHTML = '';
        dialogBody.appendChild(optionsContainer);

        const showOk = hasImages || hasMeta;
        okButton.style.display = showOk ? 'block' : 'none';
        cancelButton.textContent = showOk ? 'Cancel' : 'Close';

        const onOk = () => {
            const imagesChecked = document.getElementById('batch-images')?.checked || false;
            const metadataChecked = document.getElementById('batch-metadata')?.checked || false;
            closeDialog();
            resolve({ imageBatch: imagesChecked, metaBatch: metadataChecked }); // Resolve with user's choice
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

    okButton.addEventListener('click', async () => {
        launchGame(gameContainer);
        if (!document.getElementById('open-dialog-at-launch').checked) {
            await updatePreference('settings', 'launchDialogPolicy', 'hide');
        }
        closeDialog();
    });

    // Open the dialog using DialogManager
    DialogManager.open(overlay, 'launchGame');
    okButton.focus();
}

import { initSlideShow, initGallery } from './slideshow.js';
import { displayMetaData } from './metadata.js';
import { PLATFORMS } from './platforms.js';
import { launchGame, simulateTabNavigation, } from './utils.js';

export function quitDialog() {
    LB.mode = 'quit';

    const overlay = document.getElementById('quit-confirmation-overlay');
    const dialog = overlay.querySelector('.dialog');
    const cancelButton = dialog.querySelector('button.cancel');
    const okButton = dialog.querySelector('button.ok');

    function openDialog() {
        closeAllDialogs();
        overlay.style.display = 'flex';
        cancelButton.focus();
    }

    function closeDialog() {
        overlay.style.display = 'none';
        initSlideShow(LB.currentPlatform);
    }

    window.onQuitKeyDown = function onQuitKeyDown(event) {
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
        case 'Enter':
            const focusedButton = document.activeElement;
            if (focusedButton === okButton) {
                ipcRenderer.invoke('quit');
            } else if (focusedButton === cancelButton) {
                closeDialog();
            }
            break;
        case 'Escape':
            closeDialog();
            break;
        }
    };

    okButton.addEventListener('click', () => { ipcRenderer.invoke('quit'); });
    cancelButton.addEventListener('click', closeDialog);
    overlay.addEventListener('click', closeDialog);

    openDialog();
}

function closeAllDialogs() {
    document.querySelectorAll('div.overlay').forEach(div => {div.style.display = 'none';});
}

export function editMetaDialog(params, gameMetaData) {

    LB.mode = 'metaEdit';

    const overlay = document.getElementById('edit-meta-overlay');
    const dialog = overlay.querySelector('.dialog');
    const dialogBody = dialog.querySelector('div.dialog-text');

    const title = dialog.querySelector('div.dialog-text');

    const cancelButton = dialog.querySelector('button.cancel');
    const okButton = dialog.querySelector('button.ok');

    const form = createEditMetaForm(params, gameMetaData);
    dialogBody.innerHTML = '';
    dialogBody.appendChild(form);

    function openDialog() {
        closeAllDialogs();
        overlay.style.display = 'flex';
        cancelButton.focus();
        document.querySelectorAll('div.overlay').forEach(div => {div.style.display = 'none';});
    }

    function closeDialog() {
        overlay.style.display = 'none';
        initGallery(LB.currentPlatform);
    }

    window.onMetaEditKeyDown = function onMetaEditKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
    };

    okButton.addEventListener('click', () => {
        form.requestSubmit();
    });

    cancelButton.addEventListener('click', closeDialog);
    overlay.onclick = (e) => { if (e.target === overlay) closeDialog();};

    openDialog();

}

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
        input.className = 'input';
        input.name = field.name;

        if (field.name === 'developers') input.value = (gameMetaData.developers || []).join(', ');
        else if (field.name === 'platforms') input.value = (gameMetaData.platforms || []).join(', ');
        else if (field.name === 'genre') input.value = gameMetaData.genre || '';
        else if (field.name === 'description') input.value = gameMetaData.description || '';
        else if (field.name === 'releaseDate') input.value = gameMetaData.releaseDate?.slice(0, 10) || '';
        else input.value = gameMetaData[field.name] || '';

        form.appendChild(input);
    });

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
    });

    return form;
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

    const prevMode = LB.mode;

    LB.mode = 'kbHelp';

    const overlay = document.getElementById('kb-shortcuts-overlay');
    const closeButton = document.getElementById('kb-close-button');
    const platformNames = document.getElementById('platform-names');

    platformNames.textContent = PLATFORMS.map(platform => platform.name).join(', ');

    function openDialog() {
        closeAllDialogs();
        overlay.style.display = 'flex';
        // overlay.style.alignItems = 'flex-start';
        // overlay.style.paddingTop = '50px';
        closeButton.focus();

        // Populate platform names in CLI tab
        const platformNames = document.querySelector('#kb-shortcuts-dialog .dialog #platform-names');
        if (platformNames) {
            platformNames.textContent = PLATFORMS.map(platform => platform.name).join(', ');
        }


        // Tab switching functionality
        let tabButtons = overlay.querySelectorAll('.tab-button');
        const tabContents = overlay.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
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
        overlay.style.display = 'none';
        LB.mode = prevMode;
    }

    window.onKBHelpKeyDown = function onKBHelpKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();

        const kbOverlay = document.getElementById('kb-shortcuts-overlay');
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



    closeButton.addEventListener('click', closeDialog);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDialog(); });

    openDialog();
}


export function batchDialog(imagesCount, metaCount) {
    return new Promise((resolve, reject) => {
        const overlay = document.getElementById('batch-confirmation-overlay');
        const dialogTitle = overlay.querySelector('.title');
        const dialogText = overlay.querySelector('.dialog-text');
        const okButton = overlay.querySelector('button.ok');
        const cancelButton = overlay.querySelector('button.cancel');

        overlay.dataset.status = 'open';
        dialogText.innerHTML = '';

        // --- Build dialog options dynamically ---
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'batch-options';

        const makeRadioOption = (id, label, count, checked, disabled, name) => {
            const wrapper = document.createElement('label');
            wrapper.className = 'batch-option';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.id = id;
            radio.name = name;
            radio.classList.add('input');
            radio.checked = checked;
            radio.disabled = disabled;

            const countText = count ? ` (${count})` : '';
            const text = document.createTextNode(` ${label}${countText}`);

            wrapper.appendChild(radio);
            wrapper.appendChild(text);

            return wrapper;
        };

        const hasImages = imagesCount > 0;
        const hasMeta = metaCount > 0;

        // Build radio options for singly selected type
        const imgLabel = hasImages ? `Download missing images` : `No missing images`;
        const metaLabel = hasMeta ? `Download missing metadata` : `No missing metadata`;

        optionsContainer.appendChild(
            makeRadioOption('batch-images', imgLabel, hasImages ? imagesCount : 0, hasImages, !hasImages, 'batch-type')
        );
        optionsContainer.appendChild(
            makeRadioOption('batch-metadata', metaLabel, hasMeta ? metaCount : 0, hasImages && !hasMeta, !hasMeta, 'batch-type')
        );

        dialogText.appendChild(optionsContainer);

        // --- Buttons behavior ---
        const showOk = hasImages || hasMeta;
        okButton.style.display = showOk ? 'block' : 'none';
        cancelButton.textContent = showOk ? 'Cancel' : 'Close';

        overlay.style.display = 'flex';
        cancelButton.focus();

        const cleanup = () => {
            overlay.style.display = 'none';
            document.removeEventListener('keydown', onKeyDown);
            dialogTitle.textContent = 'Game meta data';
        };

        const onOk = () => {
            const imagesChecked = document.getElementById('batch-images')?.checked || false;
            const metadataChecked = document.getElementById('batch-metadata')?.checked || false;
            cleanup();
            resolve({ imageBatch: imagesChecked, metaBatch: metadataChecked });
        };

        const onCancel = () => {
            cleanup();
            reject(new Error('User cancelled batch dialog'));
        };

        const onKeyDown = (event) => {
            if (event.key === 'Escape') onCancel();
            if (event.key === 'Enter' && document.activeElement.type === 'radio') {
                document.activeElement.checked = !document.activeElement.checked;
            }
        };

        okButton.onclick = onOk;
        cancelButton.onclick = onCancel;
        document.addEventListener('keydown', onKeyDown);
        overlay.onclick = (e) => { if (e.target === overlay) onCancel(); };

        // --- Optional: basic focus loop ---
        // setTimeout(() => {
        //     const inputs = optionsContainer.querySelectorAll('input[type="radio"]');
        //     const elements = [...inputs, okButton, cancelButton];

        //     elements.forEach((el, i) => {
        //         el.addEventListener('keydown', (e) => {
        //             if (e.key === 'Tab') {
        //                 e.preventDefault();
        //                 const dir = e.shiftKey ? -1 : 1;
        //                 const next = (i + dir + elements.length) % elements.length;
        //                 elements[next].focus();
        //             }
        //         });
        //     });
        // }, 0);

    });
}

export function systemDialog() {
    const prevMode = LB.mode;
    LB.mode = 'systemDialog';

    const overlay = document.getElementById('system-dialog-overlay');
    const dialog = overlay.querySelector('.dialog');
    const restartButton = dialog.querySelector('.restart');
    const configButton = dialog.querySelector('.config');
    const quitButton = dialog.querySelector('.quit');
    const cancelButton = dialog.querySelector('.cancel');
    const helpButton = dialog.querySelector('.help');

    function openDialog() {
        closeAllDialogs();
        overlay.style.display = 'flex';
        cancelButton.focus();
    }

    function closeDialog() {
        overlay.style.display = 'none';
        LB.mode = prevMode;
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

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDialog(); });

    openDialog();
}

export function launchGameDialog(gameContainer) {

    LB.mode = 'launchGame';

    const overlay = document.getElementById('launch-game-overlay');
    const dialog = overlay.querySelector('div.dialog');
    const okButton = dialog.querySelector('.ok');
    const cancelButton = dialog.querySelector('.cancel');
    const checkBox = dialog.querySelector('#open-dialog-at-launch');
    checkBox.checked = true;

    dialog.querySelector('img').src = gameContainer.querySelector('img').src;

    dialog.querySelector('.dialog-title').textContent = gameContainer.dataset.cleanName || gameContainer.dataset.gameName;
    dialog.querySelector('.emulator-name').textContent = gameContainer.dataset.emulator;

    function openDialog() {
        closeAllDialogs();
        overlay.style.display = 'flex';
        okButton.focus();
    }

    function closeDialog() {
        overlay.style.display = 'none';
        LB.mode = 'gallery';
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
        closeDialog();
        launchGame(gameContainer);
    });

    openDialog();
}

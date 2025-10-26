import { initSlideShow, initGallery } from './slideshow.js';
import { displayMetaData } from './metadata.js';
import { getPlatformByName } from './utils.js';

export function quitDialog() {
    LB.mode = 'quit';

    const overlay = document.getElementById('quit-confirmation-overlay');
    const okButton = document.getElementById('quit-ok-button');
    const cancelButton = document.getElementById('quit-cancel-button');

    function openDialog() {
        overlay.style.display = 'flex';
        okButton.blur();
        cancelButton.focus();
    }

    function closeDialog() {
        console.log("closeDialog: ");
        overlay.style.display = 'none';
        initSlideShow(LB.currentPlatform);
    }

    window.onQuitKeyDown = function onQuitKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        const buttons = [okButton, cancelButton];
        const currentIndex = buttons.indexOf(document.activeElement);

        switch (event.key) {
        case 'Enter':
            const focusedButton = document.activeElement;
            if (focusedButton === okButton) {
                console.log('OK button focused - performing quit action');
                ipcRenderer.invoke('quit');
            } else if (focusedButton === cancelButton) {
                console.log('Cancel button focused - closing dialog');
                closeDialog();
            }
            break;
        case 'ArrowLeft':
        case 'ArrowRight':
            const dir = event.key === 'ArrowRight' ? 1 : -1;
            const nextIndex = (currentIndex + dir + buttons.length) % buttons.length;
            buttons[nextIndex].focus();
            break;
        case 'Escape':
            closeDialog();
            break;
        }
    };

    okButton.addEventListener('click', () => { closeDialog(); ipcRenderer.invoke('quit'); });
    cancelButton.addEventListener('click', (event) => {
        event.stopPropagation();
        event.stopImmediatePropagation();

        console.log("cancelButton: ");
        closeDialog();
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDialog(); });

    openDialog();
}

export function editMetaDialog(params, gameMetaData) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.style.cssText = `
        position: fixed; inset: 0;
        display:flex; justify-content:center; align-items:center;
        background: rgba(0,0,0,0.5); z-index:9999;
    `;
    const form = createEditMetaForm(params, gameMetaData);
    overlay.appendChild(form);
    document.body.appendChild(overlay);

    LB.mode = 'metaEdit';

    window.onMetaEditKeyDown = function onMetaEditKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
    };
}

function createEditMetaForm(params, gameMetaData) {
    const form = document.createElement('form');
    form.classList.add('edit-metadata-dialog', 'dialog');

    const title = document.createElement('h3');
    title.textContent = 'Edit Game Metadata';
    form.appendChild(title);

    const fields = [
        { label: 'Genre', name: 'genre', type: 'text' },
        { label: 'Developers (comma-separated)', name: 'developers', type: 'text' },
        { label: 'Publisher', name: 'publisher', type: 'text' },
        { label: 'Release Date', name: 'releaseDate', type: 'date' },
        { label: 'Platforms (comma-separated)', name: 'platforms', type: 'text' },
        { label: 'Description', name: 'description', type: 'textarea' },
    ];

    fields.forEach(f => {
        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = f.label;
        form.appendChild(label);

        let input;
        if (f.type === 'textarea') {
            input = document.createElement('textarea');
            // input.style.flex = '1';
            input.rows = 15;

            // input.style.height = '100%';
            // input.style.resize = 'none';
        } else {
            input = document.createElement('input');
            input.type = f.type;
        }
        input.className = 'input';
        input.name = f.name;

        if (f.name === 'developers') input.value = (gameMetaData.developers || []).join(', ');
        else if (f.name === 'platforms') input.value = (gameMetaData.platforms || []).join(', ');
        else if (f.name === 'genre') input.value = gameMetaData.genre || '';
        else if (f.name === 'description') input.value = gameMetaData.description || '';
        else if (f.name === 'releaseDate') input.value = gameMetaData.releaseDate?.slice(0, 10) || '';
        else input.value = gameMetaData[f.name] || '';

        form.appendChild(input);
    });

    const btnContainer = document.createElement('div');
    btnContainer.classList.add('bottom-buttons');
    btnContainer.style.cssText = 'display:flex; justify-content:flex-end; gap:10px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        form.closest('.popup-overlay')?.remove();
        LB.mode = 'gallery';
    });

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'button';
    saveBtn.textContent = 'Save';

    btnContainer.append(cancelBtn, saveBtn);
    form.appendChild(btnContainer);

    form.addEventListener('submit', e => {
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
    // Remove existing dialog if any
    const existingDialog = document.getElementById('favorite-confirmation');
    if (existingDialog) {
        existingDialog.remove();
    }

    const dialog = document.createElement('div');
    dialog.id = 'favorite-confirmation';
    dialog.className = 'dialog';
    // dialog.style.cssText = `
    //     position: fixed;
    //     top: 50%;
    //     left: 50%;
    //     transform: translate(-50%, -50%);
    //     background: rgba(0, 0, 0, 0.9);
    //     color: white;
    //     padding: 20px 30px;
    //     border-radius: 10px;
    //     border: 2px solid #00ffae;
    //     z-index: 10000;
    //     font-family: Arial, sans-serif;
    //     text-align: center;
    // `;
    dialog.textContent = message;
    document.body.appendChild(dialog);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(dialog)) {
            dialog.remove();
            LB.favoritePendingAction = null;
        }
    }, 5000);
}

export function kbShortcutsDialog() {

    const prevMode = LB.mode;

    LB.mode = 'kbHelp';

    const overlay = document.getElementById('kb-shortcuts-overlay');
    const closeButton = document.getElementById('kb-close-button');

    function openDialog() {
        overlay.style.display = 'flex';
        closeButton.focus();
    }

    function closeDialog() {
        overlay.style.display = 'none';
        LB.mode = prevMode;
    }

    window.onKBHelpKeyDown = function onKBHelpKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
        case '?':
        case 'Escape':
        case 'Enter':
            closeDialog();
            break;
        }
    };

    closeButton.addEventListener('click', closeDialog);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDialog(); });

    openDialog();
}

export function systemDialog() {

    const prevMode = LB.mode;

    LB.mode = 'systemDialog';

    const overlay = document.getElementById('system-dialog-overlay');
    const restartButton = document.getElementById('system-dialog-restart-button');
    const configButton = document.getElementById('system-dialog-conf-button');
    const quitButton = document.getElementById('system-dialog-quit-button');
    const cancelButton = document.getElementById('system-dialog-cancel-button');

    const buttons = [restartButton, configButton, quitButton, cancelButton];
    let currentFocusIndex = 0;

    function openDialog() {
        overlay.style.display = 'flex';
        // Set initial focus
        buttons[currentFocusIndex].focus();
    }

    function closeDialog() {
        overlay.style.display = 'none';
        LB.mode = prevMode;
    }

    function navigateButtons(direction) {
        currentFocusIndex = (currentFocusIndex + direction + buttons.length) % buttons.length;
        buttons[currentFocusIndex].focus();
    }

    window.onSystemDialogKeyDown = function onSystemDialogKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
        case 'ArrowUp':
            navigateButtons(-1); // Move to previous button
            break;
        case 'ArrowDown':
            navigateButtons(1); // Move to next button
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
            } else if (focusedButton === configButton) {
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
    configButton.addEventListener('click', (event) => {
        initGallery('settings');
        closeDialog();
    });
    quitButton.addEventListener('click', () => ipcRenderer.invoke('quit'));
    cancelButton.addEventListener('click', closeDialog);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDialog(); });

    openDialog();
}

export function batchDialog(imagesCount) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('batch-confirmation-overlay');

        overlay.dataset.status = 'open';

        const dialogTitle = document.getElementById('batch-dialog-title');
        const dialogText = document.getElementById('batch-dialog-text');

        dialogText.innerHTML = '';

        const okButton = document.getElementById('batch-ok-button');
        const cancelButton = document.getElementById('batch-cancel-button');

        // Create form with checkboxes
        const formHtml = `
            <div class="batch-options">
                <label class="batch-option">
                    <input type="checkbox" id="batch-images" checked>
                    Download ${imagesCount} missing images
                </label>
                <label class="batch-option">
                    <input type="checkbox" id="batch-metadata">
                    Update game metadata
                </label>
            </div>
        `;


        if (!imagesCount) {
            // Update form for no missing images case
            const noImagesForm = `
                <div class="batch-options">
                    <label class="batch-option">
                        <input type="checkbox" id="batch-images" disabled>
                        No missing images
                    </label>
                    <label class="batch-option">
                        <input type="checkbox" id="batch-metadata" checked>
                        Update game metadata
                    </label>
                </div>
            `;

            dialogText.innerHTML += noImagesForm;
            okButton.style.display = 'none';
            cancelButton.textContent = 'Close';
        } else {
            dialogText.innerHTML += formHtml;
            okButton.style.display = 'block';
            cancelButton.textContent = 'Cancel';
        }

        overlay.style.display = 'flex';
        document.getElementById('batch-cancel-button').focus();

        const onOk = () => {
            const imagesChecked = document.getElementById('batch-images')?.checked || false;
            const metadataChecked = document.getElementById('batch-metadata')?.checked || false;

            cleanup();
            resolve({
                images: imagesChecked,
                metadata: metadataChecked
            });
        };

        const onCancel = () => {
            cleanup();
            resolve({
                images: false,
                metadata: false
            });
        };

        const onKeyDown = (event) => {
            if (event.key === 'Escape') onCancel();
            // Allow navigation between form elements with Tab
            if (event.key === 'Enter' && document.activeElement.type === 'checkbox') {
                document.activeElement.checked = !document.activeElement.checked;
            }
        };

        const cleanup = () => {
            overlay.style.display = 'none';
            document.removeEventListener('keydown', onKeyDown);
            dialogTitle.textContent = 'Game meta data';
        };

        okButton.onclick = onOk;
        cancelButton.onclick = onCancel;
        document.addEventListener('keydown', onKeyDown);
        overlay.onclick = (e) => { if (e.target === overlay) onCancel(); };

        // Focus management for form elements
        setTimeout(() => {
            const imagesCheckbox = document.getElementById('batch-images');
            const metadataCheckbox = document.getElementById('batch-metadata');

            if (imagesCheckbox && metadataCheckbox) {
                imagesCheckbox.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        metadataCheckbox.focus();
                    }
                });

                metadataCheckbox.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab' && e.shiftKey) {
                        e.preventDefault();
                        imagesCheckbox.focus();
                    } else if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        okButton.focus();
                    }
                });
            }
        }, 0);
    });
}

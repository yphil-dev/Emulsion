import { initSlideShow } from './slideshow.js';
import { displayMetaData } from './metadata.js';

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
        overlay.style.display = 'none';
        initSlideShow(LB.currentPlatform);
    }

    window.onQuitKeyDown = function onQuitKeyDown(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        const buttons = [okButton, cancelButton];
        const currentIndex = buttons.indexOf(document.activeElement);

        switch (event.key) {
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
    cancelButton.addEventListener('click', closeDialog);
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
    form.classList.add('edit-metadata-dialog');

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
            input.style.flex = '1';
            input.style.height = '100%';
            input.style.resize = 'none';
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
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        border: 2px solid #00ffae;
        z-index: 10000;
        font-family: Arial, sans-serif;
        text-align: center;
    `;
    dialog.textContent = message;
    document.body.appendChild(dialog);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(dialog)) {
            dialog.remove();
            pendingAction = null;
        }
    }, 5000);
}

export function kbShortcutsDialog() {
    LB.mode = 'kbHelp';

    const overlay = document.getElementById('kb-shortcuts-overlay');
    const closeButton = document.getElementById('kb-close-button');

    function openDialog() {
        overlay.style.display = 'flex';
        closeButton.focus();
    }

    function closeDialog() {
        overlay.style.display = 'none';
        // initSlideShow(LB.currentPlatform);
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

import { getPlatformInfo } from './platforms.js';

export function getMeta(params) {
    return new Promise((resolve, reject) => {
        const gamesDir = LB.preferences[params.platformName].gamesDir;
        params.gamesDir = gamesDir;
        const platformDisplayName = getPlatformInfo(params.platformName).name;
        params.platformDisplayName = platformDisplayName;

        ipcRenderer.send(params.function, params);
        ipcRenderer.once('game-meta-data', (event, data) => {

            if (!data) {
                // Reject if data is null or undefined
                reject(`No data for ${params.gameFileName}`);
            } else {
                resolve(data);
            }
        });
    });
}

export async function displayMetaData(params, gameMetaData) {

    const activePage = document.querySelector('.page.active');
    let metaContainer = activePage.querySelector('.meta-container');

    if (!metaContainer) {
        metaContainer = document.createElement('div');
        metaContainer.classList.add('meta-container');
        params.paneText.appendChild(metaContainer);
    } else {
        metaContainer.innerHTML = '';
    }

    const oldDl = metaContainer.querySelector('dl.game-meta-data');
    if (oldDl) oldDl.remove();
    const oldNotFound = metaContainer.querySelector('.meta-not-found');
    if (oldNotFound) oldNotFound.remove();

    const metaNotFoundDiv = document.createElement('div');
    metaNotFoundDiv.classList.add('meta-not-found');

    metaNotFoundDiv.innerHTML = `<p>No meta data found for ${params.gameFileName}</p>`;

    metaContainer.style.display = 'block';

    if (!params.error) {
        const dl = createGameMetaDataDL(gameMetaData);
        metaContainer.prepend(dl);
        metaContainer.style.display = 'block';
    } else {
        if (params.function === 'fetch-meta') {
            metaContainer.appendChild(metaNotFoundDiv);
        } else {
            metaContainer.style.display = 'none';
        }
    }
}

function createGameMetaDataDL(metadata) {
    const dl = document.createElement('dl');
    dl.classList.add('game-meta-data');

    const footerSize = LB.preferences['settings']?.footerSize;
    if (footerSize === 'small') dl.style.height = '40.5vh';
    else if (footerSize === 'medium') dl.style.height = '80%';
    else if (footerSize === 'big') dl.style.height = '35vh';

    const addMeta = (title, value) => {
        // normalize and validate
        if (
            value == null ||
                (typeof value === 'string' && value.trim() === '') ||
                value === 'N/A' ||
                value === 'Unknown' ||
                value === 'undefined' ||
                value === 'null' ||
                value === '0000-12-31T00:00:00Z' ||
            /^--\d{2}-\d{2}$/.test(value)
        ) return;

        const dt = document.createElement('dt');
        dt.className = 'meta-key';
        dt.textContent = title;

        const dd = document.createElement('dd');
        dd.className = 'meta-value';
        dd.textContent = value;

        dl.append(dt, dd);
    };

    addMeta('Publisher', metadata.publisher);
    addMeta('Developers', metadata.developers);
    addMeta('Release Date', metadata.releaseDate);
    addMeta('Description', metadata.description);
    addMeta('Platforms', metadata.platforms);
    addMeta('Genre', metadata.genre);

    // hide the <dl> entirely if it ends up empty
    if (!dl.children.length) dl.style.display = 'none';

    return dl;
}

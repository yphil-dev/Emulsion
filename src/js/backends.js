import { fetchImages as steamgridFetch } from './backends/steamgrid.js';
import { fetchImages as wikipediaFetch } from './backends/wikipedia.js';
import { fetchImages as giantbombFetch } from './backends/giantbomb.js';
import { fetchImages as opdbFetch, fetchGameMetaData as opdbFetchGameMetaData } from './backends/opdb.js';
import { fetchGameMetaData as wikipediaFetchGameMetaData } from './backends/wikipedia-text.js';

export const getGameMetaData = async (params) => {
    if (params.platformKey?.startsWith('vpx')) {
        return await opdbFetchGameMetaData(params, params.opdbAPIKey);
    }

    return await wikipediaFetchGameMetaData(params.cleanName, params.platformDisplayName || params.platformName);
};

export const getAllCoverImageUrls = async (gameName, platform, platformName, options = {}) => {
    const { steamGridAPIKey, giantBombAPIKey, opdbAPIKey } = options;

    const backends = [];

    if (platform.startsWith("vpx")) {
        if (opdbAPIKey) {
            backends.push(() => opdbFetch(gameName, opdbAPIKey));
        }
        if (steamGridAPIKey) {
            backends.push(() => steamgridFetch(gameName, steamGridAPIKey));
        }
        if (giantBombAPIKey) {
            backends.push(() => giantbombFetch(gameName, giantBombAPIKey, platformName));
        }
        backends.push(() => wikipediaFetch(gameName, platformName));
    } else {
        if (steamGridAPIKey) {
            backends.push(() => steamgridFetch(gameName, steamGridAPIKey));
        }
        if (giantBombAPIKey) {
            backends.push(() => giantbombFetch(gameName, giantBombAPIKey, platformName));
        }
        backends.push(() => opdbFetch(gameName, opdbAPIKey));
        backends.push(() => wikipediaFetch(gameName, platformName));
    }

    const allResults = await Promise.allSettled(backends.map(fn => fn()));

    const allImages = allResults.flatMap(result =>
        result.status === 'fulfilled' ? result.value : []
    );

    return allImages.flat();
};

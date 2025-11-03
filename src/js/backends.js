import { fetchImages as steamgridFetch } from './backends/steamgrid.js';
import { fetchImages as wikipediaFetch } from './backends/wikipedia.js';
import { fetchImages as giantbombFetch } from './backends/giantbomb.js';
import { fetchGameMetaData } from './backends/wikipedia-text.js';

export const getGameMetaData = async (params) => {
    return await fetchGameMetaData(params.cleanName, params.platformName);
};

export const getAllCoverImageUrls = async (gameName, platform, options = {}) => {
    console.log("gameName: ", gameName, platform);
    const { steamGridAPIKey, giantBombAPIKey } = options;

    const backends = [];

    // SteamGrid API (requires API key)
    if (steamGridAPIKey) {
        backends.push(() => steamgridFetch(gameName, steamGridAPIKey));
    }

    // GiantBomb API (requires API key)
    if (giantBombAPIKey) {
        backends.push(() => giantbombFetch(gameName, giantBombAPIKey, platform));
    }

    // Wikipedia API (no key required, works for all platforms)
    backends.push(() => wikipediaFetch(gameName, platform));

    const allResults = await Promise.allSettled(backends.map(fn => fn()));

    console.log("allResults: ", allResults);

    const allImages = allResults.flatMap(result =>
        result.status === 'fulfilled' ? result.value : []
    );

    console.log("allImages.flat(): ", allImages.flat());

    return allImages.flat();
};

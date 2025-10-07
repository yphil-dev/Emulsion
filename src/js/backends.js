import { fetchImages as steamgridFetch } from './backends/steamgrid.js';
import { fetchImages as wikipediaFetch } from './backends/wikipedia.js';
import { fetchImages as giantbombFetch } from './backends/giantbomb.js';

export const getAllCoverImageUrls = async (gameName, platform, options = {}) => {
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
    backends.push(() => wikipediaFetch(gameName));

    const allResults = await Promise.allSettled(backends.map(fn => fn()));

    const allImages = allResults.flatMap(result =>
        result.status === 'fulfilled' ? result.value : []
    );

    return allImages.flat();
};

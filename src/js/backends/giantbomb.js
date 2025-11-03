// src/js/backends/giantbomb.js
import axios from 'axios';

export const fetchImages = async (gameName, apiKey) => {

    if (!apiKey) {
        console.warn("GiantBomb backend disabled: no API key provided.");
        return [];
    }

    try {
        const searchUrl = `https://www.giantbomb.com/api/search/?api_key=${apiKey}&format=json&query=${encodeURIComponent(gameName)}&resources=game`;
        const response = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'EmumE/1.0 (https://github.com/yphil-gh/EmumE)' }
        });

        if (response.status !== 200 || !response.data?.results?.length) {
            console.warn(`[GiantBomb] No results for: ${gameName}`);
            return [];
        }

        const imgSources = response.data.results
            .map(result => result.image?.super_url) // can use `icon_url`, `medium_url`, etc.
            .filter(url => !!url);

        if (!imgSources.length) {
            console.warn(`[GiantBomb] No images found for: ${gameName}`);
        }

        return imgSources.map(url => ({
            url,
            source: 'GiantBomb'
        }));

    } catch (err) {
        console.error(`[GiantBomb] Error: ${err.message}`);
        return [];
    }
};

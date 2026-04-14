export const fetchImages = async (gameName, apiKey) => {

    console.log("OPDB gameName, apiKey: ", gameName, apiKey);

    try {
        // Build headers - include API key if provided
        const headers = {};
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        // Search for games on OPDB
        const searchResponse = await fetch(`https://opdb.org/api/search?q=${encodeURIComponent(gameName)}`, { headers });
        
        if (!searchResponse.ok) {
            throw new Error(`OPDB search failed: ${searchResponse.status}`);
        }

        const games = await searchResponse.json();
        if (!games || !games.length) return [];

        const imageUrls = [];

        // Extract images directly from search results
        for (const game of games.slice(0, 5)) { // Limit to first 5 results
            if (game.images && Array.isArray(game.images)) {
                for (const image of game.images) {
                    // Get the large URL if available, otherwise medium, otherwise small
                    if (image.urls) {
                        const url = image.urls.large || image.urls.medium || image.urls.small;
                        if (url) {
                            imageUrls.push(url);
                        }
                    }
                }
            }
        }

        // Remove duplicates and return in standard format
        const uniqueUrls = [...new Set(imageUrls)];

        return uniqueUrls.map((url) => ({
            url,
            source: 'OPDB'
        }));

    } catch (err) {
        console.error('OPDB error:', err.message);
        return [];
    }
};

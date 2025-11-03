import SGDB from 'steamgriddb';

export const fetchImages = async (gameName, APIKey) => {

    const client = new SGDB({ key: APIKey });

    try {
        const games = await client.searchGame(gameName);
        if (!games.length) return [];

        const imageUrls = [];

        for (const game of games) {
            const gameId = game.steam_app_id || game.id;
            const images = await client.getGrids({ type: 'game', id: gameId });
            imageUrls.push(...images.map(img => img.url));
        }

        return imageUrls.map((url) => ({
            url,
            source: 'SteamGridDB'
        }));

    } catch (err) {
        console.error('SteamGridDB error:', err.message);
        return [];
    }
};

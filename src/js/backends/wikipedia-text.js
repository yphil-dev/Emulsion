// src/js/backends/wikipedia-text.js

export const fetchGameMetaData = async (gameName, platform = null) => {
    try {
        // Step 1: Find the right Wikipedia page
        const wikiSearchUrl = new URL('https://en.wikipedia.org/w/api.php');
        wikiSearchUrl.searchParams.set('action', 'query');
        wikiSearchUrl.searchParams.set('format', 'json');
        wikiSearchUrl.searchParams.set('origin', '*');
        wikiSearchUrl.searchParams.set('list', 'search');
        wikiSearchUrl.searchParams.set('srsearch', gameName);
        wikiSearchUrl.searchParams.set('srlimit', '20');

        const wikiSearchResp = await fetch(wikiSearchUrl.toString());
        const wikiSearchData = await wikiSearchResp.json();

        const candidates = wikiSearchData.query?.search || [];
        if (!candidates.length) {
            return null;
        }

        // IMPROVED scoring - prioritize exact matches and platform-specific versions
        const scoredCandidates = candidates.map(candidate => {
            let score = 0;
            const title = candidate.title.toLowerCase();
            const snippet = candidate.snippet.toLowerCase();
            const normalizedGameName = gameName.toLowerCase();

            // MAJOR bonus for exact title match
            if (title === normalizedGameName) score += 300;

            // High bonus for title starting with game name
            if (title.startsWith(normalizedGameName)) score += 200;

            // Bonus for containing the exact game name
            if (title.includes(normalizedGameName)) score += 100;

            // MAJOR bonus for platform-specific versions
            if (platform) {
                const platformNorm = platform.toLowerCase();
                if (title.includes(platformNorm)) score += 150;
                if (snippet.includes(platformNorm)) score += 80;

                // Extra bonus for NES platform indicators
                if (platformNorm === 'nes' && (title.includes('nes') || title.includes('nintendo entertainment system'))) {
                    score += 100;
                }
            }

            // Video game indicators
            if (title.includes('(video game)')) score += 80;
            if (snippet.includes('video game')) score += 60;
            if (title.includes('game')) score += 40;

            // MAJOR penalties for unwanted content
            if (title.includes('(disambiguation)')) score -= 500;
            if (title.includes('list of') || title.includes('lists of')) score -= 400;
            if (title.includes('(tv series)') || title.includes('(film)')) score -= 300;
            if (title.includes('characters') || title.includes('episodes')) score -= 200;

            // Penalty for numbered sequels when looking for original
            if (!gameName.match(/\d+/) && title.match(/\d+/)) {
                score -= 100;
            }

            return { candidate, score };
        }).sort((a, b) => b.score - a.score);

        // Debug: show top candidates
        console.log('🔍 Top candidates:');
        scoredCandidates.slice(0, 3).forEach(({ candidate, score }, i) => {
            console.log(`  ${i + 1}. ${score}: "${candidate.title}"`);
        });

        const mainGamePage = scoredCandidates[0].candidate;
        const dbpediaResource = mainGamePage.title.replace(/ /g, '_');

        // Step 2: Get the actual Wikipedia page content
        const wikiPageUrl = new URL('https://en.wikipedia.org/w/api.php');
        wikiPageUrl.searchParams.set('action', 'query');
        wikiPageUrl.searchParams.set('format', 'json');
        wikiPageUrl.searchParams.set('origin', '*');
        wikiPageUrl.searchParams.set('prop', 'extracts|pageprops');
        wikiPageUrl.searchParams.set('exintro', 'true');
        wikiPageUrl.searchParams.set('explaintext', 'true');
        wikiPageUrl.searchParams.set('titles', mainGamePage.title);

        const wikiPageResp = await fetch(wikiPageUrl.toString());
        const wikiPageData = await wikiPageResp.json();

        const pages = wikiPageData.query?.pages || {};
        const pageId = Object.keys(pages)[0];
        const pageData = pages[pageId];

        if (!pageData || pageData.missing) {
            return null;
        }

        // Step 3: Extract data from Wikipedia content
        const extract = pageData.extract || '';

        // Extract data using helper functions
        const platforms = extractPlatformsFromText(extract);
        const releaseDate = extractReleaseDate(extract);
        const genre = extractGenre(extract);
        const developers = extractDevelopers(extract);
        const publisher = extractPublisher(extract);

        // Return in the exact format required
        const finalResult = {
            title: mainGamePage.title,
            description: extract.split('\n')[0], // First paragraph as abstract
            genre: genre,
            developers: developers,
            publisher: publisher,
            releaseDate: releaseDate,
            platforms: platforms,
            wikipediaPage: mainGamePage.title,
            dbpediaUri: `http://dbpedia.org/resource/${dbpediaResource}`
        };

        return finalResult;

    } catch (err) {
        console.error('Error:', err.message);
        return null;
    }
};

// Helper functions to extract clean data (same as before)
function extractPlatformsFromText(text) {
    const platformKeywords = [
        'nintendo', 'playstation', 'xbox',
        'nes', 'snes', 'n64', 'gamecube', 'wii', 'game boy', 'ds', '3ds',
        'ps1', 'ps2', 'ps3', 'ps4', 'ps5', 'psp', 'vita',
        'xbox', 'xbox 360', 'xbox series',
        'arcade', 'commodore', 'amiga', 'atari', 'sega', 'genesis', 'dreamcast'
    ];

    const foundPlatforms = [];
    const lowerText = text.toLowerCase();

    platformKeywords.forEach(platform => {
        if (lowerText.includes(platform)) {
            // Clean up the platform name
            const cleanPlatform = platform.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            if (!foundPlatforms.includes(cleanPlatform)) {
                foundPlatforms.push(cleanPlatform);
            }
        }
    });

    return foundPlatforms.length > 0 ? foundPlatforms : null;
}

function extractReleaseDate(text) {
    // Look for years in the format (1990) or released in 1990
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : null;
}

function extractGenre(text) {
    const genreKeywords = [
        'platform', 'action', 'adventure', 'role-playing', 'rpg', 'strategy', 'simulation',
        'sports', 'racing', 'fighting', 'shooter', 'puzzle', 'horror', 'survival'
    ];

    const lowerText = text.toLowerCase();

    for (const genre of genreKeywords) {
        if (lowerText.includes(genre)) {
            return genre.charAt(0).toUpperCase() + genre.slice(1);
        }
    }

    return null;
}

function extractDevelopers(text) {
    // Common developer patterns - much cleaner extraction
    const developerPatterns = [
        /developed by ([^.,]+(?:\s+[^.,]+){0,2})/i,
        /developer[^.,]*?([^.,]+(?:\s+[^.,]+){0,2})/i,
        /by ([^.,]+(?:\s+[^.,]+){0,2}) for (?:windows|playstation|xbox|nintendo)/i
    ];

    for (const pattern of developerPatterns) {
        const match = text.match(pattern);
        if (match) {
            const developer = match[1].trim();
            // Clean up the developer name
            return [developer.split(' and ')[0].split(' for ')[0].trim()];
        }
    }

    return null;
}

function extractPublisher(text) {
    // Common publisher patterns - much cleaner extraction
    const publisherPatterns = [
        /published by ([^.,]+)/i,
        /publisher[^.,]*?([^.,]+)/i,
        /by ([^.,]+) and published/,
        /published by ([^.,]+) and/
    ];

    for (const pattern of publisherPatterns) {
        const match = text.match(pattern);
        if (match) {
            const publisher = match[1].trim();
            // Clean up the publisher name
            return publisher.split(' and ')[0].split(' for ')[0].trim();
        }
    }

    return null;
}

// Test function
const testGame = async (gameName, platform = null) => {
    console.log(`\n🎮 Testing: "${gameName}" ${platform ? `(${platform})` : ''}`);

    const result = await fetchGameMetaData(gameName, platform);
    if (result) {
        console.log('✅ SUCCESS');
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log('❌ FAILED');
    }
    console.log('---');
};

// (async () => {
//     await testGame('Duck Tales', 'nes');
//     await testGame('FlatOut 2', 'playstation');
//     await testGame('Ninja Gaiden', 'nes');
//     await testGame('Ninja Gaiden', 'arcade');
// })();

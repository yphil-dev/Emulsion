// src/js/backends/wikipedia-text.js

// src/js/backends/wikipedia-text.js

export const fetchGameMetaData = async (gameName, platform = null) => {
    console.log("gameName, platform: ", gameName);
    try {
        // Build Wikipedia search URL
        const wikiSearchUrl = new URL('https://en.wikipedia.org/w/api.php');
        wikiSearchUrl.searchParams.set('action', 'query');
        wikiSearchUrl.searchParams.set('format', 'json');
        wikiSearchUrl.searchParams.set('origin', '*');
        wikiSearchUrl.searchParams.set('list', 'search');

        // If platform provided, include it to bias search results
        // const srsearch = platform
        //     ? `"${gameName}" video game ${platform}`
        //     : `"${gameName}" video game`;

        const srsearch = `"${gameName}" video game`;

        wikiSearchUrl.searchParams.set('srsearch', srsearch);
        wikiSearchUrl.searchParams.set('srlimit', '10');

        const wikiSearchResp = await fetch(wikiSearchUrl.toString());
        const wikiSearchData = await wikiSearchResp.json();

        const candidates = wikiSearchData.query?.search || [];
        if (!candidates.length) {
            console.log('❌ No Wikipedia search results');
            return null;
        }

        // Normalizers
        const normalize = str => (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
        const stripHtml = s => (s || '').replace(/<[^>]+>/g, '');
        const query = normalize(gameName);
        const platformNorm = platform ? platform.toLowerCase() : null;

        // Score candidates based on multiple criteria
        const scoreCandidate = (candidate) => {
            let score = 0;
            const title = candidate.title.toLowerCase();
            const normalizedTitle = normalize(candidate.title);
            const snippet = stripHtml(candidate.snippet).toLowerCase();

            // High priority: exact title match
            if (normalizedTitle === query) {
                score += 100;
            }

            // High priority: title starts with query
            if (normalizedTitle.startsWith(query)) {
                score += 50;
            }

            // Medium priority: title contains query
            if (normalizedTitle.includes(query)) {
                score += 25;
            }

            // High priority: contains "video game" in title or snippet
            if (title.includes('video game') || snippet.includes('video game')) {
                score += 30;
            }

            // High priority: platform match in title (if platform provided)
            if (platformNorm && title.includes(platformNorm)) {
                score += 40;
            }

            // Medium priority: platform match in snippet (if platform provided)
            if (platformNorm && snippet.includes(platformNorm)) {
                score += 20;
            }

            // Penalty: list articles and non-game content
            if (title.includes('list of') || title.includes('lists of')) {
                score -= 100;
            }
            if (title.includes('(film)') || title.includes('(movie)')) {
                score -= 50;
            }

            // Penalty: terms that suggest non-game content
            const nonGameTerms = ['film', 'movie', 'collection', 'lcd', 'watch', 'tv', 'television'];
            if (nonGameTerms.some(term => title.includes(term))) {
                score -= 30;
            }

            return score;
        };

        // Score all candidates and sort by score
        const scoredCandidates = candidates.map(candidate => ({
            candidate,
            score: scoreCandidate(candidate)
        })).sort((a, b) => b.score - a.score);

        // console.log('🔍 Candidate scores:');
        // scoredCandidates.forEach(({ candidate, score }) => {
        //     console.log(`  ${score}: "${candidate.title}"`);
        // });

        // Pick the highest scoring candidate that has a positive score
        const bestCandidate = scoredCandidates[0];
        let mainGamePage = bestCandidate && bestCandidate.score > 0
            ? bestCandidate.candidate
            : null;

        // Extra filter: reject if the title doesn't include the game name at all
        if (mainGamePage) {
            const titleNorm = normalize(mainGamePage.title);
            if (!titleNorm.includes(query)) {
                console.log(`🚫 Rejected candidate "${mainGamePage.title}" — title doesn't contain game name "${gameName}"`);
                mainGamePage = null;
            }
        }

        if (!mainGamePage) {
            console.log('❌ No valid Wikipedia match after filtering.');
            return null;
        }

        // console.log(`🎯 Main Wikipedia page: "${mainGamePage.title}" (score: ${bestCandidate.score})`);

        // ... rest of the function remains the same ...
        // Convert Wikipedia title to DBpedia resource name
        const dbpediaResource = mainGamePage.title.replace(/ /g, '_');

        const sparqlQuery = `
            PREFIX dbo: <http://dbpedia.org/ontology/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX dbp: <http://dbpedia.org/property/>
            PREFIX dct: <http://purl.org/dc/terms/>

            SELECT ?label ?abstract ?genre ?publisher ?platform
                   (GROUP_CONCAT(DISTINCT ?dev; SEPARATOR=", ") AS ?developers)
                   (MIN(?relDate) AS ?firstReleaseDate)
            WHERE {
                <http://dbpedia.org/resource/${dbpediaResource}> rdfs:label ?label ;
                     dbo:abstract ?abstract .
                FILTER(LANG(?label) = "en")
                FILTER(LANG(?abstract) = "en")

                OPTIONAL {
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbo:genre ?genre }
                    UNION
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbp:genre ?genre }
                }

                OPTIONAL {
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbo:developer ?dev }
                    UNION
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbp:developer ?dev }
                }

                OPTIONAL {
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbo:publisher ?publisher }
                    UNION
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbp:publisher ?publisher }
                }

                OPTIONAL {
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbo:releaseDate ?relDate }
                    UNION
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbp:released ?relDate }
                    UNION
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbp:releaseDate ?relDate }
                    UNION
                    { <http://dbpedia.org/resource/${dbpediaResource}> dct:issued ?relDate }
                }

                OPTIONAL {
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbo:computingPlatform ?platform }
                    UNION
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbp:platforms ?platform }
                    UNION
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbo:platform ?platform }
                }
            }
            GROUP BY ?label ?abstract ?genre ?publisher ?platform
        `;

        const url = `http://dbpedia.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.results.bindings.length) {
            console.log('❌ No DBpedia data found for this resource');
            return null;
        }

        // ... rest of data processing remains the same ...
        // Aggregate all bindings
        const results = data.results.bindings;
        const base = results[0];

        // Extract platforms array (unique)
        const extractPlatform = (item) =>
            item.platform?.value
                ? item.platform.value.split('/').pop().replace(/_/g, ' ')
                : null;
        const platforms = [...new Set(results.map(extractPlatform).filter(Boolean))];

        // Helpers
        const cleanValue = (value) => {
            if (!value) return null;
            if (typeof value === 'string' && value.startsWith('http://dbpedia.org/resource/')) {
                return value.split('/').pop().replace(/_/g, ' ');
            }
            return value;
        };
        const parseArray = (value) => {
            if (!value) return null;
            return value.split(', ').map(item => cleanValue(item.trim())).filter(item => item);
        };

        // Fallback: Extract year from description if no release date found
        let releaseDate = base.firstReleaseDate?.value;
        if (!releaseDate && base.abstract?.value) {
            const yearMatch = base.abstract.value.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) releaseDate = yearMatch[0];
        }

        const finalResult = {
            title: base.label?.value,
            description: base.abstract?.value,
            genre: cleanValue(base.genre?.value),
            developers: parseArray(base.developers?.value),
            publisher: cleanValue(base.publisher?.value),
            releaseDate,
            platforms,
            wikipediaPage: mainGamePage.title,
            dbpediaUri: `http://dbpedia.org/resource/${dbpediaResource}`
        };

        return finalResult;

    } catch (err) {
        console.error(`❌ [DBpedia] Error: ${err.message}`);
        return null;
    }
};


// --- Test Runner ---
const testGame = async (gameName, platform = null) => {
    console.log(`\n🎮 === Testing: "${gameName}" ${platform ? `(platform: ${platform})` : ''} ===`);
    console.log('='.repeat(60));

    const startTime = Date.now();
    const result = await fetchGameMetaData(gameName, platform);
    const endTime = Date.now();

    console.log(`\n⏱️ Request took: ${endTime - startTime}ms`);
    console.log('📊 FINAL STRUCTURED DATA:');
    console.log(JSON.stringify(result, null, 2));
    console.log('='.repeat(60));

    return result;
};

(async () => {
    // await testGame('nitro');
    // await testGame('nitro', 'amiga');

    await testGame('Flat Out Ultimate Carnage');

    // await testGame('Super Spike V ball');
    // await testGame('outrun 2006', 'sony playstation');
    // await testGame('Army Men - World War', 'playstation');
    // await testGame('banshee');

    console.log('\n✅ === All tests completed ===');
})();

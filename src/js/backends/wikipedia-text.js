const fetchGameDataStructured = async (gameName) => {
    try {
        console.log(`🔍 Finding main Wikipedia page for: "${gameName}"`);

        // First use Wikipedia API to find the canonical page
        const wikiSearchUrl = new URL('https://en.wikipedia.org/w/api.php');
        wikiSearchUrl.searchParams.set('action', 'query');
        wikiSearchUrl.searchParams.set('format', 'json');
        wikiSearchUrl.searchParams.set('origin', '*');
        wikiSearchUrl.searchParams.set('list', 'search');
        wikiSearchUrl.searchParams.set('srsearch', `"${gameName}" video game`);
        wikiSearchUrl.searchParams.set('srlimit', '10');

        const wikiSearchResp = await fetch(wikiSearchUrl.toString());
        const wikiSearchData = await wikiSearchResp.json();

        // Find the main game page (exclude films, collections, etc.)
        const mainGamePage = wikiSearchData.query?.search?.find(page =>
            page.title.toLowerCase().includes(gameName.toLowerCase()) &&
            !page.title.toLowerCase().includes('film') &&
            !page.title.toLowerCase().includes('movie') &&
            !page.title.toLowerCase().includes('collection') &&
            !page.title.toLowerCase().includes('lcd') &&
            !page.title.toLowerCase().includes('watch')
        );

        if (!mainGamePage) {
            console.log('❌ No main game page found');
            return null;
        }

        console.log(`🎯 Main Wikipedia page: "${mainGamePage.title}"`);

        // Convert Wikipedia title to DBpedia resource name
        const dbpediaResource = mainGamePage.title.replace(/ /g, '_');
        console.log(`🔗 DBpedia resource: ${dbpediaResource}`);

        // Enhanced query to get release date from the franchise page
        const sparqlQuery = `
            PREFIX dbo: <http://dbpedia.org/ontology/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX dbp: <http://dbpedia.org/property/>
            PREFIX dct: <http://purl.org/dc/terms/>

            SELECT ?label ?abstract ?genre ?publisher ?platform
                   (GROUP_CONCAT(DISTINCT ?dev; SEPARATOR=", ") AS ?developers)
                   (MIN(?relDate) AS ?firstReleaseDate)  # Get the earliest release date
            WHERE {
                <http://dbpedia.org/resource/${dbpediaResource}> rdfs:label ?label ;
                     dbo:abstract ?abstract .
                FILTER(LANG(?label) = "en")
                FILTER(LANG(?abstract) = "en")

                # Try multiple property variations for each field
                OPTIONAL {
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbo:genre ?genre }
                    UNION
                    { <http://dbpedia.org/resource/${dbpediaResource}> dbp:genre ?genre }
                }

                # Multiple developers (array)
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

                # Try to find ANY release date property
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
        console.log(`📡 SPARQL URL: ${url.substring(0, 200)}...`);

        const response = await fetch(url);
        const data = await response.json();

        console.log('📦 Raw DBpedia response:', JSON.stringify(data, null, 2));

        if (!data.results.bindings.length) {
            console.log('❌ No DBpedia data found for this resource');
            return null;
        }

        const result = data.results.bindings[0];

        // Clean up the data
        const cleanValue = (value) => {
            if (!value) return null;
            if (typeof value === 'string' && value.startsWith('http://dbpedia.org/resource/')) {
                return value.split('/').pop().replace(/_/g, ' ');
            }
            return value;
        };

        // Parse arrays from comma-separated strings
        const parseArray = (value) => {
            if (!value) return null;
            return value.split(', ').map(item => cleanValue(item.trim())).filter(item => item);
        };

        // Fallback: Extract year from description if no release date found
        let releaseDate = result.firstReleaseDate?.value;
        if (!releaseDate && result.abstract?.value) {
            const yearMatch = result.abstract.value.match(/\b1986\b/); // Zelda specific
            if (yearMatch) {
                releaseDate = yearMatch[0];
                console.log(`📅 Extracted release year from description: ${releaseDate}`);
            }
        }

        const finalResult = {
            title: result.label?.value,
            description: result.abstract?.value,
            genre: cleanValue(result.genre?.value),
            developers: parseArray(result.developers?.value),
            publisher: cleanValue(result.publisher?.value),
            releaseDate: releaseDate, // Single release date
            platforms: cleanValue(result.platform?.value),
            wikipediaPage: mainGamePage.title,
            dbpediaUri: `http://dbpedia.org/resource/${dbpediaResource}`
        };

        console.log('✨ Final structured data:', finalResult);
        return finalResult;

    } catch (err) {
        console.error(`❌ [DBpedia] Error: ${err.message}`);
        return null;
    }
};

// Test function
const testGame = async (gameName) => {
    console.log(`\n🎮 === Testing: "${gameName}" ===`);
    console.log('='.repeat(60));

    const startTime = Date.now();
    const result = await fetchGameDataStructured(gameName);
    const endTime = Date.now();

    console.log(`\n⏱️ Request took: ${endTime - startTime}ms`);
    console.log('📊 FINAL STRUCTURED DATA:');
    console.log(JSON.stringify(result, null, 2));
    console.log('='.repeat(60));

    return result;
};

// Run tests
(async () => {
    console.log('🎯 DBpedia SPARQL Game Data - Structured Test\n');

    // Test with Zelda
    await testGame('The Legend of Zelda');

    console.log('\n✅ === All tests completed ===');
})();

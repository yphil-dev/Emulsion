const fetchGameDataStructured = async (gameName) => {
    try {

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

        // console.log(`🎯 Main Wikipedia page: "${mainGamePage.title}"`);

        // Convert Wikipedia title to DBpedia resource name
        const dbpediaResource = mainGamePage.title.replace(/ /g, '_');
        // console.log(`🔗 DBpedia resource: ${dbpediaResource}`);

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
        // console.log(`📡 SPARQL URL: ${url.substring(0, 200)}...`);

        const response = await fetch(url);
        const data = await response.json();

        // console.log('📦 Raw DBpedia response:', JSON.stringify(data, null, 2));

        if (!data.results.bindings.length) {
            console.log('❌ No DBpedia data found for this resource');
            return null;
        }
if (!data.results.bindings.length) {
    console.log('❌ No DBpedia data found for this resource');
    return null;
}

// --- Aggregate all bindings ---
const results = data.results.bindings;

// All rows share label/abstract, so take those from the first
const base = results[0];

// Helper to extract clean platform names
const extractPlatform = (item) =>
    item.platform?.value
        ? item.platform.value.split('/').pop().replace(/_/g, ' ')
        : null;

const platforms = [...new Set(results.map(extractPlatform).filter(Boolean))]; // unique array

// Clean up the data
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
    // Test with Zelda
    await testGame('Zeewolf');

    console.log('\n✅ === All tests completed ===');
})();

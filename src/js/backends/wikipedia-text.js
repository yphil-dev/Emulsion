// src/js/backends/wikipedia-text.js

import fetch from 'node-fetch';

export const fetchWikipediaData = async (gameName, platform = null) => {
  try {
    console.log(`\n🎮 Searching: "${gameName}"${platform ? ` (platform: ${platform})` : ''}`);
    console.log('='.repeat(60));

    const wikiSearchUrl = new URL('https://en.wikipedia.org/w/api.php');
    wikiSearchUrl.searchParams.set('action', 'query');
    wikiSearchUrl.searchParams.set('format', 'json');
    wikiSearchUrl.searchParams.set('origin', '*');
    wikiSearchUrl.searchParams.set('list', 'search');
    wikiSearchUrl.searchParams.set('srsearch', `"${gameName}" video game${platform ? ' ' + platform : ''}`);
    wikiSearchUrl.searchParams.set('srlimit', '10');

    const resp = await fetch(wikiSearchUrl.toString());
    const data = await resp.json();
    let candidates = data.query?.search || [];

    if (!candidates.length) {
      console.log('❌ No Wikipedia search results');
      return null;
    }

    const normalize = str => (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const stripHtml = s => (s || '').replace(/<[^>]+>/g, '');
    const query = normalize(gameName);
    const platformNorm = platform ? platform.toLowerCase() : null;

    // --- 1️⃣ Filter candidates by platform if provided ---
    if (platform) {
      const filtered = candidates.filter(c =>
        stripHtml(c.snippet).toLowerCase().includes(platformNorm) ||
        c.title.toLowerCase().includes(platformNorm)
      );
      if (filtered.length) candidates = filtered;
    }

    // --- 2️⃣ Pick main page ---
    let mainPage =
      candidates.find(p => normalize(p.title) === query) ||
      candidates.find(p => normalize(p.title).startsWith(query)) ||
      candidates.find(p => normalize(p.title).includes(query) && !/film|movie|collection|lcd|watch/.test(p.title.toLowerCase())) ||
      candidates[0];

    if (!mainPage) {
      console.log('❌ No main game page found');
      return null;
    }

    console.log(`🎯 Wikipedia page selected: ${mainPage.title}`);

    // --- 3️⃣ Check if it's a disambiguation page ---
    const isDisambig = /disambiguation/i.test(stripHtml(mainPage.snippet));
    let dbpediaResource = mainPage.title.replace(/ /g, '_');

    if (isDisambig && platform) {
      // Fetch links from disambiguation page to select the correct platform
      const linksUrl = new URL('https://en.wikipedia.org/w/api.php');
      linksUrl.searchParams.set('action', 'query');
      linksUrl.searchParams.set('prop', 'links');
      linksUrl.searchParams.set('titles', mainPage.title);
      linksUrl.searchParams.set('format', 'json');
      linksUrl.searchParams.set('pllimit', 'max');

      const linksResp = await fetch(linksUrl.toString());
      const linksData = await linksResp.json();
      const pages = Object.values(linksData.query.pages);
      const links = pages[0]?.links || [];

      // Pick link that includes platform or game name
      const candidateLink = links.find(l =>
        normalize(l.title).includes(query) &&
        l.title.toLowerCase().includes(platformNorm)
      );

      if (candidateLink) {
        mainPage.title = candidateLink.title;
        dbpediaResource = mainPage.title.replace(/ /g, '_');
        console.log(`🔗 Updated page via disambig link: ${mainPage.title}`);
      }
    }

    // --- 4️⃣ Fetch DBpedia data ---
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

          OPTIONAL { { <http://dbpedia.org/resource/${dbpediaResource}> dbo:genre ?genre } UNION { <http://dbpedia.org/resource/${dbpediaResource}> dbp:genre ?genre } }
          OPTIONAL { { <http://dbpedia.org/resource/${dbpediaResource}> dbo:developer ?dev } UNION { <http://dbpedia.org/resource/${dbpediaResource}> dbp:developer ?dev } }
          OPTIONAL { { <http://dbpedia.org/resource/${dbpediaResource}> dbo:publisher ?publisher } UNION { <http://dbpedia.org/resource/${dbpediaResource}> dbp:publisher ?publisher } }
          OPTIONAL { { <http://dbpedia.org/resource/${dbpediaResource}> dbo:releaseDate ?relDate } UNION { <http://dbpedia.org/resource/${dbpediaResource}> dbp:released ?relDate } UNION { <http://dbpedia.org/resource/${dbpediaResource}> dbp:releaseDate ?relDate } UNION { <http://dbpedia.org/resource/${dbpediaResource}> dct:issued ?relDate } }
          OPTIONAL { { <http://dbpedia.org/resource/${dbpediaResource}> dbo:computingPlatform ?platform } UNION { <http://dbpedia.org/resource/${dbpediaResource}> dbp:platforms ?platform } UNION { <http://dbpedia.org/resource/${dbpediaResource}> dbo:platform ?platform } }
      }
      GROUP BY ?label ?abstract ?genre ?publisher ?platform
    `;
    const dbUrl = `http://dbpedia.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
    const dbResp = await fetch(dbUrl);
    const dbData = await dbResp.json();

    if (!dbData.results.bindings.length) {
      console.log('⚠️  No DBpedia data, trying Wikidata fallback…');
      return {
        title: mainPage.title,
        description: stripHtml(mainPage.snippet),
        developer: null,
        publisher: null,
        genre: null,
        platform: platform || null,
        releaseDate: null,
        wikipediaPage: mainPage.title,
        wikidataUri: `https://www.wikidata.org/wiki/${mainPage.title.replace(/ /g, '_')}`,
      };
    }

    const results = dbData.results.bindings;
    const base = results[0];

    const extractPlatform = item =>
      item.platform?.value
        ? item.platform.value.split('/').pop().replace(/_/g, ' ')
        : null;
    const platforms = [...new Set(results.map(extractPlatform).filter(Boolean))];

    const cleanValue = val => {
      if (!val) return null;
      if (typeof val === 'string' && val.startsWith('http://dbpedia.org/resource/')) {
        return val.split('/').pop().replace(/_/g, ' ');
      }
      return val;
    };
    const parseArray = val =>
      val ? val.split(', ').map(i => cleanValue(i.trim())).filter(Boolean) : null;

    let releaseDate = base.firstReleaseDate?.value;
    if (!releaseDate && base.abstract?.value) {
      const m = base.abstract.value.match(/\b(19|20)\d{2}\b/);
      if (m) releaseDate = m[0];
    }

    const finalResult = {
      title: base.label?.value,
      description: base.abstract?.value,
      genre: cleanValue(base.genre?.value),
      developers: parseArray(base.developers?.value),
      publisher: cleanValue(base.publisher?.value),
      releaseDate,
      platforms,
      wikipediaPage: mainPage.title,
      dbpediaUri: `http://dbpedia.org/resource/${dbpediaResource}`,
    };

    console.log('✅ DBpedia data found.');
    return finalResult;

  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    return null;
  }
};

// --- Test runner ---
if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = [
    // ["Stardust", "Amiga"],
    // ["Super Stardust", "Amiga"],
    // ["Nitro", "Amiga"],
      ["OutRun", "playstation"],
  ];

  (async () => {
    for (const [name, platform] of tests) {
      const res = await fetchWikipediaData(name, platform);
      console.log(JSON.stringify(res, null, 2));
    }
    console.log('\n✅ All tests done.');
  })();
}

export const fetchImages = async (gameName) => {
    const API = "https://en.wikipedia.org/w/api.php";
    const results = [];
    const triedTitles = new Set();

    const tryTitle = async (title) => {
        if (triedTitles.has(title.toLowerCase())) return;
        triedTitles.add(title.toLowerCase());

        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

        const url = new URL(API);
        url.searchParams.set("action", "query");
        url.searchParams.set("format", "json");
        url.searchParams.set("origin", "*");
        url.searchParams.set("titles", title);
        url.searchParams.set("prop", "images|pageimages|categories");
        url.searchParams.set("imlimit", "max");
        url.searchParams.set("piprop", "original");

        const resp = await fetch(url.toString());
        if (!resp.ok) return;

        const data = await resp.json();
        const pages = Object.values(data.query.pages || {});

        for (const page of pages) {
            if (page.missing) continue;
            const cats = (page.categories || []).map((c) => c.title.toLowerCase());
            if (cats.some((c) => c.includes("disambiguation"))) return;

            // Infobox / main page image
            if (page.original?.source && !page.original.source.endsWith(".svg")) {
                results.push({
                    url: page.original.source,
                    source: "wikipedia",
                    type: "image",
                    pageUrl,
                });
            }

            // Page images
            if (page.images) {
                for (const img of page.images) {
                    const imgTitle = img.title || "";
                    if (!/logo|ambox|seal/i.test(imgTitle)) {
                        const infoUrl = new URL(API);
                        infoUrl.searchParams.set("action", "query");
                        infoUrl.searchParams.set("format", "json");
                        infoUrl.searchParams.set("origin", "*");
                        infoUrl.searchParams.set("titles", img.title);
                        infoUrl.searchParams.set("prop", "imageinfo");
                        infoUrl.searchParams.set("iiprop", "url");

                        const infoResp = await fetch(infoUrl.toString());
                        if (!infoResp.ok) continue;
                        const infoData = await infoResp.json();
                        const p = Object.values(infoData.query.pages || {})[0];
                        const url = p?.imageinfo?.[0]?.url;

                        if (url && !url.endsWith(".svg")) {
                            results.push({
                                url,
                                source: "wikipedia",
                                type: "image",
                                pageUrl,
                            });
                        }
                    }
                }
            }
        }
    };

    const variants = [
        `${gameName} (video game)`,
        `${gameName} (Amiga video game)`,
        `${gameName} (Amiga)`,
        gameName,
    ];

    for (const v of variants) {
        await tryTitle(v);
        if (results.length) break;
    }

    // Fallback search if nothing found
    if (!results.length) {
        const searchUrl = new URL(API);
        searchUrl.searchParams.set("action", "query");
        searchUrl.searchParams.set("format", "json");
        searchUrl.searchParams.set("origin", "*");
        searchUrl.searchParams.set("list", "search");
        searchUrl.searchParams.set("srsearch", `${gameName} video game`);
        searchUrl.searchParams.set("srlimit", "8");

        const searchResp = await fetch(searchUrl.toString());
        if (!searchResp.ok) return results;
        const searchData = await searchResp.json();

        const pageTitles = (searchData.query?.search || []).map((p) => p.title);
        for (const t of pageTitles) {
            await tryTitle(t);
        }
    }

    // Deduplicate and remove svg again just in case
    const uniqueResults = [];
    const seen = new Set();
    for (const r of results) {
        if (!seen.has(r.url) && !r.url.endsWith(".svg")) {
            seen.add(r.url);
            uniqueResults.push(r);
        }
    }

    return uniqueResults;
};


// --- Test Runner ---
const testGame = async (gameName) => {
  console.log(`\n🎮 === Testing: "${gameName}" ===`);
  console.log("=".repeat(60));

  const start = Date.now();
  const images = await fetchImages(gameName);
  const end = Date.now();

  console.log(`\n⏱️ Request took: ${end - start}ms`);
  console.log("📊 Images found:");
  console.log(JSON.stringify(images, null, 2));
  console.log("=".repeat(60));

  return images;
};

// (async () => {
//   // await testGame("Flat Out Ultimate Carnage");
//   await testGame("Outrun");
//   // await testGame("Banshee (Amiga video game)");
//   // await testGame("Kirby Air Ride");
// })();

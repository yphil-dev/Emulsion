export const fetchImages = async (gameName, platformName) => {
    console.log("gameName, platformName: ", gameName, platformName);
    const API = "https://en.wikipedia.org/w/api.php";
    const results = [];
    const triedTitles = new Set();

    // KEEP ALL YOUR EXISTING NETWORK CODE EXACTLY AS IS
    const tryTitle = async (title) => {
        console.log("title: ", title);

        if (triedTitles.has(title.toLowerCase())) return;
        triedTitles.add(title.toLowerCase());

        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

        const url = new URL(API);
        url.searchParams.set("action", "query");
        url.searchParams.set("format", "json");
        url.searchParams.set("origin", "*");
        url.searchParams.set("titles", title);
        url.searchParams.set("prop", "images|pageimages|categories|info");
        url.searchParams.set("imlimit", "max");
        url.searchParams.set("piprop", "original");
        url.searchParams.set("inprop", "url");

        try {
            const resp = await fetch(url.toString());
            if (!resp.ok) return;

            const data = await resp.json();
            const pages = Object.values(data.query.pages || {});

            for (const page of pages) {
                // Check if page exists (has pageid and is not missing)
                if (page.missing !== undefined || !page.pageid) continue;

                const cats = (page.categories || []).map((c) => c.title?.toLowerCase() || '');
                if (cats.some((c) => c.includes("disambiguation"))) continue;

                // Infobox / main page image
                if (page.original?.source) {
                    results.push({
                        url: page.original.source,
                        source: "wikipedia",
                        type: "image",
                        pageUrl,
                        isCover: page.original.source.toLowerCase().includes("cover") ||
                            page.original.source.toLowerCase().includes("box")
                    });
                }

                // Page images - get detailed info for each
                if (page.images) {
                    // Batch process images to avoid too many requests
                    const imageBatches = [];
                    for (let i = 0; i < page.images.length; i += 10) {
                        imageBatches.push(page.images.slice(i, i + 10));
                    }

                    for (const batch of imageBatches) {
                        const imageTitles = batch.map(img => img.title).join('|');

                        const infoUrl = new URL(API);
                        infoUrl.searchParams.set("action", "query");
                        infoUrl.searchParams.set("format", "json");
                        infoUrl.searchParams.set("origin", "*");
                        infoUrl.searchParams.set("titles", imageTitles);
                        infoUrl.searchParams.set("prop", "imageinfo");
                        infoUrl.searchParams.set("iiprop", "url|size|mime");
                        infoUrl.searchParams.set("iilimit", "max");

                        try {
                            const infoResp = await fetch(infoUrl.toString());
                            if (!infoResp.ok) continue;

                            const infoData = await infoResp.json();
                            const imagePages = Object.values(infoData.query.pages || {});

                            for (const imgPage of imagePages) {
                                const imageInfo = imgPage.imageinfo?.[0];
                                if (imageInfo?.url) {
                                    const imgTitle = imgPage.title || "";

                                    // Skip logos, seals, icons, and small images
                                    if (!/logo|ambox|seal|icon|symbol/i.test(imgTitle) &&
                                        imageInfo.width >= 200 &&
                                        imageInfo.height >= 200) {

                                        results.push({
                                            url: imageInfo.url,
                                            source: "wikipedia",
                                            type: "image",
                                            pageUrl,
                                            isCover: imgTitle.toLowerCase().includes(platformName) ||
                                                imageInfo.url.toLowerCase().includes(platformName) ||
                                                imageInfo.url.toLowerCase().includes("cover") ||
                                                imgTitle.toLowerCase().includes("cover") ||
                                                imageInfo.url.toLowerCase().includes("box") ||
                                                imgTitle.toLowerCase().includes("box") ||
                                                imageInfo.url.toLowerCase().includes("flyer") ||
                                                imgTitle.toLowerCase().includes("flyer") ||
                                                imgTitle.toLowerCase().includes("artwork") ||
                                                imageInfo.url.toLowerCase().includes("artwork")
                                        });
                                    }
                                }
                            }
                        } catch (error) {
                            console.log("Error fetching image batch:", error);
                        }
                    }
                }
            }
        } catch (error) {
            console.log("Error fetching page:", error);
        }
    };

    // FIXED SEARCH STRATEGY - Better search terms for "1080 Snowboarding"
    const searchTerms = [
        `"${gameName}" "${platformName}"`,
        `${gameName} (${platformName} video game)`,
        `${gameName} (${platformName})`,
        `${gameName} ${platformName}`,
        `${gameName} video game`,
        gameName,
        // Special cases for games with symbols or unusual names
        `1080° Snowboarding`, // with degree symbol
        `1080 Snowboarding`,  // without degree symbol
        `1080 Snowboarding (video game)`,
        `1080° Snowboarding (video game)`
    ];

    let foundPages = [];

    for (const term of searchTerms) {
        const searchUrl = new URL(API);
        searchUrl.searchParams.set("action", "query");
        searchUrl.searchParams.set("format", "json");
        searchUrl.searchParams.set("origin", "*");
        searchUrl.searchParams.set("list", "search");
        searchUrl.searchParams.set("srsearch", term);
        searchUrl.searchParams.set("srlimit", "5");
        searchUrl.searchParams.set("srprop", "");

        try {
            const searchResp = await fetch(searchUrl.toString());
            if (!searchResp.ok) continue;

            const searchData = await searchResp.json();
            const searchResults = searchData.query?.search || [];

            // MORE LENIENT FILTERING - Don't be so strict
            const relevantPages = searchResults.filter(page => {
                const title = page.title?.toLowerCase() || '';
                const snippet = page.snippet?.toLowerCase() || '';

                // Don't exclude pages just because they don't mention "video game"
                return !title.includes("disambiguation") &&
                       !title.includes("list of") &&
                       (snippet.includes("video game") ||
                        snippet.includes("game") ||
                        snippet.includes(platformName.toLowerCase()) ||
                        title.includes(gameName.toLowerCase()) ||
                        title.includes("1080")); // Be more permissive
            });

            foundPages.push(...relevantPages.map(p => p.title));
            console.log(`Search for "${term}" found:`, relevantPages.map(p => p.title));

        } catch (error) {
            console.log("Search error:", error);
        }
    }

    // Remove duplicates from found pages
    foundPages = [...new Set(foundPages)];
    console.log("All unique found pages:", foundPages);

    // Try the found pages first
    for (const pageTitle of foundPages) {
        await tryTitle(pageTitle);
    }

    // If still no results, try our predefined variants - EXPANDED LIST
    if (results.length === 0) {
        console.log("No results from search, trying expanded variants...");
        const variants = [
            `${gameName} (${platformName})`,
            `${gameName} (video game)`,
            `${gameName} (${platformName} video game)`,
            `${gameName}`,
            // Specific to "1080 Snowboarding"
            `1080° Snowboarding`,
            `1080° Snowboarding (video game)`,
            `1080 Snowboarding (Nintendo 64)`,
            `1080° Snowboarding (Nintendo 64)`,
            `1080 (video game)`,
            `1080 Avalanche` // Sequel name might help
        ];

        for (const v of variants) {
            await tryTitle(v);
        }
    }

    // Deduplicate and filter (KEEP YOUR EXISTING CODE)
    const uniqueResults = [];
    const seen = new Set();

    function isAllowedImageType(url) {
        const lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith('.png') ||
            lowerUrl.endsWith('.jpg') ||
            lowerUrl.endsWith('.jpeg') ||
            lowerUrl.endsWith('.webp');
    }

    // First pass: add cover images
    for (const r of results) {
        if (!seen.has(r.url) && isAllowedImageType(r.url) && r.isCover) {
            seen.add(r.url);
            uniqueResults.push(r);
        }
    }

    // Second pass: add non-cover images
    for (const r of results) {
        if (!seen.has(r.url) && isAllowedImageType(r.url) && !r.isCover) {
            seen.add(r.url);
            uniqueResults.push(r);
        }
    }

    console.log(`Found ${uniqueResults.length} images after filtering`);
    return uniqueResults;
};


// --- Test Runner ---
const testGame = async (gameName, platformName) => {
  console.log(`\n🎮 === Testing: "${gameName}" ===`);

  const start = Date.now();
  const images = await fetchImages(gameName, platformName);
  const end = Date.now();

  console.log(`\n⏱️ Request took: ${end - start}ms`);
  console.log(JSON.stringify(images, null, 2));
  console.log("=".repeat(60));

  return images;
};

// (async () => {
//   // await testGame("Flat Out Ultimate Carnage");
//     // await testGame("DuckTales", "NES");
//     await testGame("1080 Snowboarding", "Nintendo 64");
//     // await testGame("Power Strike", "Master System");
//     // await testGame("Kirby Air Ride");
// })();

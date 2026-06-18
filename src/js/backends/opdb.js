function buildOpdbUrl(path, params = {}) {
    const url = new URL(`https://opdb.org/api${path}`);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
        }
    });

    return url.toString();
}

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`OPDB request failed: ${response.status}`);
    }

    return await response.json();
}

function normalizeText(value) {
    return String(value || '')
        .replace(/\.[^.]+$/, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function uniqueNonEmpty(values) {
    return [...new Set(values.filter(Boolean))];
}

function getNameLike(value) {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);

    return String(
        value.name ||
        value.title ||
        value.label ||
        value.display_name ||
        value.value ||
        ''
    ).trim();
}

function getNames(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
        return uniqueNonEmpty(value.map(getNameLike));
    }

    const single = getNameLike(value);
    return single ? [single] : [];
}

function deriveSearchTerms(gameName, gameFileName) {
    const rawFileName = normalizeText(gameFileName);
    const baseFileName = rawFileName.replace(/\.[^.]+$/, '');
    const beforeParen = baseFileName.split('(')[0].trim();
    const beforeUnderscore = baseFileName.split('_')[0].trim();
    const noParens = baseFileName.replace(/\s*[\(\[].*?[\)\]]/g, ' ').replace(/\s+/g, ' ').trim();
    const strippedSuffixes = noParens
        .replace(/\b(?:mod|fs|vr|desktop|cabinet|night|day|b2s)\b.*$/i, '')
        .replace(/\bv?\d+(?:\.\d+)*\b.*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    return uniqueNonEmpty([
        normalizeText(gameName),
        beforeParen,
        beforeUnderscore,
        noParens,
        strippedSuffixes
    ]);
}

function scoreTypeaheadResult(result, searchTerm) {
    const term = normalizeText(searchTerm).toLowerCase();
    const name = normalizeText(result?.name || result?.text).toLowerCase();
    const text = normalizeText(result?.text).toLowerCase();

    let score = 0;

    if (name === term) score += 300;
    if (text === term) score += 250;
    if (name.startsWith(term)) score += 150;
    if (text.startsWith(term)) score += 100;
    if (name.includes(term)) score += 75;
    if (text.includes(term)) score += 50;

    return score;
}

async function findBestOpdbId(gameName, gameFileName) {
    const searchTerms = deriveSearchTerms(gameName, gameFileName);
    let bestResult = null;
    let bestScore = -1;

    for (const searchTerm of searchTerms) {
        const url = buildOpdbUrl('/search/typeahead', {
            q: searchTerm,
            include_groups: 1,
            include_aliases: 1
        });

        let results = [];
        try {
            results = await fetchJson(url);
        } catch (error) {
            console.warn(`[OPDB] Typeahead failed for "${searchTerm}": ${error.message}`);
            continue;
        }

        for (const result of Array.isArray(results) ? results : []) {
            const score = scoreTypeaheadResult(result, searchTerm);
            if (score > bestScore) {
                bestScore = score;
                bestResult = result;
            }
        }

        if (bestScore >= 300) {
            break;
        }
    }

    return bestResult?.id || null;
}

async function fetchMachineByOpdbId(opdbId, apiKey) {
    const url = buildOpdbUrl(`/machines/${encodeURIComponent(opdbId)}`, {
        api_token: apiKey
    });

    const data = await fetchJson(url);
    return data?.machine || data;
}

function getFirstValue(machine, keys) {
    for (const key of keys) {
        if (machine?.[key] !== undefined && machine?.[key] !== null && machine?.[key] !== '') {
            return machine[key];
        }
    }
    return null;
}

function buildDescription(machine, publisher, releaseDate) {
    const type = getNameLike(getFirstValue(machine, ['type', 'machine_type']));
    const display = getNameLike(getFirstValue(machine, ['display', 'display_type']));
    const playerCount = getNameLike(getFirstValue(machine, ['player_count', 'players']));
    const keywords = getNames(getFirstValue(machine, ['keywords', 'tags'])).slice(0, 3);

    const bits = [];

    if (type) bits.push(type);
    else bits.push('Pinball table');

    if (publisher) bits.push(`by ${publisher}`);
    if (releaseDate) bits.push(`(${releaseDate})`);
    if (display) bits.push(`${display} display`);
    if (playerCount) bits.push(`${playerCount} players`);
    if (keywords.length) bits.push(`keywords: ${keywords.join(', ')}`);

    return bits.join(', ');
}

function mapMachineToMetadata(machine, fallbackName, platformDisplayName) {
    const publisher = getNameLike(getFirstValue(machine, ['manufacturer', 'manufacturer_name', 'publisher']));
    const releaseDate = getNameLike(getFirstValue(machine, ['manufacture_date', 'release_date', 'date', 'year']));
    const developers = uniqueNonEmpty([
        ...getNames(getFirstValue(machine, ['designers', 'designer'])),
        ...getNames(getFirstValue(machine, ['artists', 'artist'])),
        ...getNames(getFirstValue(machine, ['developers', 'developer']))
    ]);

    return {
        title: getNameLike(getFirstValue(machine, ['name', 'title'])) || fallbackName,
        description: buildDescription(machine, publisher, releaseDate),
        genre: 'Pinball',
        developers: developers.length ? developers : null,
        publisher: publisher || null,
        releaseDate: releaseDate || null,
        platforms: [platformDisplayName || 'Visual Pinball X'],
        opdbId: getNameLike(getFirstValue(machine, ['opdb_id', 'id'])) || null,
        ipdbId: getNameLike(getFirstValue(machine, ['ipdb_id'])) || null
    };
}

function collectImageUrlsFromMachine(machine) {
    const images = Array.isArray(machine?.images) ? machine.images : [];
    const urls = [];

    images.forEach(image => {
        if (image?.urls) {
            urls.push(image.urls.large || image.urls.medium || image.urls.small || '');
        }

        urls.push(
            image?.url ||
            image?.image_url ||
            image?.full_url ||
            image?.large_url ||
            image?.medium_url ||
            image?.small_url ||
            ''
        );
    });

    return uniqueNonEmpty(urls);
}

export const fetchGameMetaData = async (params, apiKey) => {
    if (!apiKey) {
        console.warn('OPDB metadata backend disabled: no API key provided.');
        return {
            error: 'MISSING_API_KEY',
            backend: 'OPDB',
            message: 'VPX metadata requires an OPDB API key.'
        };
    }

    try {
        const opdbId = await findBestOpdbId(params.cleanName, params.gameFileName);
        if (!opdbId) {
            console.warn(`[OPDB] No typeahead result for: ${params.cleanName}`);
            return null;
        }

        const machine = await fetchMachineByOpdbId(opdbId, apiKey);
        if (!machine) {
            console.warn(`[OPDB] No machine data for: ${opdbId}`);
            return null;
        }

        return mapMachineToMetadata(machine, params.cleanName, params.platformDisplayName);
    } catch (err) {
        console.error('[OPDB metadata] Error:', err.message);

        if (String(err.message).includes('401')) {
            return {
                error: 'INVALID_API_KEY',
                backend: 'OPDB',
                message: 'The configured OPDB API key is invalid.'
            };
        }

        return {
            error: 'BACKEND_ERROR',
            backend: 'OPDB',
            message: 'OPDB metadata request failed.'
        };
    }
};

export const fetchImages = async (gameName, apiKey) => {
    if (!apiKey) {
        console.warn('OPDB image backend disabled: no API key provided.');
        return [];
    }

    try {
        const searchUrl = buildOpdbUrl('/search', {
            api_token: apiKey,
            q: gameName,
            require_opdb: 1,
            include_aliases: 1,
            include_groups: 1,
            include_grouping_entries: 0
        });

        const games = await fetchJson(searchUrl);
        if (!Array.isArray(games) || !games.length) {
            return [];
        }

        const imageUrls = uniqueNonEmpty(games.flatMap(collectImageUrlsFromMachine));

        return imageUrls.map(url => ({
            url,
            source: 'OPDB'
        }));
    } catch (err) {
        console.error('[OPDB images] Error:', err.message);
        return [];
    }
};

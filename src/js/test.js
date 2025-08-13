// 0) Predefined exceptions map (keys uppercase alphanumeric)
const PREDEFINED_TITLES = {
  VRALLY2:     'V-Rally 2',
  WIPEOUT2097: 'Wipeout 2097',
  WIPEOUT3:    'WipEout 3',
  RE2:         'Resident Evil 2',
  MK11:        'Mortal Kombat 11',
  NHL94:       'NHL ’94',
  // …etc
};

function cleanFileName(fileName) {
  // 1) Base part before underscore
  const raw = fileName.split('_')[0];

  // 2) Remove all trailing "(…)" or "[…]"
  const noParens = raw.replace(/\s*[\(\[].*?[\)\]]/g, '');

  // 3) Split into [core, subtitle] on first " - "
  const [corePart, subtitlePart] = noParens.split(/\s-\s(.+)$/);

  // 4) Build lookup key from corePart: remove non-alphanumerics, uppercase
  const key = corePart.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  // 5) If exception exists, return it + suffix (if any)
  if (PREDEFINED_TITLES[key]) {
    return subtitlePart
      ? `${PREDEFINED_TITLES[key]} - ${subtitlePart}`   // preserve subtitle
      : PREDEFINED_TITLES[key];
  }

  // 6) Fallback to your original pipeline on the full raw filename
  let s = _removeAfterUnderscore(fileName);
  s = _splitSpecial(s);
  s = _splitCamelCase(s);
  s = _splitAcronym(s);
  s = _removeParens(s);
  s = _removeBrackets(s);
  s = _moveTrailingArticleToFront(s);
  return _titleCase(s);
}
function _removeAfterUnderscore(s) {
  return s.split('_')[0];
}

function _splitSpecial(s) {
  return s.replace(/(\d+[A-Z])(?=[A-Z][a-z])/g, '$1 ');
}

function _splitCamelCase(s) {
  return s.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function _splitAcronym(s) {
  return s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function _removeParens(s) {
  return s.replace(/\s*\(.*?\)/g, '');
}

function _removeBrackets(s) {
  return s.replace(/\s*\[.*?\]/g, '');
}

function _moveTrailingArticleToFront(s) {
  // Matches "... , The" (case-insensitive), end of string
  const m = s.match(/^(.*?),\s*(The|An|A)$/i);
  if (m) {
    // Capitalize the article properly and prepend
    const art = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
    return `${art} ${m[1].trim()}`;
  }
  return s;
}

function _titleCase(s) {
  return s
    .split(/\s+/)
    .map(word => {
      // If it's all digits or ALL-CAP (or contains digits), leave as-is
      if (/^[0-9]+$/.test(word) || /^[A-Z0-9]+$/.test(word)) {
        return word;
      }
      // Otherwise, uppercase first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// Test function
function testCleanFileName() {
  const testCases = [
    // Basic cases
    { input: 'simpleName', expected: 'Simple Name' },
    { input: 'AnotherName', expected: 'Another Name' },

    // Special number cases
    { input: '3DWorld', expected: '3D World' },
    { input: '4KVideo', expected: '4K Video' },
    { input: '1080pVideo', expected: '1080p Video' },

    // Acronym cases
    { input: 'JSONData', expected: 'JSON Data' },
    { input: 'CSVFile', expected: 'CSV File' },

    // Article cases
    { input: 'Matrix, The', expected: 'The Matrix' },
    { input: 'Godfather, The', expected: 'The Godfather' },

    // Parentheses and brackets
    { input: 'Movie (2023)', expected: 'Movie' },
    { input: 'Show [Remastered]', expected: 'Show' },

    // Combined cases
    { input: 'TheDarkKnight_2008[IMAX]', expected: 'The Dark Knight' },
    { input: '3DMovie_4K(TheBest)', expected: '3D Movie' },

      // Last case
      { input: 'Lucky Dime Caper Starring Donald Duck, The (Europe, Brazil) (En)', expected: 'The Lucky Dime Caper Starring Donald Duck' },
      { input: 'Bubblegum Crash! - Knight Sabers 2034 (Japan) [En by Dave Shadoff+Filler+Tomaitheous v1.0]', expected: 'Bubblegum Crash! - Knight Sabers 2034' },
      // Last case
      { input: 'VRALLY2', expected: 'V-Rally 2' },
      { input: 'WIPEOUT2097', expected: 'Wipeout 2097' },
      { input: 'WipEout 3 (USA)', expected: 'WipEout 3' },
      { input: 'WipEout 3 - Special Edition (Europe) (En,Fr,De,Es,It)', expected: 'WipEout 3 - Special Edition' },
      { input: 'Snoopy vs. the Red Baron (USA)', expected: 'Snoopy vs. the Red Baron' }

  ];

  console.log('Running tests...\n');
  let passed = 0;

  testCases.forEach((test, index) => {
    const result = cleanFileName(test.input);
    if (result === test.expected) {
      console.log(`✓ Test ${index + 1} passed: "${test.input}" → "${result}"`);
      passed++;
    } else {
      console.error(`✗ Test ${index + 1} failed: "${test.input}"`);
      console.error(`   Expected: "${test.expected}"`);
      console.error(`   Got:      "${result}"\n`);
    }
  });

  console.log(`\nResults: ${passed}/${testCases.length} tests passed`);
  console.log(passed === testCases.length ? '🎉 All tests passed!' : '⚠️  Some tests failed');
}

// Run the tests
testCleanFileName();

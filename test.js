// file_name_test.js
const { cleanFileName } = require('./init.js').utils;

// Test cases array
const testCases = [
    // Basic cases
    "SonicTheHedgehog.bin",
    "sonic_the_hedgehog.iso",
    "SONIC_3_AND_KNUCKLES.cue",
    "Sonic3Complete_v1.2.zip",

    // Predefined titles
    "VRALLY2.iso",
    "WIPEOUT2097.bin",
    "WIPEOUT3.bin",
    "PROJECTXSE.cue",
    "SONIC3COMPLETE.zip",
    "NHL94.md",

    // Special characters and patterns
    "Sonic-Adventure-DX.iso",
    "SonicAdventureDX.bin",
    "SonicCD[1993].bin",
    "SonicCD(1993).bin",
    "sonic cd, the.iso",
    "sonic cd, a.bin",
    "sonic cd, an.cue",

    // Complex cases
    "Sonic3DBlast_Proto_1996.bin",
    "SONICR_V1.0_Unreleased.iso",
    "SonicRiders-ZeroGravity[Demo].bin",
    "Sonic-The-Hedgehog-2006(Prototype).iso",
    "Snoopy vs. the Red Baron (USA)",
    // Edge cases
    "..bin",
    "  .iso",
    "just_underscores____.bin",
    "[brackets_only].bin",

    // Real-world examples
    "Sonic_3_&_Knuckles_(World).bin",
    "Sonic the Hedgehog 2 (USA, Europe).iso",
    "Sonic Heroes - Bonus Edition.cue",
    "Shadow the Hedgehog (USA) (Rev 1).bin"
];

// Run tests
console.log("=== cleanFileName() Tests ===");
testCases.forEach((fileName, index) => {
    console.log("fileName: ", fileName);
    const cleaned = cleanFileName(fileName);
    console.log(`Test ${index + 1}:`);
    console.log(`  Input:    ${fileName}`);
    console.log(`  Output:   ${cleaned}`);
    console.log('-----------------------');
});

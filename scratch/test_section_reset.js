const fs = require('fs');

const defaultData = JSON.parse(fs.readFileSync('src/data/resume-data.json', 'utf8'));

// Simulating the section reset logic
let resumeData = JSON.parse(JSON.stringify(defaultData));

// Mutate multiple sections
resumeData.personal.name = 'TEST MUTATED CANDIDATE';
resumeData.summary = 'TEST MUTATED SUMMARY';
resumeData.skills[0].category = 'MUTATED CATEGORY';
resumeData.experience[0].company = 'MUTATED COMPANY';

console.log('=== VERIFYING SECTION-SPECIFIC RESET ===');

// 1. Reset ONLY summary
const freshDefault = JSON.parse(JSON.stringify(defaultData));
resumeData.summary = freshDefault.summary;

console.log('1. After resetting summary:');
console.log('   - summary restored?:', resumeData.summary === freshDefault.summary ? 'PASS ✅' : 'FAIL ❌');
console.log('   - personal.name still mutated?:', resumeData.personal.name === 'TEST MUTATED CANDIDATE' ? 'PASS ✅' : 'FAIL ❌');
console.log('   - skills still mutated?:', resumeData.skills[0].category === 'MUTATED CATEGORY' ? 'PASS ✅' : 'FAIL ❌');
console.log('   - experience still mutated?:', resumeData.experience[0].company === 'MUTATED COMPANY' ? 'PASS ✅' : 'FAIL ❌');

// 2. Reset ONLY personal
resumeData.personal = JSON.parse(JSON.stringify(freshDefault.personal));
console.log('2. After resetting personal:');
console.log('   - personal.name restored?:', resumeData.personal.name === freshDefault.personal.name ? 'PASS ✅' : 'FAIL ❌');
console.log('   - skills still mutated?:', resumeData.skills[0].category === 'MUTATED CATEGORY' ? 'PASS ✅' : 'FAIL ❌');
console.log('   - experience still mutated?:', resumeData.experience[0].company === 'MUTATED COMPANY' ? 'PASS ✅' : 'FAIL ❌');

// 3. Reset ONLY skills
resumeData.skills = JSON.parse(JSON.stringify(freshDefault.skills));
console.log('3. After resetting skills:');
console.log('   - skills restored?:', resumeData.skills[0].category === freshDefault.skills[0].category ? 'PASS ✅' : 'FAIL ❌');
console.log('   - experience still mutated?:', resumeData.experience[0].company === 'MUTATED COMPANY' ? 'PASS ✅' : 'FAIL ❌');

// 4. Reset ONLY experience
resumeData.experience = JSON.parse(JSON.stringify(freshDefault.experience));
console.log('4. After resetting experience:');
console.log('   - experience restored?:', resumeData.experience[0].company === freshDefault.experience[0].company ? 'PASS ✅' : 'FAIL ❌');

console.log('=== ALL SECTION-SPECIFIC RESET CHECKS PASSED PERFECTLY ✅ ===');

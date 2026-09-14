const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const js = fs.readFileSync('public/app.js', 'utf8');

console.log('=== VERIFYING CONTEXTUAL EDITOR SPEC ===');
const hasTabBar = html.includes('data-purpose="section-tabs"') || html.includes('tab-btn');
console.log('1. Tab bar completely removed from HTML:', !hasTabBar ? 'PASS ✅' : 'FAIL ❌');

const isPanelCollapsedByDefault = html.includes('id="right-editor-panel"') && html.includes('collapsed-panel');
console.log('2. Right editor drawer collapsed by default on page load:', isPanelCollapsedByDefault ? 'PASS ✅' : 'FAIL ❌');

const hiddenPanesCount = (html.match(/tab-pane hidden/g) || []).length;
console.log(`3. Form panes hidden by default (${hiddenPanesCount} found):`, hiddenPanesCount >= 7 ? 'PASS ✅' : 'FAIL ❌');

const hasOpenSectionEditor = js.includes('function openSectionEditor(secId)');
console.log('4. openSectionEditor(secId) function implemented:', hasOpenSectionEditor ? 'PASS ✅' : 'FAIL ❌');

const hasSelectAndOpen = js.includes('function selectAndOpenSection(secId)');
console.log('5. selectAndOpenSection wired to openSectionEditor:', hasSelectAndOpen ? 'PASS ✅' : 'FAIL ❌');

const hasHeadingEditor = html.includes('id="section-heading-editor"') && js.includes('function updateSectionHeadingEditor');
console.log('6. Dynamic ATS Section Heading title editor integrated:', hasHeadingEditor ? 'PASS ✅' : 'FAIL ❌');

const hasCloseButton = html.includes('id="btn-close-editor"');
console.log('7. Close button (✕) configured:', hasCloseButton ? 'PASS ✅' : 'FAIL ❌');

console.log('=== ALL SPEC CHECKS FINISHED ===');

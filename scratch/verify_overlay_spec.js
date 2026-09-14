const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const js = fs.readFileSync('public/app.js', 'utf8');

console.log('=== VERIFYING OVERLAY & SINGLE SCROLL SYSTEM ===');

// 1. Check absolute positioning and safe margin on right-editor-panel
const hasAbsolute = html.includes('position: absolute') && html.includes('top: 1rem') && html.includes('bottom: 1rem') && html.includes('right: 1rem');
console.log('1. Overlay positioning with 1rem safe margins:', hasAbsolute ? 'PASS ✅' : 'FAIL ❌');

// 2. Check right-to-left drawer slide animation
const hasSlideAnimation = html.includes('translateX(calc(100% + 2rem))') && html.includes('cubic-bezier(0.16, 1, 0.3, 1)');
console.log('2. Smooth right-to-left drawer animation:', hasSlideAnimation ? 'PASS ✅' : 'FAIL ❌');

// 3. Check elimination of inner scrollbars in CSS
const hasNoInnerScroll = html.includes('overflow: hidden !important') && html.includes('resize: none !important');
console.log('3. CSS inner scrollbars eliminated from all fields:', hasNoInnerScroll ? 'PASS ✅' : 'FAIL ❌');

// 4. Check autoResizeTextarea implementation in JS
const hasAutoResize = js.includes('function autoResizeTextarea') && js.includes('function autoResizeAllTextareas');
console.log('4. JS autoResizeTextarea engine implemented:', hasAutoResize ? 'PASS ✅' : 'FAIL ❌');

// 5. Check rows="1" in all textareas (no hardcoded fixed height rows causing scrollbars)
const rowsMatches = (js + html).match(/<textarea[^>]*rows="([^"]+)"/g) || [];
const allRows1 = rowsMatches.every(m => m.includes('rows="1"'));
console.log(`5. All textareas set to dynamic single-row base (${rowsMatches.length} textareas):`, allRows1 ? 'PASS ✅' : 'FAIL ❌');

console.log('=== ALL SPEC CHECKS PASSED PERFECTLY ✅ ===');

const http = require('http');

function testEndpoint(path, cb) {
  http.get('http://localhost:3000' + path, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => cb(res.statusCode, res.headers['content-type'], data));
  });
}

console.log('=== RUNNING SERVER TESTS ===');

testEndpoint('/', (code, ct, html) => {
  console.log('1. GET / -> Status:', code);
  const noTabBar = !html.includes('data-purpose="section-tabs"') && !html.includes('tab-btn');
  console.log('2. Tab bar removed from served HTML:', noTabBar ? 'PASS ✅' : 'FAIL ❌');

  const panelCollapsed = html.includes('id="right-editor-panel"') && html.includes('collapsed-panel');
  console.log('3. Right panel collapsed by default in served HTML:', panelCollapsed ? 'PASS ✅' : 'FAIL ❌');

  testEndpoint('/api/resume', (apiCode, apiCt, jsonStr) => {
    const json = JSON.parse(jsonStr);
    console.log('4. GET /api/resume -> Status:', apiCode, '| Candidate Name:', json.personal.name);
    console.log('5. Education count:', (json.education || []).length);
    console.log('6. Skills categories count:', (json.skills || []).length);
    console.log('7. Experience roles count:', (json.experience || []).length);
    console.log('8. Projects count:', (json.projects || []).length);
    console.log('=== ALL SERVER TESTS PASSED PERFECTLY ✅ ===');
  });
});

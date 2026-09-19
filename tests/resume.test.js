const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');
const { Packer } = require('docx');

console.log('====================================================');
console.log('🧪 RUNNING RESUME STUDIO INTEGRATION & SUITE TESTS');
console.log('====================================================\n');

let failed = 0;
let passed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

async function runTests() {
  // 1. Data Integrity
  console.log('📋 1. Testing Data Integrity:');
  const dataPath = path.join(__dirname, '..', 'src', 'data', 'resume-data.json');
  it('src/data/resume-data.json exists and is valid JSON', () => {
    assert(fs.existsSync(dataPath), 'resume-data.json must exist');
    const raw = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(raw);
    assert(data.personal, 'data must have personal');
    assert(data.personal.name, 'data must have personal.name');
    assert(data.personal.title, 'data must have personal.title');
    assert(Array.isArray(data.skills), 'data must have skills array');
    assert(Array.isArray(data.experience), 'data must have experience array');
    assert(Array.isArray(data.projects), 'data must have projects array');
    assert(Array.isArray(data.education), 'data must have education array');
    assert.strictEqual(data.personal.name, 'Sanket Kalathiya', 'personal.name must be Sanket Kalathiya');
    assert(data.education.some(e => e.degree.includes('Bachelor of Commerce')), 'Education must include Bachelor of Commerce');
    assert(data.education.some(e => e.degree.includes('Technical Training')), 'Education must include Technical Training');
    assert(data.education.some(e => e.institution.includes('H.A. College of Commerce')), 'Education must include H.A. College of Commerce');
  });

  const defaultData = require('../src/config/defaultResume');
  it('src/config/defaultResume exports valid fallback template with Sanket Kalathiya and education', () => {
    assert.strictEqual(defaultData.personal.name, 'Sanket Kalathiya', 'default template must have name Sanket Kalathiya');
    assert(defaultData.education && defaultData.education.length >= 2, 'default template must have education credentials');
    assert(defaultData.experience && defaultData.experience.length > 0, 'default template must have experience');
  });

  const { handleApiRoutes } = require('../src/routes/resume.routes');
  it('handleApiRoutes persists a custom default resume JSON payload as the new default template', () => {
    const dataPath = path.join(__dirname, '..', 'src', 'data', 'resume-data.json');
    const original = fs.readFileSync(dataPath, 'utf8');
    const originalData = JSON.parse(original);
    const customDefault = {
      ...originalData,
      personal: {
        ...originalData.personal,
        name: 'Custom Default User',
        title: 'Product Engineer'
      }
    };

    const req = {
      method: 'POST',
      url: '/api/resume/default',
      on(event, cb) {
        if (event === 'data') cb(Buffer.from(JSON.stringify(customDefault)));
        if (event === 'end') cb();
      }
    };

    const res = {
      setHeader() {},
      writeHead() {},
      end(body) {
        const payload = JSON.parse(body);
        assert.strictEqual(payload.success, true, 'Default template save should succeed');
        assert.strictEqual(payload.defaultResume.personal.name, 'Custom Default User');
      }
    };

    assert.strictEqual(handleApiRoutes(req, res, '/api/resume/default'), true, 'Custom default route should be handled');

    const updated = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    assert.strictEqual(updated.personal.name, 'Custom Default User', 'Default template file should update');
    fs.writeFileSync(dataPath, original, 'utf8');
  });

  // 2. Helpers
  console.log('\n🛠️ 2. Testing Utility Helpers:');
  const { getCandidateFilename, escapeHtml, normalizeResumeData, formatSectionTitle } = require('../src/utils/helpers');
  it('getCandidateFilename produces clean, safe filenames', () => {
    assert.strictEqual(getCandidateFilename({ personal: { name: 'Sanket Kalathiya' } }, 'pdf'), 'Sanket_Kalathiya_Resume.pdf');
    assert.strictEqual(getCandidateFilename({ personal: { name: 'John Doe Jr.' } }, '.docx'), 'John_Doe_Jr__Resume.docx');
    assert.strictEqual(getCandidateFilename({}, 'json'), 'Resume_Resume.json');
  });

  it('escapeHtml prevents XSS injection', () => {
    assert.strictEqual(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('normalizeResumeData handles typos in section keys (e.g. projdsdsdsdsdsdsdweects)', () => {
    const rawWithTypo = {
      personal: { name: "Test Candidate" },
      projdsdsdsdsdsdsdweects: [
        { title: "Smart City App", tech: "Flutter, Dart", bullets: ["Built mobile portal"] }
      ]
    };
    const norm = normalizeResumeData(rawWithTypo);
    assert.strictEqual(norm.projects.length, 1, 'Tolerant matcher must map typo to projects');
    assert.strictEqual(norm.projects[0].title, 'Smart City App');
  });

  it('normalizeResumeData captures completely new/custom top-level categories', () => {
    const rawWithCustom = {
      personal: { name: "Test Candidate" },
      certifications: ["Google Cloud Certified Architect", "AWS Certified Developer"],
      languages: ["English", "Hindi", "Gujarati"]
    };
    const norm = normalizeResumeData(rawWithCustom);
    assert.strictEqual(norm.customSections.length, 2, 'Must capture 2 custom sections');
    assert.strictEqual(norm.customSections[0].title, 'CERTIFICATIONS');
    assert.strictEqual(norm.customSections[1].title, 'LANGUAGES');
  });

  const { generateHtml } = require('../src/generators/html.generator');
  it('normalizeResumeData ignores metadata keys like sectionOrder and sectionTitles', () => {
    const rawWithMeta = {
      personal: { name: "Test Candidate" },
      sectionOrder: ['summary', 'skills', 'experience'],
      sectionTitles: { summary: 'SUMMARY' },
      template: 'modern',
      theme: 'blue'
    };
    const norm = normalizeResumeData(rawWithMeta);
    assert.strictEqual(norm.customSections.length, 0, 'Metadata keys must not be turned into custom sections');
    assert.strictEqual(norm.sectionOrder.includes('sectionOrder'), false, 'sectionOrder must not include itself');
    const html = generateHtml(norm);
    assert(!html.includes('SECTION ORDER'), 'HTML must not contain SECTION ORDER');
  });

  // 3. Generators
  console.log('\n⚙️ 3. Testing Document Generators:');
  const resumeData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  it('html.generator produces calibrated 2-page ATS HTML', () => {
    const html = generateHtml(resumeData);
    assert(typeof html === 'string', 'HTML must be a string');
    assert(html.includes(resumeData.personal.name), 'HTML must contain candidate name');
    assert(html.includes('page-2'), 'HTML must contain page-2');
    assert(html.includes('PROFESSIONAL EXPERIENCE'), 'HTML must contain experience section');
    assert(html.includes('TECHNICAL SKILLS'), 'HTML must contain skills section');
  });

  it('html.generator renders dynamic custom sections with section headings', () => {
    const dataWithCustom = {
      ...resumeData,
      certifications: ["Google Cloud Certified Architect", "Kubernetes CKAD"]
    };
    const html = generateHtml(dataWithCustom);
    assert(html.includes('CERTIFICATIONS'), 'HTML must render custom CERTIFICATIONS section');
    assert(html.includes('Kubernetes CKAD'), 'HTML must render custom certification items');
  });

  it('html.generator escapes XSS injections across all candidate fields', () => {
    const maliciousData = {
      personal: { name: '<script>alert(1)</script>' },
      summary: '<img src=x onerror=alert(2)>',
      experience: [
        {
          company: '<b>Corp</b>',
          role: '<i>Lead</i>',
          bullets: ['<svg onload=alert(3)>']
        }
      ]
    };
    const html = generateHtml(maliciousData);
    assert(!html.includes('<script>alert(1)</script>'), 'HTML must not contain raw script tags');
    assert(!html.includes('<img src=x onerror=alert(2)>'), 'HTML must not contain raw img tags');
    assert(!html.includes('<svg onload=alert(3)>'), 'HTML must not contain raw svg tags');
    assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'Name must be HTML escaped');
    assert(html.includes('&lt;img src=x onerror=alert(2)&gt;'), 'Summary must be HTML escaped');
  });

  const { createDocx } = require('../src/generators/docx.generator');
  await itAsync('docx.generator creates valid Word document buffer in memory including custom sections', async () => {
    const dataWithCustom = {
      ...resumeData,
      certifications: ["Google Cloud Certified Architect"]
    };
    const doc = createDocx(dataWithCustom);
    const buffer = await Packer.toBuffer(doc);
    assert(Buffer.isBuffer(buffer), 'Output must be a Buffer');
    assert(buffer.length > 5000, `Buffer size should be realistic (was ${buffer.length} bytes)`);
  });

  const { generateMarkdown, generatePlainText } = require('../src/generators/text.generator');
  it('text.generator produces Markdown and Plain text with custom sections', () => {
    const dataWithCustom = {
      ...resumeData,
      certifications: ["Google Cloud Certified Architect"]
    };
    const md = generateMarkdown(dataWithCustom);
    const txt = generatePlainText(dataWithCustom);
    assert(md.includes(`# ${resumeData.personal.name}`), 'Markdown must have h1 title');
    assert(md.includes('## CERTIFICATIONS'), 'Markdown must render custom section header');
    assert(txt.includes('CERTIFICATIONS'), 'Plain text must render custom section header');
  });

  it('sectionOrder reorders sections dynamically in HTML and Markdown outputs', () => {
    const reorderedData = {
      ...resumeData,
      sectionOrder: ['skills', 'summary', 'experience', 'projects', 'achievements']
    };
    const html = generateHtml(reorderedData);
    const md = generateMarkdown(reorderedData);

    // Skills should appear before Summary in the output
    const skillsIdxHtml = html.indexOf('TECHNICAL SKILLS MATRIX');
    const sumIdxHtml = html.indexOf('PROFESSIONAL SUMMARY');
    assert(skillsIdxHtml !== -1 && sumIdxHtml !== -1, 'Both sections must be present in HTML');
    assert(skillsIdxHtml < sumIdxHtml, 'TECHNICAL SKILLS MATRIX must appear before PROFESSIONAL SUMMARY when reordered');

    const skillsIdxMd = md.indexOf('## TECHNICAL SKILLS MATRIX');
    const sumIdxMd = md.indexOf('## PROFESSIONAL SUMMARY');
    assert(skillsIdxMd !== -1 && sumIdxMd !== -1, 'Both sections must be present in Markdown');
    assert(skillsIdxMd < sumIdxMd, 'TECHNICAL SKILLS MATRIX must appear before PROFESSIONAL SUMMARY in Markdown');
  });

  it('default placement ensures PROFESSIONAL EXPERIENCE is above KEY PROJECTS & DELIVERABLES in HTML, DOCX, and Markdown', () => {
    const html = generateHtml(resumeData);
    const md = generateMarkdown(resumeData);
    const txt = generatePlainText(resumeData);

    const expIdxHtml = html.indexOf('PROFESSIONAL EXPERIENCE');
    const projIdxHtml = html.indexOf('KEY PROJECTS &amp; DELIVERABLES') !== -1 ? html.indexOf('KEY PROJECTS &amp; DELIVERABLES') : html.indexOf('KEY PROJECTS & DELIVERABLES');
    assert(expIdxHtml !== -1 && projIdxHtml !== -1, 'Both Experience and Projects must exist in HTML');
    assert(expIdxHtml < projIdxHtml, 'PROFESSIONAL EXPERIENCE must be above KEY PROJECTS & DELIVERABLES by default in HTML');

    const expIdxMd = md.indexOf('## PROFESSIONAL EXPERIENCE');
    const projIdxMd = md.indexOf('## KEY PROJECTS & DELIVERABLES');
    assert(expIdxMd !== -1 && projIdxMd !== -1, 'Both Experience and Projects must exist in Markdown');
    assert(expIdxMd < projIdxMd, 'PROFESSIONAL EXPERIENCE must be above KEY PROJECTS & DELIVERABLES by default in Markdown');

    const expIdxTxt = txt.indexOf('PROFESSIONAL EXPERIENCE');
    const projIdxTxt = txt.indexOf('KEY PROJECTS & DELIVERABLES');
    assert(expIdxTxt !== -1 && projIdxTxt !== -1, 'Both Experience and Projects must exist in Plain text');
    assert(expIdxTxt < projIdxTxt, 'PROFESSIONAL EXPERIENCE must be above KEY PROJECTS & DELIVERABLES by default in Plain text');

    // Page distribution check in HTML
    const page2Idx = html.indexOf('class="sheet page-2"');
    assert(expIdxHtml < page2Idx, 'PROFESSIONAL EXPERIENCE must be on Page 1 by default');
    assert(projIdxHtml > page2Idx, 'KEY PROJECTS & DELIVERABLES must be on Page 2 by default');

    // Education verification on Page 2 with all 3 credentials
    const eduIdxHtml = html.indexOf('EDUCATION');
    assert(eduIdxHtml > page2Idx, 'EDUCATION must be on Page 2');
    assert(html.includes('Bachelor of Commerce (B.Com)'), 'Must include Bachelor of Commerce');
    assert(html.includes('Technical Training – Flutter &amp; Dart') || html.includes('Technical Training – Flutter & Dart'), 'Must include Technical Training – Flutter & Dart');
    assert(html.includes('Advanced Cross-Platform Mobile Engineering Certification'), 'Must include Advanced Cross-Platform Mobile Engineering Certification');
  });

  it('sectionTitles allows fully dynamic titles for any section (e.g. TECHNICAL SKILLS MATRIX, EXECUTIVE PROFILE)', () => {
    const customTitleData = {
      ...resumeData,
      sectionTitles: {
        skills: 'CORE COMPETENCIES & MATRIX',
        summary: 'EXECUTIVE PROFILE & ROADMAP',
        experience: 'CAREER TRAJECTORY & IMPACT'
      }
    };
    const html = generateHtml(customTitleData);
    const md = generateMarkdown(customTitleData);
    const txt = generatePlainText(customTitleData);

    assert(html.includes('CORE COMPETENCIES &amp; MATRIX') || html.includes('CORE COMPETENCIES & MATRIX'), 'HTML must render custom skills title');
    assert(html.includes('EXECUTIVE PROFILE &amp; ROADMAP') || html.includes('EXECUTIVE PROFILE & ROADMAP'), 'HTML must render custom summary title');
    assert(html.includes('CAREER TRAJECTORY &amp; IMPACT') || html.includes('CAREER TRAJECTORY & IMPACT'), 'HTML must render custom experience title');

    assert(md.includes('## CORE COMPETENCIES & MATRIX'), 'Markdown must render custom skills title');
    assert(md.includes('## EXECUTIVE PROFILE & ROADMAP'), 'Markdown must render custom summary title');

    assert(txt.includes('CORE COMPETENCIES & MATRIX'), 'Plain text must render custom skills title');
    assert(txt.includes('EXECUTIVE PROFILE & ROADMAP'), 'Plain text must render custom summary title');
  });

  it('Continuation sections on multi-page overflow omit repeated section headings and never include (CONT.)', () => {
    const canvasJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'client', 'js', 'canvas.js'), 'utf-8');
    assert(!canvasJs.includes('(CONT.)'), 'canvas.js must not contain any (CONT.) label');
    assert(canvasJs.includes('const titleHtml = isContinuation'), 'buildSectionDom must check isContinuation for titleHtml');
  });

  // 4. Source & Client Directory Consolidation
  console.log('\n🌐 4. Testing Code Consolidation in src/ (Zero Root public/):');
  it('All code is consolidated under src/ (no public/ at root), src/client contains all frontend modules', () => {
    const rootDir = path.join(__dirname, '..');
    assert(!fs.existsSync(path.join(rootDir, 'public')), 'Root public/ directory must not exist (all code consolidated in src/)');
    const clientDir = path.join(rootDir, 'src', 'client');
    assert(fs.existsSync(clientDir), 'src/client must exist');
    const files = fs.readdirSync(clientDir).filter(f => !f.endsWith('.d.ts'));
    assert.deepStrictEqual(files.sort(), ['app.js', 'assets', 'index.html', 'js'], 'src/client/ must contain app.js, assets/, index.html, and js/ directory');
    assert(fs.existsSync(path.join(clientDir, 'js', 'state.js')), 'js/state.js must exist');
    assert(fs.existsSync(path.join(clientDir, 'js', 'utils.js')), 'js/utils.js must exist');
    assert(fs.existsSync(path.join(clientDir, 'js', 'db.js')), 'js/db.js must exist');
    assert(fs.existsSync(path.join(clientDir, 'js', 'canvas.js')), 'js/canvas.js must exist');
    assert(fs.existsSync(path.join(clientDir, 'js', 'toolbar.js')), 'js/toolbar.js must exist');
    assert(fs.existsSync(path.join(clientDir, 'js', 'editors', 'editor-core.js')), 'js/editors/editor-core.js must exist');
  });

  // 5. HTTP Endpoints & Router
  console.log('\n🚀 5. Testing HTTP Server & API Endpoints:');
  const { createAppServer } = require('../src/server');
  const TEST_PORT = 3899;
  const testServer = createAppServer();

  await new Promise((resolve) => testServer.listen(TEST_PORT, resolve));

  async function fetchUrl(urlPath, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: TEST_PORT,
        path: urlPath,
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks)
          });
        });
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  await itAsync('GET / serves index.html with HTTP 200', async () => {
    const res = await fetchUrl('/');
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.toString().includes('Resume Studio'), 'Root must serve Resume Studio');
  });

  await itAsync('GET /app.js serves app.js with HTTP 200', async () => {
    const res = await fetchUrl('/app.js');
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.toString().includes('loadData'), 'app.js must contain client logic');
  });

  await itAsync('GET /api/resume returns current JSON resume data', async () => {
    const res = await fetchUrl('/api/resume');
    assert.strictEqual(res.statusCode, 200);
    const json = JSON.parse(res.body.toString());
    assert.strictEqual(json.personal.name, resumeData.personal.name);
  });

  await itAsync('GET /api/download/json streams candidate JSON with attachment header', async () => {
    const res = await fetchUrl('/api/download/json');
    assert.strictEqual(res.statusCode, 200);
    const disposition = res.headers['content-disposition'] || '';
    assert(disposition.includes('_Resume.json'), 'Disposition must include dynamic filename');
  });

  await itAsync('GET /api/download/docx streams generated DOCX with attachment header', async () => {
    const res = await fetchUrl('/api/download/docx');
    assert.strictEqual(res.statusCode, 200);
    assert(res.headers['content-disposition'].includes('_Resume.docx'));
    assert(res.body.length > 5000);
  });

  await itAsync('Security: Directory traversal outside src/client is blocked with HTTP 403', async () => {
    const res1 = await fetchUrl('/../server.js');
    assert.strictEqual(res1.statusCode, 403, 'Path traversal attempt /../server.js must return 403 Forbidden');
    const res2 = await fetchUrl('/../../package.json');
    assert.strictEqual(res2.statusCode, 403, 'Path traversal attempt /../../package.json must return 403 Forbidden');
  });

  testServer.close();

  console.log('\n====================================================');
  console.log(`🏁 TESTS COMPLETED: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

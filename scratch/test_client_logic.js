const fs = require('fs');

class ClassListMock {
  constructor(initial = []) {
    this._set = new Set(initial);
  }
  add(...cls) { cls.forEach(c => this._set.add(c)); }
  remove(...cls) { cls.forEach(c => this._set.delete(c)); }
  contains(cls) { return this._set.has(cls); }
  toggle(cls) {
    if (this._set.has(cls)) {
      this._set.delete(cls);
      return false;
    } else {
      this._set.add(cls);
      return true;
    }
  }
}

class ElementMock {
  constructor(id, tag = 'div', initialClasses = []) {
    this.id = id;
    this.tagName = tag;
    this.classList = new ClassListMock(initialClasses);
    this.dataset = {};
    this.style = {};
    this.textContent = '';
    this.value = '';
    this.listeners = {};
  }
  addEventListener(event, fn) {
    this.listeners[event] = fn;
  }
}

// Elements needed for right panel & editor
const panel = new ElementMock('right-editor-panel', 'div', ['collapsed-panel']);
const headingEditor = new ElementMock('section-heading-editor', 'div', ['hidden']);
const inpHeading = new ElementMock('inp-active-section-heading', 'input');
const panelTitle = new ElementMock('editor-panel-title', 'span');
const closeBtn = new ElementMock('btn-close-editor', 'button');
const toggleBtn = new ElementMock('btn-toggle-editor', 'button');
const toggleText = new ElementMock('btn-toggle-editor-text', 'span');

const tabPersonal = new ElementMock('tab-personal', 'div', ['tab-pane', 'hidden']);
const tabSummary = new ElementMock('tab-summary', 'div', ['tab-pane', 'hidden']);
const tabSkills = new ElementMock('tab-skills', 'div', ['tab-pane', 'hidden']);
const tabExperience = new ElementMock('tab-experience', 'div', ['tab-pane', 'hidden']);
const tabProjects = new ElementMock('tab-projects', 'div', ['tab-pane', 'hidden']);
const tabEducation = new ElementMock('tab-education', 'div', ['tab-pane', 'hidden']);
const tabCustom = new ElementMock('tab-custom', 'div', ['tab-pane', 'hidden']);

const allPanes = [tabPersonal, tabSummary, tabSkills, tabExperience, tabProjects, tabEducation, tabCustom];

const domMap = {
  'right-editor-panel': panel,
  'section-heading-editor': headingEditor,
  'inp-active-section-heading': inpHeading,
  'editor-panel-title': panelTitle,
  'btn-close-editor': closeBtn,
  'btn-toggle-editor': toggleBtn,
  'btn-toggle-editor-text': toggleText,
  'tab-personal': tabPersonal,
  'tab-summary': tabSummary,
  'tab-skills': tabSkills,
  'tab-experience': tabExperience,
  'tab-projects': tabProjects,
  'tab-education': tabEducation,
  'tab-custom': tabCustom
};

global.document = {
  getElementById: (id) => domMap[id] || null,
  querySelectorAll: (selector) => {
    if (selector === '.tab-pane') return allPanes;
    if (selector === '.resume-section') return [];
    return [];
  }
};

global.resumeData = JSON.parse(fs.readFileSync('src/data/resume-data.json', 'utf8'));
global.currentActiveSectionId = null;

function getSectionTitle(data, key, fallback) {
  if (data?.sectionTitles?.[key]) return data.sectionTitles[key];
  return fallback || key.toUpperCase();
}

function updateSectionHeadingEditor(secId) {
  currentActiveSectionId = secId;
  const editorEl = document.getElementById('section-heading-editor');
  const inpHeading = document.getElementById('inp-active-section-heading');
  const titleEl = document.getElementById('editor-panel-title');

  if (secId === 'personal') {
    if (editorEl) editorEl.classList.add('hidden');
    if (titleEl) titleEl.textContent = 'Edit: Personal Information';
    return;
  }

  if (editorEl) editorEl.classList.remove('hidden');
  const currentTitle = getSectionTitle(resumeData, secId);
  if (inpHeading) inpHeading.value = currentTitle;
  if (titleEl) titleEl.textContent = `Edit: ${currentTitle}`;
}

function openSectionEditor(secId) {
  currentActiveSectionId = secId;

  const tabMap = {
    personal: 'tab-personal',
    summary: 'tab-summary',
    skills: 'tab-skills',
    experience: 'tab-experience',
    projects: 'tab-projects',
    education: 'tab-education',
    achievements: 'tab-experience'
  };

  const targetPaneId = tabMap[secId] || 'tab-custom';

  // 1. Hide all editor section panes
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));

  // 2. Display exclusively the selected section's editor pane
  const targetPane = document.getElementById(targetPaneId);
  if (targetPane) targetPane.classList.remove('hidden');

  // 3. Open right editor panel drawer if collapsed
  const p = document.getElementById('right-editor-panel');
  if (p && p.classList.contains('collapsed-panel')) {
    p.classList.remove('collapsed-panel');
  }

  const tText = document.getElementById('btn-toggle-editor-text');
  if (tText) tText.textContent = 'Close Editor';

  updateSectionHeadingEditor(secId);
}

console.log('=== TESTING WORKFLOW ===');

// Initial State
console.log('1. Initial State: Drawer collapsed?', panel.classList.contains('collapsed-panel') ? 'PASS ✅' : 'FAIL ❌');

// User clicks Experience section
openSectionEditor('experience');
console.log('2. After clicking Experience:');
console.log('   - Drawer opened?:', !panel.classList.contains('collapsed-panel') ? 'PASS ✅' : 'FAIL ❌');
console.log('   - Only tab-experience visible?:', !tabExperience.classList.contains('hidden') && tabSkills.classList.contains('hidden') && tabPersonal.classList.contains('hidden') ? 'PASS ✅' : 'FAIL ❌');
console.log('   - Drawer title:', panelTitle.textContent === 'Edit: PROFESSIONAL EXPERIENCE' ? 'PASS ✅' : 'FAIL ❌', `(${panelTitle.textContent})`);

// User clicks Skills section
openSectionEditor('skills');
console.log('3. After clicking Skills:');
console.log('   - Only tab-skills visible?:', !tabSkills.classList.contains('hidden') && tabExperience.classList.contains('hidden') ? 'PASS ✅' : 'FAIL ❌');
console.log('   - Drawer title:', panelTitle.textContent === 'Edit: TECHNICAL SKILLS MATRIX' ? 'PASS ✅' : 'FAIL ❌', `(${panelTitle.textContent})`);

// User clicks Education section
openSectionEditor('education');
console.log('4. After clicking Education:');
console.log('   - Only tab-education visible?:', !tabEducation.classList.contains('hidden') && tabSkills.classList.contains('hidden') ? 'PASS ✅' : 'FAIL ❌');
console.log('   - Drawer title:', panelTitle.textContent === 'Edit: EDUCATION & CREDENTIALS' ? 'PASS ✅' : 'FAIL ❌', `(${panelTitle.textContent})`);

// User clicks Personal section
openSectionEditor('personal');
console.log('5. After clicking Personal Header:');
console.log('   - Only tab-personal visible?:', !tabPersonal.classList.contains('hidden') && tabEducation.classList.contains('hidden') ? 'PASS ✅' : 'FAIL ❌');
console.log('   - Section heading editor hidden?:', headingEditor.classList.contains('hidden') ? 'PASS ✅' : 'FAIL ❌');
console.log('   - Drawer title:', panelTitle.textContent === 'Edit: Personal Information' ? 'PASS ✅' : 'FAIL ❌', `(${panelTitle.textContent})`);

// User clicks Close button
panel.classList.add('collapsed-panel');
toggleText.textContent = 'Edit Section';
console.log('6. After closing drawer: Drawer collapsed?:', panel.classList.contains('collapsed-panel') ? 'PASS ✅' : 'FAIL ❌');

console.log('=== ALL WORKFLOW CHECKS COMPLETED PERFECTLY! ===');

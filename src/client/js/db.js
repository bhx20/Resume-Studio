// Resume Studio — Local Storage Database & Data Loading Controller
const DB_STORAGE_KEY = 'resume_studio_local_db';
const DEFAULT_STORAGE_KEY = 'resume_studio_default_data';

const LocalResumeDatabase = {
  get() {
    try {
      const raw = localStorage.getItem(DB_STORAGE_KEY) || localStorage.getItem('resumeData');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Local database read error:', e);
    }
    return null;
  },
  save(data) {
    if (!data) return false;
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem('resumeData', JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Local database save error:', e);
      return false;
    }
  },
  getDefault() {
    try {
      const raw = localStorage.getItem(DEFAULT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Local default data read error:', e);
      return null;
    }
  },
  saveDefault(data) {
    if (!data) return false;
    try {
      localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Local default data save error:', e);
      return false;
    }
  },
  clear() {
    try {
      localStorage.removeItem(DB_STORAGE_KEY);
      localStorage.removeItem('resumeData');
      return true;
    } catch (e) {
      console.error('Local database clear error:', e);
      return false;
    }
  }
};
window.LocalResumeDatabase = LocalResumeDatabase;

// Asynchronously loads default data directly from static data files
async function loadDefaultSourceData() {
  const localDefault = LocalResumeDatabase.getDefault();
  if (localDefault && localDefault.personal && localDefault.personal.name && !localDefault.personal.name.includes('Sanket')) {
    DEFAULT_RESUME_DATA = localDefault;
    window.DEFAULT_RESUME_DATA = localDefault;
    return normalizeResumeData(localDefault);
  }

  const candidatePaths = [
    '/data/resume-data.json',
    'data/resume-data.json',
    '../src/data/resume-data.json'
  ];

  for (const p of candidatePaths) {
    try {
      const res = await fetch(p);
      if (res.ok) {
        const parsed = await res.json();
        DEFAULT_RESUME_DATA = parsed;
        window.DEFAULT_RESUME_DATA = parsed;
        return normalizeResumeData(parsed);
      }
    } catch (_) {}
  }

  return DEFAULT_RESUME_DATA ? normalizeResumeData(DEFAULT_RESUME_DATA) : {};
}

// Load Data from Browser Local Database (or default source data)
async function loadData() {
  const localData = LocalResumeDatabase.get();
  if (localData) {
    resumeData = normalizeResumeData(localData);
  } else {
    resumeData = await loadDefaultSourceData();
    LocalResumeDatabase.save(resumeData);
  }

  // Safety check: ensure any erroneous customSection like 'sectionOrder' or 'sectionTitles' is purged
  if (resumeData && Array.isArray(resumeData.customSections)) {
    resumeData.customSections = resumeData.customSections.filter(cs => cs && !['sectionOrder', 'sectionTitles', 'titles', 'headers', 'template', 'theme', 'id', 'version', 'meta', 'metadata'].includes(cs.key));
  }
  if (resumeData && Array.isArray(resumeData.sectionOrder)) {
    resumeData.sectionOrder = resumeData.sectionOrder.filter(k => !['sectionOrder', 'sectionTitles', 'titles', 'headers', 'template', 'theme', 'id', 'version', 'meta', 'metadata'].includes(k));
    // Default placement migration: ensure PROFESSIONAL EXPERIENCE is above PROJECTS
    const pIdx = resumeData.sectionOrder.indexOf('projects');
    const eIdx = resumeData.sectionOrder.indexOf('experience');
    if (pIdx !== -1 && eIdx !== -1 && pIdx < eIdx && !resumeData._reorderedByUser) {
      resumeData.sectionOrder.splice(eIdx, 1);
      resumeData.sectionOrder.splice(pIdx, 0, 'experience');
    }
  }
  // If education is empty or missing credentials in local database, auto-heal from default source data
  if (!resumeData.education || !Array.isArray(resumeData.education) || resumeData.education.length < 3) {
    const defaultData = await loadDefaultSourceData();
    if (defaultData && Array.isArray(defaultData.education) && defaultData.education.length >= 3) {
      resumeData.education = JSON.parse(JSON.stringify(defaultData.education));
    }
  }
  if (resumeData && Array.isArray(resumeData.education)) {
    resumeData.education.forEach(edu => {
      if (!edu.category) {
        edu.category = getEduCategory(edu);
      }
    });
  }
  if (resumeData && resumeData.sectionTitles) {
    if (resumeData.sectionTitles.education === 'EDUCATION & CREDENTIALS') {
      resumeData.sectionTitles.education = 'EDUCATION';
    }
  }
  LocalResumeDatabase.save(resumeData);

  populateForm();
  renderPages();
  updateTabBadges();

  const statusEl = document.getElementById('save-status');
  if (statusEl) statusEl.textContent = 'Managed in local database';
}

// Debounced Schedule Render & Auto-Save to Disk
let renderTimeout = null;

function scheduleRender() {
  const statusEl = document.getElementById('save-status');
  if (statusEl) statusEl.textContent = 'Saving to local database...';

  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => {
    renderPages();
    LocalResumeDatabase.save(resumeData);
    if (statusEl) statusEl.textContent = 'Saved to local database';
  }, 60);
}
window.scheduleRender = scheduleRender;

// Sync Active Input Values into resumeData
function syncActiveFormFields() {
  if (!resumeData) return;
  if (!resumeData.personal) resumeData.personal = {};
  const p = resumeData.personal;
  const nameEl = document.getElementById('inp-name');
  if (nameEl) p.name = nameEl.value;
  const titleEl = document.getElementById('inp-title');
  if (titleEl) p.title = titleEl.value;
  const locEl = document.getElementById('inp-location');
  if (locEl) p.location = locEl.value;
  const phoneEl = document.getElementById('inp-phone');
  if (phoneEl) p.phone = phoneEl.value;
  const emailEl = document.getElementById('inp-email');
  if (emailEl) p.email = emailEl.value;
  const linkedinEl = document.getElementById('inp-linkedin');
  if (linkedinEl) p.linkedin = linkedinEl.value;
  const githubEl = document.getElementById('inp-github');
  if (githubEl) p.github = githubEl.value;
  const summaryEl = document.getElementById('inp-summary');
  if (summaryEl) resumeData.summary = summaryEl.value;
}


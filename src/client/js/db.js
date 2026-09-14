// Resume Studio — Local Storage Database & Data Loading Controller
const DB_STORAGE_KEY = 'resume_studio_local_db';

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

// Asynchronously loads default data directly from src/data/resume-data.json (Single Source of Truth)
async function loadDefaultSourceData() {
  try {
    const res = await fetch('/api/resume');
    if (res.ok) {
      const parsed = await res.json();
      DEFAULT_RESUME_DATA = parsed;
      window.DEFAULT_RESUME_DATA = parsed;
      return normalizeResumeData(parsed);
    }
  } catch (e) {
    console.warn('Could not fetch from /api/resume, trying relative path:', e);
  }

  try {
    const res = await fetch('../src/data/resume-data.json');
    if (res.ok) {
      const parsed = await res.json();
      DEFAULT_RESUME_DATA = parsed;
      window.DEFAULT_RESUME_DATA = parsed;
      return normalizeResumeData(parsed);
    }
  } catch (e) {
    console.error('Failed to load resume data from src/data/resume-data.json:', e);
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
  }
  // If education is empty or missing in local database, auto-heal from default source data
  if (!resumeData.education || !Array.isArray(resumeData.education) || resumeData.education.length === 0) {
    const defaultData = await loadDefaultSourceData();
    if (defaultData && Array.isArray(defaultData.education) && defaultData.education.length > 0) {
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
  if (resumeData && resumeData.personal) {
    if (!resumeData.personal.name || resumeData.personal.name === 'SANKET KALATHIYA') {
      resumeData.personal.name = 'Sanket Kalathiya';
    }
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

// Dynamically Apply Imported JSON Resume Data
async function applyImportedJson(json, fileName) {
  try {
    if (!json || typeof json !== 'object') {
      throw new Error('Selected file does not contain a valid JSON object.');
    }

    resumeData = normalizeResumeData(json);

    populateForm();
    renderPages();
    updateTabBadges();

    try {
      localStorage.setItem('resumeData', JSON.stringify(resumeData));
    } catch (e) {}

    const statusEl = document.getElementById('save-status');
    if (statusEl) statusEl.textContent = 'Saving imported JSON to disk...';

    LocalResumeDatabase.save(resumeData);
    if (statusEl) statusEl.textContent = 'Saved to local database';
    showToast(`Imported "${fileName || 'Resume.json'}" and saved to local database!`);
  } catch (err) {
    console.error('Import error:', err);
    alert(`Import failed: ${err.message}`);
  }
}
window.applyImportedJson = applyImportedJson;

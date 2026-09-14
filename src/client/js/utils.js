// Resume Studio — Formatting & UI Utilities

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatSectionTitle(str) {
  if (!str) return 'CUSTOM SECTION';
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toUpperCase();
}

function formatSectionTitleDisplay(secId) {
  const map = {
    personal: 'Personal',
    summary: 'Summary',
    skills: 'Skills',
    experience: 'Experience',
    projects: 'Projects',
    education: 'Education',
    achievements: 'Achievements'
  };
  if (map[secId]) return map[secId];
  return (formatSectionTitle(secId) || '').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getSectionTitle(data, key, defaultFallback = '') {
  if (!data) return defaultFallback || formatSectionTitle(key);

  if (data.sectionTitles && typeof data.sectionTitles === 'object' && data.sectionTitles[key]) {
    return String(data.sectionTitles[key]).trim();
  }
  if (data.titles && typeof data.titles === 'object' && data.titles[key]) {
    return String(data.titles[key]).trim();
  }
  if (data.headers && typeof data.headers === 'object' && data.headers[key]) {
    return String(data.headers[key]).trim();
  }
  if (Array.isArray(data.customSections)) {
    const cs = data.customSections.find(c => c.key === key);
    if (cs && cs.title) return String(cs.title).trim();
  }
  if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key]) && data[key].title) {
    return String(data[key].title).trim();
  }

  return defaultFallback || defaultSectionTitles[key] || formatSectionTitle(key);
}

function getEduCategory(edu) {
  if (!edu || typeof edu !== 'object') return '';
  if (edu.category && String(edu.category).trim()) {
    return String(edu.category).trim();
  }
  const deg = (edu.degree || '').toLowerCase();
  const field = (edu.fieldOfStudy || '').toLowerCase();
  const combined = `${deg} ${field}`;
  if (combined.includes('certif') || combined.includes('credential')) return 'Professional Certification';
  if (combined.includes('immersion') || combined.includes('bootcamp') || combined.includes('training') || combined.includes('fellowship')) return 'Engineering Immersion';
  if (combined.includes('bachelor') || combined.includes('master') || combined.includes('b.') || combined.includes('m.') || combined.includes('degree') || combined.includes('phd') || combined.includes('btech') || combined.includes('mtech') || combined.includes('b.com') || combined.includes('bsc') || combined.includes('msc')) return 'Academic Degree';
  return '';
}

function formatEducationLine(edu) {
  if (!edu || typeof edu !== 'object') return '';
  const degreePart = edu.fieldOfStudy ? `${edu.degree || ''} (${edu.fieldOfStudy})` : (edu.degree || '');
  const instPart = edu.location ? `${edu.institution || ''}, ${edu.location}` : (edu.institution || '');
  const periodPart = edu.period || (edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : (edu.startDate || edu.endDate || edu.year || ''));
  const gradePart = edu.grade ? (edu.grade.toLowerCase().startsWith('grade') ? edu.grade : `Grade: ${edu.grade}`) : (edu.gpa ? `GPA: ${edu.gpa}` : '');

  const parts = [degreePart, instPart, periodPart, gradePart].filter(Boolean);
  return parts.join(' | ');
}

function formatEducationHtml(edu, escape = escapeHtml) {
  if (!edu || typeof edu !== 'object') return '';
  const degreeTitle = edu.degree || '';
  const fieldText = edu.fieldOfStudy ? ` (${edu.fieldOfStudy})` : '';
  const fullDegree = `${degreeTitle}${fieldText}`;
  const period = edu.period || (edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : (edu.startDate || edu.endDate || edu.year || ''));
  const instAndLoc = [edu.institution, edu.location].filter(Boolean).join(', ');
  const gradeText = edu.grade ? (edu.grade.toLowerCase().startsWith('grade') ? edu.grade : `Grade: ${edu.grade}`) : (edu.gpa ? `GPA: ${edu.gpa}` : '');
  const bullets = Array.isArray(edu.bullets) ? edu.bullets : [];

  return `
    <article class="edu-entry">
      <div class="edu-heading-row">
        <h3 class="role-heading bold">${escape(fullDegree)}</h3>
        ${period ? `<span class="meta bold">${escape(period)}</span>` : ''}
      </div>
      <div class="edu-sub-row">
        <span class="inst">${escape(instAndLoc)}</span>
        ${gradeText ? `<span class="grade">${escape(gradeText)}</span>` : ''}
      </div>
      ${bullets.length > 0 ? `
        <ul class="bullets" style="margin-top: 1px; margin-bottom: 2px;">
          ${bullets.map(b => `<li>${escape(b)}</li>`).join('')}
        </ul>
      ` : ''}
    </article>
  `;
}

function normalizeResumeData(raw) {
  if (!raw || typeof raw !== 'object') return {};

  const normalized = { ...raw };
  const keys = Object.keys(raw);

  function findKey(regex, fallbackKey) {
    if (raw[fallbackKey] !== undefined) return fallbackKey;
    return keys.find(k => regex.test(k));
  }

  // Personal
  const personalKey = findKey(/^(personal|contact|profile|candidate|info)/i, 'personal');
  normalized.personal = (personalKey && typeof raw[personalKey] === 'object') ? { ...raw[personalKey] } : (normalized.personal || {});

  // Summary
  const summaryKey = findKey(/^(summary|about|objective|overview|bio)/i, 'summary');
  normalized.summary = summaryKey ? String(raw[summaryKey] || '') : (normalized.summary || '');

  // Skills
  const skillsKey = findKey(/^(skills|skillset|technical_skills|competencies)/i, 'skills');
  let rawSkills = skillsKey ? raw[skillsKey] : normalized.skills;
  if (Array.isArray(rawSkills)) {
    normalized.skills = rawSkills.map(s => {
      if (typeof s === 'string') return { category: 'Core Skills', skills: s };
      return {
        category: s.category || s.title || s.name || 'Technical Domain',
        skills: s.skills || s.items || s.list || ''
      };
    });
  } else {
    normalized.skills = [];
  }

  // Experience
  const expKey = findKey(/^(experience|work_experience|work|employment|history)/i, 'experience');
  normalized.experience = Array.isArray(raw[expKey]) ? raw[expKey] : (Array.isArray(normalized.experience) ? normalized.experience : []);

  // Projects
  const projKey = findKey(/^(proj|projects|portfolio|selected_projects)/i, 'projects');
  normalized.projects = Array.isArray(raw[projKey]) ? raw[projKey] : (Array.isArray(normalized.projects) ? normalized.projects : []);

  // Education
  const eduKey = findKey(/^(edu|education|academics|qualifications)/i, 'education');
  normalized.education = Array.isArray(raw[eduKey]) ? raw[eduKey] : (Array.isArray(normalized.education) ? normalized.education : []);

  // Achievements
  const achKey = findKey(/^(achieve|achievements|awards|honors)/i, 'achievements');
  normalized.achievements = Array.isArray(raw[achKey]) ? raw[achKey] : (Array.isArray(normalized.achievements) ? normalized.achievements : []);

  // Custom Sections (excluding reserved metadata)
  const standardMatchedKeys = new Set([
    personalKey, summaryKey, skillsKey, expKey, projKey, eduKey, achKey,
    'personal', 'summary', 'skills', 'experience', 'projects', 'education', 'achievements',
    'customSections', 'sectionOrder', 'sectionTitles', 'titles', 'headers',
    'template', 'theme', 'id', 'version', 'meta', 'metadata'
  ].filter(Boolean));

  normalized.customSections = (Array.isArray(normalized.customSections) ? [...normalized.customSections] : [])
    .filter(cs => cs && !['sectionOrder', 'sectionTitles', 'titles', 'headers', 'template', 'theme', 'id', 'version', 'meta', 'metadata'].includes(cs.key));

  keys.forEach(k => {
    if (!standardMatchedKeys.has(k) && raw[k] !== undefined && raw[k] !== null) {
      if (!normalized.customSections.some(cs => cs.key === k)) {
        normalized.customSections.push({
          key: k,
          title: formatSectionTitle(k),
          data: raw[k]
        });
      }
    }
  });

  return normalized;
}

function getCandidateFilename(data, ext) {
  const p = data?.personal || {};
  const rawName = p.name || 'Resume';
  const sanitized = rawName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
  return `${sanitized}_Resume.${cleanExt}`;
}

function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.max(el.scrollHeight, 38) + 'px';
}
window.autoResizeTextarea = autoResizeTextarea;

function autoResizeAllTextareas() {
  requestAnimationFrame(() => {
    document.querySelectorAll('#right-editor-panel textarea').forEach(autoResizeTextarea);
  });
}
window.autoResizeAllTextareas = autoResizeAllTextareas;

function showToast(msg) {
  const toast = document.getElementById('toast');
  const text = document.getElementById('toast-text');
  if (!toast || !text) return;
  text.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}
window.showToast = showToast;

function showConfirmDialog({
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true,
  icon = 'fa-rotate-left'
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const box = document.getElementById('confirm-modal-box');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const okBtn = document.getElementById('confirm-modal-ok');
    const okText = document.getElementById('confirm-modal-ok-text');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const iconEl = document.getElementById('confirm-modal-icon');
    const iconContainer = document.getElementById('confirm-modal-icon-container');

    if (!modal) {
      resolve(window.confirm(message));
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.innerHTML = message;
    if (okText) okText.textContent = confirmText;
    if (cancelBtn) cancelBtn.textContent = cancelText;
    if (iconEl) iconEl.className = `fa-solid ${icon} text-base`;

    if (danger) {
      if (okBtn) okBtn.className = 'px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-sm transition flex items-center gap-1.5';
      if (iconContainer) iconContainer.className = 'w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80 shrink-0';
    } else {
      if (okBtn) okBtn.className = 'px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-sm transition flex items-center gap-1.5';
      if (iconContainer) iconContainer.className = 'w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80 shrink-0';
    }

    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
      if (box) {
        box.classList.remove('scale-95', 'opacity-0');
        box.classList.add('scale-100', 'opacity-100');
      }
    });

    const cleanup = (result) => {
      if (box) {
        box.classList.remove('scale-100', 'opacity-100');
        box.classList.add('scale-95', 'opacity-0');
      }
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 150);
      document.removeEventListener('keydown', handleKey);
      modal.removeEventListener('click', handleBackdrop);
      if (okBtn) okBtn.onclick = null;
      if (cancelBtn) cancelBtn.onclick = null;
      resolve(result);
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') cleanup(false);
      if (e.key === 'Enter') cleanup(true);
    };

    const handleBackdrop = (e) => {
      if (e.target === modal) cleanup(false);
    };

    if (okBtn) okBtn.onclick = () => cleanup(true);
    if (cancelBtn) cancelBtn.onclick = () => cleanup(false);
    document.addEventListener('keydown', handleKey);
    modal.addEventListener('click', handleBackdrop);
  });
}
window.showConfirmDialog = showConfirmDialog;

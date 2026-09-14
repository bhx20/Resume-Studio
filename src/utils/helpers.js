/**
 * Generates a clean, sanitized filename based on candidate name and requested extension.
 * e.g. (data, 'pdf') -> "Sanket_Kalathiya_Resume.pdf"
 */
function getCandidateFilename(data, ext) {
  const p = data?.personal || {};
  const rawName = p.name || 'Resume';
  const sanitized = rawName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
  return `${sanitized}_Resume.${cleanExt}`;
}

/**
 * Escapes HTML characters to prevent XSS in rendered templates.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Resolves credential category from explicit field or intelligent inference.
 */
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

/**
 * Formats an education item into clean ATS line tokens.
 */
function formatEducationLine(edu) {
  if (!edu || typeof edu !== 'object') return '';
  const degreePart = edu.fieldOfStudy ? `${edu.degree || ''} (${edu.fieldOfStudy})` : (edu.degree || '');
  const instPart = edu.location ? `${edu.institution || ''}, ${edu.location}` : (edu.institution || '');
  const periodPart = edu.period || (edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : (edu.startDate || edu.endDate || edu.year || ''));
  const gradePart = edu.grade ? (edu.grade.toLowerCase().startsWith('grade') ? edu.grade : `Grade: ${edu.grade}`) : (edu.gpa ? `GPA: ${edu.gpa}` : '');

  const parts = [degreePart, instPart, periodPart, gradePart].filter(Boolean);
  return parts.join(' | ');
}

/**
 * Formats an education item into rich, structured 2-row ATS HTML.
 * Heading row: Degree/Field (bold) on left, Period (bold) on right.
 * Sub row: Institution/Location on left, Grade/GPA on right.
 */
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

/**
 * Formats a key name into a professional ATS section heading.
 * e.g. "certifications" -> "CERTIFICATIONS", "work_highlights" -> "WORK HIGHLIGHTS"
 */
function formatSectionTitle(str) {
  if (!str) return 'CUSTOM SECTION';
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toUpperCase();
}

const defaultSectionTitles = {
  summary: 'PROFESSIONAL SUMMARY',
  skills: 'TECHNICAL SKILLS MATRIX',
  experience: 'PROFESSIONAL EXPERIENCE',
  projects: 'KEY PROJECTS & DELIVERABLES',
  achievements: 'CORE ENGINEERING & ACHIEVEMENTS',
  education: 'EDUCATION'
};

/**
 * Resolves section title dynamically from data.sectionTitles, custom sections, or default fallback.
 * Guarantees zero hardcoded titles across the entire application.
 */
function getSectionTitle(data, key, defaultFallback = '') {
  if (!data) return defaultFallback || formatSectionTitle(key);

  // 1. Direct sectionTitles dictionary
  if (data.sectionTitles && typeof data.sectionTitles === 'object' && data.sectionTitles[key]) {
    return String(data.sectionTitles[key]).trim();
  }
  // 2. Direct titles dictionary
  if (data.titles && typeof data.titles === 'object' && data.titles[key]) {
    return String(data.titles[key]).trim();
  }
  // 3. Direct headers dictionary
  if (data.headers && typeof data.headers === 'object' && data.headers[key]) {
    return String(data.headers[key]).trim();
  }
  // 4. Custom sections list entry
  if (Array.isArray(data.customSections)) {
    const cs = data.customSections.find(c => c.key === key);
    if (cs && cs.title) return String(cs.title).trim();
  }
  // 5. Explicit title attribute inside section object if object
  if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key]) && data[key].title) {
    return String(data[key].title).trim();
  }

  return defaultFallback || defaultSectionTitles[key] || formatSectionTitle(key);
}

/**
 * Normalizes resume data dynamically:
 * 1. Uses intelligent alias matching for standard sections (e.g. 'projdsds...' -> 'projects').
 * 2. Extracts any extra / unknown top-level categories into dynamic 'customSections'.
 * 3. Preserves 100% of all original keys and data without dropping anything.
 */
function normalizeResumeData(raw) {
  if (!raw || typeof raw !== 'object') return {};

  const normalized = { ...raw };
  const keys = Object.keys(raw);

  function findKey(regex, fallbackKey) {
    if (raw[fallbackKey] !== undefined) return fallbackKey;
    return keys.find(k => regex.test(k));
  }

  // Personal / Contact info
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

  // Projects (matches /^proj/i, tolerant to variations)
  const projKey = findKey(/^(proj|projects|portfolio|selected_projects)/i, 'projects');
  normalized.projects = Array.isArray(raw[projKey]) ? raw[projKey] : (Array.isArray(normalized.projects) ? normalized.projects : []);

  // Education
  const eduKey = findKey(/^(edu|education|academics|qualifications)/i, 'education');
  normalized.education = Array.isArray(raw[eduKey]) ? raw[eduKey] : (Array.isArray(normalized.education) ? normalized.education : []);

  // Achievements
  const achKey = findKey(/^(achieve|achievements|awards|honors)/i, 'achievements');
  normalized.achievements = Array.isArray(raw[achKey]) ? raw[achKey] : (Array.isArray(normalized.achievements) ? normalized.achievements : []);

  // Collect ALL remaining custom / dynamic categories
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

  // 3. Section Order normalization
  const defaultOrder = ['summary', 'skills', 'experience', 'projects', 'achievements', 'education'];
  normalized.customSections.forEach(cs => {
    if (!defaultOrder.includes(cs.key) && !['sectionOrder', 'sectionTitles', 'titles', 'headers', 'template', 'theme', 'id', 'version', 'meta', 'metadata'].includes(cs.key)) {
      defaultOrder.push(cs.key);
    }
  });

  if (Array.isArray(raw.sectionOrder) && raw.sectionOrder.length > 0) {
    const userOrder = raw.sectionOrder.filter(id => defaultOrder.includes(id) && !['sectionOrder', 'sectionTitles', 'titles', 'headers', 'template', 'theme', 'id', 'version', 'meta', 'metadata'].includes(id));
    defaultOrder.forEach(id => {
      if (!userOrder.includes(id)) userOrder.push(id);
    });
    normalized.sectionOrder = userOrder;
  } else {
    normalized.sectionOrder = defaultOrder;
  }

  // 4. Dynamic Section Titles normalization
  normalized.sectionTitles = { ...defaultSectionTitles };
  if (raw.sectionTitles && typeof raw.sectionTitles === 'object') {
    Object.assign(normalized.sectionTitles, raw.sectionTitles);
  } else if (raw.titles && typeof raw.titles === 'object') {
    Object.assign(normalized.sectionTitles, raw.titles);
  } else if (raw.headers && typeof raw.headers === 'object') {
    Object.assign(normalized.sectionTitles, raw.headers);
  }
  normalized.customSections.forEach(cs => {
    if (!normalized.sectionTitles[cs.key]) {
      normalized.sectionTitles[cs.key] = cs.title || formatSectionTitle(cs.key);
    }
  });

  return normalized;
}

/**
 * Renders custom sections dynamically to HTML.
 */
function renderCustomSectionHtml(cs, escape = escapeHtml, titleOverride = null) {
  const title = escape(titleOverride || cs.title || formatSectionTitle(cs.key));
  const data = cs.data;
  if (!data) return '';

  let bodyHtml = '';
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    if (typeof data[0] === 'string') {
      bodyHtml = `
        <ul class="bullets">
          ${data.map(item => `<li>${escape(item)}</li>`).join('')}
        </ul>
      `;
    } else if (typeof data[0] === 'object') {
      bodyHtml = data.map(item => {
        const itemTitle = item.title || item.name || item.role || '';
        const itemMeta = item.issuer || item.institution || item.period || item.date || item.level || '';
        const bullets = Array.isArray(item.bullets) ? item.bullets : [];
        const desc = item.description || item.desc || '';
        return `
          <div style="margin-top: 3px; margin-bottom: 3px;">
            ${itemTitle ? `<h3 class="role-heading bold" style="margin-bottom:0;">${escape(itemTitle)}${itemMeta ? ` <span class="proj-stack">| ${escape(itemMeta)}</span>` : ''}</h3>` : ''}
            ${desc ? `<p class="summary" style="margin-top: 1px; margin-bottom: 2px;">${escape(desc)}</p>` : ''}
            ${bullets.length > 0 ? `
              <ul class="bullets">
                ${bullets.map(b => `<li>${escape(b)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `;
      }).join('');
    }
  } else if (typeof data === 'string') {
    bodyHtml = `<p class="summary">${escape(data)}</p>`;
  } else if (typeof data === 'object') {
    bodyHtml = Object.entries(data).map(([k, v]) => `
      <div class="skill-line">
        <strong class="bold">${escape(formatSectionTitle(k))}:</strong> ${escape(Array.isArray(v) ? v.join(', ') : String(v))}
      </div>
    `).join('');
  }

  return `
    <section>
      <h2 class="section-title">${title}</h2>
      ${bodyHtml}
    </section>
  `;
}

module.exports = {
  getCandidateFilename,
  escapeHtml,
  getEduCategory,
  formatEducationLine,
  formatEducationHtml,
  formatSectionTitle,
  defaultSectionTitles,
  getSectionTitle,
  normalizeResumeData,
  renderCustomSectionHtml
};

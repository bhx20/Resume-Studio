const { normalizeResumeData, renderCustomSectionHtml, getSectionTitle, escapeHtml, formatEducationLine, formatEducationHtml } = require('../utils/helpers');

function generateHtml(raw) {
  const data = normalizeResumeData(raw);
  const p = data.personal || {};

  const skillsHtml = (data.skills || []).map(s => `
    <div class="skill-line">
      <strong class="bold">${escapeHtml(s.category)}:</strong> ${escapeHtml(s.skills)}
    </div>
  `).join('');

  const expHtml = (data.experience || []).map(e => `
    <article class="exp-entry">
      <h3 class="role-heading bold">${escapeHtml(e.company || '')} | ${escapeHtml(e.role || '')}</h3>
      <div class="meta">${escapeHtml(e.period || '')}${e.location ? ' | ' + escapeHtml(e.location) : ''}</div>
      <ul class="bullets">
        ${(e.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
    </article>
  `).join('');

  const projHtml = (data.projects || []).map(proj => `
    <article class="proj-entry">
      <h3 class="proj-heading bold">${escapeHtml(proj.title || '')}${proj.tech ? ' | <span class="proj-stack">' + escapeHtml(proj.tech) + '</span>' : ''}</h3>
      <ul class="bullets">
        ${(proj.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
    </article>
  `).join('');

  const achievements = data.achievements || [];
  const achHtml = achievements.length > 0 ? `
    <section>
      <h2 class="section-title">${escapeHtml(getSectionTitle(data, 'achievements', 'CORE ENGINEERING & ACHIEVEMENTS').toUpperCase())}</h2>
      <ul class="bullets" style="margin-bottom: 8px;">
        ${achievements.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
      </ul>
    </section>
  ` : '';

  const eduHtml = (data.education || []).map(edu => formatEducationHtml(edu, escapeHtml)).join('');

  const sectionRenderers = {
    summary: () => `
      <section>
        <h2 class="section-title">${escapeHtml(getSectionTitle(data, 'summary', 'PROFESSIONAL SUMMARY').toUpperCase())}</h2>
        <p class="summary">${escapeHtml(data.summary || '')}</p>
      </section>
    `,
    skills: () => `
      <section>
        <h2 class="section-title">${escapeHtml(getSectionTitle(data, 'skills', 'TECHNICAL SKILLS MATRIX').toUpperCase())}</h2>
        ${skillsHtml}
      </section>
    `,
    experience: () => `
      <section>
        <h2 class="section-title">${escapeHtml(getSectionTitle(data, 'experience', 'PROFESSIONAL EXPERIENCE').toUpperCase())}</h2>
        ${expHtml}
      </section>
    `,
    projects: () => `
      <section>
        <h2 class="section-title" style="margin-top:0;">${escapeHtml(getSectionTitle(data, 'projects', 'KEY PROJECTS & DELIVERABLES').toUpperCase())}</h2>
        ${projHtml}
      </section>
    `,
    achievements: () => achHtml,
    education: () => `
      <section>
        <h2 class="section-title">${escapeHtml(getSectionTitle(data, 'education', 'EDUCATION').toUpperCase())}</h2>
        ${eduHtml}
      </section>
    `
  };

  (data.customSections || []).forEach(cs => {
    if (cs && cs.key && !['sectionOrder', 'sectionTitles', 'titles', 'headers', 'template', 'theme', 'id', 'version', 'meta', 'metadata'].includes(cs.key)) {
      sectionRenderers[cs.key] = () => renderCustomSectionHtml(cs, escapeHtml, getSectionTitle(data, cs.key, cs.title));
    }
  });

  const defaultOrder = ['summary', 'skills', 'experience', 'projects', 'achievements', 'education'];
  (data.customSections || []).forEach(cs => {
    if (cs && cs.key && !defaultOrder.includes(cs.key) && !['sectionOrder', 'sectionTitles', 'titles', 'headers', 'template', 'theme', 'id', 'version', 'meta', 'metadata'].includes(cs.key)) {
      defaultOrder.push(cs.key);
    }
  });

  const order = (Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0)
    ? data.sectionOrder.filter(id => !['sectionOrder', 'sectionTitles', 'titles', 'headers', 'template', 'theme', 'id', 'version', 'meta', 'metadata'].includes(id))
    : defaultOrder;

  // Estimate block heights for A4 pagination (usable height ~1018px)
  const headerHtml = `
    <header>
      <h1>${escapeHtml(p.name || 'Candidate Name')}</h1>
      <div class="subtitle">${escapeHtml(p.title || 'Software Engineer')}</div>
      <div class="contact-line">${escapeHtml(p.location || '')} | ${escapeHtml(p.phone || '')} | <a href="mailto:${escapeHtml(p.email || '')}">${escapeHtml(p.email || '')}</a></div>
      <div class="contact-line">LinkedIn: <a href="${escapeHtml(p.linkedin || '')}">${escapeHtml(p.linkedin || '')}</a> | GitHub: <a href="${escapeHtml(p.github || '')}">${escapeHtml(p.github || '')}</a></div>
    </header>
  `;

  function estimateSectionHeight(id) {
    if (id === 'summary') return 95;
    if (id === 'skills') return 30 + ((data.skills || []).length * 27);
    if (id === 'experience') {
      const exps = data.experience || [];
      const totalBullets = exps.reduce((acc, e) => acc + (e.bullets || []).length, 0);
      return 30 + (exps.length * 55) + (totalBullets * 18);
    }
    if (id === 'projects') {
      const projs = data.projects || [];
      const totalBullets = projs.reduce((acc, pr) => acc + (pr.bullets || []).length, 0);
      return 30 + (projs.length * 40) + (totalBullets * 18);
    }
    if (id === 'education') return 30 + ((data.education || []).length * 40);
    if (id === 'achievements') return 30 + ((data.achievements || []).length * 20);
    return 150;
  }

  const MAX_PAGE_HEIGHT = 1018;
  const pages = [{ pageNum: 1, items: [headerHtml], height: 85 }];

  order.forEach(id => {
    if (!sectionRenderers[id]) return;
    const sHtml = sectionRenderers[id]();
    if (!sHtml || !sHtml.trim()) return;

    const sHeight = estimateSectionHeight(id);
    let curPage = pages[pages.length - 1];

    if (curPage.height + sHeight <= MAX_PAGE_HEIGHT) {
      curPage.items.push(sHtml);
      curPage.height += sHeight;
    } else {
      if (curPage.items.length > 0) {
        pages.push({ pageNum: pages.length + 1, items: [sHtml], height: sHeight });
      } else {
        curPage.items.push(sHtml);
        curPage.height += sHeight;
      }
    }
  });

  // Ensure at least 2 pages exist for standard 2-page template requirements
  if (pages.length === 1) {
    pages.push({ pageNum: 2, items: [], height: 0 });
  }

  const sheetsHtml = pages.map(pg => `
  <!-- PAGE ${pg.pageNum} -->
  <main class="sheet page-${pg.pageNum}">
    ${pg.items.join('\n    ')}
  </main>
  `).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(p.name || 'Candidate Name')} - ${escapeHtml(p.title || 'Software Engineer')} - Resume</title>
  <meta name="author" content="${escapeHtml(p.name || 'Candidate Name')}">
  <meta name="description" content="${escapeHtml((p.name || 'Candidate Name') + ', ' + (p.title || 'Software Engineer') + ' resume')}">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000000;
      background: #f1f5f9;
      font-size: 8.9pt;
      line-height: 1.28;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    .sheet {
      width: 210mm;
      min-height: 297mm;
      height: 297mm;
      margin: 20px auto;
      background: #ffffff;
      padding: 10mm 12mm;
      box-sizing: border-box;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      position: relative;
    }
    .sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    header {
      margin-bottom: 5px;
    }
    h1 {
      font-size: 19pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      word-spacing: normal;
      line-height: 1.1;
      margin-bottom: 1.5px;
    }
    .subtitle {
      font-size: 11pt;
      font-weight: bold;
      letter-spacing: normal;
      word-spacing: normal;
      margin-bottom: 2px;
    }
    .contact-line {
      font-size: 8.6pt;
      line-height: 1.32;
      letter-spacing: normal;
      word-spacing: normal;
    }
    .contact-line a {
      color: #000000;
      text-decoration: none;
    }
    h2.section-title {
      font-size: 10.2pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      word-spacing: normal;
      margin-top: 5px;
      margin-bottom: 3px;
      border-bottom: 1px solid #111111;
      padding-bottom: 1px;
    }
    p.summary {
      font-size: 8.7pt;
      line-height: 1.28;
      text-align: left;
      letter-spacing: normal;
      word-spacing: normal;
      margin-bottom: 3px;
    }
    .skill-line {
      font-size: 8.5pt;
      line-height: 1.25;
      margin-bottom: 1.5px;
      text-align: left;
      letter-spacing: normal;
      word-spacing: normal;
    }
    .bold {
      font-weight: bold;
    }
    .role-heading, .proj-heading {
      font-size: 8.9pt;
      font-weight: bold;
      line-height: 1.22;
      letter-spacing: normal;
      word-spacing: normal;
      margin-top: 3.5px;
      margin-bottom: 0.5px;
    }
    .proj-stack {
      font-weight: normal;
      font-size: 8.4pt;
      color: #222222;
      letter-spacing: normal;
      word-spacing: normal;
    }
    .meta {
      font-size: 8.5pt;
      color: #222222;
      letter-spacing: normal;
      word-spacing: normal;
      margin-bottom: 1.5px;
    }
    .exp-entry {
      margin-bottom: 4px;
    }
    ul.bullets {
      list-style-type: disc;
      padding-left: 14px;
      margin-bottom: 1px;
    }
    ul.bullets li {
      font-size: 8.5pt;
      line-height: 1.25;
      margin-bottom: 1px;
      text-align: left;
      letter-spacing: normal;
      word-spacing: normal;
    }
    .proj-entry {
      margin-bottom: 7px;
    }
    .edu-entry {
      margin-bottom: 4px;
    }
    .edu-heading-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .edu-heading-row .role-heading {
      margin: 0;
      font-size: 8.9pt;
      font-weight: bold;
      color: #000000;
    }
    .edu-sub-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 8.3pt;
      color: #333333;
      margin-top: 0.5px;
      gap: 8px;
    }
    .edu-sub-row .grade {
      color: #475569;
      font-style: italic;
    }
    .edu-line {
      font-size: 8.5pt;
      line-height: 1.3;
      margin-bottom: 2px;
    }
    .no-print {
      display: none;
    }
    @media print {
      body {
        background: #ffffff;
        margin: 0;
        padding: 0;
      }
      .sheet {
        margin: 0 auto;
        box-shadow: none;
        width: 210mm;
        min-height: 297mm;
        height: 297mm;
        padding: 10mm 12mm;
        page-break-after: always;
        break-after: page;
        box-sizing: border-box;
      }
      .sheet:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      .exp-entry, .proj-entry, .edu-entry, .skill-line, ul.bullets li, article {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      h1, h2, h3, .section-title, .role-heading, .proj-heading {
        break-after: avoid;
        page-break-after: avoid;
      }
      @page {
        size: A4 portrait;
        margin: 0;
      }
      a {
        text-decoration: none;
        color: inherit;
      }
    }
  </style>
</head>
<body>
  ${sheetsHtml}
</body>
</html>`;
}

module.exports = {
  generateHtml
};

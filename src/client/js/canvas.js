// Resume Studio — 2-Page WYSIWYG Canvas Renderer & Section Interactions

function getValidSectionOrder() {
  const baseOrder = ['summary', 'skills', 'projects', 'experience', 'achievements', 'education'];
  (resumeData.customSections || []).forEach(cs => {
    if (cs && cs.key && !baseOrder.includes(cs.key) && !['sectionOrder', 'sectionTitles', 'titles', 'headers', 'template', 'theme', 'id', 'version', 'meta', 'metadata'].includes(cs.key)) {
      baseOrder.push(cs.key);
    }
  });
  if (!Array.isArray(resumeData.sectionOrder) || resumeData.sectionOrder.length === 0) {
    resumeData.sectionOrder = [...baseOrder];
  } else {
    const current = resumeData.sectionOrder.filter(k => baseOrder.includes(k) && !['sectionOrder', 'sectionTitles', 'titles', 'headers', 'template', 'theme', 'id', 'version', 'meta', 'metadata'].includes(k));
    baseOrder.forEach(k => {
      if (!current.includes(k)) current.push(k);
    });
    resumeData.sectionOrder = current;
  }
  return resumeData.sectionOrder;
}
window.getValidSectionOrder = getValidSectionOrder;

window.jumpCurrentSection = function(toIdx) {
  if (!currentActiveSectionId || currentActiveSectionId === 'personal') return;
  const order = getValidSectionOrder();
  const fromIdx = order.indexOf(currentActiveSectionId);
  if (fromIdx === -1 || toIdx < 0 || toIdx >= order.length || fromIdx === toIdx) return;

  const [item] = order.splice(fromIdx, 1);
  order.splice(toIdx, 0, item);
  resumeData.sectionOrder = [...order];
  scheduleRender();
  if (typeof updateSectionHeadingEditor === 'function') {
    updateSectionHeadingEditor(currentActiveSectionId);
  }
  showToast(`Moved ${formatSectionTitleDisplay(currentActiveSectionId)} to position ${toIdx + 1}`);
};

window.moveCurrentSection = function(direction) {
  if (!currentActiveSectionId || currentActiveSectionId === 'personal') return;
  const order = getValidSectionOrder();
  const idx = order.indexOf(currentActiveSectionId);
  if (idx === -1) return;
  window.jumpCurrentSection(idx + direction);
};

// Custom Section HTML Renderer for Client
function renderCustomSectionHtml(cs, escape = escapeHtml, titleOverride = null) {
  const title = escape(titleOverride || cs.title || formatSectionTitle(cs.key)).toUpperCase();
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
    <h2 class="section-title" contenteditable="true" data-title-key="${escape(cs.key)}">${title}</h2>
    ${bodyHtml}
  `;
}
window.renderCustomSectionHtml = renderCustomSectionHtml;

// Render Pages (100% WYSIWYG match with server.js generateHtml)
function renderPages() {
  const page1 = document.getElementById('page-1-content');
  const page2 = document.getElementById('page-2-content');
  if (!page1 || !page2 || !resumeData) return;
  const p = resumeData.personal || {};

  const skillsHtml = (resumeData.skills || []).map(s => `
    <div class="skill-line">
      <strong class="bold">${escapeHtml(s.category)}:</strong> ${escapeHtml(s.skills)}
    </div>
  `).join('');

  const expHtml = (resumeData.experience || []).map(e => `
    <article class="exp-entry">
      <h3 class="role-heading bold">${escapeHtml(e.company)} | ${escapeHtml(e.role)}</h3>
      <div class="meta">${escapeHtml(e.period)}${e.location ? ' | ' + escapeHtml(e.location) : ''}</div>
      <ul class="bullets">
        ${(e.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
    </article>
  `).join('');

  const projHtml = (resumeData.projects || []).map(proj => `
    <article class="proj-entry">
      <h3 class="proj-heading bold">${escapeHtml(proj.title)}${proj.tech ? ' | <span class="proj-stack">' + escapeHtml(proj.tech) + '</span>' : ''}</h3>
      <ul class="bullets">
        ${(proj.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
    </article>
  `).join('');

  const achievements = resumeData.achievements || [];
  const achBulletsHtml = (achievements || []).map(a => `<li>${escapeHtml(a)}</li>`).join('');

  const eduHtml = (resumeData.education || []).map(edu => formatEducationHtml(edu, escapeHtml)).join('');

  const headerHtml = `
    <header class="resume-section" data-section-id="personal" title="Click to edit personal information">
      <span class="section-edit-badge"><i class="fa-solid fa-pen text-[8px] mr-1"></i>Edit</span>
      <h1>${escapeHtml(p.name || 'Sanket Kalathiya')}</h1>
      <div class="subtitle">${escapeHtml(p.title || 'Lead Flutter Developer & Mobile Architect | Multi-Platform (Mobile & Web)')}</div>
      <div class="contact-line">
        ${escapeHtml(p.location || '')} | ${escapeHtml(p.phone || '')} | <a href="mailto:${escapeHtml(p.email || '')}">${escapeHtml(p.email || '')}</a>
      </div>
      <div class="contact-line">
        LinkedIn: <a href="${escapeHtml(p.linkedin || '')}" target="_blank">${escapeHtml((p.linkedin || '').replace(/^https?:\/\//, ''))}</a> | GitHub: <a href="${escapeHtml(p.github || '')}" target="_blank">${escapeHtml((p.github || '').replace(/^https?:\/\//, ''))}</a>
      </div>
    </header>
  `;

  const sectionRenderers = {
    summary: () => `
      <section class="resume-section" draggable="true" data-section-id="summary">
        <div class="section-drag-handle" draggable="true" title="Drag to reorder section"><i class="fa-solid fa-grip-vertical"></i> <span class="drag-text">DRAG</span></div>
        <span class="section-edit-badge"><i class="fa-solid fa-pen text-[8px] mr-1"></i>Edit</span>
        <h2 class="section-title" contenteditable="true" data-title-key="summary">${escapeHtml(getSectionTitle(resumeData, 'summary', 'PROFESSIONAL SUMMARY').toUpperCase())}</h2>
        <p class="summary">${escapeHtml(resumeData.summary || '')}</p>
      </section>
    `,
    skills: () => `
      <section class="resume-section" draggable="true" data-section-id="skills">
        <div class="section-drag-handle" draggable="true" title="Drag to reorder section"><i class="fa-solid fa-grip-vertical"></i> <span class="drag-text">DRAG</span></div>
        <span class="section-edit-badge"><i class="fa-solid fa-pen text-[8px] mr-1"></i>Edit</span>
        <h2 class="section-title" contenteditable="true" data-title-key="skills">${escapeHtml(getSectionTitle(resumeData, 'skills', 'TECHNICAL SKILLS MATRIX').toUpperCase())}</h2>
        ${skillsHtml}
      </section>
    `,
    experience: () => `
      <section class="resume-section" draggable="true" data-section-id="experience">
        <div class="section-drag-handle" draggable="true" title="Drag to reorder section"><i class="fa-solid fa-grip-vertical"></i> <span class="drag-text">DRAG</span></div>
        <span class="section-edit-badge"><i class="fa-solid fa-pen text-[8px] mr-1"></i>Edit</span>
        <h2 class="section-title" contenteditable="true" data-title-key="experience">${escapeHtml(getSectionTitle(resumeData, 'experience', 'PROFESSIONAL EXPERIENCE').toUpperCase())}</h2>
        ${expHtml}
      </section>
    `,
    projects: () => `
      <section class="resume-section" draggable="true" data-section-id="projects">
        <div class="section-drag-handle" draggable="true" title="Drag to reorder section"><i class="fa-solid fa-grip-vertical"></i> <span class="drag-text">DRAG</span></div>
        <span class="section-edit-badge"><i class="fa-solid fa-pen text-[8px] mr-1"></i>Edit</span>
        <h2 class="section-title" contenteditable="true" style="margin-top:0;" data-title-key="projects">${escapeHtml(getSectionTitle(resumeData, 'projects', 'KEY PROJECTS & DELIVERABLES').toUpperCase())}</h2>
        ${projHtml}
      </section>
    `,
    achievements: () => (achievements.length > 0) ? `
      <section class="resume-section" draggable="true" data-section-id="achievements">
        <div class="section-drag-handle" draggable="true" title="Drag to reorder section"><i class="fa-solid fa-grip-vertical"></i> <span class="drag-text">DRAG</span></div>
        <span class="section-edit-badge"><i class="fa-solid fa-pen text-[8px] mr-1"></i>Edit</span>
        <h2 class="section-title" contenteditable="true" data-title-key="achievements">${escapeHtml(getSectionTitle(resumeData, 'achievements', 'CORE ENGINEERING & ACHIEVEMENTS').toUpperCase())}</h2>
        <ul class="bullets" style="margin-bottom: 8px;">
          ${achBulletsHtml}
        </ul>
      </section>
    ` : '',
    education: () => `
      <section class="resume-section" draggable="true" data-section-id="education">
        <div class="section-drag-handle" draggable="true" title="Drag to reorder section"><i class="fa-solid fa-grip-vertical"></i> <span class="drag-text">DRAG</span></div>
        <span class="section-edit-badge"><i class="fa-solid fa-pen text-[8px] mr-1"></i>Edit</span>
        <h2 class="section-title" contenteditable="true" data-title-key="education">${escapeHtml(getSectionTitle(resumeData, 'education', 'EDUCATION').toUpperCase())}</h2>
        ${eduHtml}
      </section>
    `
  };

  (resumeData.customSections || []).forEach(cs => {
    if (cs && cs.key && !['sectionOrder', 'sectionTitles', 'titles', 'headers', 'template', 'theme', 'id', 'version', 'meta', 'metadata'].includes(cs.key)) {
      sectionRenderers[cs.key] = () => `
        <section class="resume-section" draggable="true" data-section-id="${cs.key}">
          <div class="section-drag-handle" draggable="true" title="Drag to reorder section"><i class="fa-solid fa-grip-vertical"></i> <span class="drag-text">DRAG</span></div>
          <span class="section-edit-badge"><i class="fa-solid fa-pen text-[8px] mr-1"></i>Edit</span>
          ${renderCustomSectionHtml(cs, escapeHtml, getSectionTitle(resumeData, cs.key, cs.title))}
        </section>
      `;
    }
  });

  const order = getValidSectionOrder();

  // Distribute sections: first 3 on Page 1, remaining on Page 2
  const p1Sections = order.slice(0, 3).map(id => sectionRenderers[id] ? sectionRenderers[id]() : '').join('');
  const p2Sections = order.slice(3).map(id => sectionRenderers[id] ? sectionRenderers[id]() : '').join('');

  page1.innerHTML = headerHtml + p1Sections;
  page2.innerHTML = p2Sections;

  setupSectionInteractions();
  updatePageFitMeter();
}
window.renderPages = renderPages;

// Attaches Click-to-Edit and Drag-and-Drop handlers to all resume sections
function setupSectionInteractions() {
  const sections = document.querySelectorAll('.resume-section');
  sections.forEach(el => {
    const secId = el.dataset.sectionId;

    // 1. Click section to open right-side editor and focus tab
    el.addEventListener('click', (e) => {
      if (e.target.closest('.section-drag-handle')) return;
      if (e.target.closest('.section-title[contenteditable="true"]')) return;
      if (typeof selectAndOpenSection === 'function') {
        selectAndOpenSection(secId);
      }
    });

    // 2. Drag & Drop for reordering
    if (secId !== 'personal') {
      const handle = el.querySelector('.section-drag-handle');
      if (handle) {
        handle.setAttribute('draggable', 'true');
        handle.addEventListener('dragstart', (e) => {
          e.stopPropagation();
          draggedSectionId = secId;
          el.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', secId);
          try {
            if (e.dataTransfer.setDragImage) {
              e.dataTransfer.setDragImage(el, 20, 20);
            }
          } catch (_) {}
        });
        handle.addEventListener('dragend', () => {
          el.classList.remove('dragging');
          document.querySelectorAll('.resume-section').forEach(s => s.classList.remove('drag-over'));
        });
      }

      el.addEventListener('dragstart', (e) => {
        if (e.target.closest('[contenteditable="true"]') || e.target.closest('input, textarea, button')) {
          e.preventDefault();
          return;
        }
        draggedSectionId = secId;
        el.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', secId);
      });

      el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
        document.querySelectorAll('.resume-section').forEach(s => s.classList.remove('drag-over'));
      });

      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (secId && secId !== draggedSectionId && secId !== 'personal') {
          el.classList.add('drag-over');
        }
      });

      el.addEventListener('dragleave', (e) => {
        if (!el.contains(e.relatedTarget)) {
          el.classList.remove('drag-over');
        }
      });

      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('drag-over');
        if (!draggedSectionId || !secId || draggedSectionId === secId || secId === 'personal') return;

        const currentOrder = [...getValidSectionOrder()];
        const fromIdx = currentOrder.indexOf(draggedSectionId);
        const toIdx = currentOrder.indexOf(secId);

        if (fromIdx !== -1 && toIdx !== -1) {
          currentOrder.splice(fromIdx, 1);
          currentOrder.splice(toIdx, 0, draggedSectionId);
          resumeData.sectionOrder = currentOrder;
          scheduleRender();
          if (currentActiveSectionId && typeof updateSectionHeadingEditor === 'function') {
            updateSectionHeadingEditor(currentActiveSectionId);
          }
          showToast(`Reordered: ${getSectionTitle(resumeData, draggedSectionId)} moved!`);
        }
      });
    }
  });

  // Cross-page container drop support
  const p1Content = document.getElementById('page-1-content');
  const p2Content = document.getElementById('page-2-content');
  [p1Content, p2Content].forEach((container, cIdx) => {
    if (!container) return;
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    container.addEventListener('drop', (e) => {
      if (e.target.closest('.resume-section')) return;
      e.preventDefault();
      if (!draggedSectionId || draggedSectionId === 'personal') return;

      const currentOrder = [...getValidSectionOrder()];
      const fromIdx = currentOrder.indexOf(draggedSectionId);
      if (fromIdx === -1) return;

      currentOrder.splice(fromIdx, 1);
      if (cIdx === 0) {
        currentOrder.unshift(draggedSectionId);
      } else {
        currentOrder.push(draggedSectionId);
      }
      resumeData.sectionOrder = currentOrder;
      scheduleRender();
      if (currentActiveSectionId && typeof updateSectionHeadingEditor === 'function') {
        updateSectionHeadingEditor(currentActiveSectionId);
      }
      showToast(`Reordered: ${getSectionTitle(resumeData, draggedSectionId)} moved to Page ${cIdx + 1}!`);
    });
  });

  // Direct Inline Heading Editing on Canvas
  document.querySelectorAll('.section-title[contenteditable="true"]').forEach(titleEl => {
    titleEl.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    titleEl.addEventListener('input', () => {
      const key = titleEl.dataset.titleKey;
      if (!key || !resumeData) return;
      const newTitle = titleEl.innerText.trim();
      resumeData.sectionTitles = resumeData.sectionTitles || {};
      resumeData.sectionTitles[key] = newTitle;

      if (key === currentActiveSectionId) {
        const inp = document.getElementById('inp-active-section-heading');
        if (inp) inp.value = newTitle;
        const panelTitle = document.getElementById('editor-panel-title');
        if (panelTitle) panelTitle.textContent = `Edit: ${newTitle}`;
      }
    });
    titleEl.addEventListener('blur', () => {
      scheduleRender();
    });
  });
}
window.setupSectionInteractions = setupSectionInteractions;

// Calculate Page Height & Fit
function updatePageFitMeter() {
  requestAnimationFrame(() => {
    const page1 = document.querySelector('[data-purpose="resume-document-page-1"]');
    const page2 = document.querySelector('[data-purpose="resume-document-page-2"]');
    if (!page1 || !page2) return;

    const content1 = document.getElementById('page-1-content');
    const content2 = document.getElementById('page-2-content');

    const h1 = content1.scrollHeight;
    const max1 = page1.clientHeight - 60;
    const pct1 = Math.round((h1 / max1) * 100);

    const h2 = content2.scrollHeight;
    const max2 = page2.clientHeight - 60;
    const pct2 = Math.round((h2 / max2) * 100);

    const badge = document.getElementById('page-fit-badge');
    if (badge) {
      if (pct1 <= 102 && pct2 <= 102) {
        badge.textContent = `Page 1: ${pct1}% | Page 2: ${pct2}% (Perfect 2-Page Fit ✅)`;
      } else {
        badge.textContent = `P1: ${pct1}% | P2: ${pct2}% (Adjusting budget...)`;
      }
    }
  });
}
window.updatePageFitMeter = updatePageFitMeter;

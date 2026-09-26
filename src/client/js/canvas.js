// Resume Studio — 2-Page WYSIWYG Canvas Renderer & Section Interactions

function getValidSectionOrder() {
  const baseOrder = ['summary', 'skills', 'experience', 'projects', 'achievements', 'education'];
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
  resumeData._reorderedByUser = true;
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

function renderCustomSectionBodyHtml(cs, escape = escapeHtml) {
  const data = cs.data;
  if (!data) return '';

  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    if (typeof data[0] === 'string') {
      return `
        <ul class="bullets">
          ${data.map(item => `<li>${escape(item)}</li>`).join('')}
        </ul>
      `;
    } else if (typeof data[0] === 'object') {
      return data.map(item => {
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
    return `<p class="summary">${escape(data)}</p>`;
  } else if (typeof data === 'object') {
    return Object.entries(data).map(([k, v]) => `
      <div class="skill-line">
        <strong class="bold">${escape(formatSectionTitle(k))}:</strong> ${escape(Array.isArray(v) ? v.join(', ') : String(v))}
      </div>
    `).join('');
  }
  return '';
}
window.renderCustomSectionBodyHtml = renderCustomSectionBodyHtml;

function buildSectionDom(secId, title, itemsHtml, isContinuation = false) {
  const sec = document.createElement('section');
  sec.className = 'resume-section';
  if (isContinuation) {
    sec.classList.add('resume-section-continuation');
  }
  sec.setAttribute('draggable', 'true');
  sec.setAttribute('data-section-id', secId);

  const mtStyle = secId === 'projects' ? 'style="margin-top:0;"' : '';
  const titleHtml = isContinuation
    ? ''
    : `<h2 class="section-title" contenteditable="true" data-title-key="${escapeHtml(secId)}" ${mtStyle}>${escapeHtml(title.toUpperCase())}</h2>`;

  sec.innerHTML = `
    <div class="section-drag-handle" draggable="true" title="Drag to reorder section"><i class="fa-solid fa-grip-vertical"></i> <span class="drag-text">DRAG</span></div>
    <span class="section-edit-badge"><i class="fa-solid fa-pen text-[8px] mr-1"></i>Edit</span>
    ${titleHtml}
    ${itemsHtml}
  `;
  return sec;
}

function createPageDom(pageIndex) {
  const pageDiv = document.createElement('div');
  pageDiv.className = 'resume-document-page shadow-2xl flex flex-col justify-between';
  pageDiv.setAttribute('data-purpose', `resume-document-page-${pageIndex}`);
  pageDiv.setAttribute('data-page-number', String(pageIndex));
  
  const fontSelect = document.getElementById('font-select');
  if (fontSelect && fontSelect.value === 'serif') {
    pageDiv.classList.add('font-serif');
  } else {
    pageDiv.classList.add('font-sans');
  }

  const contentDiv = document.createElement('div');
  contentDiv.id = `page-${pageIndex}-content`;
  contentDiv.className = 'page-content-wrapper';

  const footerDiv = document.createElement('div');
  footerDiv.className = 'page-footer border-t border-slate-200 pt-2 text-center text-[10px] text-slate-400 font-sans no-print';
  footerDiv.style.marginTop = 'auto';
  footerDiv.textContent = `Page ${pageIndex}`;

  pageDiv.appendChild(contentDiv);
  pageDiv.appendChild(footerDiv);
  return { pageDiv, contentDiv, footerDiv };
}

function createDividerDom() {
  const div = document.createElement('div');
  div.className = 'w-[210mm] flex items-center justify-center gap-3 no-print page-break-marker';
  div.innerHTML = `
    <div class="flex-1 h-px bg-slate-300"></div>
    <span class="text-[10px] font-semibold text-slate-500 bg-white border border-slate-300 px-3 py-0.5 rounded-full shadow-sm">
      ✂️ Page Break Boundary (A4 Standard)
    </span>
    <div class="flex-1 h-px bg-slate-300"></div>
  `;
  return div;
}

// Render Pages (Dynamic Multi-Page A4 Standard with automatic overflow movement)
function renderPages() {
  const container = document.getElementById('pages-container');
  if (!container || !resumeData) return;
  const p = resumeData.personal || {};

  const skillsHtmlList = (resumeData.skills || []).map(s => `
    <div class="skill-line">
      <strong class="bold">${escapeHtml(s.category)}:</strong> ${escapeHtml(s.skills)}
    </div>
  `);

  const expHtmlList = (resumeData.experience || []).map(e => `
    <article class="exp-entry">
      <h3 class="role-heading bold">${escapeHtml(e.company)} | ${escapeHtml(e.role)}</h3>
      <div class="meta">${escapeHtml(e.period)}${e.location ? ' | ' + escapeHtml(e.location) : ''}</div>
      <ul class="bullets">
        ${(e.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
    </article>
  `);

  const projHtmlList = (resumeData.projects || []).map(proj => `
    <article class="proj-entry">
      <h3 class="proj-heading bold">${escapeHtml(proj.title)}${proj.tech ? ' | <span class="proj-stack">' + escapeHtml(proj.tech) + '</span>' : ''}</h3>
      <ul class="bullets">
        ${(proj.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
    </article>
  `);

  const achievements = resumeData.achievements || [];
  const achBulletsHtml = (achievements || []).map(a => `<li>${escapeHtml(a)}</li>`).join('');

  const eduHtmlList = (resumeData.education || []).map(edu => formatEducationHtml(edu, escapeHtml));

  const contactParts = [
    p.location ? escapeHtml(p.location) : '',
    p.phone ? escapeHtml(p.phone) : '',
    p.email ? `<a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a>` : ''
  ].filter(Boolean);

  const cleanUrl = (u) => String(u || '').replace(/^https?:\/\//i, '');
  const socialParts = [
    p.linkedin ? `LinkedIn: <a href="${escapeHtml(p.linkedin)}" target="_blank">${escapeHtml(cleanUrl(p.linkedin))}</a>` : '',
    p.github ? `GitHub: <a href="${escapeHtml(p.github)}" target="_blank">${escapeHtml(cleanUrl(p.github))}</a>` : ''
  ].filter(Boolean);

  const headerHtml = `
    <header class="resume-section" data-section-id="personal" title="Click to edit personal information">
      <span class="section-edit-badge"><i class="fa-solid fa-pen text-[8px] mr-1"></i>Edit</span>
      <h1>${escapeHtml(p.name || '')}</h1>
      ${p.title ? `<div class="subtitle">${escapeHtml(p.title)}</div>` : ''}
      ${contactParts.length ? `<div class="contact-line">${contactParts.join(' | ')}</div>` : ''}
      ${socialParts.length ? `<div class="contact-line">${socialParts.join(' | ')}</div>` : ''}
    </header>
  `;

  const sectionDefinitions = {
    summary: {
      id: 'summary',
      defaultTitle: 'PROFESSIONAL SUMMARY',
      items: resumeData.summary ? [`<p class="summary">${escapeHtml(resumeData.summary || '')}</p>`] : []
    },
    skills: {
      id: 'skills',
      defaultTitle: 'TECHNICAL SKILLS MATRIX',
      items: skillsHtmlList
    },
    experience: {
      id: 'experience',
      defaultTitle: 'PROFESSIONAL EXPERIENCE',
      items: expHtmlList
    },
    projects: {
      id: 'projects',
      defaultTitle: 'KEY PROJECTS & DELIVERABLES',
      items: projHtmlList
    },
    achievements: {
      id: 'achievements',
      defaultTitle: 'CORE ENGINEERING & ACHIEVEMENTS',
      items: achBulletsHtml ? [`<ul class="bullets" style="margin-bottom: 8px;">${achBulletsHtml}</ul>`] : []
    },
    education: {
      id: 'education',
      defaultTitle: 'EDUCATION',
      items: eduHtmlList
    }
  };

  (resumeData.customSections || []).forEach(cs => {
    if (cs && cs.key && !['sectionOrder', 'sectionTitles', 'titles', 'headers', 'template', 'theme', 'id', 'version', 'meta', 'metadata'].includes(cs.key)) {
      sectionDefinitions[cs.key] = {
        id: cs.key,
        defaultTitle: cs.title || formatSectionTitle(cs.key),
        items: [renderCustomSectionBodyHtml(cs, escapeHtml)]
      };
    }
  });

  // Re-build pages cleanly inside #pages-container
  container.innerHTML = '';
  let currentPageIndex = 1;
  const p1 = createPageDom(1);
  container.appendChild(p1.pageDiv);
  let currentContentDiv = p1.contentDiv;

  // Insert Personal Header on Page 1
  currentContentDiv.insertAdjacentHTML('beforeend', headerHtml);

  // Standard A4 usable content height: 297mm - 20mm padding - ~26px footer = ~1020px
  const MAX_CONTENT_HEIGHT = 1014;

  function placeSectionItems(secId, title, items, isContinuation = false) {
    if (!items || items.length === 0) return;

    // Test whole block
    const secEl = buildSectionDom(secId, title, items.join(''), isContinuation);
    currentContentDiv.appendChild(secEl);

    if (currentContentDiv.scrollHeight <= MAX_CONTENT_HEIGHT) {
      // Entire block fits cleanly on current page
      return;
    }

    // Block overflows! If section has multiple items, check if some can fit
    if (items.length > 1) {
      let fitCount = items.length - 1;
      let fitted = false;

      while (fitCount >= 1) {
        secEl.remove();
        const testEl = buildSectionDom(secId, title, items.slice(0, fitCount).join(''), isContinuation);
        currentContentDiv.appendChild(testEl);

        if (currentContentDiv.scrollHeight <= MAX_CONTENT_HEIGHT) {
          fitted = true;
          break;
        }
        testEl.remove();
        fitCount--;
      }

      if (fitted && fitCount >= 1) {
        // items 0 .. fitCount-1 stay on current page.
        // Remaining items move to next page in continuation section!
        const remainingItems = items.slice(fitCount);
        container.appendChild(createDividerDom());
        currentPageIndex++;
        const nextP = createPageDom(currentPageIndex);
        container.appendChild(nextP.pageDiv);
        currentContentDiv = nextP.contentDiv;
        placeSectionItems(secId, title, remainingItems, true);
        return;
      }
    }

    // Not splittable or not even 1 item fits on this page
    secEl.remove();

    // If current page already has content, advance to a new page
    if (currentContentDiv.children.length > 0) {
      container.appendChild(createDividerDom());
      currentPageIndex++;
      const nextP = createPageDom(currentPageIndex);
      container.appendChild(nextP.pageDiv);
      currentContentDiv = nextP.contentDiv;
    }

    // Place on the new page
    const freshSecEl = buildSectionDom(secId, title, items.join(''), isContinuation);
    currentContentDiv.appendChild(freshSecEl);

    // If it still overflows on a fresh page and has multiple items, split it
    if (currentContentDiv.scrollHeight > MAX_CONTENT_HEIGHT && items.length > 1) {
      freshSecEl.remove();
      placeSectionItems(secId, title, items, isContinuation);
    }
  }

  const order = getValidSectionOrder();
  order.forEach(secId => {
    const def = sectionDefinitions[secId];
    if (!def || !def.items || def.items.length === 0) return;
    const title = getSectionTitle(resumeData, secId, def.defaultTitle);
    placeSectionItems(secId, title, def.items, false);
  });

  // Ensure at least 2 pages for standard 2-page template presentation
  if (currentPageIndex < 2) {
    container.appendChild(createDividerDom());
    currentPageIndex = 2;
    const p2 = createPageDom(2);
    container.appendChild(p2.pageDiv);
  }

  // Update all page footers: "Page X of Y"
  const allFooters = container.querySelectorAll('.page-footer');
  const totalPages = allFooters.length;
  allFooters.forEach((footer, idx) => {
    footer.textContent = `Page ${idx + 1} of ${totalPages}`;
  });

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
          resumeData._reorderedByUser = true;
          scheduleRender();
          if (currentActiveSectionId && typeof updateSectionHeadingEditor === 'function') {
            updateSectionHeadingEditor(currentActiveSectionId);
          }
          showToast(`Reordered: ${getSectionTitle(resumeData, draggedSectionId)} moved!`);
        }
      });
    }
  });

  // Cross-page container drop support across all dynamically created pages
  const pageContainers = document.querySelectorAll('[id^="page-"][id$="-content"]');
  pageContainers.forEach((container, cIdx) => {
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
      resumeData._reorderedByUser = true;
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

  // Highlight active section if currently open in drawer
  if (currentActiveSectionId) {
    document.querySelectorAll(`.resume-section[data-section-id="${currentActiveSectionId}"]`).forEach(el => {
      el.classList.add('active-editing');
    });
  }
}
window.setupSectionInteractions = setupSectionInteractions;

// Calculate Page Height & Fit (no-op if badge element is not in DOM)
function updatePageFitMeter() {
  const badge = document.getElementById('page-fit-badge');
  if (!badge) return;

  requestAnimationFrame(() => {
    const pages = document.querySelectorAll('.resume-document-page');
    if (!pages.length) return;

    const pcts = [];
    let allFit = true;
    pages.forEach((page, idx) => {
      const content = page.querySelector('[id$="-content"]');
      if (!content) return;
      const h = content.scrollHeight;
      const maxH = page.clientHeight ? (page.clientHeight - 30) : 1014;
      const pct = Math.round((h / maxH) * 100);
      pcts.push(`P${idx + 1}: ${pct}%`);
      if (pct > 102) allFit = false;
    });

    if (allFit) {
      badge.textContent = `${pcts.join(' | ')} (A4 Standard Fit ✅)`;
    } else {
      badge.textContent = `${pcts.join(' | ')} (Adjusting budget...)`;
    }
  });
}
window.updatePageFitMeter = updatePageFitMeter;

// public/js/editors/edu-editor.js
// Editor for Education section: degree, field, institution, location, dates, grade, bullets, compact reordering

let draggedEduIndex = null;
let isEducationCompactReorderView = false;

function toggleEducationViewMode() {
  isEducationCompactReorderView = !isEducationCompactReorderView;
  const txt = document.getElementById('txt-education-view-mode');
  const btn = document.getElementById('btn-toggle-education-view');
  if (txt) txt.textContent = isEducationCompactReorderView ? 'Edit Details' : 'Reorder View';
  if (btn) {
    if (isEducationCompactReorderView) {
      btn.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-300');
      btn.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-300/70');
    } else {
      btn.classList.remove('bg-blue-100', 'text-blue-800', 'border-blue-300');
      btn.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-300/70');
    }
  }
  renderEducationEditor();
}

function jumpEducation(fromIdx, toIdx) {
  if (!resumeData || !Array.isArray(resumeData.education)) return;
  const eduList = resumeData.education;
  if (fromIdx < 0 || fromIdx >= eduList.length || toIdx < 0 || toIdx >= eduList.length || fromIdx === toIdx) return;
  const [item] = eduList.splice(fromIdx, 1);
  eduList.splice(toIdx, 0, item);
  renderEducationEditor();
  scheduleRender();
  showToast(`Moved credential to #${toIdx + 1}`);
}

function moveEducation(fromIdx, direction) {
  if (!resumeData || !Array.isArray(resumeData.education)) return;
  const toIdx = fromIdx + direction;
  if (toIdx < 0 || toIdx >= resumeData.education.length) return;
  jumpEducation(fromIdx, toIdx);
}

function getEduDates(edu) {
  if (edu.startDate !== undefined || edu.endDate !== undefined) {
    return {
      startDate: edu.startDate || '',
      endDate: edu.endDate || ''
    };
  }
  const period = (edu.period || edu.year || '').trim();
  if (!period) return { startDate: '', endDate: '' };
  const parts = period.split(/\s*(?:–|-|to)\s*/i);
  return {
    startDate: parts[0] || '',
    endDate: parts[1] || ''
  };
}

function getEduInstitutionAndLocation(edu) {
  if (edu.location !== undefined) {
    return {
      institution: edu.institution || '',
      location: edu.location || ''
    };
  }
  const inst = (edu.institution || '').trim();
  if (!inst) return { institution: '', location: '' };
  const parts = inst.split(/\s*(?:·|,|\|)\s*/);
  if (parts.length > 1) {
    return {
      institution: parts[0] || '',
      location: parts.slice(1).join(', ') || ''
    };
  }
  return { institution: inst, location: '' };
}

function updateEduDate(eduIdx, part, val) {
  const edu = resumeData.education[eduIdx];
  const dates = getEduDates(edu);
  dates[part] = val;
  edu.startDate = dates.startDate;
  edu.endDate = dates.endDate;
  if (dates.startDate && dates.endDate) {
    edu.period = `${dates.startDate} – ${dates.endDate}`;
  } else {
    edu.period = dates.startDate || dates.endDate || '';
  }
  scheduleRender();
}

function updateEduInstOrLoc(eduIdx, part, val) {
  const edu = resumeData.education[eduIdx];
  edu[part] = val;
  scheduleRender();
}

function addEduBullet(eduIdx) {
  if (!Array.isArray(resumeData.education[eduIdx].bullets)) {
    resumeData.education[eduIdx].bullets = [];
  }
  resumeData.education[eduIdx].bullets.push("Key academic project / achievement or coursework.");
  renderEducationEditor();
  scheduleRender();
}

function updateEduBullet(eduIdx, bIdx, val) {
  if (!Array.isArray(resumeData.education[eduIdx].bullets)) {
    resumeData.education[eduIdx].bullets = [];
  }
  resumeData.education[eduIdx].bullets[bIdx] = val;
  scheduleRender();
}

function deleteEduBullet(eduIdx, bIdx) {
  if (Array.isArray(resumeData.education[eduIdx].bullets)) {
    resumeData.education[eduIdx].bullets.splice(bIdx, 1);
  }
  renderEducationEditor();
  scheduleRender();
}

function updateEduField(eduIdx, field, val) {
  resumeData.education[eduIdx][field] = val;
  scheduleRender();
}

function setEduCategory(eduIdx, cat) {
  if (!resumeData || !resumeData.education || !resumeData.education[eduIdx]) return;
  resumeData.education[eduIdx].category = cat;
  renderEducationEditor();
  scheduleRender();
}

function deleteEducation(eduIdx) {
  resumeData.education.splice(eduIdx, 1);
  renderEducationEditor();
  scheduleRender();
}

function renderEducationEditor() {
  const container = document.getElementById('education-list');
  if (!container) return;
  container.innerHTML = '';
  const eduList = resumeData.education || [];

  if (isEducationCompactReorderView) {
    const reorderHint = document.createElement('div');
    reorderHint.className = 'bg-blue-50/70 border border-blue-200/80 rounded-lg p-2.5 text-xs text-blue-800 flex items-center justify-between gap-2';
    reorderHint.innerHTML = `
      <span class="flex items-center gap-1.5 font-medium">
        <i class="fa-solid fa-arrows-up-down text-blue-600"></i>
        <span>Drag cards to reorder credentials instantly.</span>
      </span>
      <button class="text-xs font-bold text-blue-700 hover:underline shrink-0" onclick="window.toggleEducationViewMode()">
        Done Reordering
      </button>
    `;
    container.appendChild(reorderHint);

    eduList.forEach((edu, eduIdx) => {
      const row = document.createElement('div');
      row.className = 'bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2.5 shadow-sm hover:border-blue-400 cursor-grab active:cursor-grabbing transition-all select-none';
      row.draggable = true;
      row.dataset.eduIdx = eduIdx;

      const eduDisplay = edu.degree ? (edu.institution ? `${edu.degree} — ${edu.institution}` : edu.degree) : 'Untitled Credential';
      const eduCat = getEduCategory(edu);

      row.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <span class="text-slate-400 hover:text-slate-600 p-0.5" title="Drag to reorder"><i class="fa-solid fa-grip-vertical text-xs"></i></span>
          <span class="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">#${eduIdx + 1}</span>
          <div class="flex items-center gap-1.5 min-w-0 truncate">
            ${eduCat ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">${escapeHtml(eduCat)}</span>` : ''}
            <span class="text-xs font-bold text-slate-800 truncate" title="Credential">${escapeHtml(eduDisplay)}</span>
          </div>
        </div>
        <div class="flex items-center shrink-0">
          <button type="button" class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded p-1 text-xs transition ml-1 shrink-0" title="Delete Credential" onclick="deleteEducation(${eduIdx})"><i class="fa-solid fa-trash-can text-xs"></i></button>
        </div>
      `;

      row.addEventListener('dragstart', (e) => {
        draggedEduIndex = eduIdx;
        row.classList.add('opacity-40', 'border-blue-400');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(eduIdx));
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('opacity-40', 'border-blue-400');
        container.querySelectorAll('div[data-edu-idx]').forEach(c => {
          c.classList.remove('border-blue-500', 'bg-blue-50/30');
        });
        draggedEduIndex = null;
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedEduIndex !== null && draggedEduIndex !== eduIdx) {
          row.classList.add('border-blue-500', 'bg-blue-50/30');
        }
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('border-blue-500', 'bg-blue-50/30');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('border-blue-500', 'bg-blue-50/30');
        if (draggedEduIndex !== null && draggedEduIndex !== eduIdx) {
          const [item] = resumeData.education.splice(draggedEduIndex, 1);
          resumeData.education.splice(eduIdx, 0, item);
          renderEducationEditor();
          scheduleRender();
          showToast(`Moved "${item.degree || 'Credential'}" to #${eduIdx + 1}`);
        }
      });

      container.appendChild(row);
    });
    return;
  }

  eduList.forEach((edu, eduIdx) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 transition-all duration-150 hover:border-slate-300';
    card.draggable = true;
    card.dataset.eduIdx = eduIdx;

    const eduDates = getEduDates(edu);
    const eduInst = getEduInstitutionAndLocation(edu);
    const bullets = Array.isArray(edu.bullets) ? edu.bullets : [];

    let bulletsHtml = bullets.map((b, bIdx) => `
      <div class="flex gap-2 items-start group">
        <span class="text-slate-400 text-xs mt-2 select-none">•</span>
        <textarea rows="1" class="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition leading-relaxed" oninput="autoResizeTextarea(this); updateEduBullet(${eduIdx}, ${bIdx}, this.value)">${escapeHtml(b)}</textarea>
        <button class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0 mt-0.5" onclick="deleteEduBullet(${eduIdx}, ${bIdx})" title="Delete bullet">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="border-b border-slate-200/80 pb-2.5 flex justify-between items-center gap-2 select-none">
        <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span class="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1 py-0.5 rounded hover:bg-slate-200/50 transition shrink-0" title="Drag to reorder credential">
            <i class="fa-solid fa-grip-vertical text-xs"></i>
          </span>
          <span class="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">#${eduIdx + 1}</span>
        </div>
        <button class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition shrink-0" onclick="deleteEducation(${eduIdx})" title="Delete Credential">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
      <div class="space-y-2.5 pt-1">
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Category / Credential Type</label>
            <div class="flex gap-1">
              <button type="button" class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition" onclick="setEduCategory(${eduIdx}, 'Professional Certification')">Certification</button>
              <button type="button" class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition" onclick="setEduCategory(${eduIdx}, 'Engineering Immersion')">Immersion</button>
              <button type="button" class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition" onclick="setEduCategory(${eduIdx}, 'Academic Degree')">Degree</button>
            </div>
          </div>
          <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. Professional Certification, Engineering Immersion, Academic Degree" value="${escapeHtml(edu.category || getEduCategory(edu))}" oninput="updateEduField(${eduIdx}, 'category', this.value)">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Degree / Certification Title</label>
          <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. Bachelor of Technology / Mobile Engineering Certification" value="${escapeHtml(edu.degree || '')}" oninput="updateEduField(${eduIdx}, 'degree', this.value)">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Field of Study / Major / Specialization</label>
          <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. Flutter & Dart Mobile Architecture / Computer Science" value="${escapeHtml(edu.fieldOfStudy || '')}" oninput="updateEduField(${eduIdx}, 'fieldOfStudy', this.value)">
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Institution / University</label>
            <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. PSK Technologies / Gujarat University" value="${escapeHtml(eduInst.institution || '')}" oninput="updateEduInstOrLoc(${eduIdx}, 'institution', this.value)">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Location / City</label>
            <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. Surat, Gujarat" value="${escapeHtml(eduInst.location || '')}" oninput="updateEduInstOrLoc(${eduIdx}, 'location', this.value)">
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Start Date</label>
            <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. Jan 2021" value="${escapeHtml(eduDates.startDate)}" oninput="updateEduDate(${eduIdx}, 'startDate', this.value)">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">End Date / Year</label>
            <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. Dec 2021 or 2021" value="${escapeHtml(eduDates.endDate)}" oninput="updateEduDate(${eduIdx}, 'endDate', this.value)">
          </div>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Grade / GPA / Percentage / Honors</label>
          <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. First Class with Distinction / 3.8 GPA" value="${escapeHtml(edu.grade || edu.gpa || '')}" oninput="updateEduField(${eduIdx}, 'grade', this.value)">
        </div>
      </div>
      <div class="space-y-2 pt-1 border-t border-slate-100">
        <div class="flex justify-between items-center">
          <label class="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Key Coursework / Honors / Bullets</label>
          <button class="btn-section-add" onclick="addEduBullet(${eduIdx})">
            <i class="fa-solid fa-plus text-[10px]"></i> <span>Add Bullet</span>
          </button>
        </div>
        <div class="space-y-2">${bulletsHtml}</div>
      </div>
    `;

    card.addEventListener('dragstart', (e) => {
      if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        return;
      }
      draggedEduIndex = eduIdx;
      card.classList.add('opacity-40', 'border-blue-400');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(eduIdx));
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('opacity-40', 'border-blue-400');
      container.querySelectorAll('div[data-edu-idx]').forEach(c => {
        c.classList.remove('border-blue-500', 'bg-blue-50/30');
      });
      draggedEduIndex = null;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedEduIndex !== null && draggedEduIndex !== eduIdx) {
        card.classList.add('border-blue-500', 'bg-blue-50/30');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('border-blue-500', 'bg-blue-50/30');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('border-blue-500', 'bg-blue-50/30');
      if (draggedEduIndex !== null && draggedEduIndex !== eduIdx) {
        const [item] = resumeData.education.splice(draggedEduIndex, 1);
        resumeData.education.splice(eduIdx, 0, item);
        renderEducationEditor();
        scheduleRender();
        showToast(`Moved "${item.degree || 'Credential'}" to #${eduIdx + 1}`);
      }
    });

    container.appendChild(card);
  });
  autoResizeAllTextareas();
}

function setupEducationEditorListeners() {
  const toggleEduBtn = document.getElementById('btn-toggle-education-view');
  if (toggleEduBtn) {
    toggleEduBtn.onclick = toggleEducationViewMode;
  }

  const addEduBtn = document.getElementById('btn-add-education');
  if (addEduBtn) {
    addEduBtn.onclick = () => {
      if (!resumeData) return;
      if (!Array.isArray(resumeData.education)) resumeData.education = [];
      resumeData.education.push({
        category: "Professional Certification",
        degree: "Professional Certification",
        fieldOfStudy: "Computer Science / Mobile Architecture",
        institution: "Issuing Organization",
        location: "City, State",
        startDate: "2023",
        endDate: "2024",
        period: "2023 – 2024",
        grade: "Distinction",
        bullets: []
      });
      renderEducationEditor();
      scheduleRender();
    };
  }
}

// Global exposure
window.toggleEducationViewMode = toggleEducationViewMode;
window.jumpEducation = jumpEducation;
window.moveEducation = moveEducation;
window.getEduDates = getEduDates;
window.getEduInstitutionAndLocation = getEduInstitutionAndLocation;
window.updateEduDate = updateEduDate;
window.updateEduInstOrLoc = updateEduInstOrLoc;
window.addEduBullet = addEduBullet;
window.updateEduBullet = updateEduBullet;
window.deleteEduBullet = deleteEduBullet;
window.updateEduField = updateEduField;
window.setEduCategory = setEduCategory;
window.deleteEducation = deleteEducation;
window.renderEducationEditor = renderEducationEditor;
window.setupEducationEditorListeners = setupEducationEditorListeners;

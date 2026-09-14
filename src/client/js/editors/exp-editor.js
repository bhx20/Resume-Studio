// public/js/editors/exp-editor.js
// Editor for Experience section: roles, dates, company, locations, bullets, compact reordering

let draggedExpIndex = null;
let isExperienceCompactReorderView = false;

function toggleExperienceViewMode() {
  isExperienceCompactReorderView = !isExperienceCompactReorderView;
  const txt = document.getElementById('txt-experience-view-mode');
  const btn = document.getElementById('btn-toggle-experience-view');
  if (txt) txt.textContent = isExperienceCompactReorderView ? 'Edit Details' : 'Reorder View';
  if (btn) {
    if (isExperienceCompactReorderView) {
      btn.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-300');
      btn.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-300/70');
    } else {
      btn.classList.remove('bg-blue-100', 'text-blue-800', 'border-blue-300');
      btn.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-300/70');
    }
  }
  renderExperienceEditor();
}

function jumpExperience(fromIdx, toIdx) {
  if (!resumeData || !Array.isArray(resumeData.experience)) return;
  const expList = resumeData.experience;
  if (fromIdx < 0 || fromIdx >= expList.length || toIdx < 0 || toIdx >= expList.length || fromIdx === toIdx) return;
  const [item] = expList.splice(fromIdx, 1);
  expList.splice(toIdx, 0, item);
  renderExperienceEditor();
  scheduleRender();
  showToast(`Moved role to #${toIdx + 1}`);
}

function moveExperience(fromIdx, direction) {
  if (!resumeData || !Array.isArray(resumeData.experience)) return;
  const toIdx = fromIdx + direction;
  if (toIdx < 0 || toIdx >= resumeData.experience.length) return;
  jumpExperience(fromIdx, toIdx);
}

function getExpDates(exp) {
  if (exp.startDate !== undefined || exp.endDate !== undefined) {
    return {
      startDate: exp.startDate || '',
      endDate: exp.endDate || ''
    };
  }
  const period = (exp.period || '').trim();
  if (!period) return { startDate: '', endDate: '' };
  const parts = period.split(/\s*(?:–|-|to)\s*/i);
  return {
    startDate: parts[0] || '',
    endDate: parts[1] || ''
  };
}

function getExpLocationAndWorkspace(exp) {
  if (exp.city !== undefined || exp.workspace !== undefined || exp.workMode !== undefined) {
    return {
      location: exp.city || exp.location || '',
      workspace: exp.workspace || exp.workMode || ''
    };
  }
  const loc = (exp.location || '').trim();
  if (!loc) return { location: '', workspace: '' };
  const parts = loc.split(/\s*(?:·|\|)\s*/);
  if (parts.length > 1) {
    return {
      location: parts[0] || '',
      workspace: parts[1] || ''
    };
  }
  return { location: loc, workspace: '' };
}

function updateExpDate(expIdx, part, val) {
  const exp = resumeData.experience[expIdx];
  const dates = getExpDates(exp);
  dates[part] = val;
  exp.startDate = dates.startDate;
  exp.endDate = dates.endDate;
  if (dates.startDate && dates.endDate) {
    exp.period = `${dates.startDate} – ${dates.endDate}`;
  } else {
    exp.period = dates.startDate || dates.endDate || '';
  }
  scheduleRender();
}

function updateExpLocationOrWorkspace(expIdx, part, val) {
  const exp = resumeData.experience[expIdx];
  const parsed = getExpLocationAndWorkspace(exp);
  parsed[part] = val;
  exp.city = parsed.location;
  exp.workspace = parsed.workspace;
  if (parsed.location && parsed.workspace) {
    exp.location = `${parsed.location} · ${parsed.workspace}`;
  } else {
    exp.location = parsed.location || parsed.workspace || '';
  }
  scheduleRender();
}

function updateExpField(expIdx, field, val) {
  resumeData.experience[expIdx][field] = val;
  scheduleRender();
}

function updateExpBullet(expIdx, bIdx, val) {
  resumeData.experience[expIdx].bullets[bIdx] = val;
  scheduleRender();
}

function deleteExpBullet(expIdx, bIdx) {
  resumeData.experience[expIdx].bullets.splice(bIdx, 1);
  renderExperienceEditor();
  scheduleRender();
}

function addExpBullet(expIdx) {
  resumeData.experience[expIdx].bullets.push("Accomplished [Impact], measured by [Metric], by engineering [Feature/Architecture].");
  renderExperienceEditor();
  scheduleRender();
}

function deleteExperience(expIdx) {
  resumeData.experience.splice(expIdx, 1);
  renderExperienceEditor();
  scheduleRender();
}

function renderExperienceEditor() {
  const container = document.getElementById('experience-list');
  if (!container) return;
  container.innerHTML = '';
  const expList = resumeData.experience || [];

  if (isExperienceCompactReorderView) {
    const reorderHint = document.createElement('div');
    reorderHint.className = 'bg-blue-50/70 border border-blue-200/80 rounded-lg p-2.5 text-xs text-blue-800 flex items-center justify-between gap-2';
    reorderHint.innerHTML = `
      <span class="flex items-center gap-1.5 font-medium">
        <i class="fa-solid fa-arrows-up-down text-blue-600"></i>
        <span>Drag cards to reorder roles instantly.</span>
      </span>
      <button class="text-xs font-bold text-blue-700 hover:underline shrink-0" onclick="window.toggleExperienceViewMode()">
        Done Reordering
      </button>
    `;
    container.appendChild(reorderHint);

    expList.forEach((exp, idx) => {
      const row = document.createElement('div');
      row.className = 'bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2.5 shadow-sm hover:border-blue-400 cursor-grab active:cursor-grabbing transition-all select-none';
      row.draggable = true;
      row.dataset.expIdx = idx;

      const roleDisplay = exp.role ? (exp.company ? `${exp.role} — ${exp.company}` : exp.role) : 'Untitled Role';

      row.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <span class="text-slate-400 hover:text-slate-600 p-0.5" title="Drag to reorder"><i class="fa-solid fa-grip-vertical text-xs"></i></span>
          <span class="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">#${idx + 1}</span>
          <span class="text-xs font-bold text-slate-800 truncate" title="Role">${escapeHtml(roleDisplay)}</span>
        </div>
        <div class="flex items-center shrink-0">
          <button type="button" class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded p-1 text-xs transition shrink-0" title="Delete Role" onclick="deleteExperience(${idx})"><i class="fa-solid fa-trash-can text-xs"></i></button>
        </div>
      `;

      row.addEventListener('dragstart', (e) => {
        draggedExpIndex = idx;
        row.classList.add('opacity-40', 'border-blue-400');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('opacity-40', 'border-blue-400');
        container.querySelectorAll('div[data-exp-idx]').forEach(c => {
          c.classList.remove('border-blue-500', 'bg-blue-50/30');
        });
        draggedExpIndex = null;
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedExpIndex !== null && draggedExpIndex !== idx) {
          row.classList.add('border-blue-500', 'bg-blue-50/30');
        }
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('border-blue-500', 'bg-blue-50/30');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('border-blue-500', 'bg-blue-50/30');
        if (draggedExpIndex !== null && draggedExpIndex !== idx) {
          const [item] = resumeData.experience.splice(draggedExpIndex, 1);
          resumeData.experience.splice(idx, 0, item);
          renderExperienceEditor();
          scheduleRender();
          showToast(`Moved role to #${idx + 1}`);
        }
      });

      container.appendChild(row);
    });
    return;
  }

  expList.forEach((exp, expIdx) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 transition-all duration-150 hover:border-slate-300';
    card.draggable = true;
    card.dataset.expIdx = expIdx;

    let bulletsHtml = (exp.bullets || []).map((b, bIdx) => `
      <div class="flex gap-2 items-start group">
        <span class="text-slate-400 text-xs mt-2 select-none">•</span>
        <textarea rows="1" class="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition leading-relaxed" oninput="autoResizeTextarea(this); updateExpBullet(${expIdx}, ${bIdx}, this.value)">${escapeHtml(b)}</textarea>
        <button class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0 mt-0.5" onclick="deleteExpBullet(${expIdx}, ${bIdx})" title="Delete bullet">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
    `).join('');

    const expDates = getExpDates(exp);
    const expLoc = getExpLocationAndWorkspace(exp);

    card.innerHTML = `
      <div class="border-b border-slate-200/80 pb-2.5 flex justify-between items-center gap-2 select-none">
        <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span class="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1 py-0.5 rounded hover:bg-slate-200/50 transition shrink-0" title="Drag to reorder role">
            <i class="fa-solid fa-grip-vertical text-xs"></i>
          </span>
          <span class="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">#${expIdx + 1}</span>
        </div>
        <button class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition shrink-0" title="Delete Role" onclick="deleteExperience(${expIdx})">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
      <div class="space-y-2.5 pt-1">
        <div>
          <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Role Title</label>
          <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. Lead Flutter Developer & Senior Software Engineer" value="${escapeHtml(exp.role || '')}" oninput="updateExpField(${expIdx}, 'role', this.value)">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Company</label>
          <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. Regumsoft" value="${escapeHtml(exp.company || '')}" oninput="updateExpField(${expIdx}, 'company', this.value)">
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Start Date</label>
            <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. Jun 2020" value="${escapeHtml(expDates.startDate)}" oninput="updateExpDate(${expIdx}, 'startDate', this.value)">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">End Date</label>
            <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. Feb 2025 or Present" value="${escapeHtml(expDates.endDate)}" oninput="updateExpDate(${expIdx}, 'endDate', this.value)">
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Location</label>
            <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. Surat, Gujarat" value="${escapeHtml(expLoc.location)}" oninput="updateExpLocationOrWorkspace(${expIdx}, 'location', this.value)">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Workspace / Work Mode</label>
            <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. On-site, Remote, Hybrid" value="${escapeHtml(expLoc.workspace)}" oninput="updateExpLocationOrWorkspace(${expIdx}, 'workspace', this.value)">
          </div>
        </div>
      </div>
      <div class="space-y-2 pt-1 border-t border-slate-100">
        <div class="flex justify-between items-center">
          <label class="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Impact Bullets (Google XYZ)</label>
          <button class="btn-section-add" onclick="addExpBullet(${expIdx})">
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
      draggedExpIndex = expIdx;
      card.classList.add('opacity-40', 'border-blue-400');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(expIdx));
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('opacity-40', 'border-blue-400');
      container.querySelectorAll('div[data-exp-idx]').forEach(c => {
        c.classList.remove('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
      });
      draggedExpIndex = null;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedExpIndex !== null && draggedExpIndex !== expIdx) {
        card.classList.add('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
      if (draggedExpIndex !== null && draggedExpIndex !== expIdx) {
        const [item] = resumeData.experience.splice(draggedExpIndex, 1);
        resumeData.experience.splice(expIdx, 0, item);
        renderExperienceEditor();
        scheduleRender();
        showToast(`Moved role to #${expIdx + 1}`);
      }
    });

    container.appendChild(card);
  });
  autoResizeAllTextareas();
}

function setupExperienceEditorListeners() {
  const toggleExpBtn = document.getElementById('btn-toggle-experience-view');
  if (toggleExpBtn) {
    toggleExpBtn.onclick = toggleExperienceViewMode;
  }

  const addExpBtn = document.getElementById('btn-add-experience');
  if (addExpBtn) {
    addExpBtn.onclick = () => {
      if (!resumeData) return;
      if (!Array.isArray(resumeData.experience)) resumeData.experience = [];
      resumeData.experience.unshift({
        role: "Senior Mobile Engineer",
        company: "Company Name",
        startDate: "Jan 2025",
        endDate: "Present",
        period: "Jan 2025 – Present",
        city: "Location",
        workspace: "On-site",
        location: "Location · On-site",
        bullets: ["Accomplished [Impact], measured by [Metric], by engineering [Feature/Architecture]."]
      });
      renderExperienceEditor();
      scheduleRender();
    };
  }
}

// Global exposure
window.toggleExperienceViewMode = toggleExperienceViewMode;
window.jumpExperience = jumpExperience;
window.moveExperience = moveExperience;
window.getExpDates = getExpDates;
window.getExpLocationAndWorkspace = getExpLocationAndWorkspace;
window.updateExpDate = updateExpDate;
window.updateExpLocationOrWorkspace = updateExpLocationOrWorkspace;
window.updateExpField = updateExpField;
window.updateExpBullet = updateExpBullet;
window.deleteExpBullet = deleteExpBullet;
window.addExpBullet = addExpBullet;
window.deleteExperience = deleteExperience;
window.renderExperienceEditor = renderExperienceEditor;
window.setupExperienceEditorListeners = setupExperienceEditorListeners;

// public/js/editors/proj-editor.js
// Editor for Projects section: title, role, market, platform, tech stack, bullets, compact reordering

let draggedProjIndex = null;
let isProjectsCompactReorderView = false;

function toggleProjectsViewMode() {
  isProjectsCompactReorderView = !isProjectsCompactReorderView;
  const txt = document.getElementById('txt-projects-view-mode');
  const btn = document.getElementById('btn-toggle-projects-view');
  if (txt) txt.textContent = isProjectsCompactReorderView ? 'Edit Details' : 'Reorder View';
  if (btn) {
    if (isProjectsCompactReorderView) {
      btn.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-300');
      btn.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-300/70');
    } else {
      btn.classList.remove('bg-blue-100', 'text-blue-800', 'border-blue-300');
      btn.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-300/70');
    }
  }
  renderProjectsEditor();
}

function jumpProject(fromIdx, toIdx) {
  if (!resumeData || !Array.isArray(resumeData.projects)) return;
  const projList = resumeData.projects;
  if (fromIdx < 0 || fromIdx >= projList.length || toIdx < 0 || toIdx >= projList.length || fromIdx === toIdx) return;
  const [item] = projList.splice(fromIdx, 1);
  projList.splice(toIdx, 0, item);
  renderProjectsEditor();
  scheduleRender();
  showToast(`Moved project to #${toIdx + 1}`);
}

function moveProject(fromIdx, direction) {
  if (!resumeData || !Array.isArray(resumeData.projects)) return;
  const toIdx = fromIdx + direction;
  if (toIdx < 0 || toIdx >= resumeData.projects.length) return;
  jumpProject(fromIdx, toIdx);
}

function toggleProjFeatured(projIdx, val) {
  resumeData.projects[projIdx].featured = val;
  scheduleRender();
}

function updateProjField(projIdx, field, val) {
  resumeData.projects[projIdx][field] = val;
  scheduleRender();
}

function updateProjBullet(projIdx, bIdx, val) {
  resumeData.projects[projIdx].bullets[bIdx] = val;
  scheduleRender();
}

function deleteProjBullet(projIdx, bIdx) {
  resumeData.projects[projIdx].bullets.splice(bIdx, 1);
  renderProjectsEditor();
  scheduleRender();
}

function addProjBullet(projIdx) {
  resumeData.projects[projIdx].bullets.push("Architected [System Component] achieving [Result Metrics] utilizing [Core Tech].");
  renderProjectsEditor();
  scheduleRender();
}

function deleteProject(projIdx) {
  resumeData.projects.splice(projIdx, 1);
  renderProjectsEditor();
  scheduleRender();
}

function renderProjectsEditor() {
  const container = document.getElementById('projects-list');
  if (!container) return;
  container.innerHTML = '';
  const projList = resumeData.projects || [];

  if (isProjectsCompactReorderView) {
    const reorderHint = document.createElement('div');
    reorderHint.className = 'bg-blue-50/70 border border-blue-200/80 rounded-lg p-2.5 text-xs text-blue-800 flex items-center justify-between gap-2';
    reorderHint.innerHTML = `
      <span class="flex items-center gap-1.5 font-medium">
        <i class="fa-solid fa-arrows-up-down text-blue-600"></i>
        <span>Drag cards to reorder projects instantly.</span>
      </span>
      <button class="text-xs font-bold text-blue-700 hover:underline shrink-0" onclick="window.toggleProjectsViewMode()">
        Done Reordering
      </button>
    `;
    container.appendChild(reorderHint);

    projList.forEach((proj, projIdx) => {
      const row = document.createElement('div');
      row.className = 'bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2.5 shadow-sm hover:border-blue-400 cursor-grab active:cursor-grabbing transition-all select-none';
      row.draggable = true;
      row.dataset.projIdx = projIdx;

      const projDisplay = proj.title ? (proj.subtitle ? `${proj.title} (${proj.subtitle})` : proj.title) : 'Untitled Project';

      row.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <span class="text-slate-400 hover:text-slate-600 p-0.5" title="Drag to reorder"><i class="fa-solid fa-grip-vertical text-xs"></i></span>
          <span class="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">#${projIdx + 1}</span>
          <span class="text-xs font-bold text-slate-800 truncate" title="Project">${escapeHtml(projDisplay)}</span>
        </div>
        <div class="flex items-center shrink-0">
          <button type="button" class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded p-1 text-xs transition shrink-0" title="Delete Project" onclick="deleteProject(${projIdx})"><i class="fa-solid fa-trash-can text-xs"></i></button>
        </div>
      `;

      row.addEventListener('dragstart', (e) => {
        draggedProjIndex = projIdx;
        row.classList.add('opacity-40', 'border-blue-400');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(projIdx));
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('opacity-40', 'border-blue-400');
        container.querySelectorAll('div[data-proj-idx]').forEach(c => {
          c.classList.remove('border-blue-500', 'bg-blue-50/30');
        });
        draggedProjIndex = null;
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedProjIndex !== null && draggedProjIndex !== projIdx) {
          row.classList.add('border-blue-500', 'bg-blue-50/30');
        }
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('border-blue-500', 'bg-blue-50/30');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('border-blue-500', 'bg-blue-50/30');
        if (draggedProjIndex !== null && draggedProjIndex !== projIdx) {
          const [item] = resumeData.projects.splice(draggedProjIndex, 1);
          resumeData.projects.splice(projIdx, 0, item);
          renderProjectsEditor();
          scheduleRender();
          showToast(`Moved "${item.title || 'Project'}" to #${projIdx + 1}`);
        }
      });

      container.appendChild(row);
    });
    return;
  }

  projList.forEach((proj, projIdx) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 transition-all duration-150 hover:border-slate-300';
    card.draggable = true;
    card.dataset.projIdx = projIdx;

    let bulletsHtml = (proj.bullets || []).map((b, bIdx) => `
      <div class="flex gap-2 items-start group">
        <span class="text-slate-400 text-xs mt-2 select-none">•</span>
        <textarea rows="1" class="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition leading-relaxed" oninput="autoResizeTextarea(this); updateProjBullet(${projIdx}, ${bIdx}, this.value)">${escapeHtml(b)}</textarea>
        <button class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0 mt-0.5" onclick="deleteProjBullet(${projIdx}, ${bIdx})" title="Delete bullet">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="border-b border-slate-200/80 pb-2.5 flex justify-between items-center gap-2 select-none">
        <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span class="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1 py-0.5 rounded hover:bg-slate-200/50 transition shrink-0" title="Drag to reorder project">
            <i class="fa-solid fa-grip-vertical text-xs"></i>
          </span>
          <span class="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">#${projIdx + 1}</span>
        </div>
        <button class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition shrink-0" onclick="deleteProject(${projIdx})" title="Delete project">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
      <div class="space-y-2.5 pt-1">
        <div>
          <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Project Title</label>
          <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition" value="${escapeHtml(proj.title)}" oninput="updateProjField(${projIdx}, 'title', this.value)">
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Your Role in Project</label>
            <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition" value="${escapeHtml(proj.role)}" oninput="updateProjField(${projIdx}, 'role', this.value)">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Market / Scope</label>
            <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition" value="${escapeHtml(proj.market || '')}" oninput="updateProjField(${projIdx}, 'market', this.value)">
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Platform</label>
            <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition" value="${escapeHtml(proj.platform)}" oninput="updateProjField(${projIdx}, 'platform', this.value)">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Tech Stack</label>
            <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition" value="${escapeHtml(proj.tech)}" oninput="updateProjField(${projIdx}, 'tech', this.value)">
          </div>
        </div>
      </div>
      <div class="space-y-2 pt-1 border-t border-slate-100">
        <div class="flex justify-between items-center">
          <label class="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Impact Bullets (Google XYZ)</label>
          <button class="btn-section-add" onclick="addProjBullet(${projIdx})">
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
      draggedProjIndex = projIdx;
      card.classList.add('opacity-40', 'border-blue-400');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(projIdx));
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('opacity-40', 'border-blue-400');
      container.querySelectorAll('div[data-proj-idx]').forEach(c => {
        c.classList.remove('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
      });
      draggedProjIndex = null;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedProjIndex !== null && draggedProjIndex !== projIdx) {
        card.classList.add('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
      if (draggedProjIndex !== null && draggedProjIndex !== projIdx) {
        const [item] = resumeData.projects.splice(draggedProjIndex, 1);
        resumeData.projects.splice(projIdx, 0, item);
        renderProjectsEditor();
        scheduleRender();
        showToast(`Moved project to #${projIdx + 1}`);
      }
    });

    container.appendChild(card);
  });
  autoResizeAllTextareas();
}

function setupProjectsEditorListeners() {
  const toggleProjectsBtn = document.getElementById('btn-toggle-projects-view');
  if (toggleProjectsBtn) {
    toggleProjectsBtn.onclick = toggleProjectsViewMode;
  }

  const addProjBtn = document.getElementById('btn-add-project');
  if (addProjBtn) {
    addProjBtn.onclick = () => {
      if (!resumeData) return;
      if (!Array.isArray(resumeData.projects)) resumeData.projects = [];
      resumeData.projects.push({
        title: "New Flagship App",
        role: "Lead Mobile Architect",
        platform: "Android, iOS",
        market: "Global",
        tech: "Flutter, Dart, Clean Architecture",
        featured: true,
        bullets: ["Built robust multi-tier cross-platform application."]
      });
      renderProjectsEditor();
      scheduleRender();
    };
  }
}

// Global exposure
window.toggleProjectsViewMode = toggleProjectsViewMode;
window.jumpProject = jumpProject;
window.moveProject = moveProject;
window.toggleProjFeatured = toggleProjFeatured;
window.updateProjField = updateProjField;
window.updateProjBullet = updateProjBullet;
window.deleteProjBullet = deleteProjBullet;
window.addProjBullet = addProjBullet;
window.deleteProject = deleteProject;
window.renderProjectsEditor = renderProjectsEditor;
window.setupProjectsEditorListeners = setupProjectsEditorListeners;

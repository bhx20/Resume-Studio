// public/js/editors/skills-editor.js
// Editor for Skills section: compact reorder view, detailed edit view, drag-and-drop, add/delete/update

let draggedSkillIndex = null;
let isSkillsCompactReorderView = false;

function toggleSkillsViewMode() {
  isSkillsCompactReorderView = !isSkillsCompactReorderView;
  const txt = document.getElementById('txt-skills-view-mode');
  const btn = document.getElementById('btn-toggle-skills-view');
  if (txt) txt.textContent = isSkillsCompactReorderView ? 'Edit Details' : 'Reorder View';
  if (btn) {
    if (isSkillsCompactReorderView) {
      btn.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-300');
      btn.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-300/70');
    } else {
      btn.classList.remove('bg-blue-100', 'text-blue-800', 'border-blue-300');
      btn.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-300/70');
    }
  }
  renderSkillsEditor();
}

function renderSkillsEditor() {
  const container = document.getElementById('skills-list');
  if (!container) return;
  container.innerHTML = '';
  const skillsList = resumeData.skills || [];

  if (isSkillsCompactReorderView) {
    // COMPACT REORDER VIEW: All categories fit on screen without scrolling
    const reorderHint = document.createElement('div');
    reorderHint.className = 'bg-blue-50/70 border border-blue-200/80 rounded-lg p-2.5 text-xs text-blue-800 flex items-center justify-between gap-2';
    reorderHint.innerHTML = `
      <span class="flex items-center gap-1.5 font-medium">
        <i class="fa-solid fa-arrows-up-down text-blue-600"></i>
        <span>Drag cards to reorder categories instantly.</span>
      </span>
      <button class="text-xs font-bold text-blue-700 hover:underline shrink-0" onclick="window.toggleSkillsViewMode()">
        Done Reordering
      </button>
    `;
    container.appendChild(reorderHint);

    skillsList.forEach((s, idx) => {
      const row = document.createElement('div');
      row.className = 'bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2.5 shadow-sm hover:border-blue-400 cursor-grab active:cursor-grabbing transition-all select-none';
      row.draggable = true;
      row.dataset.skillIdx = idx;

      row.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <span class="text-slate-400 hover:text-slate-600 p-0.5" title="Drag to reorder"><i class="fa-solid fa-grip-vertical text-xs"></i></span>
          <span class="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">#${idx + 1}</span>
          <span class="text-xs font-bold text-slate-800 truncate" title="Category">${escapeHtml(s.category || 'Untitled Category')}</span>
        </div>
        <div class="flex items-center shrink-0">
          <button type="button" class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded p-1 text-xs transition shrink-0" title="Delete Category" onclick="deleteSkillCategory(${idx})"><i class="fa-solid fa-trash-can text-xs"></i></button>
        </div>
      `;

      // Drag & drop listeners on compact rows
      row.addEventListener('dragstart', (e) => {
        draggedSkillIndex = idx;
        row.classList.add('opacity-40', 'border-blue-400');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('opacity-40', 'border-blue-400');
        container.querySelectorAll('div[data-skill-idx]').forEach(c => {
          c.classList.remove('border-blue-500', 'bg-blue-50/30');
        });
        draggedSkillIndex = null;
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedSkillIndex !== null && draggedSkillIndex !== idx) {
          row.classList.add('border-blue-500', 'bg-blue-50/30');
        }
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('border-blue-500', 'bg-blue-50/30');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('border-blue-500', 'bg-blue-50/30');
        if (draggedSkillIndex !== null && draggedSkillIndex !== idx) {
          const [item] = resumeData.skills.splice(draggedSkillIndex, 1);
          resumeData.skills.splice(idx, 0, item);
          renderSkillsEditor();
          scheduleRender();
          showToast(`Moved "${item.category || 'Category'}" to #${idx + 1}`);
        }
      });

      container.appendChild(row);
    });
    return;
  }

  // DETAILED EDIT VIEW: Cards with dynamic inputs + drag handle
  skillsList.forEach((s, idx) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 transition-all duration-150 hover:border-slate-300';
    card.draggable = true;
    card.dataset.skillIdx = idx;

    card.innerHTML = `
      <div class="border-b border-slate-200/80 pb-2.5 flex justify-between items-center gap-2 select-none">
        <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span class="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1 py-0.5 rounded hover:bg-slate-200/50 transition shrink-0" title="Drag to reorder category">
            <i class="fa-solid fa-grip-vertical text-xs"></i>
          </span>
          <span class="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">#${idx + 1}</span>
        </div>
        <button class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition shrink-0" title="Delete Category" onclick="deleteSkillCategory(${idx})">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
      <div class="space-y-2.5 pt-0.5">
        <div>
          <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Category Title</label>
          <input type="text" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400" placeholder="e.g. Languages & Web, Cloud Infrastructure" value="${escapeHtml(s.category || '')}" oninput="updateSkillCategory(${idx}, 'category', this.value)">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Skills (Comma-separated)</label>
          <textarea rows="2" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition leading-relaxed placeholder:text-slate-400" placeholder="e.g. Dart, Flutter, TypeScript, SQL" oninput="autoResizeTextarea(this); updateSkillCategory(${idx}, 'skills', this.value)">${escapeHtml(s.skills || '')}</textarea>
        </div>
      </div>
    `;

    // Drag-and-drop event listeners
    card.addEventListener('dragstart', (e) => {
      if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        return;
      }
      draggedSkillIndex = idx;
      card.classList.add('opacity-40', 'border-blue-400');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(idx));
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('opacity-40', 'border-blue-400');
      container.querySelectorAll('div[data-skill-idx]').forEach(c => {
        c.classList.remove('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
      });
      draggedSkillIndex = null;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedSkillIndex !== null && draggedSkillIndex !== idx) {
        card.classList.add('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
      if (draggedSkillIndex !== null && draggedSkillIndex !== idx) {
        const [item] = resumeData.skills.splice(draggedSkillIndex, 1);
        resumeData.skills.splice(idx, 0, item);
        renderSkillsEditor();
        scheduleRender();
        showToast(`Moved "${item.category || 'Category'}" to #${idx + 1}`);
      }
    });

    container.appendChild(card);
  });
  autoResizeAllTextareas();
}

function jumpSkillCategory(fromIdx, toIdx) {
  if (!resumeData || !Array.isArray(resumeData.skills)) return;
  const skillsList = resumeData.skills;
  if (fromIdx < 0 || fromIdx >= skillsList.length) return;
  if (toIdx < 0 || toIdx >= skillsList.length || toIdx === fromIdx) return;
  const [item] = skillsList.splice(fromIdx, 1);
  skillsList.splice(toIdx, 0, item);
  renderSkillsEditor();
  scheduleRender();
  showToast(`Moved "${item.category || 'Category'}" to #${toIdx + 1}`);

  setTimeout(() => {
    const card = document.querySelector(`#skills-list div[data-skill-idx="${toIdx}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => card.classList.remove('ring-2', 'ring-blue-500'), 1200);
    }
  }, 100);
}

function moveSkillCategory(fromIdx, direction) {
  if (!resumeData || !Array.isArray(resumeData.skills)) return;
  const toIdx = fromIdx + direction;
  if (toIdx < 0 || toIdx >= resumeData.skills.length) return;
  const [item] = resumeData.skills.splice(fromIdx, 1);
  resumeData.skills.splice(toIdx, 0, item);
  renderSkillsEditor();
  scheduleRender();
  showToast(`Moved to #${toIdx + 1}`);

  setTimeout(() => {
    const card = document.querySelector(`#skills-list div[data-skill-idx="${toIdx}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      card.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => card.classList.remove('ring-2', 'ring-blue-500'), 1000);
    }
  }, 100);
}

function updateSkillCategory(idx, field, val) {
  if (!resumeData || !resumeData.skills || !resumeData.skills[idx]) return;
  resumeData.skills[idx][field] = val;
  scheduleRender();
}

function deleteSkillCategory(idx) {
  if (!resumeData || !resumeData.skills) return;
  resumeData.skills.splice(idx, 1);
  renderSkillsEditor();
  scheduleRender();
  showToast('Category removed');
}

function setupSkillsEditorListeners() {
  const toggleSkillsBtn = document.getElementById('btn-toggle-skills-view');
  if (toggleSkillsBtn) {
    toggleSkillsBtn.onclick = toggleSkillsViewMode;
  }

  const addSkillBtn = document.getElementById('btn-add-skill-category');
  if (addSkillBtn) {
    addSkillBtn.onclick = () => {
      if (!resumeData) return;
      if (!Array.isArray(resumeData.skills)) resumeData.skills = [];
      resumeData.skills.push({ category: "", skills: "" });
      if (isSkillsCompactReorderView) {
        toggleSkillsViewMode();
      } else {
        renderSkillsEditor();
      }
      scheduleRender();
      setTimeout(() => {
        const inputs = document.querySelectorAll('#skills-list input');
        if (inputs.length > 0) {
          inputs[inputs.length - 1].focus();
        }
      }, 60);
      showToast('New category added');
    };
  }
}

// Global exposure
window.toggleSkillsViewMode = toggleSkillsViewMode;
window.renderSkillsEditor = renderSkillsEditor;
window.jumpSkillCategory = jumpSkillCategory;
window.moveSkillCategory = moveSkillCategory;
window.updateSkillCategory = updateSkillCategory;
window.deleteSkillCategory = deleteSkillCategory;
window.setupSkillsEditorListeners = setupSkillsEditorListeners;

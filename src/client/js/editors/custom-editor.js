// public/js/editors/custom-editor.js
// Editor for Custom sections: dynamic title, JSON key, content/bullets, compact reordering

let draggedCustomIndex = null;
let isCustomSectionsCompactReorderView = false;

function toggleCustomSectionsViewMode() {
  isCustomSectionsCompactReorderView = !isCustomSectionsCompactReorderView;
  const txt = document.getElementById('txt-custom-view-mode');
  const btn = document.getElementById('btn-toggle-custom-view');
  if (txt) txt.textContent = isCustomSectionsCompactReorderView ? 'Edit Details' : 'Reorder View';
  if (btn) {
    if (isCustomSectionsCompactReorderView) {
      btn.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-300');
      btn.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-300/70');
    } else {
      btn.classList.remove('bg-blue-100', 'text-blue-800', 'border-blue-300');
      btn.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-300/70');
    }
  }
  renderCustomSectionsEditor();
}

function jumpCustomSection(fromIdx, toIdx) {
  if (!resumeData || !Array.isArray(resumeData.customSections)) return;
  const sections = resumeData.customSections;
  if (fromIdx < 0 || fromIdx >= sections.length || toIdx < 0 || toIdx >= sections.length || fromIdx === toIdx) return;
  const [item] = sections.splice(fromIdx, 1);
  sections.splice(toIdx, 0, item);
  renderCustomSectionsEditor();
  scheduleRender();
  showToast(`Moved section to #${toIdx + 1}`);
}

function moveCustomSection(fromIdx, direction) {
  if (!resumeData || !Array.isArray(resumeData.customSections)) return;
  const toIdx = fromIdx + direction;
  if (toIdx < 0 || toIdx >= resumeData.customSections.length) return;
  jumpCustomSection(fromIdx, toIdx);
}

function updateCustomSectionTitle(idx, val) {
  resumeData.customSections[idx].title = val;
  scheduleRender();
}

function updateCustomSectionData(idx, val) {
  try {
    const parsed = JSON.parse(val);
    resumeData.customSections[idx].data = parsed;
    resumeData[resumeData.customSections[idx].key] = parsed;
  } catch (e) {
    const lines = val.split('\n').map(l => l.trim()).filter(Boolean);
    resumeData.customSections[idx].data = lines.length > 1 ? lines : val;
    resumeData[resumeData.customSections[idx].key] = resumeData.customSections[idx].data;
  }
  scheduleRender();
}

function deleteCustomSection(idx) {
  const [removed] = resumeData.customSections.splice(idx, 1);
  if (removed && removed.key) delete resumeData[removed.key];
  renderCustomSectionsEditor();
  updateTabBadges();
  scheduleRender();
}

function renderCustomSectionsEditor() {
  const container = document.getElementById('custom-sections-list');
  if (!container) return;
  container.innerHTML = '';
  const sections = resumeData.customSections || [];

  if (sections.length === 0) {
    container.innerHTML = `
      <div class="p-4 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500">
        No custom sections. Click <strong>+ Add Section</strong> above or import a JSON with custom categories (Certifications, Awards, Languages, etc.)
      </div>
    `;
    return;
  }

  if (isCustomSectionsCompactReorderView) {
    const reorderHint = document.createElement('div');
    reorderHint.className = 'bg-blue-50/70 border border-blue-200/80 rounded-lg p-2.5 text-xs text-blue-800 flex items-center justify-between gap-2';
    reorderHint.innerHTML = `
      <span class="flex items-center gap-1.5 font-medium">
        <i class="fa-solid fa-arrows-up-down text-blue-600"></i>
        <span>Drag cards to reorder sections instantly.</span>
      </span>
      <button class="text-xs font-bold text-blue-700 hover:underline shrink-0" onclick="window.toggleCustomSectionsViewMode()">
        Done Reordering
      </button>
    `;
    container.appendChild(reorderHint);

    sections.forEach((sec, idx) => {
      const row = document.createElement('div');
      row.className = 'bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2.5 shadow-sm hover:border-blue-400 cursor-grab active:cursor-grabbing transition-all select-none';
      row.draggable = true;
      row.dataset.customIdx = idx;

      const secDisplay = sec.title || sec.key || 'Untitled Section';

      row.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <span class="text-slate-400 hover:text-slate-600 p-0.5" title="Drag to reorder"><i class="fa-solid fa-grip-vertical text-xs"></i></span>
          <span class="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">#${idx + 1}</span>
          <span class="text-xs font-bold text-slate-800 truncate" title="Section">${escapeHtml(secDisplay)}</span>
        </div>
        <div class="flex items-center shrink-0">
          <button type="button" class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded p-1 text-xs transition ml-1 shrink-0" title="Delete Custom Section" onclick="deleteCustomSection(${idx})"><i class="fa-solid fa-trash-can text-xs"></i></button>
        </div>
      `;

      row.addEventListener('dragstart', (e) => {
        draggedCustomIndex = idx;
        row.classList.add('opacity-40', 'border-blue-400');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('opacity-40', 'border-blue-400');
        container.querySelectorAll('div[data-custom-idx]').forEach(c => {
          c.classList.remove('border-blue-500', 'bg-blue-50/30');
        });
        draggedCustomIndex = null;
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedCustomIndex !== null && draggedCustomIndex !== idx) {
          row.classList.add('border-blue-500', 'bg-blue-50/30');
        }
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('border-blue-500', 'bg-blue-50/30');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('border-blue-500', 'bg-blue-50/30');
        if (draggedCustomIndex !== null && draggedCustomIndex !== idx) {
          const [item] = resumeData.customSections.splice(draggedCustomIndex, 1);
          resumeData.customSections.splice(idx, 0, item);
          renderCustomSectionsEditor();
          scheduleRender();
          showToast(`Moved "${item.title || item.key}" to #${idx + 1}`);
        }
      });

      container.appendChild(row);
    });
    return;
  }

  sections.forEach((sec, idx) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 transition-all duration-150 hover:border-slate-300';
    card.draggable = true;
    card.dataset.customIdx = idx;

    let dataStr = typeof sec.data === 'string' ? sec.data : (Array.isArray(sec.data) ? (typeof sec.data[0] === 'string' ? sec.data.join('\n') : JSON.stringify(sec.data, null, 2)) : JSON.stringify(sec.data, null, 2));

    card.innerHTML = `
      <div class="border-b border-slate-200/80 pb-2.5 flex justify-between items-center gap-2 select-none">
        <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span class="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1 py-0.5 rounded hover:bg-slate-200/50 transition shrink-0" title="Drag to reorder section">
            <i class="fa-solid fa-grip-vertical text-xs"></i>
          </span>
          <span class="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">#${idx + 1}</span>
        </div>
        <button class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition shrink-0" title="Delete Custom Section" onclick="deleteCustomSection(${idx})">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
      <div class="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Section Title</label>
          <input type="text" class="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 font-medium" value="${escapeHtml(sec.title || '')}" oninput="updateCustomSectionTitle(${idx}, this.value)">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">JSON Key</label>
          <input type="text" class="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-500 font-mono" value="${escapeHtml(sec.key || '')}" readonly>
        </div>
      </div>
      <div>
        <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Content (Bullets or JSON array)</label>
        <textarea rows="1" class="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 font-mono" oninput="autoResizeTextarea(this); updateCustomSectionData(${idx}, this.value)">${escapeHtml(dataStr)}</textarea>
      </div>
    `;

    card.addEventListener('dragstart', (e) => {
      if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        return;
      }
      draggedCustomIndex = idx;
      card.classList.add('opacity-40', 'border-blue-400');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(idx));
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('opacity-40', 'border-blue-400');
      container.querySelectorAll('div[data-custom-idx]').forEach(c => {
        c.classList.remove('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
      });
      draggedCustomIndex = null;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedCustomIndex !== null && draggedCustomIndex !== idx) {
        card.classList.add('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('border-blue-500', 'bg-blue-50/30', 'scale-[1.01]');
      if (draggedCustomIndex !== null && draggedCustomIndex !== idx) {
        const [item] = resumeData.customSections.splice(draggedCustomIndex, 1);
        resumeData.customSections.splice(idx, 0, item);
        renderCustomSectionsEditor();
        scheduleRender();
        showToast(`Moved section to #${idx + 1}`);
      }
    });

    container.appendChild(card);
  });
  autoResizeAllTextareas();
}

function setupCustomSectionsEditorListeners() {
  const toggleCustomBtn = document.getElementById('btn-toggle-custom-view');
  if (toggleCustomBtn) {
    toggleCustomBtn.onclick = toggleCustomSectionsViewMode;
  }

  const addCustomSecBtn = document.getElementById('btn-add-custom-section');
  if (addCustomSecBtn) {
    addCustomSecBtn.onclick = () => {
      const secKey = 'custom_' + Date.now();
      resumeData.customSections.push({
        key: secKey,
        title: 'CERTIFICATIONS & CREDENTIALS',
        data: ['Professional Cloud Architect (Google Cloud)', 'Lead Mobile Application Specialist']
      });
      resumeData[secKey] = resumeData.customSections[resumeData.customSections.length - 1].data;
      renderCustomSectionsEditor();
      updateTabBadges();
      scheduleRender();
    };
  }
}

// Global exposure
window.toggleCustomSectionsViewMode = toggleCustomSectionsViewMode;
window.jumpCustomSection = jumpCustomSection;
window.moveCustomSection = moveCustomSection;
window.updateCustomSectionTitle = updateCustomSectionTitle;
window.updateCustomSectionData = updateCustomSectionData;
window.deleteCustomSection = deleteCustomSection;
window.renderCustomSectionsEditor = renderCustomSectionsEditor;
window.setupCustomSectionsEditorListeners = setupCustomSectionsEditorListeners;

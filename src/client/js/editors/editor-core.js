// public/js/editors/editor-core.js
// Handles Drawer controls, tab switching, form population, section heading live editing, and tab badges

function openSectionEditor(secId) {
  currentActiveSectionId = secId;

  const tabMap = {
    personal: 'tab-personal',
    summary: 'tab-summary',
    skills: 'tab-skills',
    experience: 'tab-experience',
    projects: 'tab-projects',
    education: 'tab-education',
    achievements: 'tab-experience'
  };

  const targetPaneId = tabMap[secId] || 'tab-custom';

  // 1. Hide all editor section panes
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));

  // 2. Display exclusively the selected section's editor pane
  const targetPane = document.getElementById(targetPaneId);
  if (targetPane) targetPane.classList.remove('hidden');

  // 3. Open right editor panel drawer if collapsed
  const panel = document.getElementById('right-editor-panel');
  if (panel && panel.classList.contains('collapsed-panel')) {
    panel.classList.remove('collapsed-panel');
  }

  const toggleText = document.getElementById('btn-toggle-editor-text');
  if (toggleText) toggleText.textContent = 'Close Editor';

  // 4. Highlight the active section on the resume canvas
  document.querySelectorAll('.resume-section').forEach(s => s.classList.remove('active-editing'));
  const activeEl = document.querySelector(`.resume-section[data-section-id="${secId}"]`);
  if (activeEl) {
    activeEl.classList.add('active-editing');
  }

  // 5. Update dynamic heading title input and drawer title bar
  updateSectionHeadingEditor(secId);

  // 6. Ensure all field textareas auto-expand without internal scrollbars
  autoResizeAllTextareas();
}

function selectAndOpenSection(secId) {
  openSectionEditor(secId);
}

function switchTab(tabId) {
  const tabToSecMap = {
    'tab-personal': 'personal',
    'tab-summary': 'summary',
    'tab-skills': 'skills',
    'tab-experience': 'experience',
    'tab-projects': 'projects',
    'tab-education': 'education',
    'tab-custom': 'custom'
  };
  openSectionEditor(tabToSecMap[tabId] || 'personal');
}

function deselectAll() {
  currentActiveSectionId = null;
  document.querySelectorAll('.resume-section').forEach(s => s.classList.remove('active-editing'));
  document.querySelectorAll('.drag-over, .dragging').forEach(s => s.classList.remove('drag-over', 'dragging'));
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  }
}

function closeEditorPanel() {
  const panel = document.getElementById('right-editor-panel');
  const toggleText = document.getElementById('btn-toggle-editor-text');
  if (panel && !panel.classList.contains('collapsed-panel')) {
    panel.classList.add('collapsed-panel');
  }
  if (toggleText) toggleText.textContent = 'Edit Section';
  deselectAll();
}

function setupEditorPanelControls() {
  const panel = document.getElementById('right-editor-panel');
  const closeBtn = document.getElementById('btn-close-editor');
  const toggleBtn = document.getElementById('btn-toggle-editor');

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeEditorPanel();
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (panel) {
        const isClosed = panel.classList.contains('collapsed-panel');
        if (isClosed) {
          openSectionEditor(currentActiveSectionId || 'personal');
        } else {
          closeEditorPanel();
        }
      }
    });
  }

  // Tap/click outside to deselect all things and close right panel
  document.addEventListener('pointerdown', (e) => {
    // If clicked inside the right editor panel, don't close or deselect
    if (e.target.closest('#right-editor-panel')) return;

    // If clicked inside a resume section, it handles its own selection
    if (e.target.closest('.resume-section')) return;

    // If clicked inside interactive controls (like modals, toasts, zoom controls, inputs)
    if (e.target.closest('#btn-toggle-editor, #toast-container, .modal-backdrop, [role="dialog"], #btn-zoom-in, #btn-zoom-out, #btn-zoom-reset, #inp-import-json')) return;

    // Tapped outside! Deselect all items and close the right panel
    closeEditorPanel();
  });
}

function setupHeadingEditorControl() {
  const inpHeading = document.getElementById('inp-active-section-heading');
  if (inpHeading) {
    inpHeading.addEventListener('input', (e) => {
      if (!resumeData || !currentActiveSectionId || currentActiveSectionId === 'personal') return;
      const newTitle = e.target.value;
      resumeData.sectionTitles = resumeData.sectionTitles || {};
      resumeData.sectionTitles[currentActiveSectionId] = newTitle;

      // Update custom section model title if custom
      if (Array.isArray(resumeData.customSections)) {
        const cs = resumeData.customSections.find(c => c.key === currentActiveSectionId);
        if (cs) cs.title = newTitle;
      }

      // Update section title on canvas live
      const titleEls = document.querySelectorAll(`.section-title[data-title-key="${currentActiveSectionId}"]`);
      titleEls.forEach(el => {
        el.textContent = newTitle.toUpperCase();
      });

      // Update drawer title
      const panelTitle = document.getElementById('editor-panel-title');
      if (panelTitle) panelTitle.textContent = `Edit: ${newTitle}`;

      scheduleRender();
    });
  }
}

function updateSectionHeadingEditor(secId) {
  currentActiveSectionId = secId;
  const inpHeading = document.getElementById('inp-active-section-heading');
  const btnReset = document.getElementById('btn-reset');
  const btnResetText = document.getElementById('btn-reset-text');

  if (secId === 'personal') {
    if (inpHeading) {
      inpHeading.value = 'PERSONAL INFORMATION';
      inpHeading.readOnly = true;
      inpHeading.classList.add('bg-slate-100', 'text-slate-500', 'cursor-default');
      inpHeading.classList.remove('bg-white', 'text-slate-800');
    }
    if (btnReset) btnReset.title = 'Reset Personal Information back to default template data';
    if (btnResetText) btnResetText.textContent = 'Reset Personal';
    return;
  }

  const currentTitle = getSectionTitle(resumeData, secId);
  if (inpHeading) {
    inpHeading.value = currentTitle;
    inpHeading.readOnly = false;
    inpHeading.classList.remove('bg-slate-100', 'text-slate-500', 'cursor-default');
    inpHeading.classList.add('bg-white', 'text-slate-800');
  }

  const displayTitle = formatSectionTitleDisplay(secId);
  if (btnReset) btnReset.title = `Reset ${currentTitle} back to default template data`;
  if (btnResetText) btnResetText.textContent = `Reset ${displayTitle}`;
}

function updateTabBadges() {
  if (!resumeData) return;
  const projBtn = document.getElementById('tab-btn-projects');
  if (projBtn) projBtn.textContent = `Projects (${(resumeData.projects || []).length})`;

  const skillsBtn = document.getElementById('tab-btn-skills');
  if (skillsBtn) skillsBtn.textContent = `Skills (${(resumeData.skills || []).length})`;

  const expBtn = document.getElementById('tab-btn-experience');
  if (expBtn) expBtn.textContent = `Experience (${(resumeData.experience || []).length})`;

  const eduBtn = document.getElementById('tab-btn-education');
  if (eduBtn) eduBtn.textContent = `Education (${(resumeData.education || []).length})`;

  const customBtn = document.getElementById('tab-btn-custom');
  if (customBtn) customBtn.textContent = `Custom (${(resumeData.customSections || []).length})`;
}

function populateForm() {
  const p = resumeData.personal || {};
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };
  setVal('inp-name', p.name);
  setVal('inp-title', p.title);
  setVal('inp-location', p.location);
  setVal('inp-phone', p.phone);
  setVal('inp-email', p.email);
  setVal('inp-linkedin', p.linkedin);
  setVal('inp-github', p.github);

  ['inp-name', 'inp-title', 'inp-location', 'inp-phone', 'inp-email', 'inp-linkedin', 'inp-github'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = () => {
        const key = id.replace('inp-', '');
        resumeData.personal[key] = el.value;
        scheduleRender();
      };
    }
  });

  const summaryEl = document.getElementById('inp-summary');
  if (summaryEl) {
    summaryEl.value = resumeData.summary || '';
    summaryEl.oninput = (e) => {
      autoResizeTextarea(summaryEl);
      resumeData.summary = e.target.value;
      scheduleRender();
    };
    autoResizeTextarea(summaryEl);
  }

  if (typeof renderSkillsEditor === 'function') renderSkillsEditor();
  if (typeof renderExperienceEditor === 'function') renderExperienceEditor();
  if (typeof renderProjectsEditor === 'function') renderProjectsEditor();
  if (typeof renderEducationEditor === 'function') renderEducationEditor();
  if (typeof renderCustomSectionsEditor === 'function') renderCustomSectionsEditor();
  updateTabBadges();
}

// Global exposure
window.openSectionEditor = openSectionEditor;
window.selectAndOpenSection = selectAndOpenSection;
window.switchTab = switchTab;
window.setupEditorPanelControls = setupEditorPanelControls;
window.setupHeadingEditorControl = setupHeadingEditorControl;
window.updateSectionHeadingEditor = updateSectionHeadingEditor;
window.updateTabBadges = updateTabBadges;
window.populateForm = populateForm;
window.deselectAll = deselectAll;
window.closeEditorPanel = closeEditorPanel;

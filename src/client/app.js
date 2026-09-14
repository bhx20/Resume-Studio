// public/app.js
// Resume ATS Architect - Main Application Orchestrator & Entry Point
// Modules loaded in public/index.html:
//   1. js/state.js                - Application state, constants, default template
//   2. js/utils.js                - Formatting helpers, normalization, alerts, toasts, auto-resize
//   3. js/db.js                   - Local database persistence, auto-save, JSON import/export
//   4. js/canvas.js               - 2-page ATS canvas renderer, drag-to-reorder, fit budget meter
//   5. js/editors/editor-core.js  - Drawer controls, tab switching, form population, title editor
//   6. js/editors/skills-editor.js   - Skills section editor & compact reordering
//   7. js/editors/exp-editor.js      - Experience section editor & compact reordering
//   8. js/editors/proj-editor.js     - Projects section editor & compact reordering
//   9. js/editors/edu-editor.js      - Education section editor & compact reordering
//  10. js/editors/custom-editor.js   - Custom sections editor & compact reordering
//  11. js/toolbar.js              - Zoom, print/PDF, Word doc, Markdown, plain text, reset modal
//  12. app.js                     - Application initialization entry point

async function initApp() {
  if (typeof setupToolbarActions === 'function') setupToolbarActions();
  if (typeof setupEditorPanelControls === 'function') setupEditorPanelControls();
  if (typeof setupHeadingEditorControl === 'function') setupHeadingEditorControl();
  if (typeof setupDragAutoScroll === 'function') setupDragAutoScroll();
  if (typeof loadData === 'function') await loadData();
}

window.initApp = initApp;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

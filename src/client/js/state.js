// public/js/state.js
// Resume Studio — Global Application State
// Default data source of truth: src/data/resume-data.json (loaded dynamically)

let resumeData = null;
let zoomLevel = 1.0;
let draggedSectionId = null;
let currentActiveSectionId = 'personal';

const defaultSectionTitles = {
  summary: 'PROFESSIONAL SUMMARY',
  skills: 'TECHNICAL SKILLS MATRIX',
  experience: 'PROFESSIONAL EXPERIENCE',
  projects: 'KEY PROJECTS & DELIVERABLES',
  achievements: 'CORE ENGINEERING & ACHIEVEMENTS',
  education: 'EDUCATION'
};

// Populated dynamically from src/data/resume-data.json
let DEFAULT_RESUME_DATA = null;

// Expose state globally for browser scripts and inline handlers
window.resumeData = resumeData;
window.zoomLevel = zoomLevel;
window.draggedSectionId = draggedSectionId;
window.currentActiveSectionId = currentActiveSectionId;
window.defaultSectionTitles = defaultSectionTitles;
window.DEFAULT_RESUME_DATA = DEFAULT_RESUME_DATA;

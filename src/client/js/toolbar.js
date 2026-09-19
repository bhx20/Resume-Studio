// public/js/toolbar.js
// Toolbar actions: Zoom, Print/PDF, DOC, Import/Export JSON, Markdown, Plain Text, Section Reset, Drag Auto-Scroll

let autoScrollAnimFrame = null;
let autoScrollSpeed = 0;

function setupDragAutoScroll() {
  const container = document.getElementById('editor-form-container') || document.querySelector('[data-purpose="form-inputs-container"]');
  if (!container) return;

  container.addEventListener('dragover', (e) => {
    const rect = container.getBoundingClientRect();
    const y = e.clientY;
    const edgeSize = 100; // Trigger zone in pixels from top/bottom boundary

    if (y < rect.top + edgeSize) {
      // Near top of panel: auto-scroll up
      const ratio = Math.max(0.1, 1 - (y - rect.top) / edgeSize);
      autoScrollSpeed = -Math.round(ratio * 26);
      startAutoScroll(container);
    } else if (y > rect.bottom - edgeSize) {
      // Near bottom of panel: auto-scroll down
      const ratio = Math.max(0.1, 1 - (rect.bottom - y) / edgeSize);
      autoScrollSpeed = Math.round(ratio * 26);
      startAutoScroll(container);
    } else {
      stopAutoScroll();
    }
  });

  window.addEventListener('dragend', stopAutoScroll);
  window.addEventListener('drop', stopAutoScroll);
  window.addEventListener('mouseup', stopAutoScroll);
}

function startAutoScroll(container) {
  if (autoScrollAnimFrame) return;
  function step() {
    if (autoScrollSpeed !== 0) {
      container.scrollTop += autoScrollSpeed;
      autoScrollAnimFrame = requestAnimationFrame(step);
    } else {
      autoScrollAnimFrame = null;
    }
  }
  autoScrollAnimFrame = requestAnimationFrame(step);
}

function stopAutoScroll() {
  autoScrollSpeed = 0;
  if (autoScrollAnimFrame) {
    cancelAnimationFrame(autoScrollAnimFrame);
    autoScrollAnimFrame = null;
  }
}

function buildMarkdown(data) {
  const p = data.personal || {};
  let md = `# ${p.name || 'Sanket Kalathiya'}\n`;
  md += `**${p.title || ''}**  \n`;
  md += `${p.location || ''} | ${p.phone || ''} | ${p.email || ''}  \n`;
  if (p.linkedin) md += `[LinkedIn: ${p.linkedin.replace(/^https?:\/\//, '')}](${p.linkedin}) | `;
  if (p.github) md += `[GitHub: ${p.github.replace(/^https?:\/\//, '')}](${p.github})`;
  md += `\n\n`;

  const sectionBuilders = {
    summary: () => {
      if (!data.summary) return '';
      const title = getSectionTitle(data, 'summary', 'PROFESSIONAL SUMMARY').toUpperCase();
      return `---\n\n## ${title}\n${data.summary}\n\n`;
    },
    skills: () => {
      if (!data.skills || data.skills.length === 0) return '';
      const title = getSectionTitle(data, 'skills', 'TECHNICAL SKILLS MATRIX').toUpperCase();
      let sMd = `---\n\n## ${title}\n\n`;
      data.skills.forEach(s => {
        sMd += `- **${s.category}**: ${s.skills}\n`;
      });
      return sMd + '\n';
    },
    experience: () => {
      if (!data.experience || data.experience.length === 0) return '';
      const title = getSectionTitle(data, 'experience', 'PROFESSIONAL EXPERIENCE').toUpperCase();
      let eMd = `---\n\n## ${title}\n\n`;
      let currentCompanyMd = '';
      data.experience.forEach(exp => {
        if (exp.company && exp.company !== currentCompanyMd) {
          currentCompanyMd = exp.company;
          eMd += `### **${exp.company}** — *${exp.location || ''}*\n\n`;
        }
        eMd += `#### **${exp.role}** | *${exp.period}*\n`;
        (exp.bullets || []).forEach(b => {
          eMd += `- ${b}\n`;
        });
        eMd += `\n`;
      });
      return eMd;
    },
    projects: () => {
      if (!data.projects || data.projects.length === 0) return '';
      const title = getSectionTitle(data, 'projects', 'KEY PROJECTS & DELIVERABLES').toUpperCase();
      let pMd = `---\n\n## ${title}\n\n`;
      data.projects.forEach(proj => {
        pMd += `### **${proj.title}** | *${proj.role}*\n`;
        pMd += `*Platform: ${proj.platform || ''} | Tech: ${proj.tech || ''} | Market: ${proj.market || ''}*\n`;
        (proj.bullets || []).forEach(b => {
          pMd += `- ${b}\n`;
        });
        pMd += `\n`;
      });
      return pMd;
    },
    achievements: () => {
      const achievements = data.achievements || [];
      if (achievements.length === 0) return '';
      const title = getSectionTitle(data, 'achievements', 'CORE ENGINEERING & ACHIEVEMENTS').toUpperCase();
      let aMd = `---\n\n## ${title}\n\n`;
      achievements.forEach(a => { aMd += `- ${a}\n`; });
      return aMd + '\n';
    },
    education: () => {
      if (!data.education || data.education.length === 0) return '';
      const title = getSectionTitle(data, 'education', 'EDUCATION').toUpperCase();
      let edMd = `---\n\n## ${title}\n\n`;
      data.education.forEach(edu => {
        edMd += `- **${edu.degree}** — ${edu.institution} *(${edu.period || edu.year || ''})*\n`;
      });
      return edMd + '\n';
    }
  };

  (data.customSections || []).forEach(cs => {
    sectionBuilders[cs.key] = () => {
      const title = getSectionTitle(data, cs.key, cs.title).toUpperCase();
      let cMd = `---\n\n## ${title}\n\n`;
      const val = cs.data;
      if (Array.isArray(val)) {
        val.forEach(item => {
          if (typeof item === 'string') {
            cMd += `- ${item}\n`;
          } else if (typeof item === 'object') {
            const itemTitle = item.title || item.name || item.role || '';
            const meta = item.issuer || item.institution || item.period || item.date || item.level || '';
            cMd += `### ${itemTitle}${meta ? ` *(${meta})*` : ''}\n`;
            if (item.bullets && Array.isArray(item.bullets)) {
              item.bullets.forEach(b => { cMd += `- ${b}\n`; });
            }
          }
        });
      } else if (typeof val === 'string') {
        cMd += `${val}\n\n`;
      }
      return cMd + '\n';
    };
  });

  const defaultOrder = ['summary', 'skills', 'experience', 'projects', 'achievements', 'education'];
  (data.customSections || []).forEach(cs => {
    if (!defaultOrder.includes(cs.key)) defaultOrder.push(cs.key);
  });

  const order = (Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0)
    ? data.sectionOrder
    : defaultOrder;

  order.forEach(id => {
    if (sectionBuilders[id]) {
      md += sectionBuilders[id]();
    }
  });

  return md;
}

function buildPlainText(data) {
  const p = data.personal || {};
  let txt = `================================================================================\n`;
  txt += `${p.name || 'Sanket Kalathiya'}\n`;
  txt += `${p.title || ''}\n`;
  txt += `${p.location || ''} | ${p.phone || ''} | ${p.email || ''}\n`;
  txt += `LinkedIn: ${p.linkedin || ''} | GitHub: ${p.github || ''}\n`;
  txt += `================================================================================\n\n`;

  const sectionBuilders = {
    summary: () => {
      if (!data.summary) return '';
      const title = getSectionTitle(data, 'summary', 'PROFESSIONAL SUMMARY').toUpperCase();
      return `${title}\n${'-'.repeat(Math.max(10, title.length))}\n${data.summary}\n\n\n`;
    },
    skills: () => {
      if (!data.skills || data.skills.length === 0) return '';
      const title = getSectionTitle(data, 'skills', 'TECHNICAL SKILLS MATRIX').toUpperCase();
      let sTxt = `${title}\n${'-'.repeat(Math.max(10, title.length))}\n`;
      data.skills.forEach(s => {
        sTxt += `- ${s.category}: ${s.skills}\n`;
      });
      return sTxt + '\n\n';
    },
    experience: () => {
      if (!data.experience || data.experience.length === 0) return '';
      const title = getSectionTitle(data, 'experience', 'PROFESSIONAL EXPERIENCE').toUpperCase();
      let eTxt = `${title}\n${'-'.repeat(Math.max(10, title.length))}\n`;
      let currentCompanyTxt = '';
      data.experience.forEach(exp => {
        if (exp.company && exp.company !== currentCompanyTxt) {
          currentCompanyTxt = exp.company;
          eTxt += `\n${exp.company} — ${exp.location || ''}\n`;
        }
        eTxt += `${exp.role} | ${exp.period}\n`;
        (exp.bullets || []).forEach(b => {
          eTxt += `* ${b}\n`;
        });
        eTxt += `\n`;
      });
      return eTxt + '\n';
    },
    projects: () => {
      if (!data.projects || data.projects.length === 0) return '';
      const title = getSectionTitle(data, 'projects', 'KEY PROJECTS & DELIVERABLES').toUpperCase();
      let pTxt = `${title}\n${'-'.repeat(Math.max(10, title.length))}\n`;
      data.projects.forEach(proj => {
        pTxt += `${proj.title} | ${proj.role}\n`;
        pTxt += `Platform: ${proj.platform || ''} | Tech: ${proj.tech || ''} | Market: ${proj.market || ''}\n`;
        (proj.bullets || []).forEach(b => {
          pTxt += `* ${b}\n`;
        });
        pTxt += `\n`;
      });
      return pTxt + '\n';
    },
    achievements: () => {
      const achievements = data.achievements || [];
      if (achievements.length === 0) return '';
      const title = getSectionTitle(data, 'achievements', 'CORE ENGINEERING & ACHIEVEMENTS').toUpperCase();
      let aTxt = `${title}\n${'-'.repeat(Math.max(10, title.length))}\n`;
      achievements.forEach(a => { aTxt += `* ${a}\n`; });
      return aTxt + '\n\n';
    },
    education: () => {
      if (!data.education || data.education.length === 0) return '';
      const title = getSectionTitle(data, 'education', 'EDUCATION').toUpperCase();
      let edTxt = `${title}\n${'-'.repeat(Math.max(10, title.length))}\n`;
      data.education.forEach(edu => {
        edTxt += `- ${edu.degree} — ${edu.institution} (${edu.period || edu.year || ''})\n`;
      });
      return edTxt + '\n';
    }
  };

  (data.customSections || []).forEach(cs => {
    sectionBuilders[cs.key] = () => {
      const title = getSectionTitle(data, cs.key, cs.title).toUpperCase();
      let cTxt = `\n${title}\n${'-'.repeat(Math.max(10, title.length))}\n`;
      const val = cs.data;
      if (Array.isArray(val)) {
        val.forEach(item => {
          if (typeof item === 'string') {
            cTxt += `* ${item}\n`;
          } else if (typeof item === 'object') {
            const itemTitle = item.title || item.name || item.role || '';
            const itemMeta = item.issuer || item.institution || item.period || item.date || item.level || '';
            cTxt += `\n${itemTitle}${itemMeta ? ` (${itemMeta})` : ''}\n`;
            if (item.bullets && Array.isArray(item.bullets)) {
              item.bullets.forEach(b => { cTxt += `* ${b}\n`; });
            }
          }
        });
      } else if (typeof val === 'string') {
        cTxt += `${val}\n\n`;
      }
      return cTxt + '\n';
    };
  });

  const defaultOrder = ['summary', 'skills', 'experience', 'projects', 'achievements', 'education'];
  (data.customSections || []).forEach(cs => {
    if (!defaultOrder.includes(cs.key)) defaultOrder.push(cs.key);
  });

  const order = (Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0)
    ? data.sectionOrder
    : defaultOrder;

  order.forEach(id => {
    if (sectionBuilders[id]) {
      txt += sectionBuilders[id]();
    }
  });

  return txt;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadWordHtml(data) {
  const p = data.personal || {};

  const sectionRenderers = {
    summary: () => {
      if (!data.summary) return '';
      const title = escapeHtml(getSectionTitle(data, 'summary', 'PROFESSIONAL SUMMARY').toUpperCase());
      return `
        <h2>${title}</h2>
        <p style="text-align: left;">${escapeHtml(data.summary)}</p>
      `;
    },
    skills: () => {
      if (!data.skills || data.skills.length === 0) return '';
      const title = escapeHtml(getSectionTitle(data, 'skills', 'TECHNICAL SKILLS MATRIX').toUpperCase());
      return `
        <h2>${title}</h2>
        ${(data.skills || []).map(s => `<p><b>${escapeHtml(s.category)}:</b> ${escapeHtml(s.skills)}</p>`).join('')}
      `;
    },
    experience: () => {
      if (!data.experience || data.experience.length === 0) return '';
      const title = escapeHtml(getSectionTitle(data, 'experience', 'PROFESSIONAL EXPERIENCE').toUpperCase());
      return `
        <h2>${title}</h2>
        ${(data.experience || []).map(exp => `
          <p><b>${escapeHtml(exp.company || '')} | ${escapeHtml(exp.role || '')}</b> | <i>${escapeHtml(exp.period || '')}${exp.location ? ' | ' + escapeHtml(exp.location) : ''}</i></p>
          <ul>${(exp.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        `).join('')}
      `;
    },
    projects: () => {
      if (!data.projects || data.projects.length === 0) return '';
      const title = escapeHtml(getSectionTitle(data, 'projects', 'KEY PROJECTS & DELIVERABLES').toUpperCase());
      return `
        <h2>${title}</h2>
        ${(data.projects || []).map(proj => `
          <p><b>${escapeHtml(proj.title || '')}</b> | ${escapeHtml(proj.role || '')}<br>
          <i style="font-size: 9pt; color: #555;">Platform: ${escapeHtml(proj.platform || '')} | Tech: ${escapeHtml(proj.tech || '')} | Market: ${escapeHtml(proj.market || '')}</i></p>
          <ul>${(proj.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        `).join('')}
      `;
    },
    achievements: () => {
      const achievements = data.achievements || [];
      if (achievements.length === 0) return '';
      const title = escapeHtml(getSectionTitle(data, 'achievements', 'CORE ENGINEERING & ACHIEVEMENTS').toUpperCase());
      return `
        <h2>${title}</h2>
        <ul>${achievements.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
      `;
    },
    education: () => {
      if (!data.education || data.education.length === 0) return '';
      const title = escapeHtml(getSectionTitle(data, 'education', 'EDUCATION').toUpperCase());
      return `
        <h2>${title}</h2>
        ${(data.education || []).map(edu => `<p><b>${escapeHtml(edu.degree || '')}</b> — ${escapeHtml(edu.institution || '')} <i>(${escapeHtml(edu.period || edu.year || '')})</i></p>`).join('')}
      `;
    }
  };

  (data.customSections || []).forEach(cs => {
    sectionRenderers[cs.key] = () => {
      const title = escapeHtml(getSectionTitle(data, cs.key, cs.title).toUpperCase());
      const val = cs.data;
      let bodyHtml = '';
      if (Array.isArray(val)) {
        if (typeof val[0] === 'string') {
          bodyHtml = `<ul>${val.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
        } else if (typeof val[0] === 'object') {
          bodyHtml = val.map(item => `
            <p><b>${escapeHtml(item.title || item.name || '')}</b> | <i>${escapeHtml(item.issuer || item.period || '')}</i></p>
            ${(item.bullets || []).length > 0 ? `<ul>${item.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
          `).join('');
        }
      } else if (typeof val === 'string') {
        bodyHtml = `<p>${escapeHtml(val)}</p>`;
      }
      return `<h2>${title}</h2>${bodyHtml}`;
    };
  });

  const defaultOrder = ['summary', 'skills', 'experience', 'projects', 'achievements', 'education'];
  (data.customSections || []).forEach(cs => {
    if (!defaultOrder.includes(cs.key)) defaultOrder.push(cs.key);
  });

  const order = (Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0)
    ? data.sectionOrder
    : defaultOrder;

  const sectionsHtml = order.map(id => sectionRenderers[id] ? sectionRenderers[id]() : '').join('');

  let content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(p.name || 'Resume')}</title>
      <style>
        @page Section1 { size: 8.5in 11.0in; margin: 0.5in 0.5in 0.5in 0.5in; mso-header-margin: 0.5in; mso-footer-margin: 0.5in; }
        div.Section1 { page: Section1; }
        body { font-family: 'Calibri', 'Times New Roman', serif; font-size: 10pt; line-height: 1.25; color: #000000; }
        h1 { font-size: 16pt; font-weight: bold; text-align: center; margin: 0 0 4pt 0; text-transform: uppercase; }
        .title { font-size: 10.5pt; font-weight: bold; text-align: center; color: #333333; margin-bottom: 4pt; }
        .contact { font-size: 9.5pt; text-align: center; color: #555555; border-bottom: 1pt solid #999999; padding-bottom: 6pt; margin-bottom: 10pt; }
        h2 { font-size: 11pt; font-weight: bold; text-transform: uppercase; border-bottom: 1pt solid #000000; padding-bottom: 2pt; margin: 10pt 0 4pt 0; }
        ul { margin: 2pt 0 6pt 16pt; padding: 0; }
        li { margin-bottom: 2pt; font-size: 9.5pt; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h1>${escapeHtml(p.name || 'Sanket Kalathiya')}</h1>
        <div class="title">${escapeHtml(p.title || '')}</div>
        <div class="contact">${escapeHtml([p.location, p.phone, p.email, p.linkedin, p.github].filter(Boolean).join('  •  '))}</div>
        ${sectionsHtml}
      </div>
    </body>
    </html>
  `;
  const fileName = getCandidateFilename(data, 'doc');
  const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${fileName}!`);
}

function setupToolbarActions() {
  // Import JSON Action
  const btnImportJson = document.getElementById('btn-import-json');
  const inpImportJson = document.getElementById('inp-import-json');
  if (btnImportJson && inpImportJson) {
    btnImportJson.onclick = () => {
      inpImportJson.value = '';
      inpImportJson.click();
    };
    inpImportJson.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(String(event.target.result));
          applyImportedJson(parsed, file.name);
        } catch (parseErr) {
          alert(`Invalid JSON file: ${parseErr.message}`);
        }
      };
      reader.onerror = () => {
        alert('Failed to read selected JSON file.');
      };
      reader.readAsText(file);
    };
  }

  // Window-wide Drag & Drop for JSON files
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.json') || file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(String(event.target.result));
            applyImportedJson(parsed, file.name);
          } catch (err) {
            alert(`Could not import dropped file: ${err.message}`);
          }
        };
        reader.readAsText(file);
      }
    }
  });

  // Export JSON Action
  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) {
    btnExportJson.onclick = () => {
      if (!resumeData) return;
      syncActiveFormFields();
      
      const jsonStr = JSON.stringify(resumeData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const candidateName = (resumeData.personal?.name || 'Resume').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${candidateName}_Resume.json`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported ${fileName} successfully!`);
    };
  }

  // Save to Local Database (Zero Backend)
  const btnSave = document.getElementById('btn-save');
  if (btnSave) {
    btnSave.onclick = () => {
      syncActiveFormFields();
      LocalResumeDatabase.save(resumeData);
      const statusEl = document.getElementById('save-status');
      if (statusEl) statusEl.textContent = 'Saved to local database';
      showToast('Saved to local database!');
    };
  }

  // Reset Data for Currently Selected Section to Default Template (Section-Specific)
  const btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.onclick = async () => {
      if (!currentActiveSectionId) return;

      const secId = currentActiveSectionId;
      const sectionName = secId === 'personal'
        ? 'Personal Information'
        : getSectionTitle(resumeData, secId, formatSectionTitle(secId));

      const confirmed = await showConfirmDialog({
        title: `Reset ${formatSectionTitleDisplay(secId)}?`,
        message: `Reset <strong>"${escapeHtml(sectionName)}"</strong> back to default template data?<br><span class="text-slate-500 mt-1 block">All other sections in your resume will remain unchanged.</span>`,
        confirmText: `Reset ${formatSectionTitleDisplay(secId)}`,
        cancelText: 'Cancel',
        danger: true,
        icon: 'fa-rotate-left'
      });
      if (!confirmed) return;

      const statusEl = document.getElementById('save-status');
      if (statusEl) statusEl.textContent = `Resetting ${sectionName}...`;

      // Load fresh default data
      const freshDefault = await loadDefaultSourceData();

      // Reset ONLY the active section
      if (secId === 'personal') {
        resumeData.personal = JSON.parse(JSON.stringify(freshDefault.personal || {}));
        ['name', 'title', 'location', 'phone', 'email', 'linkedin', 'github'].forEach(k => {
          const el = document.getElementById(`inp-${k}`);
          if (el) el.value = resumeData.personal[k] || '';
        });
      } else if (secId === 'summary') {
        resumeData.summary = freshDefault.summary || '';
        const el = document.getElementById('inp-summary');
        if (el) el.value = resumeData.summary;
        if (freshDefault.sectionTitles && freshDefault.sectionTitles.summary) {
          resumeData.sectionTitles = resumeData.sectionTitles || {};
          resumeData.sectionTitles.summary = freshDefault.sectionTitles.summary;
        }
      } else if (secId === 'skills') {
        resumeData.skills = JSON.parse(JSON.stringify(freshDefault.skills || []));
        if (freshDefault.sectionTitles && freshDefault.sectionTitles.skills) {
          resumeData.sectionTitles = resumeData.sectionTitles || {};
          resumeData.sectionTitles.skills = freshDefault.sectionTitles.skills;
        }
        renderSkillsEditor();
      } else if (secId === 'experience') {
        resumeData.experience = JSON.parse(JSON.stringify(freshDefault.experience || []));
        if (freshDefault.sectionTitles && freshDefault.sectionTitles.experience) {
          resumeData.sectionTitles = resumeData.sectionTitles || {};
          resumeData.sectionTitles.experience = freshDefault.sectionTitles.experience;
        }
        renderExperienceEditor();
      } else if (secId === 'projects') {
        resumeData.projects = JSON.parse(JSON.stringify(freshDefault.projects || []));
        if (freshDefault.sectionTitles && freshDefault.sectionTitles.projects) {
          resumeData.sectionTitles = resumeData.sectionTitles || {};
          resumeData.sectionTitles.projects = freshDefault.sectionTitles.projects;
        }
        renderProjectsEditor();
      } else if (secId === 'education') {
        resumeData.education = JSON.parse(JSON.stringify(freshDefault.education || []));
        if (freshDefault.sectionTitles && freshDefault.sectionTitles.education) {
          resumeData.sectionTitles = resumeData.sectionTitles || {};
          resumeData.sectionTitles.education = freshDefault.sectionTitles.education;
        }
        renderEducationEditor();
      } else if (secId === 'achievements') {
        resumeData.achievements = JSON.parse(JSON.stringify(freshDefault.achievements || []));
        if (freshDefault.sectionTitles && freshDefault.sectionTitles.achievements) {
          resumeData.sectionTitles = resumeData.sectionTitles || {};
          resumeData.sectionTitles.achievements = freshDefault.sectionTitles.achievements;
        }
        renderExperienceEditor();
      } else {
        // Custom section
        if (Array.isArray(freshDefault.customSections)) {
          const match = freshDefault.customSections.find(cs => cs.key === secId);
          if (match) {
            resumeData.customSections = resumeData.customSections || [];
            const existingIdx = resumeData.customSections.findIndex(cs => cs.key === secId);
            if (existingIdx !== -1) {
              resumeData.customSections[existingIdx] = JSON.parse(JSON.stringify(match));
            } else {
              resumeData.customSections.push(JSON.parse(JSON.stringify(match)));
            }
          }
        }
        if (freshDefault.sectionTitles && freshDefault.sectionTitles[secId]) {
          resumeData.sectionTitles = resumeData.sectionTitles || {};
          resumeData.sectionTitles[secId] = freshDefault.sectionTitles[secId];
        }
        renderCustomSectionsEditor();
      }

      // Update Section Heading input & reset button text
      updateSectionHeadingEditor(secId);

      // Save updated resume to local database
      LocalResumeDatabase.save(resumeData);

      // Re-render canvas
      renderPages();
      updatePageFitMeter();

      if (statusEl) statusEl.textContent = `Restored default for ${sectionName}`;
      showToast(`"${sectionName}" restored to default!`);
    };
  }

  // Download PDF (100% Vector PDF via browser print engine)
  const btnDownloadPdf = document.getElementById('btn-download-pdf') || document.getElementById('btn-print');
  if (btnDownloadPdf) {
    btnDownloadPdf.onclick = () => {
      syncActiveFormFields();
      LocalResumeDatabase.save(resumeData);
      showToast('Opening print dialog for Vector PDF...');
      window.print();
    };
  }

  // Download DOC (True OpenXML .docx from backend API with offline .doc fallback)
  const btnDownloadDoc = document.getElementById('btn-download-doc');
  if (btnDownloadDoc) {
    btnDownloadDoc.onclick = async () => {
      syncActiveFormFields();
      LocalResumeDatabase.save(resumeData);
      showToast('Generating Word Document (.docx)...');
      try {
        const res = await fetch('/api/download/docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resumeData)
        });
        if (res.ok) {
          const blob = await res.blob();
          const fileName = getCandidateFilename(resumeData, 'docx');
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast(`Downloaded ${fileName}!`);
          return;
        }
      } catch (e) {
        console.warn('Backend DOCX generator offline, falling back to client DOC export:', e);
      }
      downloadWordHtml(resumeData);
    };
  }

  // Typography Switcher (Classic Serif vs Modern Sans)
  const fontSelect = document.getElementById('font-select');
  if (fontSelect) {
    fontSelect.onchange = () => {
      const pages = document.querySelectorAll('.resume-document-page');
      pages.forEach(p => {
        if (fontSelect.value === 'sans') {
          p.classList.remove('font-serif');
          p.classList.add('font-sans');
        } else {
          p.classList.remove('font-sans');
          p.classList.add('font-serif');
        }
      });
      updatePageFitMeter();
    };
  }

  // PDF-Only Zoom Controls & Event Interceptors
  const container = document.getElementById('pages-container');
  const zoomText = document.getElementById('zoom-text');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');

  function applyPdfZoom(newZoom) {
    zoomLevel = Math.max(0.4, Math.min(2.0, Math.round(newZoom * 100) / 100));
    if (container) {
      container.style.transform = `scale(${zoomLevel})`;
      container.style.transformOrigin = 'top center';
      if (zoomLevel > 1.0) {
        container.style.marginBottom = `${Math.round((zoomLevel - 1.0) * 2200)}px`;
      } else {
        container.style.marginBottom = '0px';
      }
    }
    if (zoomText) {
      zoomText.textContent = `${Math.round(zoomLevel * 100)}%`;
    }
  }

  window.applyPdfZoom = applyPdfZoom;

  if (btnZoomIn) {
    btnZoomIn.onclick = () => applyPdfZoom(zoomLevel + 0.1);
  }
  if (btnZoomOut) {
    btnZoomOut.onclick = () => applyPdfZoom(zoomLevel - 0.1);
  }
  if (btnZoomReset) {
    btnZoomReset.onclick = () => applyPdfZoom(1.0);
  } else if (zoomText) {
    zoomText.onclick = () => applyPdfZoom(1.0);
  }

  // Intercept Ctrl + Wheel on canvas/document area to zoom ONLY the PDF canvas (preventing browser-wide zoom)
  const canvasScroll = document.querySelector('[data-purpose="document-canvas-scroll"]');
  const printWrapper = document.querySelector('[data-purpose="print-simulation-wrapper"]');

  function handleWheelZoom(e) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const step = Math.abs(e.deltaY) > 60 ? 0.1 : 0.05;
      const change = e.deltaY < 0 ? step : -step;
      applyPdfZoom(zoomLevel + change);
    }
  }

  if (canvasScroll) {
    canvasScroll.addEventListener('wheel', handleWheelZoom, { passive: false });
  }
  if (printWrapper) {
    printWrapper.addEventListener('wheel', handleWheelZoom, { passive: false });
  }

  // Intercept on window when mouse cursor is anywhere over the PDF simulation workspace
  window.addEventListener('wheel', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.target && (e.target.closest('[data-purpose="print-simulation-wrapper"]') || e.target.closest('#pages-container'))) {
      e.preventDefault();
      const step = Math.abs(e.deltaY) > 60 ? 0.1 : 0.05;
      const change = e.deltaY < 0 ? step : -step;
      applyPdfZoom(zoomLevel + change);
    }
  }, { passive: false });

  // Intercept Ctrl + Plus / Minus / 0 shortcuts to zoom ONLY the PDF
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (['INPUT', 'TEXTAREA'].includes(activeTag)) return;

      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        applyPdfZoom(zoomLevel + 0.1);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        applyPdfZoom(zoomLevel - 0.1);
      } else if (e.key === '0') {
        e.preventDefault();
        applyPdfZoom(1.0);
      }
    }
  });

  // Set up listeners for individual section editors
  if (typeof setupSkillsEditorListeners === 'function') setupSkillsEditorListeners();
  if (typeof setupExperienceEditorListeners === 'function') setupExperienceEditorListeners();
  if (typeof setupProjectsEditorListeners === 'function') setupProjectsEditorListeners();
  if (typeof setupEducationEditorListeners === 'function') setupEducationEditorListeners();
  if (typeof setupCustomSectionsEditorListeners === 'function') setupCustomSectionsEditorListeners();
}

// Global exposure
window.setupDragAutoScroll = setupDragAutoScroll;
window.startAutoScroll = startAutoScroll;
window.stopAutoScroll = stopAutoScroll;
window.buildMarkdown = buildMarkdown;
window.buildPlainText = buildPlainText;
window.downloadFile = downloadFile;
window.downloadWordHtml = downloadWordHtml;
window.setupToolbarActions = setupToolbarActions;

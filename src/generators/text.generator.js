const { normalizeResumeData, getSectionTitle, formatEducationLine, getEduCategory } = require('../utils/helpers');

function generateMarkdown(raw) {
  const data = normalizeResumeData(raw);
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
      const title = getSectionTitle(data, 'education', 'EDUCATION & CREDENTIALS').toUpperCase();
      let edMd = `---\n\n## ${title}\n\n`;
      data.education.forEach(edu => {
        const category = getEduCategory(edu);
        const line = formatEducationLine(edu);
        const details = category ? line.replace(new RegExp(`^${category}:\\s*`), '') : line;
        edMd += category ? `- **${category}:** ${details}\n` : `- **${details}**\n`;
        const bullets = Array.isArray(edu.bullets) ? edu.bullets : [];
        bullets.forEach(b => {
          edMd += `  - ${b}\n`;
        });
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

function generatePlainText(raw) {
  const data = normalizeResumeData(raw);
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
      const title = getSectionTitle(data, 'education', 'EDUCATION & CREDENTIALS').toUpperCase();
      let edTxt = `${title}\n${'-'.repeat(Math.max(10, title.length))}\n`;
      data.education.forEach(edu => {
        const line = formatEducationLine(edu) || `${edu.degree} — ${edu.institution} (${edu.period || edu.year || ''})`;
        edTxt += `- ${line}\n`;
        const bullets = Array.isArray(edu.bullets) ? edu.bullets : [];
        bullets.forEach(b => {
          edTxt += `  * ${b}\n`;
        });
      });
      return edTxt + '\n';
    }
  };

  (data.customSections || []).forEach(cs => {
    sectionBuilders[cs.key] = () => {
      let cTxt = `\n${cs.title || cs.key}\n${'-'.repeat(String(cs.title || cs.key).length)}\n`;
      const val = cs.data;
      if (Array.isArray(val)) {
        val.forEach(item => {
          if (typeof item === 'string') {
            cTxt += `* ${item}\n`;
          } else if (typeof item === 'object') {
            const title = item.title || item.name || item.role || '';
            const meta = item.issuer || item.institution || item.period || item.date || item.level || '';
            cTxt += `${title}${meta ? ` (${meta})` : ''}\n`;
            if (item.bullets && Array.isArray(item.bullets)) {
              item.bullets.forEach(b => { cTxt += `  * ${b}\n`; });
            }
          }
        });
      } else if (typeof val === 'string') {
        cTxt += `${val}\n`;
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

module.exports = {
  generateMarkdown,
  generatePlainText
};

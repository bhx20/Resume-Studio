const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');
const { normalizeResumeData, getSectionTitle, formatEducationLine, getEduCategory } = require('../utils/helpers');

function createDocx(raw) {
  const data = normalizeResumeData(raw);
  const p = data.personal || {};
  const children = [];

  // Candidate Name (Left aligned, bold, 18pt)
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: (p.name || 'Sanket Kalathiya').toUpperCase(),
          bold: true,
          size: 36, // 18pt
          font: 'Arial',
          color: '000000'
        })
      ]
    })
  );

  // Subtitle / Roles
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: p.title || 'Lead Flutter Developer & Mobile Architect | Multi-Platform (Mobile & Web)',
          bold: true,
          size: 19, // 9.5pt
          font: 'Arial',
          color: '222222'
        })
      ]
    })
  );

  // Contact Information
  const contactParts = [
    p.location,
    p.phone,
    p.email,
    p.linkedin ? `LinkedIn: ${p.linkedin.replace(/^https?:\/\//, '')}` : '',
    p.github ? `GitHub: ${p.github.replace(/^https?:\/\//, '')}` : ''
  ].filter(Boolean);

  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: contactParts.join('  |  '),
          size: 16, // 8pt
          font: 'Arial',
          color: '444444'
        })
      ]
    })
  );

  // Helper for Section Headers with solid bottom border
  function addSectionHeader(title) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        border: {
          bottom: {
            color: '000000',
            space: 2,
            style: BorderStyle.SINGLE,
            size: 8 // 1pt
          }
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 20, // 10pt
            font: 'Arial',
            color: '000000'
          })
        ]
      })
    );
  }

  const sectionBuilders = {
    summary: () => {
      if (!data.summary) return;
      addSectionHeader(getSectionTitle(data, 'summary', 'Professional Summary'));
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: data.summary,
              size: 17, // 8.5pt
              font: 'Arial',
              color: '222222'
            })
          ]
        })
      );
    },
    skills: () => {
      if (!data.skills || data.skills.length === 0) return;
      addSectionHeader(getSectionTitle(data, 'skills', 'Technical Skills Matrix'));
      data.skills.forEach(s => {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `${s.category}: `,
                bold: true,
                size: 17, // 8.5pt
                font: 'Arial',
                color: '000000'
              }),
              new TextRun({
                text: s.skills,
                size: 17, // 8.5pt
                font: 'Arial',
                color: '222222'
              })
            ]
          })
        );
      });
    },
    experience: () => {
      if (!data.experience || data.experience.length === 0) return;
      addSectionHeader(getSectionTitle(data, 'experience', 'Professional Experience'));
      data.experience.forEach(exp => {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 20 },
            children: [
              new TextRun({
                text: `${exp.company} | ${exp.role}`,
                bold: true,
                size: 18, // 9pt
                font: 'Arial',
                color: '000000'
              })
            ]
          })
        );

        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `${exp.period}${exp.location ? ' | ' + exp.location : ''}`,
                size: 16, // 8pt
                color: '444444',
                font: 'Arial'
              })
            ]
          })
        );

        (exp.bullets || []).forEach(b => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 30 },
              alignment: AlignmentType.JUSTIFIED,
              children: [
                new TextRun({
                  text: b,
                  size: 17, // 8.5pt
                  font: 'Arial',
                  color: '222222'
                })
              ]
            })
          );
        });
      });
    },
    projects: () => {
      if (!data.projects || data.projects.length === 0) return;
      addSectionHeader(getSectionTitle(data, 'projects', 'Key Projects & Deliverables'));
      data.projects.forEach(proj => {
        const projHeaderRuns = [
          new TextRun({
            text: proj.title,
            bold: true,
            size: 18, // 9pt
            font: 'Arial',
            color: '000000'
          })
        ];

        if (proj.tech) {
          projHeaderRuns.push(
            new TextRun({
              text: ` | ${proj.tech}`,
              size: 16, // 8pt
              font: 'Arial',
              color: '444444'
            })
          );
        }

        children.push(
          new Paragraph({
            spacing: { before: 100, after: 30 },
            children: projHeaderRuns
          })
        );

        (proj.bullets || []).forEach(b => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 30 },
              alignment: AlignmentType.JUSTIFIED,
              children: [
                new TextRun({
                  text: b,
                  size: 17, // 8.5pt
                  font: 'Arial',
                  color: '222222'
                })
              ]
            })
          );
        });
      });
    },
    achievements: () => {
      const achievements = data.achievements || [];
      if (achievements.length === 0) return;
      addSectionHeader(getSectionTitle(data, 'achievements', 'Core Engineering & Achievements'));
      achievements.forEach(ach => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 30 },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: ach,
                size: 17, // 8.5pt
                font: 'Arial',
                color: '222222'
              })
            ]
          })
        );
      });
    },
    education: () => {
      if (!data.education || data.education.length === 0) return;
      addSectionHeader(getSectionTitle(data, 'education', 'Education'));
      data.education.forEach(edu => {
        const degreeTitle = edu.degree || '';
        const fieldText = edu.fieldOfStudy ? ` (${edu.fieldOfStudy})` : '';
        const fullDegree = `${degreeTitle}${fieldText}`;
        const period = edu.period || (edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : (edu.startDate || edu.endDate || edu.year || ''));
        const instAndLoc = [edu.institution, edu.location].filter(Boolean).join(', ');
        const gradeText = edu.grade ? (edu.grade.toLowerCase().startsWith('grade') ? edu.grade : `Grade: ${edu.grade}`) : (edu.gpa ? `GPA: ${edu.gpa}` : '');
        const details = [instAndLoc, gradeText].filter(Boolean).join(' | ');

        children.push(
          new Paragraph({
            spacing: { before: 40, after: 15 },
            children: [
              new TextRun({
                text: fullDegree,
                bold: true,
                size: 18, // 9pt
                font: 'Arial',
                color: '000000'
              }),
              ...(period ? [
                new TextRun({
                  text: `  |  ${period}`,
                  bold: true,
                  size: 17, // 8.5pt
                  font: 'Arial',
                  color: '333333'
                })
              ] : [])
            ]
          })
        );

        if (details) {
          children.push(
            new Paragraph({
              spacing: { after: 30 },
              children: [
                new TextRun({
                  text: details,
                  size: 17, // 8.5pt
                  font: 'Arial',
                  color: '444444'
                })
              ]
            })
          );
        }
        const bullets = Array.isArray(edu.bullets) ? edu.bullets : [];
        bullets.forEach(b => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 20 },
              children: [
                new TextRun({
                  text: b,
                  size: 17,
                  font: 'Arial',
                  color: '222222'
                })
              ]
            })
          );
        });
      });
    }
  };

  (data.customSections || []).forEach(cs => {
    sectionBuilders[cs.key] = () => {
      addSectionHeader(getSectionTitle(data, cs.key, cs.title));
      const val = cs.data;
      if (Array.isArray(val)) {
        val.forEach(item => {
          if (typeof item === 'string') {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: item,
                    size: 17,
                    font: 'Arial',
                    color: '222222'
                  })
                ]
              })
            );
          } else if (typeof item === 'object') {
            const itemTitle = item.title || item.name || item.role || '';
            const itemMeta = item.issuer || item.institution || item.period || item.date || item.level || '';
            if (itemTitle) {
              children.push(
                new Paragraph({
                  spacing: { before: 40, after: 20 },
                  children: [
                    new TextRun({
                      text: itemTitle + (itemMeta ? ` | ${itemMeta}` : ''),
                      bold: true,
                      size: 18,
                      font: 'Arial',
                      color: '000000'
                    })
                  ]
                })
              );
            }
            if (item.bullets && Array.isArray(item.bullets)) {
              item.bullets.forEach(b => {
                children.push(
                  new Paragraph({
                    bullet: { level: 0 },
                    spacing: { after: 30 },
                    children: [
                      new TextRun({
                        text: b,
                        size: 17,
                        font: 'Arial',
                        color: '222222'
                      })
                    ]
                  })
                );
              });
            }
          }
        });
      } else if (typeof val === 'string') {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: val,
                size: 17,
                font: 'Arial',
                color: '222222'
              })
            ]
          })
        );
      }
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
      sectionBuilders[id]();
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // 210mm (A4)
              height: 16838 // 297mm (A4)
            },
            margin: {
              top: 504, // 0.35 in
              right: 648, // 0.45 in
              bottom: 504,
              left: 648
            }
          }
        },
        children
      }
    ]
  });

  return doc;
}

module.exports = { createDocx };

const fs = require('fs');
const { Packer } = require('docx');
const { DATA_FILE, DEFAULT_RESUME } = require('../config');
const { createDocx } = require('../generators/docx.generator');
const { generatePdfBuffer } = require('../generators/pdf.generator');
const { getCandidateFilename } = require('../utils/helpers');

function getDefaultResumeTemplate() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf8');
      if (fileData && fileData.trim()) {
        return JSON.parse(fileData);
      }
    }
  } catch (err) {
    console.warn('Could not read configured default resume template:', err.message);
  }
  return DEFAULT_RESUME || {};
}

/**
 * Dispatches API requests matching /api/* routes.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} pathname
 * @returns {boolean} True if route was handled
 */
function handleApiRoutes(req, res, pathname) {
  // GET /api/resume or /src/data/resume-data.json (Single Source of Truth)
  if (req.method === 'GET' && (pathname === '/api/resume' || pathname === '/src/data/resume-data.json' || pathname === '/data/resume-data.json')) {
    fs.readFile(DATA_FILE, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Could not read resume-data.json' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(content);
    });
    return true;
  }

  // POST /api/resume/reset
  if (req.method === 'POST' && pathname === '/api/resume/reset') {
    const defaultTemplate = getDefaultResumeTemplate();
    const defaultContent = JSON.stringify(defaultTemplate, null, 2);
    fs.writeFileSync(DATA_FILE, defaultContent, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(defaultContent);
    return true;
  }

  // POST /api/resume/default
  if (req.method === 'POST' && pathname === '/api/resume/default') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('Default resume payload must be a JSON object.');
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Default resume template saved successfully.',
          defaultResume: data
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid default resume JSON: ' + err.message }));
      }
    });
    return true;
  }

  // POST /api/resume
  if (req.method === 'POST' && pathname === '/api/resume') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Saved to resume-data.json successfully! All downloads render dynamically on the fly.'
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload: ' + err.message }));
      }
    });
    return true;
  }

  // GET / POST /api/download/json
  if (pathname === '/api/download/json') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          if (body) {
            const data = JSON.parse(body);
            const fileName = getCandidateFilename(data, 'json');
            const formatted = JSON.stringify(data, null, 2);
            res.writeHead(200, {
              'Content-Type': 'application/json; charset=utf-8',
              'Content-Disposition': `attachment; filename="${fileName}"`,
              'Content-Length': Buffer.byteLength(formatted)
            });
            res.end(formatted);
            return;
          }
        } catch (e) {}
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      });
      return true;
    } else {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        let fileName = 'Resume.json';
        try {
          const parsed = JSON.parse(content);
          fileName = getCandidateFilename(parsed, 'json');
        } catch (e) {}
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': Buffer.byteLength(content)
        });
        res.end(content);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Resume JSON file not found' }));
      }
      return true;
    }
  }

  // GET / POST /api/download/pdf
  if (pathname === '/api/download/pdf') {
    const handlePdf = (data) => {
      const pdfBuf = generatePdfBuffer(data);
      if (pdfBuf) {
        const fileName = getCandidateFilename(data, 'pdf');
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': pdfBuf.length
        });
        res.end(pdfBuf);
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate PDF on the fly' }));
      }
    };

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
          handlePdf(data);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return true;
    } else {
      if (fs.existsSync(DATA_FILE)) {
        try {
          const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
          handlePdf(data);
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Could not read resume data' }));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Resume data file not found' }));
      }
      return true;
    }
  }

  // GET / POST /api/download/doc or /api/download/docx
  if (pathname === '/api/download/doc' || pathname === '/api/download/docx') {
    const handleDocx = async (data) => {
      try {
        const docxObj = createDocx(data);
        const docxBuf = await Packer.toBuffer(docxObj);
        const fileName = getCandidateFilename(data, 'docx');
        res.writeHead(200, {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': docxBuf.length
        });
        res.end(docxBuf);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate DOCX on the fly: ' + err.message }));
      }
    };

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
          handleDocx(data);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return true;
    } else {
      if (fs.existsSync(DATA_FILE)) {
        try {
          const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
          handleDocx(data);
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Could not read resume data' }));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Resume data file not found' }));
      }
      return true;
    }
  }

  return false;
}

module.exports = {
  handleApiRoutes
};

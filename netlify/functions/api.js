const fs = require('fs');
const path = require('path');
const { Packer } = require('docx');
const { createDocx } = require('../../src/generators/docx.generator');
const { getCandidateFilename } = require('../../src/utils/helpers');

// Load default resume data
let resumeData;
try {
  resumeData = require('../../src/data/resume-data.json');
} catch (e) {
  try {
    resumeData = require('../../src/config/defaultResume');
  } catch (err) {
    resumeData = { personal: { name: 'Sanket Kalathiya' } };
  }
}

exports.handler = async (event) => {
  const method = event.httpMethod;
  let reqPath = event.path || '';
  // Normalize path removing function prefix
  reqPath = reqPath.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api/, '') || '/';
  if (!reqPath.startsWith('/')) reqPath = '/' + reqPath;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  // GET /resume or /
  if (method === 'GET' && (reqPath === '/resume' || reqPath === '/')) {
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(resumeData)
    };
  }

  // POST /resume/reset
  if (method === 'POST' && reqPath === '/resume/reset') {
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(resumeData)
    };
  }

  // POST /resume
  if (method === 'POST' && reqPath === '/resume') {
    try {
      if (event.body) {
        resumeData = JSON.parse(event.body);
      }
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Saved resume data successfully' })
      };
    } catch (err) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON: ' + err.message })
      };
    }
  }

  // GET / POST /download/json
  if (reqPath === '/download/json') {
    let data = resumeData;
    if (method === 'POST' && event.body) {
      try { data = JSON.parse(event.body); } catch (_) {}
    }
    const fileName = getCandidateFilename(data, 'json');
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`
      },
      body: JSON.stringify(data, null, 2)
    };
  }

  // GET / POST /download/doc or /download/docx
  if (reqPath === '/download/doc' || reqPath === '/download/docx') {
    let data = resumeData;
    if (method === 'POST' && event.body) {
      try { data = JSON.parse(event.body); } catch (_) {}
    }
    try {
      const docxObj = createDocx(data);
      const docxBuf = await Packer.toBuffer(docxObj);
      const fileName = getCandidateFilename(data, 'docx');
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${fileName}"`
        },
        body: docxBuf.toString('base64'),
        isBase64Encoded: true
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to generate DOCX: ' + err.message })
      };
    }
  }

  return {
    statusCode: 404,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Endpoint not found' })
  };
};


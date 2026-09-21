const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const SRC_DIR = path.resolve(__dirname, '..');

const defaultResume = require('./defaultResume');

module.exports = {
  PORT: process.env.PORT || 3000,
  ROOT_DIR,
  SRC_DIR,
  DATA_FILE: path.join(SRC_DIR, 'data', 'resume-data.json'),
  PERSONAL_DATA_FILE: path.join(SRC_DIR, 'data', 'resume-data.personal.json'),
  LOCAL_DATA_FILE: path.join(SRC_DIR, 'data', 'resume-data.local.json'),
  DEFAULT_RESUME: defaultResume,
  CLIENT_DIR: path.join(SRC_DIR, 'client'),
  PUBLIC_DIR: path.join(SRC_DIR, 'client'),
  MIME_TYPES: {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  }
};

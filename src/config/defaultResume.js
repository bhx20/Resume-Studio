const fs = require('fs');
const path = require('path');

const personalFile = path.join(__dirname, '..', 'data', 'resume-data.personal.json');
const localFile = path.join(__dirname, '..', 'data', 'resume-data.local.json');
const templateFile = path.join(__dirname, '..', 'data', 'resume-data.json');

let resumeData;
try {
  if (fs.existsSync(personalFile)) {
    resumeData = JSON.parse(fs.readFileSync(personalFile, 'utf8'));
  } else if (fs.existsSync(localFile)) {
    resumeData = JSON.parse(fs.readFileSync(localFile, 'utf8'));
  } else {
    resumeData = require(templateFile);
  }
} catch (e) {
  resumeData = require(templateFile);
}

module.exports = resumeData;

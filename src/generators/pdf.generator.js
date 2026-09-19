const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { generateHtml } = require('./html.generator');

/**
 * Discovers an available Chromium/Edge executable cross-platform.
 * @returns {string|null} Path to browser executable
 */
function findBrowserExecutable() {
  const envPath = process.env.CHROME_BIN || process.env.EDGE_BIN || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.BROWSER_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const platform = process.platform;
  const candidates = [];

  if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    const progFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    candidates.push(
      path.join(progFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(progFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(progFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(progFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
    );
  } else if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    );
  } else {
    // Linux / Unix
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/microsoft-edge',
      '/usr/bin/microsoft-edge-stable',
      '/snap/bin/chromium'
    );
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Dynamically generates a print-ready vector PDF in-memory buffer using headless browser.
 * Cleans up all temporary assets automatically.
 * @param {Object} data - Resume JSON model
 * @returns {Buffer|null} - PDF binary buffer or null if browser unavailable
 */
function generatePdfBuffer(data) {
  const browserExe = findBrowserExecutable();
  if (!browserExe) return null;

  const tempHtmlPath = path.join(os.tmpdir(), `resume_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.html`);
  const tempPdfPath = path.join(os.tmpdir(), `resume_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.pdf`);

  try {
    const html = generateHtml(data);
    fs.writeFileSync(tempHtmlPath, html, 'utf8');

    const res = spawnSync(browserExe, [
      '--headless',
      '--disable-gpu',
      '--no-pdf-header-footer',
      `--print-to-pdf=${tempPdfPath}`,
      tempHtmlPath
    ]);

    if (res.status === 0 && fs.existsSync(tempPdfPath)) {
      const buf = fs.readFileSync(tempPdfPath);
      return buf;
    }
    return null;
  } catch (e) {
    console.warn('[PDF Generator Error]:', e.message);
    return null;
  } finally {
    try { if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath); } catch (e) {}
    try { if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath); } catch (e) {}
  }
}

module.exports = {
  generatePdfBuffer
};

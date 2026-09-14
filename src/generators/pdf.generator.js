const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { generateHtml } = require('./html.generator');

/**
 * Dynamically generates a print-ready vector PDF in-memory buffer using headless browser.
 * Cleans up all temporary assets automatically.
 * @param {Object} data - Resume JSON model
 * @returns {Buffer|null} - PDF binary buffer or null if browser unavailable
 */
function generatePdfBuffer(data) {
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browserExe = fs.existsSync(edgeExe) ? edgeExe : (fs.existsSync(chromeExe) ? chromeExe : null);
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

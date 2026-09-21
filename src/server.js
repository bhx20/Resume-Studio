const http = require('http');
const fs = require('fs');
const path = require('path');
const { PORT, SRC_DIR, CLIENT_DIR, PUBLIC_DIR, MIME_TYPES } = require('./config');

function createAppServer() {
  return http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // Global CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const rawUrl = req.url || '';
    if (rawUrl.includes('..') || decodeURIComponent(rawUrl).includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden: Access Denied');
      return;
    }

    // 1. Serve Master Resume Data (Strictly src/data/resume-data.json)
    if (pathname === '/data/resume-data.json' || pathname === '/src/data/resume-data.json' || pathname.endsWith('resume-data.json')) {
      const dataFile = path.join(SRC_DIR, 'data', 'resume-data.json');
      if (!fs.existsSync(dataFile)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      fs.createReadStream(dataFile).pipe(res);
      return;
    }

    // 2. Serve Frontend Static Assets securely from src/client/
    const staticRoot = path.resolve(CLIENT_DIR || PUBLIC_DIR);
    const relativeRequest = pathname === '/' ? '/index.html' : pathname;
    const safePath = path.resolve(staticRoot, '.' + relativeRequest);

    if (!safePath.startsWith(staticRoot)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden: Access Denied');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();

    fs.stat(safePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }

      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(safePath).pipe(res);
    });
  });
}

const server = createAppServer();

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Resume Management Studio is running!`);
    console.log(`👉 Open in your browser: http://localhost:${PORT}`);
    console.log(`📁 Source Code: ${__dirname}`);
    console.log(`====================================================`);
  });
}

module.exports = { server, createAppServer };

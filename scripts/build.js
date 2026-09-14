const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const clientDir = path.join(rootDir, 'src', 'client');
const distDir = path.join(rootDir, 'dist');
const dataFile = path.join(rootDir, 'src', 'data', 'resume-data.json');

console.log('🚀 Starting Netlify Production Build for Resume Studio...');

// 1. Clean & create dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Recursive copy helper
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy client assets to dist
copyDirSync(clientDir, distDir);

// 3. Ensure static data files are accessible for static and offline modes
const distDataDir = path.join(distDir, 'data');
fs.mkdirSync(distDataDir, { recursive: true });
fs.copyFileSync(dataFile, path.join(distDataDir, 'resume-data.json'));

const distSrcDataDir = path.join(distDir, 'src', 'data');
fs.mkdirSync(distSrcDataDir, { recursive: true });
fs.copyFileSync(dataFile, path.join(distSrcDataDir, 'resume-data.json'));

// 4. Generate _redirects for Netlify
const redirectsContent = `# Netlify Redirects for SPA and API
/api/*          /.netlify/functions/api/:splat  200
/api/resume     /data/resume-data.json          200
/*              /index.html                     200
`;
fs.writeFileSync(path.join(distDir, '_redirects'), redirectsContent, 'utf8');

console.log('✅ Netlify build completed successfully! Output ready in dist/');


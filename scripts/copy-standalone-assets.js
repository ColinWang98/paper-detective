const fs = require('fs');
const path = require('path');

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) {
    return;
  }

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true, force: true });
}

const projectRoot = path.resolve(__dirname, '..');
const nextDir = path.join(projectRoot, '.next');
const standaloneDir = path.join(nextDir, 'standalone');
const reactPdfWorker = path.join(
  projectRoot,
  'node_modules',
  'react-pdf',
  'node_modules',
  'pdfjs-dist',
  'build',
  'pdf.worker.min.mjs'
);

copyIfExists(reactPdfWorker, path.join(projectRoot, 'public', 'pdf.worker.min.mjs'));
copyIfExists(path.join(nextDir, 'static'), path.join(standaloneDir, '.next', 'static'));
copyIfExists(path.join(projectRoot, 'public'), path.join(standaloneDir, 'public'));

console.log('Standalone assets copied.');

const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), 'dist', 'spa');
const dest = path.join(process.cwd(), 'public');

function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.error('Source directory does not exist:', srcDir);
    process.exit(1);
  }
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyRecursive(src, dest);
  console.log('Copied', src, 'to', dest);
} catch (err) {
  console.error('Error copying files:', err);
  process.exit(1);
}

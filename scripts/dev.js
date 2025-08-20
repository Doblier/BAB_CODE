const { spawn } = require('child_process');
const { execSync } = require('child_process');

// Compile TypeScript first
console.log('Compiling TypeScript...');
execSync('tsc -p tsconfig.json --outDir dist-electron', { stdio: 'inherit' });

// Start Vite server
console.log('Starting Vite server...');
const vite = spawn('npm', ['run', 'dev:vite'], { stdio: 'inherit' });

// Wait a bit for Vite to start, then start Electron
setTimeout(() => {
  console.log('Starting Electron...');
  const electron = spawn('npm', ['run', 'dev:electron'], { stdio: 'inherit' });
  
  // Handle process termination
  process.on('SIGINT', () => {
    vite.kill();
    electron.kill();
    process.exit();
  });
}, 3000); 
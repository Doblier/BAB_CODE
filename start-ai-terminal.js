const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting AI Terminal...\n');

// Start backend server
console.log('📡 Starting Python Backend...');
const backend = spawn('python', ['backend/app.py'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Wait a moment for backend to start
setTimeout(() => {
  console.log('\n⚛️  Starting React Frontend...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  frontend.on('close', (code) => {
    console.log(`\n❌ Frontend exited with code ${code}`);
    backend.kill();
    process.exit(code);
  });
}, 2000);

backend.on('close', (code) => {
  console.log(`\n❌ Backend exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down AI Terminal...');
  backend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down AI Terminal...');
  backend.kill();
  process.exit(0);
});



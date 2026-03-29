const { spawn } = require('child_process');

// In some macOS shells, ELECTRON_RUN_AS_NODE may be globally set.
// That forces Electron to behave like Node and breaks app startup.
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const electronBinary = require('electron');
const child = spawn(electronBinary, ['.'], {
  stdio: 'inherit',
  env
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('[run-electron] Failed to start Electron:', error);
  process.exit(1);
});

const { spawn } = require('child_process');

// In some macOS shells, ELECTRON_RUN_AS_NODE may be globally set.
// That forces Electron to behave like Node and breaks app startup.
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
console.log('[run-electron] Launching Electron process...', {
  electronRunAsNodeOriginal: process.env.ELECTRON_RUN_AS_NODE,
  cwd: process.cwd(),
  platform: process.platform,
  arch: process.arch,
  nodeVersion: process.version
});

const electronBinary = require('electron');
console.log('[run-electron] Electron binary resolved:', electronBinary);
const child = spawn(electronBinary, ['.'], {
  stdio: 'inherit',
  env
});

child.on('spawn', () => {
  console.log('[run-electron] Electron process started. PID:', child.pid);
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

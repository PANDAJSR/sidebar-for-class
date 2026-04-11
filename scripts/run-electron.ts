import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
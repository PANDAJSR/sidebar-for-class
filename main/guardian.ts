import * as fs from 'fs';
import * as path from 'path';
import { executeTask } from './automation';

const parentPid = parseInt(process.argv[2]);
const dataDir = process.argv[3];
const configPath = path.join(dataDir, 'config.json');
const logFile = path.join(dataDir, 'guardian.log');

function log(msg: unknown): void {
  const timestamp = new Date().toISOString();
  const content = typeof msg === 'string' ? msg : JSON.stringify(msg);
  fs.appendFileSync(logFile, `[${timestamp}] ${content}\n`);
}

console.log = log;
console.error = log;

log(`Started. Monitoring PID: ${parentPid}`);

process.on('SIGINT', () => {
  log('Received SIGINT, but ignoring it to wait for parent process.');
});

function isParentAlive(): boolean {
  try {
    return process.kill(parentPid, 0);
  } catch (e) {
    return false;
  }
}

function isProcessRunning(processName: string): boolean {
  if (process.platform !== 'win32') return false;
  try {
    const { execSync } = require('child_process');
    const nameWithoutExe = processName.toLowerCase().endsWith('.exe')
      ? processName.slice(0, -4)
      : processName;
    const command = `powershell -Command "if (Get-Process -Name '${nameWithoutExe}' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"`;
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

async function runShutdownTasks(): Promise<void> {
  log('Main process exited. Reading config...');

  if (!fs.existsSync(configPath)) {
    log('Config file not found: ' + configPath);
    return;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const automatic: Array<{ script: string; on?: string[]; name?: string }> = config.automatic || [];
    const tasks: Promise<void>[] = [];

    if (config.helper_tools?.icc_compatibility) {
      if (isProcessRunning('InkCanvasForClass.exe')) {
        log('ICC Compatibility enabled and ICC-CE is running. Restoring ICC-CE...');
        tasks.push(executeTask({ script: 'icc://thoroughHideOff' }, dataDir));
      } else {
        log('ICC Compatibility enabled but ICC-CE is not running. Skipping restore.');
      }
    }

    for (const item of automatic) {
      if (item.on && Array.isArray(item.on) && item.on.includes('shutdown')) {
        log(`Executing task: ${item.name || item.script}`);
        tasks.push(executeTask(item, dataDir));
      }
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
      log('All shutdown tasks completed.');
    } else {
      log('No shutdown tasks to run.');
    }
  } catch (e) {
    log('Error: ' + (e as Error).message);
  }
}

const timer = setInterval(async () => {
  if (!isParentAlive()) {
    clearInterval(timer);
    await runShutdownTasks();
    log('Guardian exiting.');
    process.exit(0);
  }
}, 1000);

process.on('uncaughtException', (err) => {
  log('Uncaught Exception: ' + err.stack);
});
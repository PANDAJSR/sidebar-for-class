import * as path from 'path';
import { spawn, exec } from 'child_process';
import { existsSync } from 'fs';

interface AutomationItem {
  script: string;
  args?: string[];
  on?: string[];
  name?: string;
}

async function executeTask(item: AutomationItem, dataDir: string): Promise<void> {
  if (!item.script) return;

  let scriptPath = item.script;

  if (!path.isAbsolute(scriptPath) && !scriptPath.includes('://')) {
    scriptPath = path.join(dataDir, scriptPath);
  }

  console.log(`[Automation] Executing script: ${scriptPath}`);

  try {
    if (scriptPath.includes('://')) {
      try {
        const { shell } = require('electron');
        await shell.openExternal(scriptPath);
      } catch (e) {
        const command = process.platform === 'win32' ? 'start ""' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
        exec(`${command} "${scriptPath}"`);
      }
    } else {
      let cmd = scriptPath;
      let args = item.args || [];

      const quotedScriptPath = `"${scriptPath}"`;

      if (scriptPath.toLowerCase().endsWith('.ps1')) {
        if (process.platform === 'win32') {
          cmd = 'powershell.exe';
          args = ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args];
        } else if (existsSync('/usr/local/bin/pwsh') || existsSync('/opt/homebrew/bin/pwsh')) {
          cmd = existsSync('/opt/homebrew/bin/pwsh') ? '/opt/homebrew/bin/pwsh' : '/usr/local/bin/pwsh';
          args = ['-File', scriptPath, ...args];
        } else {
          console.warn(`[Automation] Skip PowerShell script on ${process.platform}: ${scriptPath}`);
          return;
        }
      } else if (scriptPath.toLowerCase().endsWith('.js')) {
        cmd = process.platform === 'win32' ? 'node.exe' : process.execPath;
        args = [scriptPath, ...args];
      } else {
        cmd = quotedScriptPath;
      }

      return new Promise((resolve) => {
        const child = spawn(cmd, args, {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true,
          windowsHide: false
        });

        child.stdout?.on('data', (data: Buffer) => {
          console.log(`[Automation][${path.basename(scriptPath)}][stdout]: ${data.toString().trim()}`);
        });

        child.stderr?.on('data', (data: Buffer) => {
          console.error(`[Automation][${path.basename(scriptPath)}][stderr]: ${data.toString().trim()}`);
        });

        child.on('close', (code) => {
          console.log(`[Automation][${path.basename(scriptPath)}] exited with code ${code}`);
          resolve();
        });

        child.on('error', (err) => {
          console.error(`[Automation][${path.basename(scriptPath)}] Error:`, err);
          resolve();
        });
      });
    }
  } catch (e) {
    console.error(`[Automation] Failed to execute script ${scriptPath}:`, e);
  }
}

async function runStartupScripts(): Promise<void> {
  try {
    const { getConfigSync, getDataDir } = require('./config');
    const config = getConfigSync();
    const automatic: AutomationItem[] = config.automatic || [];
    const dataDir = getDataDir();

    console.log('[Automation] Checking for startup scripts...');

    for (const item of automatic) {
      if (item.on && Array.isArray(item.on) && item.on.includes('startup')) {
        executeTask(item, dataDir);
      }
    }
  } catch (err) {
    console.error('[Automation] Error in runStartupScripts:', err);
  }
}

async function runShutdownScripts(): Promise<void> {
  try {
    const { getConfigSync, getDataDir } = require('./config');
    const config = getConfigSync();
    const automatic: AutomationItem[] = config.automatic || [];
    const dataDir = getDataDir();

    console.log('[Automation] Checking for shutdown scripts...');
    const tasks: Promise<void>[] = [];

    for (const item of automatic) {
      if (item.on && Array.isArray(item.on) && item.on.includes('shutdown')) {
        tasks.push(executeTask(item, dataDir));
      }
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
      console.log('[Automation] All shutdown scripts completed.');
    }
  } catch (err) {
    console.error('[Automation] Error in runShutdownScripts:', err);
  }
}

export {
  executeTask,
  runStartupScripts,
  runShutdownScripts
};
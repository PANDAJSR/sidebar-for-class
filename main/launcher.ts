import { spawn, execSync } from 'child_process';
import { shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { getExePathFromProtocol } from '../main-utils';
import { getDataDir } from './config';

function spawnWithLogging(cmd: string, args: string[], label: string): void {
  const child = spawn(cmd, args, {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    windowsHide: true
  });

  child.stdout?.on('data', (data: Buffer) => {
    console.log(`[Launcher][${label}][stdout]: ${data.toString().trim()}`);
  });

  child.stderr?.on('data', (data: Buffer) => {
    console.error(`[Launcher][${label}][stderr]: ${data.toString().trim()}`);
  });

  child.on('error', (err) => {
    console.error(`[Launcher][${label}] Error:`, err);
  });

  child.unref();
}

function resolveNodeCommand(): string {
  return process.platform === 'win32' ? 'node.exe' : process.execPath;
}

function resolvePowerShellCommand(): string | null {
  if (process.platform === 'win32') return 'powershell.exe';

  try {
    const output = execSync('command -v pwsh', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    return output || null;
  } catch {
    return null;
  }
}

function resolveLauncherTarget(target: string): string {
  if (path.isAbsolute(target)) {
    return target;
  }

  const dataCandidate = path.join(getDataDir(), target);
  if (fs.existsSync(dataCandidate)) {
    return dataCandidate;
  }

  return target;
}

async function launchApp(target: string, args: string[] = []): Promise<void> {
  if (!target) {
    return;
  }

  if (target.includes('://')) {
    try {
      await shell.openExternal(target);
    } catch (e) {
      console.error('打开 URI 失败:', e);
    }
    return;
  }

  const resolvedTarget = resolveLauncherTarget(target);
  const label = path.basename(resolvedTarget);

  if (resolvedTarget.toLowerCase().endsWith('.ps1')) {
    const powerShellCommand = resolvePowerShellCommand();
    if (!powerShellCommand) {
      console.warn(`[Launcher] PowerShell is not available on ${process.platform}, skip: ${resolvedTarget}`);
      return;
    }

    const psArgs = process.platform === 'win32'
      ? ['-ExecutionPolicy', 'Bypass', '-File', resolvedTarget, ...args]
      : ['-File', resolvedTarget, ...args];

    spawnWithLogging(powerShellCommand, psArgs, label);
    return;
  }

  if (resolvedTarget.toLowerCase().endsWith('.js')) {
    spawnWithLogging(resolveNodeCommand(), [resolvedTarget, ...args], label);
    return;
  }

  if (!args || args.length === 0) {
    const error = await shell.openPath(resolvedTarget);
    if (error) {
      console.error('shell.openPath 失败, 尝试 spawn:', error);
      spawnWithLogging(resolvedTarget, [], label);
    }
    return;
  }

  spawnWithLogging(resolvedTarget, args, label);
}

async function getFileIcon(filePath: string, app: Electron.App): Promise<string | null> {
  try {
    let resolvedPath = filePath;

    if (filePath.includes('://')) {
      const protocol = filePath.split('://')[0];
      resolvedPath = getExePathFromProtocol(protocol);
      if (!resolvedPath) {
        return null;
      }
    } else if (!path.isAbsolute(filePath)) {
      const localPath = resolveLauncherTarget(filePath);
      if (localPath !== filePath) {
        resolvedPath = localPath;
      } else {
        try {
          if (process.platform === 'win32') {
            const output = execSync(`where ${filePath}`, { encoding: 'utf8' });
            resolvedPath = output.split('\r\n')[0];
          } else {
            const output = execSync(`command -v ${filePath}`, { encoding: 'utf8' });
            resolvedPath = output.split('\n')[0];
          }
        } catch {
          // 回退到原始值，让 getFileIcon 自己决定是否可解析。
        }
      }
    }

    const icon = await app.getFileIcon(resolvedPath, { size: 'large' });
    return icon.toDataURL();
  } catch {
    return null;
  }
}

export {
  launchApp,
  getFileIcon
};
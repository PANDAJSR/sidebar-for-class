const { spawn, execSync } = require('child_process');
const { shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { getExePathFromProtocol } = require('../main-utils');
const { getDataDir } = require('./config');

/**
 * 封装 spawn 调用以捕获日志。
 */
function spawnWithLogging(cmd, args, label) {
  const child = spawn(cmd, args, {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    windowsHide: true
  });

  child.stdout.on('data', (data) => {
    console.log(`[Launcher][${label}][stdout]: ${data.toString().trim()}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`[Launcher][${label}][stderr]: ${data.toString().trim()}`);
  });

  child.on('error', (err) => {
    console.error(`[Launcher][${label}] Error:`, err);
  });

  child.unref();
}

function resolveNodeCommand() {
  return process.platform === 'win32' ? 'node.exe' : process.execPath;
}

function resolvePowerShellCommand() {
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

/**
 * 仅在 data 目录中存在同名文件时，才将相对路径解析到 data 目录；
 * 否则保留原值（例如 explorer.exe）让系统 PATH 解析。
 */
function resolveLauncherTarget(target) {
  if (path.isAbsolute(target)) {
    return target;
  }

  const dataCandidate = path.join(getDataDir(), target);
  if (fs.existsSync(dataCandidate)) {
    return dataCandidate;
  }

  return target;
}

/**
 * 启动应用或 URL。
 * @param {string} target 目标路径或 URL
 * @param {Array<string>} args 参数
 */
async function launchApp(target, args = []) {
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

/**
 * 获取文件图标。
 * @param {string} filePath 文件路径
 * @param {Electron.App} app Electron app 实例
 * @returns {Promise<string|null>} 图标 Data URL
 */
async function getFileIcon(filePath, app) {
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

module.exports = {
  launchApp,
  getFileIcon
};

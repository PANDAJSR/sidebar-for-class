/**
 * 应用启动模块
 * 负责应用和URL的启动逻辑
 */
const { spawn } = require('child_process');
const { execSync } = require('child_process');
const { shell } = require('electron');
const path = require('path');
const { getExePathFromProtocol } = require('../main-utils');
const { getDataDir } = require('./config');

/**
 * 封装 spawn 调用以捕获日志
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
    const output = execSync('command -v pwsh', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return output || null;
  } catch (e) {
    return null;
  }
}

/**
 * 启动应用或URL
 * @param {string} target - 目标路径或URL
 * @param {Array<string>} args - 命令行参数
 */
async function launchApp(target, args = []) {
  // 如果是URL
  if (target.includes('://')) {
    try {
      await shell.openExternal(target);
    } catch (e) {
      console.error('打开 URI 失败:', e);
    }
    return;
  }

  // 处理相对路径
  let resolvedTarget = target;
  if (!path.isAbsolute(target)) {
    resolvedTarget = path.join(getDataDir(), target);
  }

  const label = path.basename(resolvedTarget);

  // 针对脚本进行特殊处理
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
  } else if (resolvedTarget.toLowerCase().endsWith('.js')) {
    spawnWithLogging(resolveNodeCommand(), [resolvedTarget, ...args], label);
    return;
  }

  // 如果没有参数，优先尝试用默认关联程序打开
  if (!args || args.length === 0) {
    const error = await shell.openPath(resolvedTarget);
    if (error) {
      console.error('shell.openPath 失败, 尝试 spawn:', error);
      // 如果 openPath 失败，回退到 spawn 尝试
      spawnWithLogging(resolvedTarget, [], label);
    }
  } else {
    spawnWithLogging(resolvedTarget, args, label);
  }
}

/**
 * 获取文件图标
 * @param {string} filePath - 文件路径
 * @param {Electron.App} app - Electron app 实例
 * @returns {Promise<string|null>} 图标的 Data URL，失败返回 null
 */
async function getFileIcon(filePath, app) {
  try {
    let resolvedPath = filePath;
    
    // 如果是协议路径
    if (filePath.includes('://')) {
      const protocol = filePath.split('://')[0];
      resolvedPath = getExePathFromProtocol(protocol);
      if (!resolvedPath) return null;
    } else if (!path.isAbsolute(filePath)) {
      // 如果是相对路径，尝试查找
      try {
        if (process.platform === 'win32') {
          const output = execSync(`where ${filePath}`, { encoding: 'utf8' });
          resolvedPath = output.split('\r\n')[0];
        } else {
          const output = execSync(`command -v ${filePath}`, { encoding: 'utf8' });
          resolvedPath = output.split('\n')[0];
        }
      } catch (e) {
        // 回退到路径检查
      }
    }
    
    const icon = await app.getFileIcon(resolvedPath, { size: 'large' });
    return icon.toDataURL();
  } catch (err) {
    return null;
  }
}

module.exports = {
  launchApp,
  getFileIcon
};

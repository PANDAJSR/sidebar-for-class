/**
 * 自动化管理模块
 * 负责处理自动化脚本的执行
 */
const path = require('path');
const { spawn, exec } = require('child_process');
const { existsSync } = require('fs');

/**
 * 执行单个自动化任务
 * @param {Object} item 任务对象
 * @param {string} dataDir 数据目录
 * @returns {Promise<void>}
 */
async function executeTask(item, dataDir) {
  if (!item.script) return;

  let scriptPath = item.script;
  
  // 如果不是绝对路径且不是 URL，则相对于 data 目录解析
  if (!path.isAbsolute(scriptPath) && !scriptPath.includes('://')) {
    scriptPath = path.join(dataDir, scriptPath);
  }

  console.log(`[Automation] Executing script: ${scriptPath}`);
  
  try {
    if (scriptPath.includes('://')) {
      // 这里的处理在没有 electron 时需要 fallback
      try {
        const { shell } = require('electron');
        await shell.openExternal(scriptPath);
      } catch (e) {
        // Fallback to platform specific command
        const command = process.platform === 'win32' ? 'start ""' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
        exec(`${command} "${scriptPath}"`);
      }
    } else {
      let cmd = scriptPath;
      let args = item.args || [];
      
      // 为路径添加引号，处理空格和特殊字符
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
        // 对于 .bat 或其他可执行文件，直接使用路径
        cmd = quotedScriptPath;
      }

      return new Promise((resolve) => {
        const child = spawn(cmd, args, {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true,
          windowsHide: false // 改为 false，允许 UI 弹出（如 msgbox）
        });

        child.stdout?.on('data', (data) => {
          console.log(`[Automation][${path.basename(scriptPath)}][stdout]: ${data.toString().trim()}`);
        });

        child.stderr?.on('data', (data) => {
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

/**
 * 运行启动脚本
 * 遍历配置中的 automatic 列表，执行 on 包含 'startup' 的脚本
 */
async function runStartupScripts() {
  try {
    const { getConfigSync, getDataDir } = require('./config');
    const config = getConfigSync();
    const automatic = config.automatic || [];
    const dataDir = getDataDir();

    console.log('[Automation] Checking for startup scripts...');

    for (const item of automatic) {
      if (item.on && Array.isArray(item.on) && item.on.includes('startup')) {
        // 启动脚本通常异步运行，不需要等待结束
        executeTask(item, dataDir);
      }
    }
  } catch (err) {
    console.error('[Automation] Error in runStartupScripts:', err);
  }
}

/**
 * 运行退出脚本
 * 遍历配置中的 automatic 列表，执行 on 包含 'shutdown' 的脚本
 */
async function runShutdownScripts() {
  try {
    const { getConfigSync, getDataDir } = require('./config');
    const config = getConfigSync();
    const automatic = config.automatic || [];
    const dataDir = getDataDir();

    console.log('[Automation] Checking for shutdown scripts...');
    const tasks = [];

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

module.exports = {
  executeTask,
  runStartupScripts,
  runShutdownScripts
};

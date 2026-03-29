/**
 * 主进程入口文件
 * Electron 应用主进程
 */
const { app } = require('electron');
const { createWindow } = require('./main/window');
const { registerIPCHandlers, registerDisplayEventListeners } = require('./main/ipcHandlers');
const { createTray } = require('./main/tray');
const { runStartupScripts } = require('./main/automation');
const { startKiller } = require('./main/killer');
const { getDataDir } = require('./main/config');
const { spawn } = require('child_process');
const path = require('path');

let guardianProcess = null;
let isQuitting = false;

/**
 * 启动守护进程
 */
function startGuardian() {
  if (isQuitting) return;

  const dataDir = getDataDir();
  const guardianScript = path.join(__dirname, 'main', 'guardian.js');

  console.log('[Main] Starting guardian process...');
  
  guardianProcess = spawn(process.execPath, [guardianScript, process.pid, dataDir], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    shell: false, // 确保不通过 cmd.exe 启动，减少信号干扰
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: 1
    }
  });

  guardianProcess.unref();

  guardianProcess.on('exit', (code) => {
    if (!isQuitting) {
      console.warn(`[Main] Guardian process exited with code ${code}. Restarting...`);
      setTimeout(startGuardian, 1000);
    }
  });
}

// 应用就绪后执行
app.whenReady().then(() => {
  // 设置 AppUserModelId 以支持 Windows 通知
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.sidebar.class');
    // 启动窗口历史监控
    const { startMonitoring } = require('./main/window-history');
    startMonitoring(1000);
  }

  // 创建主窗口
  createWindow();

  // macOS 26 + Electron 39 在部分机器上创建托盘会触发原生崩溃，默认跳过
  if (process.platform !== 'darwin' || process.env.ENABLE_TRAY_ON_MAC === '1') {
    createTray();
  }

  // 启动自动查杀服务
  startKiller();

  // 注册所有 IPC 处理器
  registerIPCHandlers();

  // 注册显示器事件监听器
  registerDisplayEventListeners();

  // 守护进程仅在 Windows 上启用（macOS 下会引入额外 Electron 子进程，稳定性较差）
  if (process.platform === 'win32') {
    startGuardian();
  }

  // 运行启动脚本
  runStartupScripts();

  // 处理 ICC-CE 兼容
  const { getConfigSync } = require('./main/config');
  const config = getConfigSync();
  if (config.helper_tools?.icc_compatibility) {
    const { isProcessRunning } = require('./main/system');
    if (isProcessRunning('InkCanvasForClass.exe')) {
      console.log('[Main] ICC Compatibility enabled and ICC-CE is running. Hiding ICC-CE...');
      const { executeTask } = require('./main/automation');
      executeTask({ script: 'icc://thoroughHideOn' }, getDataDir());
    } else {
      console.log('[Main] ICC Compatibility enabled but ICC-CE is not running. Skipping hide.');
    }
  }
});

// 处理退出前的标记
app.on('before-quit', () => {
  isQuitting = true;
});

// 处理 SIGINT 信号
process.on('SIGINT', () => {
  console.log('[Main] Received SIGINT, quitting...');
  isQuitting = true;
  app.quit();
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 特定：点击 dock 图标时重新创建窗口
app.on('activate', () => {
  const { getMainWindow } = require('./main/window');
  if (!getMainWindow()) {
    createWindow();
  }
});

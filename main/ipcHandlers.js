/**
 * IPC 处理器注册模块
 * 集中注册所有 IPC 处理器
 */
const { ipcMain, app, screen, BrowserWindow } = require('electron');
const { getConfigSync, updateConfig, previewConfig } = require('./config');
const { getAllDisplays } = require('./display');
const { getMainWindow, createSettingsWindow, createTimerWindow, setAlwaysOnTopFlag, resizeMainWindow, setIgnoreMouseEvents, notifyDisplaysUpdated, blurMainWindow } = require('./window');
const { getVolume, setVolume, executeCommand, showDesktop, taskView, closeFrontWindow, openFile, openFolder, openWithNotepad, copyImageToClipboard, saveEditedImage } = require('./system');
const { launchApp, getFileIcon } = require('./launcher');
const { getFilesInFolder, readFileContent, writeFileContent, deleteFile, renameFile } = require('./fileSystem');
const { takeScreenshot } = require('./screenshot');
const { createLogger } = require('./logger');

const log = createLogger('ipc');

/**
 * 注册所有 IPC 处理器
 */
function registerIPCHandlers() {
  log.info('register.start');
  // ===== 窗口管理 =====

  ipcMain.on('resize-window', (event, width, height, y, animate = true) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;

    if (win === getMainWindow()) {
      resizeMainWindow(width, height, y);
    } else {
      // 停止之前可能存在的动画（如果有的话，简单处理可跳过）
      win.setMinimumSize(0, 0);
      win.setMaximumSize(10000, 10000);

      const startBounds = win.getBounds();
      const targetBounds = {
        width: Math.floor(width),
        height: Math.floor(height),
        x: startBounds.x,
        y: typeof y === 'number' ? Math.floor(y) : startBounds.y
      };

      // 如果禁用动画（false 或 'off'），直接设置最终大小
      // 'partial' 模式只禁用 ipcHandlers 中的窗口缩放差值动画
      if (animate === false || animate === 'off') {
        if (!win.isDestroyed()) {
          win.setBounds(targetBounds);
        }
        return;
      }

      // 'partial' 模式：禁用窗口缩放差值动画，但保留其他动画
      if (animate === 'partial') {
        if (!win.isDestroyed()) {
          win.setBounds(targetBounds);
        }
        return;
      }

      // 动画参数
      const duration = 500; // 与 CSS transition 0.5s 保持一致
      const startTime = Date.now();

      const runAnimation = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 使用 EaseOutCubic 缓动函数: f(t) = 1 - (1-t)^3
        const ease = 1 - Math.pow(1 - progress, 3);

        const currentBounds = {
          x: Math.floor(startBounds.x + (targetBounds.x - startBounds.x) * ease),
          y: Math.floor(startBounds.y + (targetBounds.y - startBounds.y) * ease),
          width: Math.floor(startBounds.width + (targetBounds.width - startBounds.width) * ease),
          height: Math.floor(startBounds.height + (targetBounds.height - startBounds.height) * ease)
        };

        if (!win.isDestroyed()) {
          win.setBounds(currentBounds);

          if (progress < 1) {
            // 使用 setTimeout 模拟 60fps
            setTimeout(runAnimation, 16);
          }
        }
      };

      runAnimation();
    }
  });

  // 实时调整窗口大小（用于拖拽调整，保持最小尺寸限制）
  ipcMain.on('resize-window-realtime', (event, width, height) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return;

    // 确保不小于最小尺寸
    const minSize = win.getMinimumSize();
    const finalWidth = Math.max(minSize[0] || 300, Math.floor(width));
    const finalHeight = Math.max(minSize[1] || 150, Math.floor(height));

    const bounds = win.getBounds();
    win.setBounds({
      x: bounds.x,
      y: bounds.y,
      width: finalWidth,
      height: finalHeight
    });
  });

  ipcMain.on('set-ignore-mouse', (event, ignore, forward) => {
    // macOS 下 setIgnoreMouseEvents 与透明无边框窗口组合不稳定，暂时禁用
    if (process.platform === 'darwin') return;
    setIgnoreMouseEvents(ignore, forward);
  });

  ipcMain.on('set-always-on-top', (event, flag) => {
    setAlwaysOnTopFlag(flag);
  });

  ipcMain.on('open-settings', () => {
    createSettingsWindow();
  });

  ipcMain.on('open-timer-window', () => {
    createTimerWindow();
  });

  // ===== 配置管理 =====

  ipcMain.handle('get-config', async () => {
    const config = getConfigSync();
    const displays = getAllDisplays();
    const targetDisplay = (config.transforms?.display < displays.length)
      ? displays[config.transforms.display]
      : screen.getPrimaryDisplay();
    return { ...config, displayBounds: targetDisplay.bounds };
  });

  ipcMain.on('update-config', (event, newConfig) => {
    const mainWindow = getMainWindow();
    const oldConfig = getConfigSync();
    updateConfig(newConfig, { screen, mainWindow });

    // 处理 ICC-CE 兼容性的实时切换
    if (newConfig.helper_tools?.icc_compatibility !== oldConfig.helper_tools?.icc_compatibility) {
      const { isProcessRunning } = require('./system');
      if (isProcessRunning('InkCanvasForClass.exe')) {
        const { executeTask } = require('./automation');
        const { getDataDir } = require('./config');
        const uri = newConfig.helper_tools.icc_compatibility ? 'icc://thoroughHideOn' : 'icc://thoroughHideOff';
        executeTask({ script: uri }, getDataDir());
      }
    }

    // 同时更新窗口位置
    const transforms = newConfig.transforms || { display: 0, height: 64, posy: 0, size: 100 };
    const scale = (transforms.size || 100) / 100;
    const displays = screen.getAllDisplays();
    const targetDisplay = (transforms.display < displays.length)
      ? displays[transforms.display]
      : screen.getPrimaryDisplay();
    const screenBounds = targetDisplay.bounds;

    // 采用与 useSidebarAnimation 一致的计算逻辑
    const winW = Math.floor(20 * scale);
    const winH = Math.ceil((transforms.height + 40) * scale);
    const yPos = Math.floor(screenBounds.y + transforms.posy - winH / 2);

    // 调用窗口位置更新函数，传入配置对象
    resizeMainWindow(winW, winH, yPos, newConfig);
  });

  ipcMain.on('preview-config', (event, newConfig) => {
    const mainWindow = getMainWindow();
    const oldConfig = getConfigSync();
    previewConfig(newConfig, { screen, mainWindow });

    // 处理 ICC-CE 兼容性的实时切换 (预览模式)
    if (newConfig.helper_tools?.icc_compatibility !== oldConfig.helper_tools?.icc_compatibility) {
      const { isProcessRunning } = require('./system');
      if (isProcessRunning('InkCanvasForClass.exe')) {
        const { executeTask } = require('./automation');
        const { getDataDir } = require('./config');
        const uri = newConfig.helper_tools.icc_compatibility ? 'icc://thoroughHideOn' : 'icc://thoroughHideOff';
        executeTask({ script: uri }, getDataDir());
      }
    }

    // 同时更新窗口位置
    const transforms = newConfig.transforms || { display: 0, height: 64, posy: 0, size: 100 };
    const scale = (transforms.size || 100) / 100;
    const displays = screen.getAllDisplays();
    const targetDisplay = (transforms.display < displays.length)
      ? displays[transforms.display]
      : screen.getPrimaryDisplay();
    const screenBounds = targetDisplay.bounds;

    // 采用与 useSidebarAnimation 一致的计算逻辑
    const winW = Math.floor(20 * scale);
    const winH = Math.ceil((transforms.height + 40) * scale);
    const yPos = Math.floor(screenBounds.y + transforms.posy - winH / 2);

    // 调用窗口位置更新函数，传入配置对象
    resizeMainWindow(winW, winH, yPos, newConfig);
  });

  // ===== 显示器管理 =====

  ipcMain.handle('get-displays', () => {
    return getAllDisplays();
  });

  ipcMain.handle('get-os-info', () => {
    const os = require('os');
    return {
      platform: process.platform,
      release: os.release(),
    };
  });

  ipcMain.handle('get-volume', () => getVolume());

  ipcMain.handle('is-process-running', (event, processName) => {
    const { isProcessRunning } = require('./system');
    return isProcessRunning(processName);
  });

  ipcMain.on('set-volume', (e, val) => {
    setVolume(val);
  });

  ipcMain.on('execute-command', (event, command) => {
    executeCommand(command);
  });

  ipcMain.on('show-desktop', () => {
    showDesktop();
  });

  ipcMain.on('taskview', () => {
    taskView();
  });

  ipcMain.on('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
  });

  // 全屏控制（带插值动画）
  ipcMain.on('set-fullscreen', (event, flag, animate = true) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return;

    // 如果已经是目标状态且没有需要恢复的原始边界，直接发送事件并返回
    if (win.isFullScreen() === flag && (flag || !win._originalBounds)) {
      win.webContents.send('fullscreen-changed', flag);
      return;
    }

    // 防止动画期间重复触发
    if (win._isFullScreenAnimating) return;

    const { screen } = require('electron');
    const currentDisplay = screen.getDisplayNearestPoint(win.getBounds());
    const workArea = currentDisplay.workArea;

    // 保存原始窗口状态（用于退出全屏时恢复）
    if (flag && !win._originalBounds && !win.isFullScreen()) {
      win._originalBounds = win.getBounds();
    }

    // 标记为程序控制，避免 window.js 中的 leave-full-screen 事件重复处理恢复逻辑
    win._programmaticFullScreen = true;

    // 如果禁用动画，直接设置最终状态
    if (animate === false) {
      if (flag) {
        win.setFullScreen(true);
      } else {
        if (win.isFullScreen()) {
          win.setFullScreen(false);
        }
        // 恢复原始窗口大小
        if (win._originalBounds) {
          win.setBounds(win._originalBounds);
          win._originalBounds = null;
        }
        win.setMinimumSize(300, 150);
        win._programmaticFullScreen = false;
      }
      win.webContents.send('fullscreen-changed', flag);
      return;
    }

    if (flag) {
      // ===== 进入全屏（带动画） =====
      win._isFullScreenAnimating = true;

      const startBounds = win.getBounds();
      const targetBounds = {
        x: workArea.x,
        y: workArea.y,
        width: workArea.width,
        height: workArea.height
      };

      const duration = 400;
      const startTime = Date.now();

      win.setMinimumSize(0, 0);
      win.setMaximumSize(10000, 10000);

      const animate = () => {
        if (win.isDestroyed()) return;
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        const currentBounds = {
          x: Math.floor(startBounds.x + (targetBounds.x - startBounds.x) * ease),
          y: Math.floor(startBounds.y + (targetBounds.y - startBounds.y) * ease),
          width: Math.floor(startBounds.width + (targetBounds.width - startBounds.width) * ease),
          height: Math.floor(startBounds.height + (targetBounds.height - startBounds.height) * ease)
        };

        win.setBounds(currentBounds);

        if (progress < 1) {
          setTimeout(animate, 16);
        } else {
          win.setFullScreen(true);
          win._isFullScreenAnimating = false;
          // 延迟重置，确保原生事件处理后再重置
          setTimeout(() => {
            if (!win.isDestroyed()) win._programmaticFullScreen = false;
          }, 100);
        }
      };

      animate();
    } else {
      // ===== 退出全屏（带动画） =====
      const originalBounds = win._originalBounds;

      if (win.isFullScreen()) {
        win.setFullScreen(false);
      } else {
        // 如果已经不是全屏（比如通过其它方式退出），也要通知渲染进程同步状态
        win.webContents.send('fullscreen-changed', false);
      }

      if (!originalBounds) {
        win._originalBounds = null;
        win.setMinimumSize(300, 150);
        win._programmaticFullScreen = false;
        return;
      }

      win._isFullScreenAnimating = true;
      win._originalBounds = null;

      setTimeout(() => {
        if (win.isDestroyed()) return;

        const startBounds = win.getBounds();
        const targetBounds = originalBounds;

        if (startBounds.width < targetBounds.width * 1.1 && startBounds.height < targetBounds.height * 1.1) {
          win.setBounds(targetBounds);
          win.setMinimumSize(300, 150);
          win._isFullScreenAnimating = false;
          win._programmaticFullScreen = false;
          return;
        }

        const duration = 400;
        const startTime = Date.now();

        win.setMinimumSize(0, 0);
        win.setMaximumSize(10000, 10000);

        const animate = () => {
          if (win.isDestroyed()) return;
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);

          const currentBounds = {
            x: Math.floor(startBounds.x + (targetBounds.x - startBounds.x) * ease),
            y: Math.floor(startBounds.y + (targetBounds.y - startBounds.y) * ease),
            width: Math.floor(startBounds.width + (targetBounds.width - startBounds.width) * ease),
            height: Math.floor(startBounds.height + (targetBounds.height - startBounds.height) * ease)
          };

          win.setBounds(currentBounds);

          if (progress < 1) {
            setTimeout(animate, 16);
          } else {
            win.setMinimumSize(300, 150);
            win._isFullScreenAnimating = false;
            win._programmaticFullScreen = false;
          }
        };

        animate();
      }, 50);
    }
  });

  ipcMain.handle('is-fullscreen', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      return win.isFullScreen();
    }
    return false;
  });

  ipcMain.on('close-front-window', () => {
    closeFrontWindow();
  });

  ipcMain.on('blur-and-close-front-window', () => {
    blurMainWindow();
    closeFrontWindow();
  });

  ipcMain.on('open-file', (event, filePath) => {
    openFile(filePath);
  });

  ipcMain.on('open-folder', (event, filePath) => {
    openFolder(filePath);
  });

  ipcMain.on('open-with-notepad', (event, filePath) => {
    openWithNotepad(filePath);
  });

  ipcMain.on('copy-image', (event, filePath) => {
    copyImageToClipboard(filePath);
  });

  ipcMain.on('save-edited-image', (event, filePath, base64Data) => {
    saveEditedImage(filePath, base64Data);
  });

  // ===== 应用启动 =====

  ipcMain.on('launch-app', async (event, target, args) => {
    await launchApp(target, args);
  });

  ipcMain.handle('get-file-icon', async (event, filePath) => {
    return await getFileIcon(filePath, app);
  });

  // ===== 文件系统 =====

  ipcMain.handle('get-files-in-folder', async (event, folderPath, maxCount) => {
    return await getFilesInFolder(folderPath, maxCount);
  });

  ipcMain.handle('read-file', async (event, filePath) => {
    return await readFileContent(filePath);
  });

  ipcMain.handle('write-file', async (event, filePath, content) => {
    return await writeFileContent(filePath, content);
  });

  ipcMain.handle('delete-file', async (event, filePath) => {
    return await deleteFile(filePath);
  });

  ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
    return await renameFile(oldPath, newPath);
  });

  // ===== 截图 =====

  ipcMain.handle('screenshot', async () => {
    return await takeScreenshot();
  });

  log.info('register.done');
}

/**
 * 注册显示器事件监听器
 */
function registerDisplayEventListeners() {
  log.info('display-listeners.register.start');
  const updateDisplays = () => {
    const displays = getAllDisplays();
    log.info('display-listeners.changed', {
      count: displays.length,
      displays: displays.map(display => ({
        id: display.id,
        bounds: display.bounds,
        scaleFactor: display.scaleFactor
      }))
    });
    notifyDisplaysUpdated(displays);
  };

  screen.on('display-added', updateDisplays);
  screen.on('display-removed', updateDisplays);
  screen.on('display-metrics-changed', updateDisplays);
  log.info('display-listeners.register.done');
}

module.exports = {
  registerIPCHandlers,
  registerDisplayEventListeners
};

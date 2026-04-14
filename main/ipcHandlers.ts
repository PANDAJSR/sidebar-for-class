import { ipcMain, app, screen, BrowserWindow } from 'electron';
import { getConfigSync, updateConfig, previewConfig } from './config';
import { getAllDisplays } from './display';
import { getMainWindow, createSettingsWindow, createTimerWindow, setAlwaysOnTopFlag, resizeMainWindow, setIgnoreMouseEvents, notifyDisplaysUpdated, blurMainWindow } from './window';
import { getVolume, setVolume, executeCommand, showDesktop, taskView, closeFrontWindow, openFile, openFolder, openWithNotepad, copyImageToClipboard, saveEditedImage } from './system';
import { launchApp, getFileIcon } from './launcher';
import { getFilesInFolder, readFileContent, writeFileContent, deleteFile, renameFile } from './fileSystem';
import { takeScreenshot } from './screenshot';
import { createLogger } from './logger';

const log = createLogger('ipc');

function registerIPCHandlers(): void {
  log.info('register.start');

  ipcMain.on('resize-window', (event, width, height, y, animate = true) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;

    if (win === getMainWindow()) {
      resizeMainWindow(width, height, y);
    } else {
      win.setMinimumSize(0, 0);
      win.setMaximumSize(10000, 10000);

      const startBounds = win.getBounds();
      const targetBounds = {
        width: Math.floor(width),
        height: Math.floor(height),
        x: startBounds.x,
        y: typeof y === 'number' ? Math.floor(y) : startBounds.y
      };

      if (animate === false || animate === 'off') {
        if (!win.isDestroyed()) {
          win.setBounds(targetBounds);
        }
        return;
      }

      if (animate === 'partial') {
        if (!win.isDestroyed()) {
          win.setBounds(targetBounds);
        }
        return;
      }

      const duration = 500;
      const startTime = Date.now();

      const runAnimation = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
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
            setTimeout(runAnimation, 16);
          }
        }
      };

      runAnimation();
    }
  });

  ipcMain.on('resize-window-realtime', (event, width, height) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return;

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

  ipcMain.handle('get-config', async (event) => {
    log.info('get-config.request', {
      senderId: event.sender.id,
      url: event.sender.getURL()
    });
    const config = getConfigSync();
    const displays = getAllDisplays();
    const targetDisplay = (config.transforms?.display < displays.length)
      ? displays[config.transforms.display]
      : screen.getPrimaryDisplay();
    const response = { ...config, displayBounds: targetDisplay.bounds };
    log.info('get-config.response', {
      senderId: event.sender.id,
      transforms: response.transforms || null,
      widgetsCount: Array.isArray(response.widgets) ? response.widgets.length : 0
    });
    return response;
  });

  ipcMain.on('update-config', (event, newConfig) => {
    const mainWindow = getMainWindow();
    const oldConfig = getConfigSync();
    updateConfig(newConfig, { screen, mainWindow });

    if (newConfig.helper_tools?.icc_compatibility !== oldConfig.helper_tools?.icc_compatibility) {
      const { isProcessRunning } = require('./system');
      if (isProcessRunning('InkCanvasForClass.exe')) {
        const { executeTask } = require('./automation');
        const { getDataDir } = require('./config');
        const uri = newConfig.helper_tools.icc_compatibility ? 'icc://thoroughHideOn' : 'icc://thoroughHideOff';
        executeTask({ script: uri }, getDataDir());
      }
    }

    const transforms = newConfig.transforms || { display: 0, height: 64, posy: 0, size: 100 };
    const scale = (transforms.size || 100) / 100;
    const displays = screen.getAllDisplays();
    const targetDisplay = (transforms.display < displays.length)
      ? displays[transforms.display]
      : screen.getPrimaryDisplay();
    const screenBounds = targetDisplay.bounds;

    const winW = Math.floor(20 * scale);
    const winH = Math.ceil((transforms.height + 40) * scale);
    const yPos = Math.floor(screenBounds.y + transforms.posy - winH / 2);

    resizeMainWindow(winW, winH, yPos, newConfig);
  });

  ipcMain.on('preview-config', (event, newConfig) => {
    const mainWindow = getMainWindow();
    const oldConfig = getConfigSync();
    previewConfig(newConfig, { screen, mainWindow });

    if (newConfig.helper_tools?.icc_compatibility !== oldConfig.helper_tools?.icc_compatibility) {
      const { isProcessRunning } = require('./system');
      if (isProcessRunning('InkCanvasForClass.exe')) {
        const { executeTask } = require('./automation');
        const { getDataDir } = require('./config');
        const uri = newConfig.helper_tools.icc_compatibility ? 'icc://thoroughHideOn' : 'icc://thoroughHideOff';
        executeTask({ script: uri }, getDataDir());
      }
    }

    const transforms = newConfig.transforms || { display: 0, height: 64, posy: 0, size: 100 };
    const scale = (transforms.size || 100) / 100;
    const displays = screen.getAllDisplays();
    const targetDisplay = (transforms.display < displays.length)
      ? displays[transforms.display]
      : screen.getPrimaryDisplay();
    const screenBounds = targetDisplay.bounds;

    const winW = Math.floor(20 * scale);
    const winH = Math.ceil((transforms.height + 40) * scale);
    const yPos = Math.floor(screenBounds.y + transforms.posy - winH / 2);

    resizeMainWindow(winW, winH, yPos, newConfig);
  });

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

  ipcMain.on('set-fullscreen', (event, flag, animate = true) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return;

    if (win.isFullScreen() === flag && (flag || !win._originalBounds)) {
      win.webContents.send('fullscreen-changed', flag);
      return;
    }

    if (win._isFullScreenAnimating) return;

    const currentDisplay = screen.getDisplayNearestPoint(win.getBounds());
    const workArea = currentDisplay.workArea;

    if (flag && !win._originalBounds && !win.isFullScreen()) {
      win._originalBounds = win.getBounds();
    }

    win._programmaticFullScreen = true;

    if (animate === false) {
      if (flag) {
        win.setFullScreen(true);
      } else {
        if (win.isFullScreen()) {
          win.setFullScreen(false);
        }
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

      const animateStep = () => {
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
          setTimeout(animateStep, 16);
        } else {
          win.setFullScreen(true);
          win._isFullScreenAnimating = false;
          setTimeout(() => {
            if (!win.isDestroyed()) win._programmaticFullScreen = false;
          }, 100);
        }
      };

      animateStep();
    } else {
      const originalBounds = win._originalBounds;

      if (win.isFullScreen()) {
        win.setFullScreen(false);
      } else {
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

        const animateStep = () => {
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
            setTimeout(animateStep, 16);
          } else {
            win.setMinimumSize(300, 150);
            win._isFullScreenAnimating = false;
            win._programmaticFullScreen = false;
          }
        };

        animateStep();
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

  ipcMain.on('launch-app', async (event, target, args) => {
    await launchApp(target, args);
  });

  ipcMain.handle('get-file-icon', async (event, filePath) => {
    return await getFileIcon(filePath, app);
  });

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

  ipcMain.handle('screenshot', async () => {
    return await takeScreenshot();
  });

  log.info('register.done');
}

function registerDisplayEventListeners(): void {
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

export {
  registerIPCHandlers,
  registerDisplayEventListeners
};

import { BrowserWindow } from 'electron';
import * as path from 'path';
import { isDev } from './constants';
import { getTargetDisplay, calculateWindowYPosition, calculateWindowXPosition } from './display';
import { getConfigSync } from './config';
import { createLogger } from './logger';

const log = createLogger('window');

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let shouldAlwaysOnTop = true;
let topInterval: NodeJS.Timeout | null = null;
let timerWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  log.info('create-main-window.start');
  const config = getConfigSync();
  const transforms = config.transforms || {} as { display?: number; posy?: number; size?: number; panel?: { width?: number; height?: number } };
  const panel = transforms.panel || {} as { width?: number; height?: number };
  const scale = (transforms.size || 100) / 100;

  const panelWidth = panel.width || 450;
  const panelHeight = panel.height || 400;

  const targetDisplay = getTargetDisplay(transforms.display || 0);
  const screenBounds = targetDisplay.bounds;

  const initialWidth = Math.floor(panelWidth * scale + 100);
  const initialHeight = Math.ceil(panelHeight * scale + 40);

  let yPos = screenBounds.y + (transforms.posy || 0) - (initialHeight / 2);
  yPos = calculateWindowYPosition(yPos, initialHeight, screenBounds);

  const xPos = screenBounds.x;

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: initialWidth,
    height: initialHeight,
    x: xPos,
    y: yPos,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    movable: false,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      experimentalFeatures: true,
    },
  };

  if (process.platform === 'win32') {
    windowOptions.type = 'toolbar';
  }

  log.info('create-main-window.options', {
    platform: process.platform,
    isDev,
    bounds: { width: initialWidth, height: initialHeight, x: xPos, y: yPos },
    targetDisplay: {
      id: targetDisplay.id,
      bounds: targetDisplay.bounds
    },
    windowOptions: {
      frame: windowOptions.frame,
      transparent: windowOptions.transparent,
      alwaysOnTop: windowOptions.alwaysOnTop,
      skipTaskbar: windowOptions.skipTaskbar,
      movable: windowOptions.movable,
      resizable: windowOptions.resizable,
      hasShadow: windowOptions.hasShadow,
      type: windowOptions.type || null
    }
  });

  mainWindow = new BrowserWindow(windowOptions);
  log.info('create-main-window.created', {
    windowId: mainWindow.id
  });

  mainWindow.setVisibleOnAllWorkspaces(true);

  if (process.platform === 'win32') {
    startTopInterval();
  }

  if (process.env.SKIP_RENDERER === '1') {
    log.warn('main-window.load.blank', { reason: 'SKIP_RENDERER=1' });
    mainWindow.loadURL('about:blank');
  } else if (isDev) {
    log.info('main-window.load.url', { url: 'http://localhost:3000/index.html' });
    mainWindow.loadURL('http://localhost:3000/index.html');
  } else {
    const filePath = path.join(__dirname, '../dist/index.html');
    log.info('main-window.load.file', { filePath });
    mainWindow.loadFile(filePath);
  }

  mainWindow.on('ready-to-show', () => {
    log.info('main-window.ready-to-show', { windowId: mainWindow!.id });
    mainWindow!.show();
  });
  mainWindow.on('blur', () => {
    if (shouldAlwaysOnTop) {
      if (process.platform === 'win32') {
        mainWindow!.setAlwaysOnTop(true, 'screen-saver');
      } else {
        mainWindow!.setAlwaysOnTop(true);
      }
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-blur');
    }
  });

  return mainWindow;
}

function startTopInterval(): void {
  if (process.platform !== 'win32') return;

  topInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (shouldAlwaysOnTop) {
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        mainWindow.moveTop();
      }
    } else {
      if (topInterval) clearInterval(topInterval);
    }
  }, 200);
}

function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow;
}

function getTimerWindow(): BrowserWindow | null {
  return timerWindow;
}

function setAlwaysOnTopFlag(flag: boolean): void {
  shouldAlwaysOnTop = flag;
  log.info('main-window.always-on-top.update', { flag });
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(flag, 'screen-saver');
  }
}

function resizeMainWindow(width: number, height: number, y: number | null = null, config: ReturnType<typeof getConfigSync> | null = null): void {
  if (!mainWindow) {
    log.warn('main-window.resize.skip', { reason: 'main-window-not-created' });
    return;
  }

  const finalConfig = config || getConfigSync();
  const transforms = finalConfig.transforms || { display: 0, height: 64, posy: 0 };

  const targetDisplay = getTargetDisplay(transforms.display);
  const screenBounds = targetDisplay.bounds;

  const newY = (typeof y === 'number')
    ? y
    : Math.floor(screenBounds.y + transforms.posy - height / 2);

  const adjustedY = calculateWindowYPosition(newY, height, screenBounds);
  const adjustedX = calculateWindowXPosition(screenBounds.x, width, screenBounds);

  mainWindow.setBounds({
    width: Math.floor(width),
    height: Math.floor(height),
    x: Math.floor(adjustedX),
    y: Math.floor(adjustedY)
  });
}

function setIgnoreMouseEvents(ignore: boolean, forward = false): void {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward });
  }
}

function createSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: '设置',
    frame: true,
    transparent: false,
    alwaysOnTop: false,
    skipTaskbar: false,
    resizable: true,
    minimizable: true,
    maximizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    }
  });
  log.info('settings-window.created', { windowId: settingsWindow.id, isDev });

  if (isDev) {
    settingsWindow.loadURL('http://localhost:3000/settings.html');
  } else {
    const filePath = path.join(__dirname, '../dist/settings.html');
    settingsWindow.loadFile(filePath);
  }

  settingsWindow.on('closed', () => {
    log.info('settings-window.closed', { windowId: settingsWindow.id });
    settingsWindow = null;
  });
}

function createTimerWindow(): void {
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.focus();
    return;
  }

  timerWindow = new BrowserWindow({
    width: 600,
    height: 400,
    minWidth: 300,
    minHeight: 150,
    title: '计时器',
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    autoHideMenuBar: true,
    backgroundMaterial: 'acrylic',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  log.info('timer-window.created', { windowId: timerWindow.id, isDev });
  timerWindow.setAlwaysOnTop(true, 'screen-saver');

  if (isDev) {
    timerWindow.loadURL('http://localhost:3000/timer.html');
  } else {
    const filePath = path.join(__dirname, '../dist/timer.html');
    timerWindow.loadFile(filePath);
  }

  timerWindow.on('enter-full-screen', () => {
    if (timerWindow && !timerWindow.isDestroyed()) {
      timerWindow.webContents.send('fullscreen-changed', true);
    }
  });

  timerWindow.on('leave-full-screen', () => {
    if (timerWindow && !timerWindow.isDestroyed()) {
      timerWindow.webContents.send('fullscreen-changed', false);

      if (!timerWindow._programmaticFullScreen && timerWindow._originalBounds) {
        const originalBounds = timerWindow._originalBounds;
        timerWindow._originalBounds = null;

        setTimeout(() => {
          if (timerWindow && !timerWindow.isDestroyed()) {
            timerWindow.setMinimumSize(0, 0);
            timerWindow.setMaximumSize(10000, 10000);
            timerWindow.setBounds(originalBounds);
            timerWindow.setMinimumSize(300, 150);
          }
        }, 50);
      }
    }
  });

  timerWindow.on('closed', () => {
    log.info('timer-window.closed', { windowId: timerWindow.id });
    timerWindow = null;
  });
}

function notifyDisplaysUpdated(displays: Electron.Display[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('displays-updated', displays);
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('displays-updated', displays);
  }
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.webContents.send('displays-updated', displays);
  }
}

function blurMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.blur();
  }
}

export {
  createWindow,
  createSettingsWindow,
  createTimerWindow,
  getMainWindow,
  getSettingsWindow,
  getTimerWindow,
  setAlwaysOnTopFlag,
  resizeMainWindow,
  setIgnoreMouseEvents,
  notifyDisplaysUpdated,
  blurMainWindow
};
/**
 * 窗口管理模块
 * 负责主窗口和设置窗口的创建与管理
 */
const { BrowserWindow } = require('electron');
const path = require('path');
const { isDev } = require('./constants');
const { getTargetDisplay, calculateWindowYPosition, calculateWindowXPosition } = require('./display');
const { getConfigSync } = require('./config');

let mainWindow = null;
let settingsWindow = null;
let shouldAlwaysOnTop = true;
let topInterval = null;
let timerWindow = null;


/**
 * 创建主窗口
 * @returns {BrowserWindow} 主窗口实例
 */
function createWindow() {
  const config = getConfigSync();
  const transforms = config.transforms || {};
  const panel = transforms.panel || {};
  const scale = (transforms.size || 100) / 100;

  // 从配置中获取面板尺寸，如果未定义则使用默认值
  const panelWidth = panel.width || 450;
  const panelHeight = panel.height || 400;

  const targetDisplay = getTargetDisplay(transforms.display || 0);
  const screenBounds = targetDisplay.bounds;

  // 窗口尺寸始终为展开后的大小
  const initialWidth = Math.floor(panelWidth * scale + 100);
  const initialHeight = Math.ceil(panelHeight * scale + 40);

  let yPos = screenBounds.y + (transforms.posy || 0) - (initialHeight / 2);
  yPos = calculateWindowYPosition(yPos, initialHeight, screenBounds);

  const xPos = screenBounds.x;

  const windowOptions = {
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
    // backgroundMaterial: 'acrylic',
  };

  // toolbar 类型和激进置顶级别在 macOS 上稳定性较差，仅在 Windows 启用
  if (process.platform === 'win32') {
    windowOptions.type = 'toolbar';
  }

  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.setVisibleOnAllWorkspaces(true);

  // 定时保持窗口置顶（仅 Windows 需要）
  if (process.platform === 'win32') {
    startTopInterval();
  }

  // 加载页面
  if (process.env.SKIP_RENDERER === '1') {
    mainWindow.loadURL('about:blank');
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:3000/index.html');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 事件监听
  mainWindow.on('ready-to-show', () => mainWindow.show());
  mainWindow.on('blur', () => {
    if (shouldAlwaysOnTop) {
      if (process.platform === 'win32') {
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
      } else {
        mainWindow.setAlwaysOnTop(true);
      }
    }
    // 通知渲染进程窗口失去焦点
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-blur');
    }
  });

  return mainWindow;
}

/**
 * 启动置顶定时器
 */
function startTopInterval() {
  if (process.platform !== 'win32') return;

  topInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (shouldAlwaysOnTop) {
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        mainWindow.moveTop();
      }
    } else {
      clearInterval(topInterval);
    }
  }, 200);
}

/**
 * 获取主窗口实例
 * @returns {BrowserWindow|null} 主窗口实例
 */
function getMainWindow() {
  return mainWindow;
}

/**
 * 获取设置窗口实例
 * @returns {BrowserWindow|null} 设置窗口实例
 */
function getSettingsWindow() {
  return settingsWindow;
}

/**
 * 获取计时器窗口实例
 * @returns {BrowserWindow|null} 计时器窗口实例
 */
function getTimerWindow() {
  return timerWindow;
}


/**
 * 设置窗口是否保持置顶
 * @param {boolean} flag - 是否置顶
 */
function setAlwaysOnTopFlag(flag) {
  shouldAlwaysOnTop = flag;
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(flag, 'screen-saver');
  }
}

/**
 * 调整主窗口大小和位置
 * @param {number} width - 窗口宽度
 * @param {number} height - 窗口高度
 * @param {number|null} y - 窗口 Y 坐标（可选）
 * @param {Object|null} config - 配置对象（可选，如果不提供则从文件读取）
 */
function resizeMainWindow(width, height, y = null, config = null) {
  if (!mainWindow) return;

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

/**
 * 设置窗口是否忽略鼠标事件
 * @param {boolean} ignore - 是否忽略
 * @param {boolean} forward - 是否转发
 */
function setIgnoreMouseEvents(ignore, forward = false) {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward });
  }
}

/**
 * 创建设置窗口
 */
function createSettingsWindow() {
  // 如果设置窗口已经存在，则聚焦它
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

  // 加载设置页面
  if (isDev) {
    settingsWindow.loadURL('http://localhost:3000/settings.html');
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/settings.html'));
  }

  // 窗口关闭时清理引用
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

/**
 * 创建计时器窗口
 */
function createTimerWindow() {
  // 如果计时器窗口已经存在，则聚焦它
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
    frame: true,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    backgroundMaterial: 'acrylic',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  timerWindow.setAlwaysOnTop(true, 'screen-saver');

  // 加载计时器页面
  if (isDev) {
    timerWindow.loadURL('http://localhost:3000/timer.html');
  } else {
    timerWindow.loadFile(path.join(__dirname, '../dist/timer.html'));
  }

  // 监听全屏状态变化事件，通知渲染进程
  timerWindow.on('enter-full-screen', () => {
    if (timerWindow && !timerWindow.isDestroyed()) {
      timerWindow.webContents.send('fullscreen-changed', true);
    }
  });

  timerWindow.on('leave-full-screen', () => {
    if (timerWindow && !timerWindow.isDestroyed()) {
      timerWindow.webContents.send('fullscreen-changed', false);

      // 如果不是程序控制的全屏操作（比如用户按 ESC），需要恢复窗口
      if (!timerWindow._programmaticFullScreen && timerWindow._originalBounds) {
        const originalBounds = timerWindow._originalBounds;
        timerWindow._originalBounds = null;

        // 延迟恢复窗口大小
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

  // 窗口关闭时清理引用
  timerWindow.on('closed', () => {
    timerWindow = null;
  });
}


/**
 * 通知所有窗口显示器已更新
 * @param {Array} displays - 显示器列表
 */
function notifyDisplaysUpdated(displays) {
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


/**
 * 使主窗口失去焦点
 */
function blurMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.blur();
  }
}

module.exports = {
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

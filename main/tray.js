/**
 * 托盘管理模块
 * 负责系统托盘图标和菜单的创建与管理
 */
const { Tray, Menu, app, nativeImage } = require('electron');
const { getMainWindow, createSettingsWindow, getSettingsWindow } = require('./window');

let tray = null;
let isWindowVisible = true;

/**
 * 创建托盘图标
 * @returns {nativeImage} 托盘图标
 */
function createTrayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <rect width="16" height="16" fill="#0078d4"/>
      <rect x="2" y="4" width="12" height="8" fill="#ffffff"/>
    </svg>
  `;
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return nativeImage.createFromDataURL(dataUrl);
}

/**
 * 创建托盘菜单
 * @returns {Menu} 托盘菜单实例
 */
function createTrayMenu() {
  const mainWindow = getMainWindow();
  const windowVisibleText = mainWindow && mainWindow.isVisible() ? '隐藏窗口' : '显示窗口';

  const template = [
    {
      label: windowVisibleText,
      click: () => {
        toggleWindowVisibility();
      }
    },
    {
      type: 'separator'
    },
    {
      label: '设置',
      click: () => {
        createSettingsWindow();
      }
    },
    {
      type: 'separator'
    },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ];

  return Menu.buildFromTemplate(template);
}

/**
 * 切换窗口可见性
 */
function toggleWindowVisibility() {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  if (mainWindow.isVisible()) {
    mainWindow.hide();
    isWindowVisible = false;
  } else {
    mainWindow.show();
    isWindowVisible = true;
  }
  
  updateTrayMenu();
}

/**
 * 更新托盘菜单
 */
function updateTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(createTrayMenu());
}

/**
 * 创建托盘图标
 */
function createTray() {
  if (tray) {
    return;
  }

  try {
    const icon = createTrayIcon();
    tray = new Tray(icon);
    tray.setToolTip('Sidebar for Class');
    tray.setContextMenu(createTrayMenu());

    tray.on('click', () => {
      toggleWindowVisibility();
    });
  } catch (error) {
    console.error('创建托盘图标失败:', error);
  }
}

/**
 * 销毁托盘图标
 */
function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

/**
 * 获取托盘实例
 * @returns {Tray|null} 托盘实例
 */
function getTray() {
  return tray;
}

module.exports = {
  createTray,
  destroyTray,
  getTray,
  updateTrayMenu
};

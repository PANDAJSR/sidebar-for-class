import { Tray, Menu, app, nativeImage, NativeImage } from 'electron';
import { getMainWindow, createSettingsWindow, getSettingsWindow } from './window';
import { createLogger, serializeError } from './logger';

const log = createLogger('tray');

let tray: Tray | null = null;

function createTrayIcon(): NativeImage {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <rect width="16" height="16" fill="#0078d4"/>
      <rect x="2" y="4" width="12" height="8" fill="#ffffff"/>
    </svg>
  `;
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const image = nativeImage.createFromDataURL(dataUrl);
  log.debug('tray.icon.created', {
    isEmpty: image.isEmpty()
  });
  return image;
}

function createTrayMenu(): Menu {
  const mainWindow = getMainWindow();
  const windowVisibleText = mainWindow && mainWindow.isVisible() ? '隐藏窗口' : '显示窗口';
  log.debug('tray.menu.build', {
    hasMainWindow: Boolean(mainWindow),
    mainWindowVisible: mainWindow ? mainWindow.isVisible() : null
  });

  const template: Electron.MenuItemConstructorOptions[] = [
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

let isWindowVisible = true;

function toggleWindowVisibility(): void {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  if (mainWindow.isVisible()) {
    mainWindow.hide();
    isWindowVisible = false;
    log.info('tray.toggle-window', { action: 'hide' });
  } else {
    mainWindow.show();
    isWindowVisible = true;
    log.info('tray.toggle-window', { action: 'show' });
  }

  updateTrayMenu();
}

function updateTrayMenu(): void {
  if (!tray) return;
  tray.setContextMenu(createTrayMenu());
}

function createTray(): void {
  if (tray) {
    log.warn('tray.create.skip', { reason: 'already-created' });
    return;
  }

  try {
    log.info('tray.create.start', { platform: process.platform });
    const icon = createTrayIcon();
    tray = new Tray(icon);
    tray.setToolTip('Sidebar for Class');
    tray.setContextMenu(createTrayMenu());
    log.info('tray.create.success');

    tray.on('click', () => {
      log.debug('tray.click');
      toggleWindowVisibility();
    });
  } catch (error) {
    log.error('tray.create.failed', serializeError(error));
  }
}

function destroyTray(): void {
  if (tray) {
    log.info('tray.destroy');
    tray.destroy();
    tray = null;
  }
}

function getTray(): Tray | null {
  return tray;
}

export {
  createTray,
  destroyTray,
  getTray,
  updateTrayMenu
};
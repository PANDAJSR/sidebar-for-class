/**
 * 配置管理模块
 * 负责配置文件的读取、更新和预览
 */
const path = require('path');
const fs = require('fs');

const { app } = require('electron');
const { DEFAULT_CONFIG } = require('./default-config');
const { createLogger, serializeError } = require('./logger');

const log = createLogger('config');

// 获取基础路径：开发环境下是项目根目录，生产环境下是可执行文件所在目录
const isDev = !app.isPackaged;
const basePath = isDev
  ? path.join(__dirname, '..')
  : (process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath));

const DATA_DIR = path.join(basePath, 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

log.info('paths.initialized', {
  isDev,
  basePath,
  dataDir: DATA_DIR,
  configPath: CONFIG_PATH
});

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  log.info('data-dir.created', { dataDir: DATA_DIR });
}

/**
 * 释放默认配置文件
 * @returns {Object} 默认配置对象
 */
function releaseDefaultConfig() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 4), 'utf8');
    log.warn('config.released-default', { configPath: CONFIG_PATH });
  } catch (e) {
    log.error('config.release-default.failed', serializeError(e));
  }
  return DEFAULT_CONFIG;
}

/**
 * 同步读取配置文件
 * @returns {Object} 配置对象
 */
function getConfigSync() {
  log.debug('config.read.start', { configPath: CONFIG_PATH });
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const content = fs.readFileSync(CONFIG_PATH, 'utf8');
      const parsed = JSON.parse(content);
      log.debug('config.read.success', {
        configPath: CONFIG_PATH,
        bytes: Buffer.byteLength(content, 'utf8')
      });
      return parsed;
    } catch (e) {
      log.error('config.read.failed', {
        configPath: CONFIG_PATH,
        error: serializeError(e)
      });
    }
  }
  // 配置文件不存在，释放默认配置
  log.warn('config.missing.use-default', { configPath: CONFIG_PATH });
  return releaseDefaultConfig();
}

/**
 * 更新配置文件
 * @param {Object} newConfig - 新的配置对象
 * @param {Object} dependencies - 依赖对象 { screen, mainWindow }
 * @returns {Object} 包含显示器边界的配置对象
 */
function updateConfig(newConfig, dependencies = {}) {
  const { screen, mainWindow } = dependencies;

  try {
    const { displayBounds, ...configToSave } = newConfig;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(configToSave, null, 4), 'utf8');
    log.info('config.write.success', {
      configPath: CONFIG_PATH,
      keys: Object.keys(configToSave || {}),
      hasDisplayBoundsField: displayBounds !== undefined
    });

    const displays = screen.getAllDisplays();
    const targetDisplay = (newConfig.transforms?.display < displays.length)
      ? displays[newConfig.transforms.display]
      : screen.getPrimaryDisplay();
    const configWithBounds = { ...newConfig, displayBounds: targetDisplay.bounds };

    const { BrowserWindow } = require('electron');
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('config-updated', configWithBounds);
      }
    });

    log.debug('config.broadcast.updated', {
      windowCount: BrowserWindow.getAllWindows().length
    });
    return configWithBounds;
  } catch (e) {
    log.error('config.write.failed', serializeError(e));
    throw e;
  }
}

/**
 * 预览配置（不保存到文件）
 * @param {Object} newConfig - 预览的配置对象
 * @param {Object} dependencies - 依赖对象 { screen, mainWindow }
 * @returns {Object} 包含显示器边界的配置对象
 */
function previewConfig(newConfig, dependencies = {}) {
  const { screen, mainWindow } = dependencies;

  const baseConfig = getConfigSync();
    const mergedConfig = {
        ...baseConfig,
        ...newConfig,
        widgets: newConfig.widgets !== undefined ? newConfig.widgets : baseConfig.widgets,
        transforms: {
            ...(baseConfig.transforms || {}),
            ...(newConfig.transforms || {}),
            display: newConfig.transforms?.display ?? baseConfig.transforms?.display ?? 0,
            height: newConfig.transforms?.height ?? baseConfig.transforms?.height ?? 64,
            posy: newConfig.transforms?.posy ?? baseConfig.transforms?.posy ?? 0,
            size: newConfig.transforms?.size ?? baseConfig.transforms?.size ?? 100,
            auto_hide: newConfig.transforms?.auto_hide ?? baseConfig.transforms?.auto_hide ?? false,
            expand_mode: newConfig.transforms?.expand_mode ?? baseConfig.transforms?.expand_mode ?? 'drag',
            click_expand_style: newConfig.transforms?.click_expand_style ?? baseConfig.transforms?.click_expand_style ?? 'bar',
            animation_speed: newConfig.transforms?.animation_speed ?? baseConfig.transforms?.animation_speed ?? 1,
            theme_color: newConfig.transforms?.theme_color ?? baseConfig.transforms?.theme_color ?? '#5865F2',
            panel: {
                ...(baseConfig.transforms?.panel || {}),
                ...(newConfig.transforms?.panel || {}),
                width: newConfig.transforms?.panel?.width ?? baseConfig.transforms?.panel?.width ?? 450,
                height: newConfig.transforms?.panel?.height ?? baseConfig.transforms?.panel?.height ?? 400,
                opacity: newConfig.transforms?.panel?.opacity ?? baseConfig.transforms?.panel?.opacity ?? 0.9,
            }
        }
    };

  const displays = screen.getAllDisplays();
  const targetDisplay = (mergedConfig.transforms.display < displays.length)
    ? displays[mergedConfig.transforms.display]
    : screen.getPrimaryDisplay();
  const configWithBounds = { ...mergedConfig, displayBounds: targetDisplay.bounds };

      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
          win.webContents.send('config-updated', configWithBounds);
        }
      });

      log.debug('config.preview.broadcast', {
        windowCount: BrowserWindow.getAllWindows().length
      });
      return configWithBounds;
}

/**
 * 获取数据目录路径
 * @returns {string} 数据目录路径
 */
function getDataDir() {
  return DATA_DIR;
}

module.exports = {
  getConfigSync,
  updateConfig,
  previewConfig,
  getDataDir
};

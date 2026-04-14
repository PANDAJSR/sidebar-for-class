import * as path from 'path';
import * as fs from 'fs';
import { app, screen, BrowserWindow } from 'electron';
import { DEFAULT_CONFIG } from './default-config';
import { createLogger, serializeError } from './logger';

const log = createLogger('config');

const isDev: boolean = !app.isPackaged;
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

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  log.info('data-dir.created', { dataDir: DATA_DIR });
}

function releaseDefaultConfig(): typeof DEFAULT_CONFIG {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 4), 'utf8');
    log.warn('config.released-default', { configPath: CONFIG_PATH });
  } catch (e) {
    log.error('config.release-default.failed', serializeError(e));
  }
  return DEFAULT_CONFIG;
}

function getConfigSync(): typeof DEFAULT_CONFIG {
  log.debug('config.read.start', { configPath: CONFIG_PATH });
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const content = fs.readFileSync(CONFIG_PATH, 'utf8');
      const parsed = JSON.parse(content);
      log.info('config.read.success', {
        configPath: CONFIG_PATH,
        bytes: Buffer.byteLength(content, 'utf8'),
        summary: {
          transforms: parsed?.transforms || null,
          widgetsCount: Array.isArray(parsed?.widgets) ? parsed.widgets.length : 0,
          helperTools: parsed?.helper_tools || null
        }
      });
      return parsed;
    } catch (e) {
      log.error('config.read.failed', {
        configPath: CONFIG_PATH,
        error: serializeError(e)
      });
    }
  }
  log.warn('config.missing.use-default', { configPath: CONFIG_PATH });
  return releaseDefaultConfig();
}

interface ConfigDependencies {
  screen: typeof screen;
  mainWindow: BrowserWindow | null;
}

function updateConfig(newConfig: typeof DEFAULT_CONFIG, dependencies: ConfigDependencies = {} as ConfigDependencies): typeof DEFAULT_CONFIG {
  const { screen: screenInstance, mainWindow } = dependencies;

  try {
    const { displayBounds, ...configToSave } = newConfig;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(configToSave, null, 4), 'utf8');
    log.info('config.write.success', {
      configPath: CONFIG_PATH,
      keys: Object.keys(configToSave || {}),
      hasDisplayBoundsField: displayBounds !== undefined
    });

    const displays = screenInstance.getAllDisplays();
    const targetDisplay = (newConfig.transforms?.display < displays.length)
      ? displays[newConfig.transforms.display]
      : screenInstance.getPrimaryDisplay();
    const configWithBounds = { ...newConfig, displayBounds: targetDisplay.bounds };

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

function previewConfig(newConfig: Partial<typeof DEFAULT_CONFIG>, dependencies: ConfigDependencies = {} as ConfigDependencies): typeof DEFAULT_CONFIG {
  const { screen: screenInstance, mainWindow } = dependencies;

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

  const displays = screenInstance.getAllDisplays();
  const targetDisplay = (mergedConfig.transforms.display < displays.length)
    ? displays[mergedConfig.transforms.display]
    : screenInstance.getPrimaryDisplay();
  const configWithBounds = { ...mergedConfig, displayBounds: targetDisplay.bounds };

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

function getDataDir(): string {
  return DATA_DIR;
}

export {
  getConfigSync,
  updateConfig,
  previewConfig,
  getDataDir
};

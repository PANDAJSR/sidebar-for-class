import { app } from 'electron';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { createLogger, getLogFilePath, resolveLogDir, serializeError } from './main/logger';
import { createWindow } from './main/window';
import { registerIPCHandlers, registerDisplayEventListeners } from './main/ipcHandlers';
import { createTray } from './main/tray';
import { runStartupScripts } from './main/automation';
import { startKiller } from './main/killer';
import { getDataDir, getConfigSync } from './main/config';

const log = createLogger('main');

let guardianProcess: ChildProcess | null = null;
let isQuitting = false;

function configureRuntimePaths(): void {
  const dataDir = getDataDir();
  const sessionDataDir = path.join(dataDir, 'session-data');
  const cacheDir = path.join(sessionDataDir, 'Cache');

  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    app.setPath('sessionData', sessionDataDir);
    app.commandLine.appendSwitch('disk-cache-dir', cacheDir);
    log.info('runtime.paths.configured', {
      sessionDataDir,
      cacheDir
    });
  } catch (error) {
    log.warn('runtime.paths.configure.failed', {
      error: serializeError(error),
      sessionDataDir,
      cacheDir
    });
  }
}

function logBootContext(): void {
  log.info('bootstrap.process', {
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    ppid: process.ppid,
    nodeVersion: process.version,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    v8Version: process.versions.v8,
    osRelease: os.release(),
    cwd: process.cwd(),
    execPath: process.execPath,
    argv: process.argv,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      ELECTRON_RUN_AS_NODE: process.env.ELECTRON_RUN_AS_NODE,
      ENABLE_TRAY_ON_MAC: process.env.ENABLE_TRAY_ON_MAC,
      SKIP_RENDERER: process.env.SKIP_RENDERER
    },
    logDir: resolveLogDir(),
    logFile: getLogFilePath()
  });
}

function registerGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error) => {
    log.fatal('process.uncaughtException', serializeError(error));
  });

  process.on('unhandledRejection', (reason) => {
    log.fatal('process.unhandledRejection', {
      reason: reason instanceof Error ? serializeError(reason) : reason
    });
  });

  process.on('warning', (warning) => {
    log.warn('process.warning', serializeError(warning));
  });
}

function registerLifecycleEventLoggers(): void {
  app.on('will-finish-launching', () => {
    log.info('app.will-finish-launching');
  });

  app.on('ready', () => {
    log.info('app.ready.event');
  });

  app.on('before-quit', (event) => {
    isQuitting = true;
    log.info('app.before-quit', {
      isQuitting,
      defaultPrevented: event.defaultPrevented
    });
  });

  app.on('will-quit', (event) => {
    log.info('app.will-quit', {
      defaultPrevented: event.defaultPrevented
    });
  });

  app.on('quit', (event, exitCode) => {
    log.info('app.quit', {
      exitCode,
      isQuitting,
      defaultPrevented: event.defaultPrevented
    });
  });

  app.on('window-all-closed', () => {
    log.info('app.window-all-closed', {
      platform: process.platform,
      action: process.platform !== 'darwin' ? 'quit' : 'keep-alive'
    });

    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    const { getMainWindow } = require('./main/window');
    const currentMainWindow = getMainWindow();
    const shouldCreate = !currentMainWindow || currentMainWindow.isDestroyed();

    log.info('app.activate', {
      hasMainWindow: Boolean(currentMainWindow),
      mainWindowDestroyed: currentMainWindow ? currentMainWindow.isDestroyed() : null,
      action: shouldCreate ? 'create-window' : 'reuse-window'
    });

    if (shouldCreate) {
      createWindow();
    }
  });

  app.on('browser-window-created', (event, window) => {
    log.info('app.browser-window-created', {
      windowId: window.id,
      title: window.getTitle(),
      isVisible: window.isVisible()
    });

    window.on('unresponsive', () => {
      log.warn('window.unresponsive', {
        windowId: window.id
      });
    });

    window.on('closed', () => {
      log.info('window.closed', {
        windowId: window.id
      });
    });
  });

  app.on('web-contents-created', (event, contents) => {
    log.debug('web-contents.created', {
      webContentsId: contents.id,
      type: contents.getType()
    });

    contents.on('did-fail-load', (_evt, errorCode, errorDescription, validatedURL, isMainFrame, frameProcessId, frameRoutingId) => {
      log.error('web-contents.did-fail-load', {
        webContentsId: contents.id,
        errorCode,
        errorDescription,
        validatedURL,
        isMainFrame,
        frameProcessId,
        frameRoutingId
      });
    });

    contents.on('render-process-gone', (_evt, details) => {
      log.error('web-contents.render-process-gone', {
        webContentsId: contents.id,
        details
      });
    });

    contents.on('unresponsive', () => {
      log.warn('web-contents.unresponsive', {
        webContentsId: contents.id,
        url: contents.getURL()
      });
    });
  });

  app.on('render-process-gone', (event, webContents, details) => {
    log.error('app.render-process-gone', {
      webContentsId: webContents ? webContents.id : null,
      details,
      defaultPrevented: event.defaultPrevented
    });
  });

  app.on('child-process-gone', (event, details) => {
    log.error('app.child-process-gone', {
      details,
      defaultPrevented: event.defaultPrevented
    });
  });

  app.on('gpu-process-crashed', (event, killed) => {
    log.error('app.gpu-process-crashed', {
      killed,
      defaultPrevented: event.defaultPrevented
    });
  });
}

async function runInitStep(step: string, fn: () => Promise<unknown>): Promise<unknown> {
  const startTime = Date.now();
  log.info('init.step.start', { step });

  try {
    const result = await fn();
    log.info('init.step.done', {
      step,
      durationMs: Date.now() - startTime
    });
    return result;
  } catch (error) {
    log.error('init.step.failed', {
      step,
      durationMs: Date.now() - startTime,
      error: serializeError(error)
    });
    throw error;
  }
}

function startGuardian(): void {
  if (isQuitting) {
    log.warn('guardian.skip.start', { reason: 'app-is-quitting' });
    return;
  }

  const dataDir = getDataDir();
  const guardianScript = path.join(__dirname, 'main', 'guardian.js');

  log.info('guardian.starting', {
    guardianScript,
    parentPid: process.pid,
    dataDir
  });

  guardianProcess = spawn(process.execPath, [guardianScript, process.pid, dataDir], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    shell: false,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1'
    }
  });

  guardianProcess.unref();

  guardianProcess.on('spawn', () => {
    log.info('guardian.spawned', {
      pid: guardianProcess!.pid
    });
  });

  guardianProcess.on('error', (error) => {
    log.error('guardian.error', serializeError(error));
  });

  guardianProcess.on('exit', (code, signal) => {
    log.warn('guardian.exited', {
      code,
      signal,
      isQuitting
    });

    if (!isQuitting) {
      setTimeout(startGuardian, 1000);
    }
  });
}

configureRuntimePaths();
logBootContext();
registerGlobalErrorHandlers();
registerLifecycleEventLoggers();

process.on('SIGINT', () => {
  log.warn('process.signal', { signal: 'SIGINT', action: 'quit' });
  isQuitting = true;
  app.quit();
});

process.on('SIGTERM', () => {
  log.warn('process.signal', { signal: 'SIGTERM', action: 'quit' });
  isQuitting = true;
  app.quit();
});

app.whenReady()
  .then(async () => {
    log.info('app.whenReady.resolved', {
      isPackaged: app.isPackaged,
      appPath: app.getAppPath(),
      userDataPath: app.getPath('userData')
    });

    await runInitStep('platform-setup', async () => {
      if (process.platform === 'win32') {
        app.setAppUserModelId('com.sidebar.class');
        const { startMonitoring } = require('./main/window-history');
        startMonitoring(1000);
        log.info('platform.windows.setup.done', { appUserModelId: 'com.sidebar.class' });
      } else {
        log.info('platform.non-windows.setup.skip', { platform: process.platform });
      }
    });

    await runInitStep('create-main-window', async () => {
      const mainWindow = createWindow();
      log.info('main-window.created', {
        windowId: mainWindow.id,
        bounds: mainWindow.getBounds(),
        visible: mainWindow.isVisible()
      });
    });

    await runInitStep('create-tray', async () => {
      if (process.platform !== 'darwin' || process.env.ENABLE_TRAY_ON_MAC === '1') {
        createTray();
        log.info('tray.initialized', {
          platform: process.platform,
          enabledOnMac: process.env.ENABLE_TRAY_ON_MAC === '1'
        });
      } else {
        log.warn('tray.skipped', {
          reason: 'disabled-by-default-on-macos',
          platform: process.platform,
          enableFlag: process.env.ENABLE_TRAY_ON_MAC
        });
      }
    });

    await runInitStep('start-killer', async () => {
      startKiller();
      log.info('killer.started', { platform: process.platform });
    });

    await runInitStep('register-ipc-handlers', async () => {
      registerIPCHandlers();
    });

    await runInitStep('register-display-listeners', async () => {
      registerDisplayEventListeners();
    });

    await runInitStep('start-guardian', async () => {
      if (process.platform === 'win32') {
        startGuardian();
      } else {
        log.info('guardian.skipped', {
          reason: 'windows-only',
          platform: process.platform
        });
      }
    });

    await runInitStep('run-startup-scripts', async () => {
      await runStartupScripts();
    });

    await runInitStep('icc-compatibility-check', async () => {
      const config = getConfigSync();
      const iccCompatibility = Boolean(config.helper_tools?.icc_compatibility);

      log.info('icc.compatibility.state', {
        enabled: iccCompatibility
      });

      if (!iccCompatibility) {
        return;
      }

      const { isProcessRunning } = require('./main/system');
      const running = isProcessRunning('InkCanvasForClass.exe');

      log.info('icc.compatibility.process-check', {
        processName: 'InkCanvasForClass.exe',
        running
      });

      if (!running) {
        return;
      }

      const { executeTask } = require('./main/automation');
      executeTask({ script: 'icc://thoroughHideOn' }, getDataDir());
      log.info('icc.compatibility.action.executed', {
        action: 'icc://thoroughHideOn'
      });
    });

    log.info('app.init.complete');
  })
  .catch((error) => {
    log.fatal('app.init.failed', serializeError(error));
    isQuitting = true;
    app.exit(1);
  });

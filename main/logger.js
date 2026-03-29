/**
 * 主进程日志模块
 * 提供统一的结构化日志，输出到控制台和文件
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');

const APP_LOG_DIR_NAME = 'SidebarForClassLogs';
let cachedLogDir = null;

function getNowIso() {
  return new Date().toISOString();
}

function getDateToken() {
  return new Date().toISOString().slice(0, 10);
}

function serializeError(error) {
  if (!error) return null;
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
    errno: error.errno,
    syscall: error.syscall,
    path: error.path
  };
}

function safeJsonStringify(value) {
  const seen = new WeakSet();

  return JSON.stringify(value, (key, current) => {
    if (current instanceof Error) {
      return serializeError(current);
    }

    if (typeof current === 'bigint') {
      return current.toString();
    }

    if (typeof current === 'function') {
      return `[Function ${current.name || 'anonymous'}]`;
    }

    if (current && typeof current === 'object') {
      if (seen.has(current)) {
        return '[Circular]';
      }
      seen.add(current);
    }

    return current;
  });
}

function resolveLogDir() {
  if (cachedLogDir) {
    return cachedLogDir;
  }

  let dir = path.join(os.tmpdir(), APP_LOG_DIR_NAME);

  try {
    const { app } = require('electron');
    if (app) {
      try {
        app.setAppLogsPath();
      } catch (error) {
        // ignore
      }

      try {
        const electronLogsPath = app.getPath('logs');
        if (electronLogsPath) {
          dir = path.join(electronLogsPath, APP_LOG_DIR_NAME);
        }
      } catch (error) {
        // ignore
      }
    }
  } catch (error) {
    // ignore: keep tmp dir fallback
  }

  fs.mkdirSync(dir, { recursive: true });
  cachedLogDir = dir;
  return dir;
}

function getLogFilePath() {
  const dir = resolveLogDir();
  return path.join(dir, `main-${getDateToken()}.log`);
}

function toHumanString(value) {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return JSON.stringify(serializeError(value));

  try {
    return safeJsonStringify(value);
  } catch (error) {
    return util.inspect(value, { depth: 4, breakLength: 120 });
  }
}

function emit(level, moduleName, event, context) {
  const timestamp = getNowIso();
  const pid = process.pid;
  const base = `[${timestamp}] [pid:${pid}] [${level}] [${moduleName}] ${event}`;
  const payload = context === undefined ? '' : ` ${toHumanString(context)}`;
  const line = `${base}${payload}`;

  if (level === 'ERROR' || level === 'FATAL') {
    console.error(line);
  } else if (level === 'WARN') {
    console.warn(line);
  } else {
    console.log(line);
  }

  try {
    fs.appendFileSync(getLogFilePath(), `${line}\n`, 'utf8');
  } catch (error) {
    console.error(`[${timestamp}] [pid:${pid}] [ERROR] [logger] write.failed ${toHumanString(serializeError(error))}`);
  }
}

function createLogger(moduleName) {
  return {
    debug(event, context) {
      emit('DEBUG', moduleName, event, context);
    },
    info(event, context) {
      emit('INFO', moduleName, event, context);
    },
    warn(event, context) {
      emit('WARN', moduleName, event, context);
    },
    error(event, context) {
      emit('ERROR', moduleName, event, context);
    },
    fatal(event, context) {
      emit('FATAL', moduleName, event, context);
    }
  };
}

module.exports = {
  createLogger,
  getLogFilePath,
  resolveLogDir,
  serializeError
};

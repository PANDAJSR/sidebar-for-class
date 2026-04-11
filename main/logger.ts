import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';

const APP_LOG_DIR_NAME = 'SidebarForClassLogs';
const LOG_LEVELS: Record<string, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  FATAL: 50
};
const DEFAULT_LOG_LEVEL = 'INFO';
let cachedLogDir: string | null = null;

function normalizeLogLevel(level: string): string {
  const upper = String(level || '').trim().toUpperCase();
  return LOG_LEVELS[upper] ? upper : DEFAULT_LOG_LEVEL;
}

function resolveRuntimeLogLevel(): string {
  return normalizeLogLevel(process.env.LOG_LEVEL || process.env.SIDEBAR_LOG_LEVEL || '');
}

function shouldEmit(level: string): boolean {
  const currentLevel = resolveRuntimeLogLevel();
  return (LOG_LEVELS[level] || 0) >= (LOG_LEVELS[currentLevel] || 0);
}

function getNowIso(): string {
  return new Date().toISOString();
}

function getDateToken(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SerializedError {
  name?: string;
  message?: string;
  stack?: string;
  code?: string | number;
  errno?: string | number;
  syscall?: string;
  path?: string;
}

function serializeError(error: unknown): SerializedError | null {
  if (!error) return null;
  const err = error as Error & SerializedError;
  return {
    name: err.name,
    message: err.message,
    stack: err.stack,
    code: err.code,
    errno: err.errno,
    syscall: err.syscall,
    path: err.path
  };
}

function safeJsonStringify(value: unknown): string {
  const seen = new WeakSet();

  return JSON.stringify(value, (key: string, current: unknown) => {
    if (current instanceof Error) {
      return serializeError(current);
    }

    if (typeof current === 'bigint') {
      return current.toString();
    }

    if (typeof current === 'function') {
      return `[Function ${(current as { name?: string }).name || 'anonymous'}]`;
    }

    if (current && typeof current === 'object') {
      if (seen.has(current as object)) {
        return '[Circular]';
      }
      seen.add(current as object);
    }

    return current;
  });
}

function resolveLogDir(): string {
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

function getLogFilePath(): string {
  const dir = resolveLogDir();
  return path.join(dir, `main-${getDateToken()}.log`);
}

function toHumanString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return JSON.stringify(serializeError(value));

  try {
    return safeJsonStringify(value);
  } catch (error) {
    return util.inspect(value, { depth: 4, breakLength: 120 });
  }
}

function emit(level: string, moduleName: string, event: string, context?: unknown) {
  if (!shouldEmit(level)) {
    return;
  }

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

interface Logger {
  debug(event: string, context?: unknown): void;
  info(event: string, context?: unknown): void;
  warn(event: string, context?: unknown): void;
  error(event: string, context?: unknown): void;
  fatal(event: string, context?: unknown): void;
}

function createLogger(moduleName: string): Logger {
  return {
    debug(event: string, context?: unknown) {
      emit('DEBUG', moduleName, event, context);
    },
    info(event: string, context?: unknown) {
      emit('INFO', moduleName, event, context);
    },
    warn(event: string, context?: unknown) {
      emit('WARN', moduleName, event, context);
    },
    error(event: string, context?: unknown) {
      emit('ERROR', moduleName, event, context);
    },
    fatal(event: string, context?: unknown) {
      emit('FATAL', moduleName, event, context);
    }
  };
}

export {
  createLogger,
  getLogFilePath,
  resolveLogDir,
  serializeError
};
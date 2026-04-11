import * as fs from 'fs';
import * as path from 'path';
import { resolveWindowsEnv } from './system';

function getFilesInFolder(folderPath: string, maxCount: number = 100): Promise<Array<{name: string; path: string; mtime: Date; isDirectory: boolean}>> {
  return new Promise((resolve) => {
    try {
      let targetPath = folderPath || '.';
      if (!path.isAbsolute(targetPath) && !targetPath.includes('%')) {
         targetPath = path.join(require('./config').getDataDir(), targetPath);
      }

      const resolvedPath = resolveWindowsEnv(targetPath);
      console.log('[FileSystem] Listing files in:', resolvedPath);

      if (!fs.existsSync(resolvedPath)) {
        console.warn('[FileSystem] Folder does not exist:', resolvedPath);
        resolve([]);
        return;
      }

      const files = fs.readdirSync(resolvedPath);
      console.log('[FileSystem] Found files:', files.length);

      const fileStats = files.map(file => {
        const fullPath = path.join(resolvedPath, file);
        try {
          const stats = fs.statSync(fullPath);
          return {
            name: file,
            path: fullPath,
            mtime: stats.mtime,
            isDirectory: stats.isDirectory()
          };
        } catch (e) {
          return null;
        }
      }).filter(f => f !== null && !f.isDirectory && !f.name.startsWith('desktop.ini')) as Array<{name: string; path: string; mtime: Date; isDirectory: boolean}>;

      fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      resolve(fileStats.slice(0, maxCount));
    } catch (err) {
      console.error('Error listing files:', err);
      resolve([]);
    }
  });
}

async function readFileContent(filePath: string): Promise<string> {
  try {
    let targetPath = filePath;
    if (!path.isAbsolute(filePath) && !filePath.includes('%')) {
       targetPath = path.join(require('./config').getDataDir(), filePath);
    }

    const resolvedPath = resolveWindowsEnv(targetPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    return fs.readFileSync(resolvedPath, 'utf-8');
  } catch (err) {
    console.error('Error reading file:', err);
    throw err;
  }
}

async function writeFileContent(filePath: string, content: string): Promise<boolean> {
  try {
    let targetPath = filePath;
    if (!path.isAbsolute(filePath) && !filePath.includes('%')) {
       targetPath = path.join(require('./config').getDataDir(), filePath);
       const dir = path.dirname(targetPath);
       if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir, { recursive: true });
       }
    }

    const resolvedPath = resolveWindowsEnv(targetPath);
    fs.writeFileSync(resolvedPath, content, 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing file:', err);
    throw err;
  }
}

async function deleteFile(filePath: string): Promise<boolean> {
  try {
    let targetPath = filePath;
    if (!path.isAbsolute(filePath) && !filePath.includes('%')) {
      targetPath = path.join(require('./config').getDataDir(), filePath);
    }
    const resolvedPath = resolveWindowsEnv(targetPath);
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error deleting file:', err);
    throw err;
  }
}

async function renameFile(oldPath: string, newPath: string): Promise<boolean> {
  try {
    let targetOldPath = oldPath;
    let targetNewPath = newPath;

    if (!path.isAbsolute(oldPath) && !oldPath.includes('%')) {
      targetOldPath = path.join(require('./config').getDataDir(), oldPath);
    }
    if (!path.isAbsolute(newPath) && !newPath.includes('%')) {
      targetNewPath = path.join(require('./config').getDataDir(), newPath);
    }

    const resolvedOldPath = resolveWindowsEnv(targetOldPath);
    const resolvedNewPath = resolveWindowsEnv(targetNewPath);

    if (fs.existsSync(resolvedOldPath)) {
      fs.renameSync(resolvedOldPath, resolvedNewPath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error renaming file:', err);
    throw err;
  }
}

export {
  getFilesInFolder,
  readFileContent,
  writeFileContent,
  deleteFile,
  renameFile
};
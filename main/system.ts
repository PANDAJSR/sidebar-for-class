import { exec, execSync, ChildProcess } from 'child_process';
import * as fs from 'fs';
import { shell, nativeImage, clipboard, NativeImage } from 'electron';
import { getSystemVolume, setSystemVolume } from '../main-utils';

function copyImageToClipboard(filePath: string): void {
  if (filePath) {
    const image = nativeImage.createFromPath(filePath);
    clipboard.writeImage(image);
  }
}

function openFile(filePath: string): void {
  if (filePath) {
    shell.openPath(filePath);
  }
}

function openFolder(filePath: string): void {
  if (filePath) {
    shell.showItemInFolder(filePath);
  }
}

function openWithNotepad(filePath: string): void {
  if (!filePath) return;

  const pathModule = require('path');
  const { getDataDir } = require('./config');

  let targetPath = filePath;
  if (!pathModule.isAbsolute(filePath) && !filePath.includes('%')) {
    targetPath = pathModule.join(getDataDir(), filePath);
  }

  const resolvedPath = (require('./system') as typeof import('./system')).resolveWindowsEnv
    ? (require('./system') as typeof import('./system')).resolveWindowsEnv(targetPath)
    : targetPath;

  exec(`notepad.exe "${resolvedPath}"`, (error) => {
    if (error) {
      console.error('[System] 用记事本打开文件失败:', error);
    }
  });
}

function getIsAdmin(): boolean {
  try {
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function resolveWindowsEnv(pathStr: string): string {
  if (!pathStr) return '';
  return pathStr.replace(/%([^%]+)%/g, (_, n) => process.env[n] || '');
}

function getVolume(): number {
  return getSystemVolume();
}

function setVolume(val: number): void {
  console.log('[Main] Received set-volume request:', val);
  setSystemVolume(val);
}

function executeCommand(command: string): void {
  exec(command, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
    }
  });
}

function showDesktop(): void {
  if (process.platform === 'win32') {
    exec('powershell -Command "(New-Object -ComObject Shell.Application).ToggleDesktop()"');
  }
}

function taskView(): void {
  if (process.platform === 'win32') {
    exec('powershell -Command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Keyboard {[DllImport(\\"user32.dll\\")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo); public const int KEYEVENTF_KEYUP = 0x0002; public const int VK_LWIN = 0x5B; public const int VK_TAB = 0x09;}\'; [Keyboard]::keybd_event([Keyboard]::VK_LWIN, 0, 0, 0); [Keyboard]::keybd_event([Keyboard]::VK_TAB, 0, 0, 0); Start-Sleep -Milliseconds 50; [Keyboard]::keybd_event([Keyboard]::VK_TAB, 0, [Keyboard]::KEYEVENTF_KEYUP, 0); [Keyboard]::keybd_event([Keyboard]::VK_LWIN, 0, [Keyboard]::KEYEVENTF_KEYUP, 0)"');
  }
}

function closeFrontWindow(): void {
  if (process.platform === 'win32') {
    const windowHistoryModule = require('./window-history');
    windowHistoryModule.closeLastActiveWindow().then(result => {
      console.log('[System] Close window result:', result);
    }).catch(error => {
      console.error('[System] Error closing window:', error);
      const vbscript = 'Set objShell = CreateObject("WScript.Shell"): objShell.SendKeys "%{F4}"';
      const tempFile = require('path').join(require('os').tmpdir(), 'close_window.vbs');
      require('fs').writeFileSync(tempFile, vbscript);
      exec(`wscript "${tempFile}"`);
    });
  }
}

function saveEditedImage(filePath: string, base64Data: string): void {
  if (filePath && base64Data) {
    const base64Image = base64Data.split(';base64,').pop();
    if (base64Image) {
      fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });
    }

    const image = nativeImage.createFromPath(filePath);
    clipboard.writeImage(image);
  }
}

function isProcessRunning(processName: string): boolean {
  if (process.platform !== 'win32') return false;
  try {
    const nameWithoutExe = processName.toLowerCase().endsWith('.exe')
      ? processName.slice(0, -4)
      : processName;

    const command = `powershell -Command "if (Get-Process -Name '${nameWithoutExe}' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"`;
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

export {
  getIsAdmin,
  resolveWindowsEnv,
  getVolume,
  setVolume,
  executeCommand,
  showDesktop,
  taskView,
  closeFrontWindow,
  openFile,
  openFolder,
  openWithNotepad,
  copyImageToClipboard,
  saveEditedImage,
  isProcessRunning
};
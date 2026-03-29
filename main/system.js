/**
 * 系统功能模块
 * 提供系统级功能，如音量控制、显示桌面、任务视图等
 */
const { exec, execSync } = require('child_process');
const fs = require('fs');
const { shell, nativeImage, clipboard } = require('electron');
const { getSystemVolume, setSystemVolume } = require('../main-utils');

/**
 * 将图片文件复制到剪贴板
 * @param {string} filePath - 图片文件路径
 */
function copyImageToClipboard(filePath) {
  if (filePath) {
    const image = nativeImage.createFromPath(filePath);
    clipboard.writeImage(image);
  }
}

/**
 * 在系统中打开指定路径的文件
 * @param {string} filePath - 文件路径
 */
function openFile(filePath) {
  if (filePath) {
    shell.openPath(filePath);
  }
}

/**
 * 在资源管理器中显示指定文件
 * @param {string} filePath - 文件路径
 */
function openFolder(filePath) {
  if (filePath) {
    shell.showItemInFolder(filePath);
  }
}

/**
 * 用记事本打开指定文件
 * @param {string} filePath - 文件路径
 */
function openWithNotepad(filePath) {
  if (!filePath) return;

  const path = require('path');
  const { getDataDir } = require('./config');

  // 处理相对路径，相对于数据目录
  let targetPath = filePath;
  if (!path.isAbsolute(filePath) && !filePath.includes('%')) {
    targetPath = path.join(getDataDir(), filePath);
  }

  const resolvedPath = require('./system').resolveWindowsEnv
    ? require('./system').resolveWindowsEnv(targetPath)
    : targetPath;

  // 使用 notepad.exe 打开文件
  exec(`notepad.exe "${resolvedPath}"`, (error) => {
    if (error) {
      console.error('[System] 用记事本打开文件失败:', error);
    }
  });
}

/**
 * 检查是否以管理员身份运行
 * @returns {boolean} 是否具有管理员权限
 */
function getIsAdmin() {
  try {
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 解析 Windows 环境变量
 * @param {string} pathStr - 包含环境变量的路径
 * @returns {string} 解析后的路径
 */
function resolveWindowsEnv(pathStr) {
  if (!pathStr) return '';
  return pathStr.replace(/%([^%]+)%/g, (_, n) => process.env[n] || '');
}

/**
 * 获取系统音量
 * @returns {number} 音量值 0-100
 */
function getVolume() {
  return getSystemVolume();
}

/**
 * 设置系统音量
 * @param {number} val - 音量值 0-100
 */
function setVolume(val) {
  console.log('[Main] Received set-volume request:', val);
  setSystemVolume(val);
}

/**
 * 执行系统命令
 * @param {string} command - 要执行的命令
 */
function executeCommand(command) {
  exec(command, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
    }
  });
}

/**
 * 显示桌面（模拟 Win+D）
 * 只在 Windows 平台有效
 */
function showDesktop() {
  if (process.platform === 'win32') {
    exec('powershell -Command "(New-Object -ComObject Shell.Application).ToggleDesktop()"');
  }
}

/**
 * 打开任务视图（模拟 Win+Tab）
 * 只在 Windows 平台有效
 */
function taskView() {
  if (process.platform === 'win32') {
    exec('powershell -Command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Keyboard {[DllImport(\\"user32.dll\\")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo); public const int KEYEVENTF_KEYUP = 0x0002; public const int VK_LWIN = 0x5B; public const int VK_TAB = 0x09;}\'; [Keyboard]::keybd_event([Keyboard]::VK_LWIN, 0, 0, 0); [Keyboard]::keybd_event([Keyboard]::VK_TAB, 0, 0, 0); Start-Sleep -Milliseconds 50; [Keyboard]::keybd_event([Keyboard]::VK_TAB, 0, [Keyboard]::KEYEVENTF_KEYUP, 0); [Keyboard]::keybd_event([Keyboard]::VK_LWIN, 0, [Keyboard]::KEYEVENTF_KEYUP, 0)"');
  }
}

/**
 * 关闭前台窗口
 * 优先关闭历史记录中非黑名单的最近激活窗口
 * 只在 Windows 平台有效
 */
function closeFrontWindow() {
  if (process.platform === 'win32') {
    const windowHistoryModule = require('./window-history');
    windowHistoryModule.closeLastActiveWindow().then(result => {
      console.log('[System] Close window result:', result);
      // if (!result.success) {
      //   console.log('[System] Falling back to Alt+F4 method');
      //   const vbscript = 'Set objShell = CreateObject("WScript.Shell"): objShell.SendKeys "%{F4}"';
      //   const tempFile = require('path').join(require('os').tmpdir(), 'close_window.vbs');
      //   require('fs').writeFileSync(tempFile, vbscript);
      //   exec(`wscript "${tempFile}"`);
      // }
    }).catch(error => {
      console.error('[System] Error closing window:', error);
      const vbscript = 'Set objShell = CreateObject("WScript.Shell"): objShell.SendKeys "%{F4}"';
      const tempFile = require('path').join(require('os').tmpdir(), 'close_window.vbs');
      require('fs').writeFileSync(tempFile, vbscript);
      exec(`wscript "${tempFile}"`);
    });
  }
}

/**
 * 保存编辑后的图片并更新剪贴板
 * @param {string} filePath - 文件路径
 * @param {string} base64Data - 图片的 base64 数据
 */
function saveEditedImage(filePath, base64Data) {
  if (filePath && base64Data) {
    const base64Image = base64Data.split(';base64,').pop();
    fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });
    
    // 同时更新剪贴板
    const image = nativeImage.createFromPath(filePath);
    clipboard.writeImage(image);
  }
}

/**
 * 检查指定进程是否正在运行
 * @param {string} processName 进程镜像名 (例如 "InkCanvasForClass.exe")
 * @returns {boolean} 是否正在运行
 */
function isProcessRunning(processName) {
  if (process.platform !== 'win32') return false;
  try {
    // 移除 .exe 后缀进行比较，因为 Get-Process 返回的 ProcessName 通常不带后缀
    const nameWithoutExe = processName.toLowerCase().endsWith('.exe') 
      ? processName.slice(0, -4) 
      : processName;
    
    // 使用 PowerShell 检查进程，这样比解析 tasklist 文本更可靠
    const command = `powershell -Command "if (Get-Process -Name '${nameWithoutExe}' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"`;
    execSync(command, { stdio: 'ignore' });
    return true; // exit 0 表示找到进程
  } catch (e) {
    return false; // exit 1 表示未找到
  }
}

module.exports = {
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

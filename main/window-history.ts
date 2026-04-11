import { exec } from 'child_process';
import windowMonitor from './window-monitor';

const WINDOW_HISTORY_MAX_LENGTH = 50;

interface WindowInfo {
  hwnd: string;
  title: string;
  processName: string;
}

let windowHistory: WindowInfo[] = [];
let isMonitoring = false;
let lastForegroundWindow: string | null = null;
let lastLogTime = 0;
const LOG_INTERVAL = 5000;

const DEFAULT_BLACKLIST = [
  '侧边栏工具',
  'InkCanvasforClass',
];

let blacklist = [...DEFAULT_BLACKLIST];

function parseWindowInfo(output: string): WindowInfo | null {
  if (!output || typeof output !== 'string') return null;
  const parts = output.trim().split('|');
  if (parts.length < 3) return null;
  return {
    hwnd: parts[0].trim(),
    title: parts[1].trim(),
    processName: parts[2].trim().toLowerCase()
  };
}

function isWindowValid(windowInfo: WindowInfo | null): boolean {
  if (!windowInfo) return false;
  if (!windowInfo.hwnd || windowInfo.hwnd === '0') return false;
  if (!windowInfo.title || windowInfo.title.trim() === '') return false;
  const procLower = windowInfo.processName.toLowerCase();
  const titleLower = windowInfo.title.toLowerCase();
  return !blacklist.some(name => {
    const nameLower = name.toLowerCase();
    return procLower.includes(nameLower) || titleLower.includes(nameLower);
  });
}

function getCurrentForegroundWindow(silent = false): Promise<WindowInfo | null> {
  return new Promise((resolve) => {
    const rawPowershellScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class UserWindows {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
    [DllImport("user32.dll")]
    public static extern int GetWindowTextLength(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
'@
Add-Type -TypeDefinition $code -Language CSharp

$hwnd = [UserWindows]::GetForegroundWindow()
if ($hwnd -ne 0) {
    $len = [UserWindows]::GetWindowTextLength($hwnd)
    $sb = New-Object System.Text.StringBuilder ($len + 1)
    [UserWindows]::GetWindowText($hwnd, $sb, $sb.Capacity) | Out-Null
    $title = $sb.ToString()

    $pidOut = 0
    [UserWindows]::GetWindowThreadProcessId($hwnd, [ref]$pidOut) | Out-Null

    $procName = ""
    try {
        $p = Get-Process -Id $pidOut -ErrorAction SilentlyContinue
        if ($p) { $procName = $p.ProcessName }
    } catch {}

    Write-Host "$hwnd|$title|$procName"
}
`;

    const encodedCommand = Buffer.from(rawPowershellScript, 'utf16le').toString('base64');
    const command = `powershell -EncodedCommand ${encodedCommand}`;
    exec(command, { encoding: 'utf8' }, (error, stdout) => {
      if (error) {
        console.error('[Window History] 获取前台窗口失败:', error);
        resolve(null);
        return;
      }
      const windowInfo = parseWindowInfo(stdout);
      resolve(windowInfo);
    });
  });
}

function closeWindowByHwnd(hwnd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WindowUtils {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool IsWindow(IntPtr hWnd);
    public const uint WM_CLOSE = 0x0010;
}
"@
try {
    $hWnd = [IntPtr]::new(${hwnd})
    if ([WindowUtils]::IsWindow($hWnd)) {
        $result = [WindowUtils]::PostMessage($hWnd, [WindowUtils]::WM_CLOSE, [IntPtr]::Zero, [IntPtr]::Zero)
        Write-Host "RESULT:$result"
    } else {
        Write-Host "INVALID_WINDOW"
    }
} catch {
    Write-Host "ERROR:$($_.Exception.Message)"
}
`;
    const encodedCommand = Buffer.from(script, 'utf16le').toString('base64');
    exec(`powershell -EncodedCommand ${encodedCommand}`, { encoding: 'utf8' }, (error, stdout) => {
      if (error) {
        console.log('[Window History] 关闭窗口执行错误:', error.message);
      }
      const output = stdout.trim();
      if (output.startsWith('RESULT:')) {
        resolve(output === 'RESULT:True');
      } else {
        resolve(false);
      }
    });
  });
}

function updateHistory(windowInfo: WindowInfo): void {
  const existingIndex = windowHistory.findIndex(w => w.hwnd === windowInfo.hwnd);
  if (existingIndex !== -1) {
    windowHistory.splice(existingIndex, 1);
  }
  windowHistory.unshift(windowInfo);
  if (windowHistory.length > WINDOW_HISTORY_MAX_LENGTH) {
    windowHistory.pop();
  }
  lastForegroundWindow = windowInfo.hwnd;
}

function startMonitoring(): void {
  if (isMonitoring) return;
  isMonitoring = true;
  console.log('[Window History] 开始监控窗口活动 (通过事件监听)');

  getCurrentForegroundWindow(true).then(windowInfo => {
    if (windowInfo && isWindowValid(windowInfo)) {
      updateHistory(windowInfo);
    }
  });

  windowMonitor.on('window-event', (event: { type: number; hwnd: string; title: string; processName?: string }) => {
    if (event.type === 0x0003) {
      const info: WindowInfo = {
        hwnd: event.hwnd,
        title: event.title,
        processName: event.processName || 'Unknown'
      };

      const now = Date.now();
      const silent = now - lastLogTime < LOG_INTERVAL;

      if (isWindowValid(info)) {
        if (!silent) {
          console.log('[Window History] 检测到前台窗口切换:', info.title, '(', info.processName, ')');
          lastLogTime = now;
        }
        updateHistory(info);
      }
    }
  });
}

function stopMonitoring(): void {
  isMonitoring = false;
  console.log('[Window History] 停止监控窗口活动');
}

function getWindowHistory(): WindowInfo[] {
  return [...windowHistory];
}

function clearHistory(): void {
  windowHistory = [];
  lastForegroundWindow = null;
  console.log('[Window History] 清空窗口历史记录');
}

function addToBlacklist(processNames: string[]): void {
  if (Array.isArray(processNames)) {
    blacklist.push(...processNames);
  }
}

function removeFromBlacklist(processNames: string[]): void {
  if (Array.isArray(processNames)) {
    blacklist = blacklist.filter(name => !processNames.includes(name));
  }
}

function setBlacklist(names: string[]): void {
  blacklist = [...DEFAULT_BLACKLIST, ...names];
}

async function closeLastActiveWindow(): Promise<{ success: boolean; message?: string; window?: WindowInfo }> {
  if (windowHistory.length === 0) return { success: false, message: '窗口历史记录为空' };
  const windowInfo = windowHistory[0];
  if (isWindowValid(windowInfo)) {
    const closed = await closeWindowByHwnd(windowInfo.hwnd);
    if (closed) {
      windowHistory = windowHistory.filter(w => w.hwnd !== windowInfo.hwnd);
      return { success: true, window: windowInfo };
    }
  }
  return { success: false, message: '最近的窗口无效或无法关闭' };
}

async function closeCurrentWindow(): Promise<{ success: boolean; message?: string; window?: WindowInfo }> {
  const windowInfo = await getCurrentForegroundWindow();
  if (!windowInfo || !isWindowValid(windowInfo)) {
    return { success: false, message: '当前窗口无效或在黑名单中' };
  }
  const closed = await closeWindowByHwnd(windowInfo.hwnd);
  if (closed) {
    windowHistory = windowHistory.filter(w => w.hwnd !== windowInfo.hwnd);
    return { success: true, window: windowInfo };
  }
  return { success: false, message: '关闭窗口失败' };
}

function findWindowsByTitleKeywords(keywords: string[], exactMatch = false): Promise<string[]> {
  return new Promise((resolve) => {
    const keywordsJson = JSON.stringify(keywords);
    const script = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$code = @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public class WindowFinder {
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public static List<string> FindMatchingWindows(string[] keywords, uint ownPid, bool exact) {
        List<string> results = new List<string>();
        EnumWindows((hWnd, lParam) => {
            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            if (pid == ownPid) return true;

            StringBuilder sb = new StringBuilder(256);
            GetWindowText(hWnd, sb, 256);
            string title = sb.ToString();

            if (!string.IsNullOrEmpty(title)) {
                foreach (string keyword in keywords) {
                    bool isMatch = exact ?
                        string.Equals(title, keyword, StringComparison.OrdinalIgnoreCase) :
                        title.IndexOf(keyword, StringComparison.OrdinalIgnoreCase) >= 0;

                    if (isMatch) {
                        RECT rect;
                        int width = 0;
                        int height = 0;
                        if (GetWindowRect(hWnd, out rect)) {
                            width = rect.Right - rect.Left;
                            height = rect.Bottom - rect.Top;
                        }
                        results.Add(hWnd.ToString() + ":" + pid.ToString() + ":" + width.ToString() + ":" + height.ToString());
                        break;
                    }
                }
            }
            return true;
        }, IntPtr.Zero);
        return results;
    }
}
'@
Add-Type -TypeDefinition $code -Language CSharp
$keywords = '${keywordsJson}' | ConvertFrom-Json
$ownPid = ${process.pid}
$exact = ${exactMatch ? '$true' : '$false'}
$res = [WindowFinder]::FindMatchingWindows($keywords, $ownPid, $exact)
if ($res) {
    $joined = $res -join ","
    Write-Host "RESULT:$joined"
}
`;
    const encodedCommand = Buffer.from(script, 'utf16le').toString('base64');
    exec(`powershell -EncodedCommand ${encodedCommand}`, { encoding: 'utf8' }, (error, stdout) => {
      if (error) { resolve([]); return; }
      const lines = stdout.trim().split(/\r?\n/);
      let foundItems: string[] = [];
      lines.forEach(line => {
        if (line.startsWith('RESULT:')) {
          foundItems = line.substring(7).split(',');
        }
      });
      resolve(foundItems);
    });
  });
}

function killProcessByPid(pid: number): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`taskkill /F /PID ${pid}`, (error) => {
      resolve(!error);
    });
  });
}

function findProcessesByImageNames(imageNames: string[]): Promise<number[]> {
  return new Promise((resolve) => {
    const namesJson = JSON.stringify(imageNames);
    const script = `
$names = '${namesJson}' | ConvertFrom-Json
$procs = Get-Process | Where-Object { $names -contains $_.ProcessName -or $names -contains ($_.ProcessName + ".exe") }
if ($procs) {
    $pids = $procs | Select-Object -ExpandProperty Id
    $joined = $pids -join ","
    Write-Host "RESULT:$joined"
}
`;
    const encodedCommand = Buffer.from(script, 'utf16le').toString('base64');
    exec(`powershell -EncodedCommand ${encodedCommand}`, { encoding: 'utf8' }, (error, stdout) => {
      if (error) { resolve([]); return; }
      const lines = stdout.trim().split(/\r?\n/);
      let foundPids: number[] = [];
      lines.forEach(line => {
        if (line.startsWith('RESULT:')) {
          foundPids = line.substring(7).split(',').map(pid => parseInt(pid.trim()));
        }
      });
      resolve(foundPids);
    });
  });
}

function getIsMonitoring(): boolean {
  return isMonitoring;
}

export {
  startMonitoring,
  stopMonitoring,
  getWindowHistory,
  clearHistory,
  addToBlacklist,
  removeFromBlacklist,
  setBlacklist,
  closeLastActiveWindow,
  closeCurrentWindow,
  getCurrentForegroundWindow,
  closeWindowByHwnd,
  findWindowsByTitleKeywords,
  findProcessesByImageNames,
  killProcessByPid,
  getIsMonitoring
};
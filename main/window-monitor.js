/**
 * 窗口监控模块
 * 使用持久化的 PowerShell 进程监听系统窗口事件
 */
const { spawn } = require('child_process');
const EventEmitter = require('events');

class WindowMonitor extends EventEmitter {
    constructor() {
        super();
        this.psProcess = null;
        this.isStarted = false;
    }

    start() {
        if (this.isStarted) return;
        this.isStarted = true;

        const script = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
    Add-Type -AssemblyName System.Windows.Forms
    $code = @"
    using System;
    using System.Runtime.InteropServices;
    using System.Text;

    public class WindowMonitor {
        public delegate void WinEventDelegate(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime);

        [DllImport("user32.dll")]
        public static extern IntPtr SetWinEventHook(uint eventMin, uint eventMax, IntPtr hmodWinEventProc, WinEventDelegate lpfnWinEventProc, uint idProcess, uint idThread, uint dwFlags);

        [DllImport("user32.dll")]
        public static extern bool UnhookWinEvent(IntPtr hWinEventHook);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

        [DllImport("user32.dll")]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("kernel32.dll")]
        public static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, uint dwProcessId);

        [DllImport("psapi.dll", CharSet = CharSet.Unicode)]
        public static extern uint GetModuleBaseName(IntPtr hProcess, IntPtr hModule, StringBuilder lpBaseName, uint nSize);

        [DllImport("kernel32.dll")]
        public static extern bool CloseHandle(IntPtr hObject);

        [DllImport("user32.dll")]
        public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        [StructLayout(LayoutKind.Sequential)]
        public struct RECT {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        private const uint PROCESS_QUERY_INFORMATION = 0x0400;
        private const uint PROCESS_VM_READ = 0x0010;

        private const uint EVENT_OBJECT_CREATE = 0x8000;
        private const uint EVENT_OBJECT_SHOW = 0x8002;
        private const uint EVENT_SYSTEM_FOREGROUND = 0x0003;
        private const uint WINEVENT_OUTOFCONTEXT = 0;
        private const uint WINEVENT_SKIPOWNPROCESS = 2;

        private static WinEventDelegate _delegate;
        private static IntPtr _hook1;
        private static IntPtr _hook2;

        public static void Start() {
            _delegate = new WinEventDelegate(WinEventProc);
            _hook1 = SetWinEventHook(EVENT_OBJECT_CREATE, EVENT_OBJECT_SHOW, IntPtr.Zero, _delegate, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS);
            _hook2 = SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, IntPtr.Zero, _delegate, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS);
        }

        public static void Stop() {
            if (_hook1 != IntPtr.Zero) UnhookWinEvent(_hook1);
            if (_hook2 != IntPtr.Zero) UnhookWinEvent(_hook2);
        }

        private static void WinEventProc(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime) {
            if (idObject != 0) return;
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hwnd, sb, 512);
            string title = sb.ToString();
            
            uint pid;
            GetWindowThreadProcessId(hwnd, out pid);
            
            string processName = "Unknown";
            IntPtr hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, pid);
            if (hProcess != IntPtr.Zero) {
                StringBuilder nameBuilder = new StringBuilder(260);
                if (GetModuleBaseName(hProcess, IntPtr.Zero, nameBuilder, (uint)nameBuilder.Capacity) > 0) {
                    processName = nameBuilder.ToString();
                }
                CloseHandle(hProcess);
            }

            RECT rect;
            int width = 0;
            int height = 0;
            if (GetWindowRect(hwnd, out rect)) {
                width = rect.Right - rect.Left;
                height = rect.Bottom - rect.Top;
            }
            
            Console.WriteLine("EVENT|" + eventType + "|" + hwnd + "|" + pid + "|" + processName + "|" + width + "|" + height + "|" + title);
        }
    }
"@
    Add-Type -TypeDefinition $code -Language CSharp
    [WindowMonitor]::Start()
    Write-Host "PS_READY"

    # 简单的消息循环
    while($true) {
        [System.Windows.Forms.Application]::DoEvents()
        Start-Sleep -Milliseconds 100
    }
} catch {
    Write-Host "PS_ERROR|$($_.Exception.Message)"
} finally {
    try { [WindowMonitor]::Stop() } catch {}
}
`;

        const encodedCommand = Buffer.from(script, 'utf16le').toString('base64');
        this.psProcess = spawn('powershell', [
            '-NoProfile', 
            '-ExecutionPolicy', 'Bypass',
            '-EncodedCommand', encodedCommand
        ], {
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' } // 某些环境下对编码有帮助
        });

        this.psProcess.stdout.setEncoding('utf8');
        this.psProcess.stdout.on('data', (data) => {
            const lines = data.toString().split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('EVENT|')) {
                    const [, type, hwnd, pid, processName, width, height, ...titleParts] = trimmed.split('|');
                    const title = titleParts.join('|');
                    const eventData = {
                        type: parseInt(type),
                        hwnd,
                        pid: parseInt(pid),
                        processName,
                        width: parseInt(width),
                        height: parseInt(height),
                        title
                    };
                    // console.log(`[Window Monitor] Received event: type=${type}, title="${title}", pid=${pid}, processName=${processName}, hwnd=${hwnd}, size=${width}x${height}`);
                    this.emit('window-event', eventData);
                } else if (trimmed === 'PS_READY') {
                    console.log('[Window Monitor] PowerShell listener is ready.');
                } else if (trimmed.startsWith('PS_ERROR|')) {
                    console.error(`[Window Monitor] PowerShell Error: ${trimmed.substring(9)}`);
                } else {
                    console.log(`[Window Monitor] PS: ${trimmed}`);
                }
            }
        });

        this.psProcess.stderr.on('data', (data) => {
            let errStr = data.toString();
            // 过滤掉 CLIXML 噪音，尝试提取有用信息
            if (errStr.includes('#< CLIXML')) {
                // 如果是 XML 格式，提取其中的文本内容（简单粗暴过滤标签）
                errStr = errStr.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
            }
            if (errStr) {
                console.error(`[Window Monitor] PS Error: ${errStr}`);
            }
        });

        this.psProcess.on('exit', (code) => {
            console.log(`[Window Monitor] PS process exited with code ${code}`);
            this.isStarted = false;
            if (code !== 0) {
                // 异常退出则尝试重启
                setTimeout(() => this.start(), 5000);
            }
        });
    }

    stop() {
        if (this.psProcess) {
            this.psProcess.kill();
            this.psProcess = null;
        }
        this.isStarted = false;
    }
}

// 事件常量
WindowMonitor.EVENTS = {
    SYSTEM_FOREGROUND: 0x0003,
    OBJECT_CREATE: 0x8000,
    OBJECT_SHOW: 0x8002
};

module.exports = new WindowMonitor();

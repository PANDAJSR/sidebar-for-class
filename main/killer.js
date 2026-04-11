/**
 * 窗口杀手模块
 * 负责定期检查并关闭特定的同类软件窗口
 */
const { app } = require('electron');
const { getConfigSync } = require('./config');
const { findWindowsByTitleKeywords, closeWindowByHwnd, killProcessByPid, findProcessesByImageNames } = require('./window-history');
const windowMonitor = require('./window-monitor');

// 需要强行结束进程 (taskkill) 的窗口标题列表 (精确匹配)
const FORCE_KILL_TITLES = [
    'EasiSideBar',
];

// 需要普通关闭窗口 (WM_CLOSE) 的窗口标题列表 (精确匹配)
const NORMAL_CLOSE_TITLES = [
    
];

// 计时器软件进程镜像名列表
const TIMER_PROCESS_NAMES = [
    'DesktopTimer.exe',
    'HiteClock.exe', // 鸿合白板软件
    'GCTimer.exe' // 鸿合白板
];

// 计时器软件窗口标题列表 (精确匹配)
const TIMER_WINDOW_TITLES = [
    '计时器',
    '计时'
];

let checkTimeout = null;
let isPerformingKill = false;
let cachedConfig = null;
let cachedConfigAt = 0;
const CONFIG_CACHE_TTL_MS = 1000;

function getCurrentConfig(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedConfig && (now - cachedConfigAt) < CONFIG_CACHE_TTL_MS) {
        return cachedConfig;
    }

    cachedConfig = getConfigSync();
    cachedConfigAt = now;
    return cachedConfig;
}

/**
 * 获取我们应用所有进程的 PID 集合
 */
function getOurPids() {
    const metrics = app.getAppMetrics();
    return new Set(metrics.map(m => m.pid));
}

/**
 * 处理单个窗口事件
 */
async function handleWindowEvent(event) {
    const config = getCurrentConfig();
    const { title, hwnd, pid, width, height, type } = event;
    
    // 忽略标题为空的窗口
    if (!title || title.trim() === '') return;

    // 忽略我们自己应用的所有进程 (包括主进程和所有渲染进程)
    const ourPids = getOurPids();
    if (ourPids.has(pid)) return;

    const titleLower = title.toLowerCase();

    // 1. 处理通用同类软件查杀
    if (config.helper_tools?.auto_kill_similar) {
        // 1.1 强制结束列表
        const forceMatch = FORCE_KILL_TITLES.find(t => titleLower === t.toLowerCase() || titleLower.includes(t.toLowerCase()));
        if (forceMatch) {
            console.log(`[Killer] [Event] Match found in FORCE_KILL: "${title}" (PID: ${pid}). Executing taskkill...`);
            await killProcessByPid(pid);
        }
        
        // 1.2 普通关闭列表
        const normalMatch = NORMAL_CLOSE_TITLES.find(t => titleLower === t.toLowerCase() || titleLower.includes(t.toLowerCase()));
        if (normalMatch) {
            console.log(`[Killer] [Event] Match found in NORMAL_CLOSE: "${title}" (HWND: ${hwnd}). Sending WM_CLOSE...`);
            await closeWindowByHwnd(hwnd);
        }
    }

    // 2. 处理计时器软件查杀
    if (config.helper_tools?.auto_kill_timer) {
        let isTimerMatch = false;
        
        // 2.1 普通标题匹配
        if (TIMER_WINDOW_TITLES.find(t => titleLower === t.toLowerCase() || titleLower.includes(t.toLowerCase()))) {
            isTimerMatch = true;
        } 
        // 2.2 严格特殊判断规则 (班级优化大师计时器)
        else if (title === '班级优化大师-抓住孩子的每一课闪光点' && width === 576 && height === 395) {
            isTimerMatch = true;
            console.log(`[Killer] [Event] Special strict match: Class Master timer detected (${width}x${height}).`);
        }

        if (isTimerMatch) {
            console.log(`[Killer] [Event] Match found in TIMER_KILL: "${title}" (HWND: ${hwnd}). Sending WM_CLOSE and opening our timer simultaneously.`);
            
            // 1. 立即尝试关闭窗口 (不使用 taskkill，并行执行)
            closeWindowByHwnd(hwnd).catch(err => console.error('[Killer] Failed to close timer window:', err));

            // 2. 立即打开我们的计时器
            const { createTimerWindow } = require('./window');
            createTimerWindow();
        }
    }
}

// 注册窗口事件监听
windowMonitor.on('window-event', (event) => {
    // 仅处理创建和显示事件
    if (event.type === windowMonitor.constructor.EVENTS.OBJECT_CREATE || 
        event.type === windowMonitor.constructor.EVENTS.OBJECT_SHOW) {
        handleWindowEvent(event).catch(err => console.error('[Killer] Event handler error:', err));
    }
});

/**
 * 执行查杀逻辑 (轮询/初始化用)
 */
async function performKill() {
    if (isPerformingKill) return;
    isPerformingKill = true;

    try {
        const config = getCurrentConfig(true);
        
        // 1. 处理通用同类软件查杀
        if (config.helper_tools?.auto_kill_similar) {
            // 1.1 处理强制结束列表
            if (FORCE_KILL_TITLES.length > 0) {
                const forceItems = await findWindowsByTitleKeywords(FORCE_KILL_TITLES, true);
                if (forceItems.length > 0) {
                    const killedPids = new Set();
                    for (const item of forceItems) {
                        const [hwnd, pid] = item.split(':');
                        if (pid && !killedPids.has(pid)) {
                            console.log(`[Killer] Force killing process ${pid} because of exact window title match.`);
                            await killProcessByPid(pid);
                            killedPids.add(pid);
                        }
                    }
                }
            }

            // 1.2 处理普通关闭列表
            if (NORMAL_CLOSE_TITLES.length > 0) {
                const normalItems = await findWindowsByTitleKeywords(NORMAL_CLOSE_TITLES, true);
                for (const item of normalItems) {
                    const [hwnd, pid] = item.split(':');
                    console.log(`[Killer] Sending WM_CLOSE to window HWND: ${hwnd} (Title match).`);
                    await closeWindowByHwnd(hwnd);
                }
            }
        }

        // 2. 处理计时器软件查杀
        if (config.helper_tools?.auto_kill_timer) {
            let killedAny = false;

            // 2.1 通过进程名查杀 (强制结束)
            const timerPids = await findProcessesByImageNames(TIMER_PROCESS_NAMES);
            if (timerPids.length > 0) {
                console.log(`[Killer] Found similar timer processes by name: ${timerPids.join(', ')}`);
                for (const pid of timerPids) {
                    const success = await killProcessByPid(pid);
                    if (success) killedAny = true;
                }
            }

            // 2.2 通过窗口标题查杀 (普通关闭)
            if (TIMER_WINDOW_TITLES.length > 0) {
                const timerItems = await findWindowsByTitleKeywords(TIMER_WINDOW_TITLES, true);
                if (timerItems.length > 0) {
                    for (const item of timerItems) {
                        const [hwnd, pid] = item.split(':');
                        console.log(`[Killer] Sending WM_CLOSE to timer window HWND: ${hwnd} because of exact window title match.`);
                        const success = await closeWindowByHwnd(hwnd);
                        if (success) killedAny = true;
                    }
                }
            }

            // 2.3 严格特殊判断规则 (班级优化大师计时器)
            const specialItems = await findWindowsByTitleKeywords(['班级优化大师-抓住孩子的每一课闪光点'], true);
            for (const item of specialItems) {
                const [hwnd, pid, width, height] = item.split(':');
                if (parseInt(width) === 576 && parseInt(height) === 395) {
                    console.log(`[Killer] Special match found in performKill: "班级优化大师" (HWND: ${hwnd}) with size ${width}x${height}`);
                    const success = await closeWindowByHwnd(hwnd);
                    if (success) killedAny = true;
                }
            }
            
            if (killedAny) {
                console.log('[Killer] Found similar timer, opening our timer.');
                const { createTimerWindow } = require('./window');
                createTimerWindow();
            }
        }

    } catch (err) {
        console.error('[Killer] Error during performKill:', err);
    } finally {
        isPerformingKill = false;
    }
}

/**
 * 启动自动查杀
 * @param {number} intervalMs 检查间隔 (由于有了事件监听，轮询可以放慢)
 */
function startKiller(intervalMs = 2000) {
    if (process.platform !== 'win32') return;
    
    // 启动窗口事件监听
    windowMonitor.start();
    
    if (checkTimeout) {
        clearTimeout(checkTimeout);
    }
    
    console.log(`[Killer] Auto-kill service started. Polling interval: ${intervalMs}ms, Event monitoring enabled.`);
    
    const scheduleNext = () => {
        checkTimeout = setTimeout(async () => {
            await performKill();
            scheduleNext();
        }, intervalMs);
    };
    
    scheduleNext();
}

/**
 * 停止自动查杀
 */
function stopKiller() {
    windowMonitor.stop();
    if (checkTimeout) {
        clearTimeout(checkTimeout);
        checkTimeout = null;
        console.log('[Killer] Auto-kill service stopped.');
    }
}

module.exports = {
    startKiller,
    stopKiller
};

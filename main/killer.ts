import { app } from 'electron';
import { getConfigSync } from './config';
import { findWindowsByTitleKeywords, closeWindowByHwnd, killProcessByPid, findProcessesByImageNames } from './window-history';
import windowMonitor from './window-monitor';

const FORCE_KILL_TITLES = [
    'EasiSideBar',
];

const NORMAL_CLOSE_TITLES: string[] = [];

const TIMER_PROCESS_NAMES = [
    'DesktopTimer.exe',
    'HiteClock.exe',
    'GCTimer.exe'
];

const TIMER_WINDOW_TITLES = [
    '计时器',
    '计时'
];

let checkTimeout: NodeJS.Timeout | null = null;
let isPerformingKill = false;
let cachedConfig: ReturnType<typeof getConfigSync> | null = null;
let cachedConfigAt = 0;
const CONFIG_CACHE_TTL_MS = 1000;

function getCurrentConfig(forceRefresh = false): ReturnType<typeof getConfigSync> | null {
    const now = Date.now();
    if (!forceRefresh && cachedConfig && (now - cachedConfigAt) < CONFIG_CACHE_TTL_MS) {
        return cachedConfig;
    }

    cachedConfig = getConfigSync();
    cachedConfigAt = now;
    return cachedConfig;
}

function getOurPids(): Set<number> {
    const metrics = app.getAppMetrics();
    return new Set(metrics.map(m => m.pid));
}

async function handleWindowEvent(event: { title: string; hwnd: string; pid: number; width: number; height: number; type: number }): Promise<void> {
    const config = getCurrentConfig();
    if (!config) return;
    const { title, hwnd, pid, width, height } = event;

    if (!title || title.trim() === '') return;

    const ourPids = getOurPids();
    if (ourPids.has(pid)) return;

    const titleLower = title.toLowerCase();

    if (config.helper_tools?.auto_kill_similar) {
        const forceMatch = FORCE_KILL_TITLES.find(t => titleLower === t.toLowerCase() || titleLower.includes(t.toLowerCase()));
        if (forceMatch) {
            console.log(`[Killer] [Event] Match found in FORCE_KILL: "${title}" (PID: ${pid}). Executing taskkill...`);
            await killProcessByPid(pid);
        }

        const normalMatch = NORMAL_CLOSE_TITLES.find(t => titleLower === t.toLowerCase() || titleLower.includes(t.toLowerCase()));
        if (normalMatch) {
            console.log(`[Killer] [Event] Match found in NORMAL_CLOSE: "${title}" (HWND: ${hwnd}). Sending WM_CLOSE...`);
            await closeWindowByHwnd(hwnd);
        }
    }

    if (config.helper_tools?.auto_kill_timer) {
        let isTimerMatch = false;

        if (TIMER_WINDOW_TITLES.find(t => titleLower === t.toLowerCase() || titleLower.includes(t.toLowerCase()))) {
            isTimerMatch = true;
        }
        else if (title === '班级优化大师-抓住孩子的每一课闪光点' && width === 576 && height === 395) {
            isTimerMatch = true;
            console.log(`[Killer] [Event] Special strict match: Class Master timer detected (${width}x${height}).`);
        }

        if (isTimerMatch) {
            console.log(`[Killer] [Event] Match found in TIMER_KILL: "${title}" (HWND: ${hwnd}). Sending WM_CLOSE and opening our timer simultaneously.`);

            closeWindowByHwnd(hwnd).catch(err => console.error('[Killer] Failed to close timer window:', err));

            const { createTimerWindow } = require('./window');
            createTimerWindow();
        }
    }
}

const EVENTS = {
    SYSTEM_FOREGROUND: 0x0003,
    OBJECT_CREATE: 0x8000,
    OBJECT_SHOW: 0x8002
};

windowMonitor.on('window-event', (event: { title: string; hwnd: string; pid: number; width: number; height: number; type: number }) => {
    if (event.type === EVENTS.OBJECT_CREATE ||
        event.type === EVENTS.OBJECT_SHOW) {
        handleWindowEvent(event).catch(err => console.error('[Killer] Event handler error:', err));
    }
});

async function performKill(): Promise<void> {
    if (isPerformingKill) return;
    isPerformingKill = true;

    try {
        const config = getCurrentConfig(true);
        if (!config) return;

        if (config.helper_tools?.auto_kill_similar) {
            if (FORCE_KILL_TITLES.length > 0) {
                const forceItems = await findWindowsByTitleKeywords(FORCE_KILL_TITLES, true);
                if (forceItems.length > 0) {
                    const killedPids = new Set<string>();
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

            if (NORMAL_CLOSE_TITLES.length > 0) {
                const normalItems = await findWindowsByTitleKeywords(NORMAL_CLOSE_TITLES, true);
                for (const item of normalItems) {
                    const [hwnd] = item.split(':');
                    console.log(`[Killer] Sending WM_CLOSE to window HWND: ${hwnd} (Title match).`);
                    await closeWindowByHwnd(hwnd);
                }
            }
        }

        if (config.helper_tools?.auto_kill_timer) {
            let killedAny = false;

            const timerPids = await findProcessesByImageNames(TIMER_PROCESS_NAMES);
            if (timerPids.length > 0) {
                console.log(`[Killer] Found similar timer processes by name: ${timerPids.join(', ')}`);
                for (const pid of timerPids) {
                    const success = await killProcessByPid(pid);
                    if (success) killedAny = true;
                }
            }

            if (TIMER_WINDOW_TITLES.length > 0) {
                const timerItems = await findWindowsByTitleKeywords(TIMER_WINDOW_TITLES, true);
                if (timerItems.length > 0) {
                    for (const item of timerItems) {
                        const [hwnd] = item.split(':');
                        console.log(`[Killer] Sending WM_CLOSE to timer window HWND: ${hwnd} because of exact window title match.`);
                        const success = await closeWindowByHwnd(hwnd);
                        if (success) killedAny = true;
                    }
                }
            }

            const specialItems = await findWindowsByTitleKeywords(['班级优化大师-抓住孩子的每一课闪光点'], true);
            for (const item of specialItems) {
                const [hwnd, , width, height] = item.split(':');
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

function startKiller(intervalMs = 2000): void {
    if (process.platform !== 'win32') return;

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

function stopKiller(): void {
    windowMonitor.stop();
    if (checkTimeout) {
        clearTimeout(checkTimeout);
        checkTimeout = null;
        console.log('[Killer] Auto-kill service stopped.');
    }
}

export {
    startKiller,
    stopKiller
};
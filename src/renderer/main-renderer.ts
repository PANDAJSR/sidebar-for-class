import { updateSidebarStyles } from './sidebar-ui';
import { createAnimationManager } from './animation';

interface State {
    isDragging: boolean;
    isSwipeActive: boolean;
    startX: number;
    currentConfig: unknown;
    animationId: number | null;
    currentVelocity: number;
    startTimeStamp: number;
    lastIgnoreState: unknown;
    lastX: number;
    lastTime: number;
    lastResizeTime: number;
    SCALE: number;
    START_H: number;
    START_W: number;
}

const wrapper = document.getElementById('sidebar-wrapper');
const sidebar = document.getElementById('sidebar');

const state: State = {
    isDragging: false,
    isSwipeActive: false,
    startX: 0,
    currentConfig: null,
    animationId: null,
    currentVelocity: 0,
    startTimeStamp: 0,
    lastIgnoreState: null,
    lastX: 0,
    lastTime: 0,
    lastResizeTime: 0,
    SCALE: 1,
    START_H: 64,
    START_W: 4,
};

const BASE_START_W = 4;
const BASE_START_H = 64;
const TARGET_W = 400;
const TARGET_H = 450;

function throttledResize(w: number, h: number, y: number): void {
    if (Date.now() - state.lastResizeTime > 16) {
        window.electronAPI.resizeWindow(w, h, y);
        state.lastResizeTime = Date.now();
    }
}

function setIgnoreMouse(ignore: boolean): void {
    if (ignore !== state.lastIgnoreState) {
        state.lastIgnoreState = ignore;
        window.electronAPI.setIgnoreMouse(ignore, true);
    }
}

const uiUpdater = (progress: number): void => {
    updateSidebarStyles(
        sidebar!,
        state.currentConfig as { transforms?: { posy?: number }; displayBounds?: { y: number; height: number } } | null,
        progress,
        state.START_W,
        TARGET_W,
        state.START_H,
        TARGET_H,
        state.SCALE,
        setIgnoreMouse,
        throttledResize
    );
};

const anim = createAnimationManager(sidebar!, wrapper!, state, uiUpdater);

async function loadConfig(): Promise<void> {
    try {
        const config = await window.electronAPI.getConfig();
        state.currentConfig = config;
        if (config.transforms) {
            state.SCALE = (config.transforms.size || 100) / 100;
            document.documentElement.style.setProperty('--sidebar-scale', String(state.SCALE));
            state.START_H = config.transforms.height || BASE_START_H;
            uiUpdater(0);
            if (config.transforms.animation_speed) {
                const speed = config.transforms.animation_speed;
                document.documentElement.style.setProperty('--sidebar-duration', `${0.5 / speed}s`);
                document.documentElement.style.setProperty('--content-duration', `${0.3 / speed}s`);
            }
        }
    } catch (err) {
        console.error('加载配置失败:', err);
    }
}

loadConfig();

window.electronAPI.onConfigUpdated((newConfig) => {
    state.currentConfig = newConfig;
    uiUpdater(document.body.classList.contains('expanded') ? 1 : 0);
});

export { anim, state, uiUpdater };
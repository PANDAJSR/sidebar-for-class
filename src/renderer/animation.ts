interface AnimationState {
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

interface AnimationManager {
    expand: (
        currentConfig: { transforms?: { animation_speed?: number } } | null,
        START_W: number,
        TARGET_W: number,
        START_H: number,
        TARGET_H: number,
        SCALE: number,
        setIgnoreMouse: (ignore: boolean) => void,
        throttledResize: (w: number, h: number, y: number) => void
    ) => number | null;
    collapse: (
        START_W: number,
        TARGET_W: number,
        START_H: number,
        SCALE: number,
        setIgnoreMouse: (ignore: boolean) => void,
        throttledResize: (w: number, h: number, y: number) => void
    ) => number | null;
    stopAnimation: () => void;
}

export function createAnimationManager(
    sidebar: HTMLElement,
    wrapper: HTMLElement,
    state: AnimationState,
    uiUpdater: (progress: number) => void
): AnimationManager {
    let animationId: number | null = null;

    const stopAnimation = (): void => {
        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    };

    const finishExpand = (): void => {
        if (document.body.classList.contains('expanded')) {
            wrapper.style.width = '';
            sidebar.style.transition = '';
        }
    };

    const finishCollapse = (SCALE: number, START_H: number, setIgnoreMouse: (ignore: boolean) => void): void => {
        if (!document.body.classList.contains('expanded')) {
            window.electronAPI.resizeWindow(20 * SCALE, (START_H + 40) * SCALE);
            setIgnoreMouse(false);
            wrapper.style.width = '';
            sidebar.style.transition = '';
            (['width', 'height', 'borderRadius', 'marginLeft', 'background', 'backgroundColor'] as const).forEach(p => {
                (sidebar.style as Record<string, string>)[p] = '';
            });
        }
    };

    const expand = (
        currentConfig: { transforms?: { animation_speed?: number } } | null,
        START_W: number,
        TARGET_W: number,
        START_H: number,
        TARGET_H: number,
        SCALE: number,
        setIgnoreMouse: (ignore: boolean) => void,
        throttledResize: (w: number, h: number, y: number) => void
    ): number | null => {
        const baseW = parseFloat(sidebar.style.width) || START_W;
        if (document.body.classList.contains('expanded') && !state.isDragging && animationId === null && Math.abs(baseW - TARGET_W) < 1) return null;

        stopAnimation();
        document.body.classList.add('expanded');
        wrapper.style.width = '100%';
        sidebar.style.transition = 'none';

        const speed = currentConfig?.transforms?.animation_speed || 1;
        const duration = 300 / speed;
        const startTime = performance.now();
        const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);
        const startProgress = Math.max(0, Math.min(1, (baseW - START_W) / (TARGET_W - START_W)));

        const animate = (currentTime: number): void => {
            if (!document.body.classList.contains('expanded')) { animationId = null; return; }
            const elapsed = currentTime - startTime;
            const t = Math.min(1, elapsed / duration);
            const p = startProgress + (1 - startProgress) * easeOutQuart(t);

            if (t >= 1) {
                uiUpdater(1);
                animationId = null;
                finishExpand();
            } else {
                uiUpdater(p);
                animationId = requestAnimationFrame(animate);
            }
        };
        animationId = requestAnimationFrame(animate);
        return animationId;
    };

    const collapse = (
        START_W: number,
        TARGET_W: number,
        START_H: number,
        SCALE: number,
        setIgnoreMouse: (ignore: boolean) => void,
        throttledResize: (w: number, h: number, y: number) => void
    ): number | null => {
        stopAnimation();
        wrapper.style.width = '100%';
        sidebar.style.transition = 'none';
        document.body.classList.remove('expanded');

        const baseW = parseFloat(sidebar.style.width) || START_W;
        const speed = 1;
        const duration = 300;
        const startTime = performance.now();
        const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);
        const startProgress = Math.max(0, Math.min(1, (baseW - START_W) / (TARGET_W - START_W)));

        const animate = (currentTime: number): void => {
            if (document.body.classList.contains('expanded')) { animationId = null; return; }
            const elapsed = currentTime - startTime;
            const t = Math.min(1, elapsed / duration);
            const p = startProgress * (1 - easeOutQuart(t));

            if (t >= 1) {
                uiUpdater(0);
                animationId = null;
                finishCollapse(SCALE, START_H, setIgnoreMouse);
            } else {
                uiUpdater(p);
                animationId = requestAnimationFrame(animate);
            }
        };
        animationId = requestAnimationFrame(animate);
        return animationId;
    };

    return { expand, collapse, stopAnimation };
}
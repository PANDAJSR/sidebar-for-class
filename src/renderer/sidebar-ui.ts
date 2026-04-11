export function updateSidebarStyles(
    sidebar: HTMLElement,
    currentConfig: { transforms?: { posy?: number }; displayBounds?: { y: number; height: number } } | null,
    progress: number,
    START_W: number,
    TARGET_W: number,
    START_H: number,
    TARGET_H: number,
    SCALE: number,
    setIgnoreMouse: (ignore: boolean) => void,
    throttledResize: (w: number, h: number, y: number) => void
): void {
    progress = Math.max(0, Math.min(1, progress));

    const baseWidth = START_W + (TARGET_W - START_W) * progress;
    const baseHeight = START_H + (TARGET_H - START_H) * progress;
    const currentRadius = 4 + (12 * progress);
    const currentMargin = 6 + (6 * progress);

    sidebar.style.width = `${baseWidth}px`;
    sidebar.style.height = `${baseHeight}px`;
    sidebar.style.borderRadius = `${currentRadius}px`;
    sidebar.style.marginLeft = `${currentMargin}px`;

    if (currentConfig?.transforms && currentConfig?.displayBounds) {
        const { posy } = currentConfig.transforms;
        const { y: screenY, height: screenH } = currentConfig.displayBounds;
        let targetWinW: number, targetWinH: number;

        if (progress <= 0) {
            targetWinW = 20 * SCALE;
            targetWinH = (START_H + 40) * SCALE;
            setIgnoreMouse(false);
        } else {
            const rect = sidebar.getBoundingClientRect();
            targetWinW = Math.floor(rect.width + 100 * SCALE);
            targetWinH = Math.ceil(rect.height + 40 * SCALE);
        }

        const startCenterY = screenY + (posy || 0);
        const expandedWinH = (TARGET_H + 120) * SCALE;
        const safeCenterY = Math.max(
            screenY + expandedWinH / 2 + 20,
            Math.min(screenY + screenH - expandedWinH / 2 - 20, startCenterY)
        );
        const currentCenterY = startCenterY + (safeCenterY - startCenterY) * progress;
        const newWindowY = currentCenterY - (targetWinH / 2);

        if (progress === 0 || progress === 1) {
            window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY);
        } else {
            throttledResize(targetWinW, targetWinH, newWindowY);
        }
    }

    const gray = Math.floor(156 + (255 - 156) * progress);
    sidebar.style.background = `rgb(${gray}, ${gray}, ${gray})`;
}
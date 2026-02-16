import { useState, useCallback, useEffect, useRef } from 'react';

const useSidebarAnimation = (config, scale, startH, panelWidth, panelHeight, sidebarRef, wrapperRef, animationIdRef, draggingState, constants) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const { BASE_START_W, TARGET_W, TARGET_H } = constants;

    const setIgnoreMouse = (ignore) => {
        if (window.electronAPI && ignore !== draggingState.current.lastIgnoreState) {
            draggingState.current.lastIgnoreState = ignore;
            window.electronAPI.setIgnoreMouse(ignore, true);
        }
    };

    const calculateLayout = useCallback((progress) => {
        if (!config?.transforms || !config?.displayBounds) return null;

        const { posy } = config.transforms;
        const { y: screenY, height: screenH } = config.displayBounds;

        const winW = Math.floor(panelWidth * scale + 100);
        const winH = Math.ceil(panelHeight * scale + 40);

        const currentSidebarH = (startH + (panelHeight - startH) * progress) * scale;
        const startCenterY = screenY + posy;
        const safeCenterY = Math.max(
            screenY + winH / 2,
            Math.min(screenY + screenH - winH / 2, startCenterY)
        );
        const windowY = safeCenterY - (winH / 2);
        let offsetY = startCenterY - safeCenterY;
        const maxOffset = Math.max(0, (winH - currentSidebarH) / 2);
        offsetY = Math.max(-maxOffset, Math.min(maxOffset, offsetY));

        return {
            targetWinW: winW,
            targetWinH: winH,
            finalWindowY: windowY,
            offsetY,
            safeCenterY,
            startCenterY
        };
    }, [config, scale, startH, panelWidth, panelHeight]);

    const setWindowToLarge = useCallback(() => {
        if (!window.electronAPI) return;
        const layout = calculateLayout(1);
        if (layout) {
            window.electronAPI.resizeWindow(layout.targetWinW, layout.targetWinH, layout.finalWindowY);
        }
    }, [calculateLayout]);

    const setWindowToSmall = useCallback(() => {
        if (!window.electronAPI) return;
        const layout = calculateLayout(0);
        if (layout) {
            window.electronAPI.resizeWindow(layout.targetWinW, layout.targetWinH, layout.finalWindowY);
        }
    }, [calculateLayout]);

    const updateSidebarStyles = useCallback((progress) => {
        if (!sidebarRef.current) return;

        progress = Math.max(0, Math.min(1, progress));

        const currentW = BASE_START_W + (panelWidth - BASE_START_W) * progress;
        const currentH = startH + (panelHeight - startH) * progress;
        const currentRadius = 4 + (12 * progress);
        const currentMargin = 6 + (6 * progress);

        sidebarRef.current.style.width = `${currentW}px`;
        sidebarRef.current.style.height = `${currentH}px`;
        sidebarRef.current.style.borderRadius = `${currentRadius}px`;
        sidebarRef.current.style.marginLeft = `${currentMargin}px`;

        const layout = calculateLayout(progress);
        if (layout) {
            sidebarRef.current.style.transform = `scale(var(--sidebar-scale)) translateY(${layout.offsetY / scale}px)`;
        }

        // 背景色由 CSS 变量控制，不在 JS 中设置
    }, [config, scale, startH, panelWidth, panelHeight, sidebarRef, BASE_START_W, TARGET_W, TARGET_H, calculateLayout]);

    const stopAnimation = () => {
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
        }
    };

    const finishExpand = () => {
        if (wrapperRef.current) wrapperRef.current.style.width = '';
        if (sidebarRef.current) sidebarRef.current.style.transition = '';
    };

    const finishCollapse = () => {
        setWindowToSmall();
        setIgnoreMouse(false);
        if (wrapperRef.current) {
            wrapperRef.current.style.width = '';
        }
        if (sidebarRef.current) {
            sidebarRef.current.style.transition = '';
            ['width', 'height', 'borderRadius', 'marginLeft', 'background', 'backgroundColor', 'transform'].forEach(p => sidebarRef.current.style[p] = '');
            updateSidebarStyles(0);
        }
    };

    const expand = () => {
        const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
        if (isExpanded && !draggingState.current.isDragging && !animationIdRef.current && Math.abs(baseW - panelWidth) < 1) return;

        stopAnimation();
        setIsExpanded(true);
        if (wrapperRef.current) wrapperRef.current.style.width = '100%';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';

        setWindowToLarge();

        const speed = config?.transforms?.animation_speed || 1;
        const duration = 300 / speed;
        const startTime = performance.now();
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        const startProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (panelWidth - BASE_START_W)));

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const t = Math.min(1, elapsed / duration);
            const p = startProgress + (1 - startProgress) * easeOutQuart(t);
            if (t >= 1) {
                updateSidebarStyles(1);
                animationIdRef.current = null;
                finishExpand();
            } else {
                updateSidebarStyles(p);
                animationIdRef.current = requestAnimationFrame(animate);
            }
        };
        animationIdRef.current = requestAnimationFrame(animate);
    };

    const collapse = () => {
        stopAnimation();
        if (wrapperRef.current) wrapperRef.current.style.width = '100%';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
        setIsExpanded(false);

        const speed = config?.transforms?.animation_speed || 1;
        const duration = 300 / speed;
        const startTime = performance.now();
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
        const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
        const startProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (panelWidth - BASE_START_W)));

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const t = Math.min(1, elapsed / duration);
            const p = startProgress * (1 - easeOutQuart(t));
            if (t >= 1) {
                updateSidebarStyles(0);
                animationIdRef.current = null;
                finishCollapse();
            } else {
                updateSidebarStyles(p);
                animationIdRef.current = requestAnimationFrame(animate);
            }
        };
        animationIdRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (config) {
            updateSidebarStyles(isExpanded ? 1 : 0);
            if (!isExpanded) {
                setWindowToSmall();
            }
        }
    }, [isExpanded, scale, startH, panelWidth, panelHeight, updateSidebarStyles, config, setWindowToSmall]);

    return {
        isExpanded,
        expand,
        collapse,
        updateSidebarStyles,
        stopAnimation,
        setIgnoreMouse,
        setWindowToLarge
    };
};

export default useSidebarAnimation;

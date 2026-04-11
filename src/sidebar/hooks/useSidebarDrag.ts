import { useCallback, RefObject } from 'react';

interface TransformConfig {
    size?: number;
    height?: number;
    animation_speed?: number;
    expand_mode?: string;
    click_expand_style?: string;
    theme_color?: string;
    panel?: {
        width?: number;
        height?: number;
    };
}

interface SidebarConfig {
    transforms?: TransformConfig;
    displayBounds?: {
        y: number;
        height: number;
    };
}

interface DraggingState {
    isDragging: boolean;
    isSwipeActive: boolean;
    startX: number;
    lastX: number;
    lastTime: number;
    startTimeStamp: number;
    currentVelocity: number;
    lastIgnoreState: boolean | null;
    lastResizeTime: number;
}

interface Constants {
    BASE_START_W: number;
    BASE_START_H: number;
    TARGET_W: number;
    TARGET_H: number;
    THRESHOLD: number;
    VELOCITY_THRESHOLD: number;
}

interface UseSidebarDragReturn {
    handleStart: (currentX: number, target: EventTarget | null) => void;
    handleMove: (currentX: number) => void;
    handleEnd: (currentX: number | null) => void;
}

const useSidebarDrag = (
    isExpanded: boolean,
    updateSidebarStyles: (progress: number) => void,
    expand: () => void,
    collapse: () => void,
    stopAnimation: () => void,
    setIgnoreMouse: (ignore: boolean) => void,
    sidebarRef: RefObject<HTMLElement | null>,
    wrapperRef: RefObject<HTMLElement | null>,
    animationIdRef: RefObject<number | null>,
    draggingState: RefObject<DraggingState>,
    constants: Constants,
    panelWidth: number,
    setWindowToLarge: (() => void) | undefined,
    screenshotPath: string | undefined,
    allowDragExpand: boolean = true
): UseSidebarDragReturn => {
    const { BASE_START_W, VELOCITY_THRESHOLD } = constants;

    const activateDragVisuals = () => {
        if (wrapperRef.current) wrapperRef.current.style.width = '500px';
        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
        if (setWindowToLarge) setWindowToLarge();
    };

    const handleStart = (currentX: number, target: EventTarget | null) => {
        if (screenshotPath) return;
        if (!isExpanded && !allowDragExpand) return;

        const isInteractive = (el: Element | null): boolean => {
            if (!el) return false;
            return el.tagName === 'INPUT' ||
                el.tagName === 'BUTTON' ||
                el.tagName === 'A' ||
                !!el.closest('.launcher-item') ||
                !!el.closest('.volume-slider-container');
        };

        if (isExpanded && target instanceof Element && isInteractive(target)) return;

        const ds = draggingState.current;
        ds.isDragging = true;
        ds.lastX = currentX;
        ds.lastTime = performance.now();
        ds.startTimeStamp = ds.lastTime;
        ds.currentVelocity = 0;
        setIgnoreMouse(false);

        ds.isSwipeActive = true;

        const baseW = sidebarRef.current ? parseFloat(sidebarRef.current.style.width) || BASE_START_W : BASE_START_W;
        const currentProgress = Math.max(0, Math.min(1, (baseW - BASE_START_W) / (panelWidth - BASE_START_W)));

        if (animationIdRef.current) {
            ds.startX = currentX - (currentProgress * 250);
            stopAnimation();
        } else {
            if (isExpanded) {
                ds.isSwipeActive = false;
                ds.startX = currentX - 250;
            } else {
                ds.startX = currentX;
            }
        }

        if (ds.isSwipeActive) {
            activateDragVisuals();
            updateSidebarStyles(currentProgress);
        }
    };

    const handleMove = useCallback((currentX: number) => {
        const ds = draggingState.current;
        if (!ds.isDragging) return;

        const now = performance.now();
        const dt = now - ds.lastTime;
        if (dt > 0) {
            const instantVelocity = (currentX - ds.lastX) / dt;
            ds.currentVelocity = ds.currentVelocity * 0.3 + instantVelocity * 0.7;
        }
        ds.lastX = currentX;
        ds.lastTime = now;

        const deltaXTotal = currentX - ds.startX;
        const deltaXFromStart = isExpanded ? (deltaXTotal - 250) : deltaXTotal;

        if (!ds.isSwipeActive) {
            if (Math.abs(deltaXFromStart) > 10 || Math.abs(ds.currentVelocity) > 0.3) {
                ds.isSwipeActive = true;
                activateDragVisuals();
            } else {
                return;
            }
        }

        const deltaX = currentX - ds.startX;
        updateSidebarStyles(deltaX / 250);
    }, [updateSidebarStyles, draggingState, activateDragVisuals, isExpanded]);

    const handleEnd = useCallback((currentX: number | null) => {
        const ds = draggingState.current;
        if (!ds.isDragging) return;
        ds.isDragging = false;

        if (!ds.isSwipeActive) return;

        const finalX = currentX || ds.lastX;
        const deltaX = finalX - ds.startX;
        const duration = performance.now() - ds.startTimeStamp;

        if (ds.currentVelocity < -VELOCITY_THRESHOLD) {
            collapse();
            return;
        }

        if (ds.currentVelocity > VELOCITY_THRESHOLD || deltaX > 120 || (duration < 250 && deltaX > 30)) {
            expand();
        } else {
            collapse();
        }
    }, [expand, collapse, draggingState, VELOCITY_THRESHOLD]);

    return {
        handleStart,
        handleMove,
        handleEnd
    };
};

export default useSidebarDrag;

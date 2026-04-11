import { useRef, RefObject } from 'react';

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

interface UseSidebarRefsReturn {
    sidebarRef: RefObject<HTMLElement | null>;
    wrapperRef: RefObject<HTMLElement | null>;
    animationIdRef: RefObject<number | null>;
    draggingState: RefObject<DraggingState>;
    constants: Constants;
}

const useSidebarRefs = (): UseSidebarRefsReturn => {
    const sidebarRef = useRef<HTMLElement | null>(null);
    const wrapperRef = useRef<HTMLElement | null>(null);
    const animationIdRef = useRef<number | null>(null);

    const draggingState = useRef<DraggingState>({
        isDragging: false,
        isSwipeActive: false,
        startX: 0,
        lastX: 0,
        lastTime: 0,
        startTimeStamp: 0,
        currentVelocity: 0,
        lastIgnoreState: null,
        lastResizeTime: 0
    });

    const constants: Constants = {
        BASE_START_W: 4,
        BASE_START_H: 64,
        TARGET_W: 400,
        TARGET_H: 450,
        THRESHOLD: 60,
        VELOCITY_THRESHOLD: 0.5
    };

    return {
        sidebarRef,
        wrapperRef,
        animationIdRef,
        draggingState,
        constants
    };
};

export default useSidebarRefs;

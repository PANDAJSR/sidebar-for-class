import { useEffect, RefObject, MouseEvent } from 'react';

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

interface UseSidebarMouseIgnoreParams {
    isExpanded: boolean;
    sidebarRef: RefObject<HTMLElement | null>;
    wrapperRef: RefObject<HTMLElement | null>;
    draggingState: RefObject<DraggingState>;
    animationIdRef: RefObject<number | null>;
    setIgnoreMouse: (ignore: boolean) => void;
}

const useSidebarMouseIgnore = (
    isExpanded: boolean,
    sidebarRef: RefObject<HTMLElement | null>,
    wrapperRef: RefObject<HTMLElement | null>,
    draggingState: RefObject<DraggingState>,
    animationIdRef: RefObject<number | null>,
    setIgnoreMouse: (ignore: boolean) => void
) => {
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            const ds = draggingState.current;
            if (ds.isDragging || animationIdRef.current) {
                setIgnoreMouse(false);
                return;
            }

            let shouldIgnore = true;
            if (isExpanded) {
                if (sidebarRef.current) {
                    const rect = sidebarRef.current.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        shouldIgnore = false;
                    }
                }
            } else {
                if (sidebarRef.current) {
                    const rect = sidebarRef.current.getBoundingClientRect();
                    if (e.clientX >= rect.left - 6 && e.clientX <= rect.right + 6 && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        shouldIgnore = false;
                    }
                }
            }
            setIgnoreMouse(shouldIgnore);
        };

        const onMouseLeave = () => setIgnoreMouse(true);

        window.addEventListener('mousemove', onMouseMove as EventListener);
        window.addEventListener('mouseleave', onMouseLeave);

        return () => {
            window.removeEventListener('mousemove', onMouseMove as EventListener);
            window.removeEventListener('mouseleave', onMouseLeave);
        };
    }, [isExpanded, sidebarRef, wrapperRef, draggingState, animationIdRef, setIgnoreMouse]);
};

export default useSidebarMouseIgnore;

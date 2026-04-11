import { useEffect, RefObject } from 'react';

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

interface UseGlobalEventsParams {
    handleMove: (screenX: number) => void;
    handleEnd: (screenX: number | null) => void;
    draggingState: RefObject<DraggingState>;
}

const useGlobalEvents = (
    handleMove: (screenX: number) => void,
    handleEnd: (screenX: number | null) => void,
    draggingState: RefObject<DraggingState>
) => {
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => handleMove(e.screenX);
        const onMouseUp = (e: MouseEvent) => handleEnd(e.screenX);
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0 && draggingState.current.isDragging) {
                handleMove(e.touches[0].screenX);
            }
        };
        const onTouchEnd = (e: TouchEvent) => handleEnd(e.changedTouches.length > 0 ? e.changedTouches[0].screenX : null);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [handleMove, handleEnd, draggingState]);
};

export default useGlobalEvents;

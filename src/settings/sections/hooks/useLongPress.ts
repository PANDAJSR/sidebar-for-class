import { useState, useRef, useEffect, useCallback } from 'react';

interface PointerPosition {
    x: number;
    y: number;
}

interface UseLongPressReturn {
    isLongPressing: boolean;
    draggedRecently: boolean;
    pointerPos: PointerPosition;
    handlePointerDown: (e: React.PointerEvent, index: number) => void;
    handlePointerMove: (e: React.PointerEvent) => void;
    handlePointerUp: (dragOverIndex: number) => void;
}

const useLongPress = (
    handleDragStart: (e: React.DragEvent | null, index: number) => void,
    handleDragOver: (e: React.DragEvent | null, index: number) => void,
    handleDrop: (e: React.DragEvent | null, targetIndex: number) => void
): UseLongPressReturn => {
    const [isLongPressing, setIsLongPressing] = useState(false);
    const [draggedRecently, setDraggedRecently] = useState(false);
    const [pointerPos, setPointerPos] = useState<PointerPosition>({ x: 0, y: 0 });

    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialTouchPos = useRef<PointerPosition>({ x: 0, y: 0 });

    useEffect(() => {
        return () => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
        };
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent, index: number): void => {
        if (e.pointerType === 'touch') {
            initialTouchPos.current = { x: e.clientX, y: e.clientY };
            if (longPressTimer.current) clearTimeout(longPressTimer.current);

            longPressTimer.current = setTimeout(() => {
                setIsLongPressing(true);
                handleDragStart(null, index);
                if (window.navigator.vibrate) window.navigator.vibrate(50);
            }, 500);
        }
    }, [handleDragStart]);

    const handlePointerMove = useCallback((e: React.PointerEvent): void => {
        if (longPressTimer.current && !isLongPressing) {
            const dist = Math.sqrt(
                Math.pow(e.clientX - initialTouchPos.current.x, 2) +
                Math.pow(e.clientY - initialTouchPos.current.y, 2)
            );
            if (dist > 10) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        }

        if (isLongPressing) {
            setPointerPos({ x: e.clientX, y: e.clientY });
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const item = target?.closest('[data-widget-index]');
            if (item) {
                const overIndex = parseInt(item.getAttribute('data-widget-index') || '');
                if (!isNaN(overIndex)) {
                    handleDragOver(null, overIndex);
                }
            }
        }
    }, [isLongPressing, handleDragOver]);

    const handlePointerUp = useCallback((dragOverIndex: number): void => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        if (isLongPressing) {
            handleDrop(null, dragOverIndex);
            setDraggedRecently(true);
            setTimeout(() => setDraggedRecently(false), 100);
        }
    }, [isLongPressing, handleDrop]);

    return {
        isLongPressing,
        draggedRecently,
        pointerPos,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp
    };
};

export default useLongPress;

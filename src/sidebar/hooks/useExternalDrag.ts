import { useEffect, RefObject } from 'react';

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
    auto_hide?: boolean;
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

interface UseExternalDragParams {
    isExpanded: boolean;
    expand: () => void;
    collapse: () => void;
    draggingState: RefObject<DraggingState>;
    setIgnoreMouse: (ignore: boolean) => void;
    sidebarRef: RefObject<HTMLElement | null>;
    config: SidebarConfig | null;
}

const useExternalDrag = (
    isExpanded: boolean,
    expand: () => void,
    collapse: () => void,
    draggingState: RefObject<DraggingState>,
    setIgnoreMouse: (ignore: boolean) => void,
    sidebarRef: RefObject<HTMLElement | null>,
    config: SidebarConfig | null
) => {
    useEffect(() => {
        let dragLeaveTimer: ReturnType<typeof setTimeout> | null = null;

        const onDragEnter = (e: DragEvent) => {
            if (dragLeaveTimer) {
                clearTimeout(dragLeaveTimer);
                dragLeaveTimer = null;
            }
            if (draggingState.current.isDragging || isExpanded) return;

            if (sidebarRef.current) {
                const rect = sidebarRef.current.getBoundingClientRect();
                if (e.clientX < rect.left - 6 || e.clientX > rect.right + 6 || e.clientY < rect.top || e.clientY > rect.bottom) {
                    return;
                }
            }

            if (e.dataTransfer && e.dataTransfer.types.length > 0) {
                window.electronAPI.setAlwaysOnTop(false);
                expand();
            }
        };

        const onDragOver = (e: DragEvent) => {
            e.preventDefault();
            
            if (!isExpanded && sidebarRef.current) {
                const rect = sidebarRef.current.getBoundingClientRect();
                if (e.clientX < rect.left - 6 || e.clientX > rect.right + 6 || e.clientY < rect.top || e.clientY > rect.bottom) {
                    setIgnoreMouse(true);
                    return;
                }
            }

            setIgnoreMouse(false);
            if (dragLeaveTimer) {
                clearTimeout(dragLeaveTimer);
                dragLeaveTimer = null;
            }
        };

        const onDragLeave = () => {
            if (dragLeaveTimer) clearTimeout(dragLeaveTimer);
            dragLeaveTimer = setTimeout(() => {
                if (isExpanded && !draggingState.current.isDragging) {
                    collapse();
                    window.electronAPI.setAlwaysOnTop(true);
                }
            }, 150);
        };

        const onDrop = (e: DragEvent) => {
            e.preventDefault();
            if (dragLeaveTimer) clearTimeout(dragLeaveTimer);
            collapse();
            window.electronAPI.setAlwaysOnTop(true);
        };

        const onWindowMouseDown = (e: MouseEvent) => {
            if (isExpanded && sidebarRef.current && !sidebarRef.current.contains(e.target as Node) && config?.auto_hide) {
                collapse();
            }
        };

        const onBlur = () => {
            if (isExpanded && config?.auto_hide) collapse();
        };

        window.addEventListener('dragenter', onDragEnter);
        window.addEventListener('dragover', onDragOver);
        window.addEventListener('dragleave', onDragLeave);
        window.addEventListener('drop', onDrop);
        window.addEventListener('mousedown', onWindowMouseDown);
        window.addEventListener('blur', onBlur);
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        return () => {
            window.removeEventListener('dragenter', onDragEnter);
            window.removeEventListener('dragover', onDragOver);
            window.removeEventListener('dragleave', onDragLeave);
            window.removeEventListener('drop', onDrop);
            window.removeEventListener('mousedown', onWindowMouseDown);
            window.removeEventListener('blur', onBlur);
        };
    }, [isExpanded, expand, collapse, draggingState, setIgnoreMouse, sidebarRef, config]);
};

export default useExternalDrag;

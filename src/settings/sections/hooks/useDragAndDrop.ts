import { useState, useCallback } from 'react';

interface Widget {
    type: string;
    [key: string]: unknown;
}

interface Config {
    widgets: Widget[];
}

interface UseDragAndDropReturn {
    draggingIndex: number | null;
    dragOverIndex: number | null;
    handleDragStart: (e: React.DragEvent | null, index: number) => void;
    handleDragOver: (e: React.DragEvent | null, index: number) => void;
    handleDragLeave: (index: number) => void;
    handleDragEnd: () => void;
    handleDrop: (e: React.DragEvent | null, targetIndex: number) => void;
}

const useDragAndDrop = (
    config: Config,
    updateConfig: (config: Config) => void,
    setSelectedWidgetIndex: (index: number | null) => void,
    createWidget: (type: string) => Widget
): UseDragAndDropReturn => {
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = useCallback((e: React.DragEvent | null, index: number): void => {
        setSelectedWidgetIndex(null);
        setDraggingIndex(index);
        setDragOverIndex(null);
        if (e && e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
    }, [setSelectedWidgetIndex]);

    const handleDragOver = useCallback((e: React.DragEvent | null, index: number): void => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (draggingIndex === null) {
            const types = e?.dataTransfer?.types;
            const hasType = types && (types.includes ? types.includes('application/react-dnd-type') : (types.contains && types.contains('application/react-dnd-type')));

            if (hasType) {
                setDragOverIndex(index);
            }
            return;
        }

        const adjustedTargetIndex = index > draggingIndex ? index - 1 : index;

        if (adjustedTargetIndex === draggingIndex) {
            setDragOverIndex(null);
            return;
        }

        setDragOverIndex(index);
    }, [draggingIndex]);

    const handleDragEnd = useCallback((): void => {
        setDraggingIndex(null);
        setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent | null, targetIndex: number): void => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (draggingIndex === null) {
            const newWidgetType = e?.dataTransfer?.getData('application/react-dnd-type');
            if (newWidgetType && createWidget) {
                const newWidget = createWidget(newWidgetType);
                const newWidgets = [...config.widgets];

                newWidgets.splice(targetIndex, 0, newWidget);

                updateConfig({
                    ...config,
                    widgets: newWidgets
                });

                setSelectedWidgetIndex(targetIndex);

                setDragOverIndex(null);
            }
            return;
        }

        if (draggingIndex === targetIndex) {
            setDraggingIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newWidgets = [...config.widgets];
        const draggedItem = newWidgets[draggingIndex];

        newWidgets.splice(draggingIndex, 1);

        const adjustedTargetIndex = targetIndex > draggingIndex ? targetIndex - 1 : targetIndex;

        if (adjustedTargetIndex >= newWidgets.length) {
            newWidgets.push(draggedItem);
        } else {
            newWidgets.splice(adjustedTargetIndex, 0, draggedItem);
        }

        updateConfig({
            ...config,
            widgets: newWidgets
        });

        setDraggingIndex(null);
        setDragOverIndex(null);
    }, [config, updateConfig, draggingIndex, createWidget, setSelectedWidgetIndex]);

    const handleDragLeave = useCallback((index: number): void => {
        setDragOverIndex(prev => prev === index ? null : prev);
    }, []);

    return {
        draggingIndex,
        dragOverIndex,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDragEnd,
        handleDrop
    };
};

export default useDragAndDrop;

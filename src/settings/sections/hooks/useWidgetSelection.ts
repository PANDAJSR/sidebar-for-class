import { useState, useCallback } from 'react';

interface UseWidgetSelectionReturn {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    selectedWidgetIndex: number | null;
    setSelectedWidgetIndex: (index: number | null) => void;
    handleWidgetClick: (e: React.MouseEvent, index: number, draggedRecently: boolean) => void;
    clearSelection: () => void;
}

const useWidgetSelection = (initialActiveTab: string = 'properties'): UseWidgetSelectionReturn => {
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [selectedWidgetIndex, setSelectedWidgetIndex] = useState<number | null>(null);

    const handleWidgetClick = useCallback((e: React.MouseEvent, index: number, draggedRecently: boolean): void => {
        e.stopPropagation();
        if (draggedRecently) return;
        setSelectedWidgetIndex(index);
        setActiveTab('properties');
    }, []);

    const clearSelection = useCallback((): void => {
        setSelectedWidgetIndex(null);
    }, []);

    return {
        activeTab,
        setActiveTab,
        selectedWidgetIndex,
        setSelectedWidgetIndex,
        handleWidgetClick,
        clearSelection
    };
};

export default useWidgetSelection;

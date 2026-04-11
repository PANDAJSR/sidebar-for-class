import { useCallback } from 'react';

interface Widget {
    [key: string]: unknown;
}

interface Config {
    widgets: Widget[];
}

interface UseWidgetPropertyUpdateReturn {
    updateWidgetProperty: (key: string, value: unknown) => void;
}

const useWidgetPropertyUpdate = (
    config: Config,
    updateConfig: (config: Config) => void,
    selectedWidgetIndex: number | null
): UseWidgetPropertyUpdateReturn => {
    const updateWidgetProperty = useCallback((key: string, value: unknown): void => {
        if (selectedWidgetIndex === null) return;
        
        const newWidgets = [...config.widgets];
        newWidgets[selectedWidgetIndex] = {
            ...newWidgets[selectedWidgetIndex],
            [key]: value
        };
        updateConfig({
            ...config,
            widgets: newWidgets
        });
    }, [config, updateConfig, selectedWidgetIndex]);

    return { updateWidgetProperty };
};

export default useWidgetPropertyUpdate;

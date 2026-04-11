import { useEffect } from 'react';

interface Widget {
    type: string;
    [key: string]: unknown;
}

interface UseWidgetIconsReturn {
    preloadWidgetIcons: (widgets: Widget[]) => void;
}

const useWidgetIcons = (
    widgets: Widget[],
    preloadWidgetIcons: (widgets: Widget[]) => void
): void => {
    useEffect(() => {
        preloadWidgetIcons(widgets);
    }, [widgets, preloadWidgetIcons]);
};

export default useWidgetIcons;

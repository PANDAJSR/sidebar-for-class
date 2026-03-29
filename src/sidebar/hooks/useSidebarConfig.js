import { useState, useEffect } from 'react';

const useSidebarConfig = () => {
    const [config, setConfig] = useState(null);
    const [scale, setScale] = useState(1);
    const [startH, setStartH] = useState(64);
    const [panelWidth, setPanelWidth] = useState(450);
    const [panelHeight, setPanelHeight] = useState(400);

    const applyConfig = (c) => {
        setConfig(c);
        if (c.transforms) {
            if (typeof c.transforms.size === 'number' && c.transforms.size > 0) {
                setScale(c.transforms.size / 100);
            }
            if (typeof c.transforms.height === 'number') {
                setStartH(c.transforms.height);
            }
            if (typeof c.transforms.animation_speed === 'number') {
                const speed = c.transforms.animation_speed;
                document.documentElement.style.setProperty('--sidebar-duration', `${0.5 / speed}s`);
                document.documentElement.style.setProperty('--content-duration', `${0.3 / speed}s`);
            }
            if (c.transforms.panel) {
                if (typeof c.transforms.panel.width === 'number') {
                    setPanelWidth(c.transforms.panel.width);
                }
                if (typeof c.transforms.panel.height === 'number') {
                    setPanelHeight(c.transforms.panel.height);
                }
            }
            // 应用主题色
            if (c.transforms.theme_color) {
                document.documentElement.style.setProperty('--theme-color', c.transforms.theme_color);
            } else {
                document.documentElement.style.setProperty('--theme-color', '#5865F2');
            }
        }
        const scaleValue = (typeof c.transforms?.size === 'number' && c.transforms.size > 0)
            ? c.transforms.size / 100
            : 1;
        document.documentElement.style.setProperty('--sidebar-scale', String(scaleValue));
    };

    useEffect(() => {
        if (!window.electronAPI) return;

        const fetchConfig = async () => {
            const c = await window.electronAPI.getConfig();
            applyConfig(c);
        };
        fetchConfig();

        const unbind = window.electronAPI.onConfigUpdated((newConfig) => {
            applyConfig(newConfig);
        });

        return () => {
        };
    }, []);

    return {
        config,
        scale,
        startH,
        panelWidth,
        panelHeight
    };
};

export default useSidebarConfig;

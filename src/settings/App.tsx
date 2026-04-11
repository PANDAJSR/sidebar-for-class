/**
 * 设置应用主组件
 * 管理设置界面的整体布局、配置状态和标签页切换
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FluentProvider,
    webLightTheme,
    webDarkTheme,
} from "@fluentui/react-components";

import { useStyles } from './App.styles';

import SidebarNav from './components/SidebarNav';
import BasicSettings from './sections/BasicSettings';
import ComponentSettings from './sections/ComponentSettings';
import WindowSettings from './sections/WindowSettings';
import StyleSettings from './sections/StyleSettings';
import AutomationSettings from './sections/AutomationSettings';
import DataSettings from './sections/DataSettings';
import HelperSettings from './sections/HelperSettings';
import TimerSettings from './sections/TimerSettings';

import { iconCache } from '../sidebar/components/LauncherItem';

interface WidgetTarget {
    target: string;
}

interface Widget {
    type: string;
    targets?: WidgetTarget[] | string;
    folder_path?: string;
    max_count?: number;
}

interface TransformValue {
    [key: string]: string | number | boolean;
}

interface Transforms {
    [key: string]: TransformValue;
}

interface Config {
    widgets: Widget[];
    transforms?: Transforms;
    [key: string]: unknown;
}

type TabId = 'basic' | 'components' | 'window' | 'style' | 'automation' | 'data' | 'timer' | 'tools';

interface AppProps {}

const App: React.FC<AppProps> = () => {
    const styles = useStyles();
    const [selectedTab, setSelectedTab] = useState<TabId>('basic');
    const [isDarkMode, setIsDarkMode] = useState<boolean>(window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [config, setConfig] = useState<Config | null>(null);

    const isInitialMount = useRef<boolean>(true);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingIconRequests = useRef<Map<string, Promise<string | null>>>(new Map());


    const loadIcon = useCallback(async (target: string): Promise<string | null> => {
        if (!target) return null;

        const cacheKey = target;
        if (iconCache.has(cacheKey)) {
            return iconCache.get(cacheKey) ?? null;
        }

        if (pendingIconRequests.current.has(cacheKey)) {
            return pendingIconRequests.current.get(cacheKey) ?? null;
        }

        const promise = window.electronAPI.getFileIcon(target)
            .then((iconDataUrl: string | null) => {
                if (iconDataUrl) {
                    iconCache.set(cacheKey, iconDataUrl);
                }
                return iconDataUrl;
            })
            .catch((err: Error) => {
                console.error('获取图标失败:', err);
                return null;
            })
            .finally(() => {
                pendingIconRequests.current.delete(cacheKey);
            });

        pendingIconRequests.current.set(cacheKey, promise);
        return promise;
    }, []);

    const preloadWidgetIcons = useCallback(async (widgets: Widget[]): Promise<void> => {
        widgets.forEach((widget: Widget) => {
            if (widget.type === 'launcher' && widget.targets) {
                widget.targets.forEach((target: WidgetTarget) => {
                    loadIcon(target.target).then(() => {
                    });
                });
            } else if (widget.type === 'drag_to_launch' && widget.targets) {
                let exePath = widget.targets;
                if (typeof exePath === 'string') {
                    const placeholderIndex = exePath.indexOf('{{source}}');
                    let potentialPath = placeholderIndex > -1 ? exePath.substring(0, placeholderIndex).trim() : exePath;
                    if (potentialPath.startsWith('"') && potentialPath.endsWith('"')) {
                        potentialPath = potentialPath.substring(1, potentialPath.length - 1);
                    }
                    exePath = potentialPath;
                }
                loadIcon(exePath as string).then(() => {
                });
            } else if (widget.type === 'files' && widget.folder_path) {
                window.electronAPI.getFilesInFolder(widget.folder_path, widget.max_count)
                    .then((fileList: Array<{ path: string }>) => {
                        fileList.forEach((file: { path: string }) => {
                            loadIcon(file.path).then(() => {
                            });
                        });
                    })
                    .catch((err: Error) => console.error('获取文件列表失败:', err));
            }
        });
    }, [loadIcon]);

    useEffect(() => {
        const fetchConfig = async (): Promise<void> => {
            const initialConfig: Config = await window.electronAPI.getConfig();
            setConfig(initialConfig);
            preloadWidgetIcons(initialConfig.widgets);
        };
        fetchConfig();

        const mediaQuery: MediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent): void => setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [preloadWidgetIcons]);

    useEffect(() => {
        if (isInitialMount.current) {
            if (config) {
                isInitialMount.current = false;
            }
            return;
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                if (config) {
                    await window.electronAPI.updateConfig(config);
                }
            } catch (err) {
                console.error('Failed to save config:', err);
            }
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [config]);

    const updateConfig = useCallback((newConfig: Config): void => {
        setConfig(newConfig);
        window.electronAPI.previewConfig(newConfig);
    }, []);

    const handleTransformChange = useCallback((key: string, value: string | number | boolean): void => {
        setConfig(prev => {
            if (!prev) return prev;
            const next: Config = {
                ...prev,
                transforms: {
                    ...prev.transforms,
                    [key]: value
                }
            };
            window.electronAPI.previewConfig(next);
            return next;
        });
    }, []);

    if (!config) return null;

    return (
        <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
            <div className={styles.root}>
                <SidebarNav
                    selectedTab={selectedTab}
                    onTabSelect={setSelectedTab}
                    styles={styles}
                />

                <main className={styles.main}>
                    {selectedTab === 'basic' && (
                        <BasicSettings config={config} updateConfig={updateConfig} styles={styles} />
                    )}

                    {selectedTab === 'components' && (
                        <ComponentSettings 
                            config={config} 
                            updateConfig={updateConfig} 
                            styles={styles}
                            loadIcon={loadIcon}
                            preloadWidgetIcons={preloadWidgetIcons}
                        />
                    )}

                    {selectedTab === 'window' && (
                        <WindowSettings
                            config={config}
                            handleTransformChange={handleTransformChange}
                            styles={styles}
                        />
                    )}

                    {selectedTab === 'style' && (
                        <StyleSettings
                            config={config}
                            handleTransformChange={handleTransformChange}
                            styles={styles}
                        />
                    )}

                    {selectedTab === 'automation' && (
                        <AutomationSettings
                            config={config}
                            updateConfig={updateConfig}
                            styles={styles}
                        />
                    )}

                    {selectedTab === 'data' && (
                        <DataSettings
                            config={config}
                            updateConfig={updateConfig}
                            styles={styles}
                        />
                    )}

                    {selectedTab === 'timer' && (
                        <TimerSettings
                            config={config}
                            updateConfig={updateConfig}
                            styles={styles}
                        />
                    )}

                    {selectedTab === 'tools' && (
                        <HelperSettings
                            config={config}
                            updateConfig={updateConfig}
                            styles={styles}
                        />
                    )}
                </main>
            </div>
        </FluentProvider>
    );
};

export default App;

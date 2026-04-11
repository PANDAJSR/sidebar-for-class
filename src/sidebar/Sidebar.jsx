import React, { useEffect, useState } from 'react';
import LauncherItem from './components/LauncherItem';
import VolumeWidget from './components/VolumeWidget';
import FilesWidget from './components/FilesWidget';
import DragToLaunchWidget from './components/DragToLaunchWidget';
import Toolbar from './components/Toolbar';
import ICCCEControl from './components/ICCCEControl';
import ScreenshotOverlay from './components/ScreenshotOverlay';
import useSidebarRefs from './hooks/useSidebarRefs';
import useSidebarConfig from './hooks/useSidebarConfig';
import useSidebarAnimation from './hooks/useSidebarAnimation';
import useSidebarDrag from './hooks/useSidebarDrag';
import useSidebarMouseIgnore from './hooks/useSidebarMouseIgnore';
import useExternalDrag from './hooks/useExternalDrag';
import useGlobalEvents from './hooks/useGlobalEvents';

const Sidebar = () => {
    // 1. 基础 Refs 和配置
    const { sidebarRef, wrapperRef, animationIdRef, draggingState, constants } = useSidebarRefs();
    const { config, scale, startH, panelWidth, panelHeight } = useSidebarConfig();
    const expandMode = config?.transforms?.expand_mode || 'drag';
    const clickExpandStyle = config?.transforms?.click_expand_style || 'bar';
    const isEdgeTabStyle = expandMode === 'click' && clickExpandStyle === 'edge_tab';
    const allowDragExpand = expandMode === 'drag' || expandMode === 'both';
    const allowClickExpand = expandMode === 'click' || expandMode === 'both';
    
    // 2. 所有的 useState 定义
    const [screenshotPath, setScreenshotPath] = useState(null);
    const [isIccRunning, setIsIccRunning] = useState(true);

    // 检查 ICC-CE 是否运行
    useEffect(() => {
        if (!window.electronAPI) return;
        const checkIccProcess = async () => {
            const running = await window.electronAPI.isProcessRunning('InkCanvasForClass.exe');
            setIsIccRunning(running);
        };
        
        checkIccProcess();
        // 缩短轮询间隔至 3 秒
        const interval = setInterval(checkIccProcess, 3000);
        return () => clearInterval(interval);
    }, []);

    // 4. 钩子函数调用 (获取控制状态)
    const { isExpanded, expand, collapse, updateSidebarStyles, stopAnimation, setIgnoreMouse, setWindowToLarge } = useSidebarAnimation(config, scale, startH, panelWidth, panelHeight, sidebarRef, wrapperRef, animationIdRef, draggingState, constants);
    const wrapperClassName = [isExpanded ? 'expanded' : '', isEdgeTabStyle ? 'edge-tab-mode' : '']
        .filter(Boolean)
        .join(' ');
    const { handleStart, handleMove, handleEnd } = useSidebarDrag(isExpanded, updateSidebarStyles, expand, collapse, stopAnimation, setIgnoreMouse, sidebarRef, wrapperRef, animationIdRef, draggingState, constants, panelWidth, setWindowToLarge, screenshotPath, allowDragExpand);

    // 5. 其他辅助钩子
    useSidebarMouseIgnore(isExpanded, sidebarRef, wrapperRef, draggingState, animationIdRef, setIgnoreMouse);
    useExternalDrag(isExpanded, expand, collapse, draggingState, setIgnoreMouse, sidebarRef, config);
    useGlobalEvents(handleMove, handleEnd, draggingState);

    // 6. useEffect 逻辑

    // 当侧边栏展开时，立即重新检查一次进程状态，确保组件显隐实时准确
    useEffect(() => {
        if (isExpanded && window.electronAPI) {
            window.electronAPI.isProcessRunning('InkCanvasForClass.exe').then(setIsIccRunning);
        }
    }, [isExpanded]);

    // 当侧边栏收起时，自动清除截图状态
    useEffect(() => {
        if (!isExpanded) {
            setScreenshotPath(null);
        }
    }, [isExpanded]);

    useEffect(() => {
        if (!window.electronAPI) return;
        const handleWindowBlur = () => {
            if (config?.transforms?.auto_hide && isExpanded) {
                collapse();
            }
        };
        const unsubscribe = window.electronAPI.onWindowBlur(handleWindowBlur);
        return () => { if (unsubscribe) unsubscribe(); };
    }, [config, isExpanded, collapse]);

    // 7. 事件处理函数

    const handleScreenshot = async () => {
        try {
            if (isExpanded) {
                collapse();
                await new Promise(resolve => setTimeout(resolve, 400));
            }
            const result = await window.electronAPI.screenshot();
            if (result) {
                setScreenshotPath(result);
                expand();
            }
        } catch (error) {
            console.error('Screenshot failed:', error);
        }
    };

    const handleWrapperClick = () => {
        if (screenshotPath || isExpanded || !allowClickExpand) return;
        expand();
    };

    // 8. 渲染
    return (
        <div id="sidebar-wrapper"
            ref={wrapperRef}
            className={wrapperClassName}
            onMouseDown={(e) => handleStart(e.screenX, e.target)}
            onTouchStart={(e) => e.touches.length > 0 && handleStart(e.touches[0].screenX, e.target)}
            onClick={handleWrapperClick}
        >
            <div id="sidebar" ref={sidebarRef} className={isEdgeTabStyle ? 'edge-tab-style' : ''}>
                <div id="corner-settings" onDoubleClick={() => window.electronAPI?.openSettings()}></div>
                <div id="content">
                    <div id="widget-container" className="widget-list">
                        {config?.widgets?.map((widget, index) => {
                            if (widget.type === 'launcher') {
                                return (
                                    <div
                                        key={index}
                                        className={`launcher-group layout-${widget.layout || 'vertical'}`}
                                    >
                                        {widget.targets.map((target, tIndex) => (
                                            <LauncherItem key={tIndex} {...target} />
                                        ))}
                                    </div>
                                );
                            } 
                            else if (widget.type === 'volume_slider') {
                                return <VolumeWidget key={index} />;
                            } 
                            else if (widget.type === 'files') {
                                return <FilesWidget key={index} {...widget} />;
                            } 
                            else if (widget.type === 'drag_to_launch') {
                                return <DragToLaunchWidget key={index} {...widget} />;
                            }
                            else if (widget.type === 'toolbar') {
                                return <Toolbar 
                                    key={index} 
                                    {...widget} 
                                    isExpanded={isExpanded} 
                                    collapse={collapse} 
                                    onScreenshot={handleScreenshot}
                                />;
                            }
                            else if (widget.type === 'iccce_control') {
                                // 检查是否开启了"仅在运行显示"且当前未运行
                                if (widget.show_only_when_running !== false && !isIccRunning) {
                                    return null;
                                }
                                // 检查是否开启了"仅在收纳模式显示"且当前不是收纳模式
                                if (widget.show_only_when_collapsed && isExpanded) {
                                    return null;
                                }
                                return <ICCCEControl
                                    key={index}
                                    {...widget}
                                    isExpanded={isExpanded}
                                    collapse={collapse}
                                />;
                            }
                            return null;
                        })}
                    </div>
                </div>

                {screenshotPath && (
                    <ScreenshotOverlay 
                        screenshotPath={screenshotPath} 
                        setScreenshotPath={setScreenshotPath} 
                    />
                )}
            </div>
        </div>
    );
};

export default Sidebar;

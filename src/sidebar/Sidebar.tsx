import React, { useEffect, useState, MouseEvent, TouchEvent } from 'react';
import LauncherItem from './components/LauncherItem';
import VolumeWidget from './components/VolumeWidget';
import FilesWidget from './components/FilesWidget';
import DragToLaunchWidget from './components/DragToLaunchWidget';
import Toolbar from './components/Toolbar';
import ICCCeControl from './components/ICCCeControl';
import ScreenshotOverlay from './components/ScreenshotOverlay';
import useSidebarRefs from './hooks/useSidebarRefs';
import useSidebarConfig from './hooks/useSidebarConfig';
import useSidebarAnimation from './hooks/useSidebarAnimation';
import useSidebarDrag from './hooks/useSidebarDrag';
import useSidebarMouseIgnore from './hooks/useSidebarMouseIgnore';
import useExternalDrag from './hooks/useExternalDrag';
import useGlobalEvents from './hooks/useGlobalEvents';

interface SidebarProps {
    children?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = () => {
    const { sidebarRef, wrapperRef, animationIdRef, draggingState, constants } = useSidebarRefs();
    const { config, scale, startH, panelWidth, panelHeight } = useSidebarConfig();
    const expandMode = config?.transforms?.expand_mode || 'drag';
    const clickExpandStyle = config?.transforms?.click_expand_style || 'bar';
    const isEdgeTabStyle = expandMode === 'click' && clickExpandStyle === 'edge_tab';
    const allowDragExpand = expandMode === 'drag' || expandMode === 'both';
    const allowClickExpand = expandMode === 'click' || expandMode === 'both';

    const [screenshotPath, setScreenshotPath] = useState<string | null>(null);
    const [isIccRunning, setIsIccRunning] = useState<boolean>(true);

    useEffect(() => {
        if (!window.electronAPI) return;
        const checkIccProcess = async (): Promise<void> => {
            const running: boolean = await window.electronAPI.isProcessRunning('InkCanvasForClass.exe');
            setIsIccRunning(running);
        };

        checkIccProcess();
        const interval: ReturnType<typeof setInterval> = setInterval(checkIccProcess, 3000);
        return () => clearInterval(interval);
    }, []);

    const { isExpanded, expand, collapse, updateSidebarStyles, stopAnimation, setIgnoreMouse, setWindowToLarge } = useSidebarAnimation(
        config,
        scale,
        startH,
        panelWidth,
        panelHeight,
        sidebarRef,
        wrapperRef,
        animationIdRef,
        draggingState,
        constants
    );
    const wrapperClassName: string = [isExpanded ? 'expanded' : '', isEdgeTabStyle ? 'edge-tab-mode' : '']
        .filter(Boolean)
        .join(' ');
    const { handleStart, handleMove, handleEnd } = useSidebarDrag(
        isExpanded,
        updateSidebarStyles,
        expand,
        collapse,
        stopAnimation,
        setIgnoreMouse,
        sidebarRef,
        wrapperRef,
        animationIdRef,
        draggingState,
        constants,
        panelWidth,
        setWindowToLarge,
        screenshotPath,
        allowDragExpand
    );

    useSidebarMouseIgnore(isExpanded, sidebarRef, wrapperRef, draggingState, animationIdRef, setIgnoreMouse);
    useExternalDrag(isExpanded, expand, collapse, draggingState, setIgnoreMouse, sidebarRef, config);
    useGlobalEvents(handleMove, handleEnd, draggingState);

    useEffect(() => {
        if (isExpanded && window.electronAPI) {
            window.electronAPI.isProcessRunning('InkCanvasForClass.exe').then(setIsIccRunning);
        }
    }, [isExpanded]);

    useEffect(() => {
        if (!isExpanded) {
            setScreenshotPath(null);
        }
    }, [isExpanded]);

    useEffect(() => {
        if (!window.electronAPI) return;
        const handleWindowBlur = (): void => {
            if (config?.transforms?.auto_hide && isExpanded) {
                collapse();
            }
        };
        const unsubscribe = window.electronAPI.onWindowBlur(handleWindowBlur);
        return (): void => { if (unsubscribe) unsubscribe(); };
    }, [config, isExpanded, collapse]);

    const handleSettingsClick = (e: MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();
        window.electronAPI.openSettings();
    };

    const handleScreenshot = async (): Promise<void> => {
        try {
            if (isExpanded) {
                collapse();
                await new Promise<void>((resolve) => setTimeout(resolve, 400));
            }
            const result: string | null = await window.electronAPI.screenshot();
            if (result) {
                setScreenshotPath(result);
                expand();
            }
        } catch (error) {
            console.error('Screenshot failed:', error);
        }
    };

    const handleWrapperClick = (): void => {
        if (screenshotPath || isExpanded || !allowClickExpand) return;
        expand();
    };

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
        handleStart(e.screenX, e.target);
    };

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>): void => {
        if (e.touches.length > 0) {
            handleStart(e.touches[0].screenX, e.target);
        }
    };

    return (
        <div id="sidebar-wrapper"
            ref={wrapperRef}
            className={wrapperClassName}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onClick={handleWrapperClick}
        >
            <div id="sidebar" ref={sidebarRef} className={isEdgeTabStyle ? 'edge-tab-style' : ''}>
                <div id="content">
                    <button id="settings-btn" className="settings-button" title="设置" onClick={handleSettingsClick}>
                        <i className="fas fa-cog"></i>
                    </button>
                    <div id="widget-container" className="widget-list">
                        {config?.widgets?.map((widget, index: number) => {
                            if (widget.type === 'launcher') {
                                return (
                                    <div
                                        key={index}
                                        className={`launcher-group layout-${widget.layout || 'vertical'}`}
                                    >
                                        {widget.targets.map((target, tIndex: number) => (
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
                                if (widget.show_only_when_running !== false && !isIccRunning) {
                                    return null;
                                }
                                return <ICCCeControl
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

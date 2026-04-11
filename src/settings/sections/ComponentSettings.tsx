import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Tab,
    TabList,
    Body1,
    Title2,
    Caption1,
    mergeClasses,
    Input,
    Switch,
    Field,
    Label,
    Dropdown,
    Option,
    Button,
    Slider
} from "@fluentui/react-components";
import {
    DesignIdeasRegular,
    SettingsRegular,
    BoxRegular,
    InfoRegular,
    AddRegular,
    DeleteRegular,
    AppsRegular
} from "@fluentui/react-icons";

import '../../../style.css';
import useWidgetSelection from './hooks/useWidgetSelection';
import useDragAndDrop from './hooks/useDragAndDrop';
import useLongPress from './hooks/useLongPress';
import useWidgetIcons from './hooks/useWidgetIcons';
import useWidgetPropertyUpdate from './hooks/useWidgetPropertyUpdate';
import useWidgetPreviews from './hooks/useWidgetPreviews';
import PreviewPanel from './components/PreviewPanel';
import PropertiesPanel from './components/PropertiesPanel';

interface Widget {
    type: string;
    layout?: string;
    targets?: Array<{
        name: string;
        target: string;
        args: string[];
    }>;
    range?: [number, number];
    name?: string;
    show_all_time?: boolean;
    folder_path?: string;
    max_count?: number;
    tools?: string[];
    functions?: string[];
}

interface Config {
    widgets: Widget[];
}

interface Styles {
    componentSettingsSection: string;
    sectionHeader: string;
    title: string;
    description: string;
    componentLayout: string;
    leftPanel: string;
    rightPanel: string;
    resizer: string;
}

interface LauncherItemPreviewProps {
    name: string;
    target: string;
    widgetIndex: number;
    targetIndex: number;
}

interface VolumeWidgetPreviewProps {
    range: [number, number];
}

interface FilesWidgetPreviewProps {
    folder_path: string;
    max_count: number;
    layout?: string;
    widgetIndex: number;
}

interface DragToLaunchWidgetPreviewProps {
    name: string;
    targets: string;
    widgetIndex: number;
}

interface ToolbarWidgetPreviewProps {
    tools: string[];
}

interface ICCCeControlPreviewProps {
    functions: string[];
}

interface ComponentSettingsProps {
    config: Config;
    updateConfig: (config: Config) => void;
    styles: Styles;
    loadIcon?: (iconPath: string) => Promise<string>;
    preloadWidgetIcons?: (widgets: Widget[]) => void;
    setWidgetIcons?: (icons: Map<string, string>) => void;
}

const ComponentSettings: React.FC<ComponentSettingsProps> = ({ config, updateConfig, styles, loadIcon, preloadWidgetIcons, setWidgetIcons }) => {
    const {
        activeTab,
        setActiveTab,
        selectedWidgetIndex,
        setSelectedWidgetIndex,
        handleWidgetClick,
        clearSelection
    } = useWidgetSelection();

    const createWidget = useCallback((type: string): Widget => {
        const newWidget: Widget = { type };

        if (type === 'launcher') {
            newWidget.layout = 'vertical';
            newWidget.targets = [{
                name: '新目标',
                target: '',
                args: []
            }];
        } else if (type === 'volume_slider') {
            newWidget.range = [0, 100];
        } else if (type === 'drag_to_launch') {
            newWidget.name = '拖放速启';
            newWidget.targets = '';
            newWidget.show_all_time = false;
        } else if (type === 'files') {
            newWidget.folder_path = '';
            newWidget.max_count = 10;
            newWidget.layout = 'vertical';
        } else if (type === 'toolbar') {
            newWidget.tools = ['screenshot', 'show_desktop', 'taskview'];
        } else if (type === 'iccce_control') {
            newWidget.functions = ['randone', 'rand', 'timer', 'whiteboard', 'show'];
        }

        return newWidget;
    }, []);

    const {
        draggingIndex,
        dragOverIndex,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDragEnd,
        handleDrop
    } = useDragAndDrop(config, updateConfig, setSelectedWidgetIndex, createWidget);

    const {
        isLongPressing,
        draggedRecently,
        pointerPos,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp
    } = useLongPress(handleDragStart, handleDragOver, handleDrop);

    useWidgetIcons(config.widgets, preloadWidgetIcons!);

    const { updateWidgetProperty } = useWidgetPropertyUpdate(config, updateConfig, selectedWidgetIndex);

    const {
        LauncherItemPreview,
        VolumeWidgetPreview,
        FilesWidgetPreview,
        DragToLaunchWidgetPreview,
        ToolbarWidgetPreview,
        ICCCeControlPreview
    } = useWidgetPreviews();

    const selectedWidget = selectedWidgetIndex !== null ? config.widgets[selectedWidgetIndex] : null;

    const handleWidgetClickWrapper = (e: React.MouseEvent, index: number, draggedRecently: boolean): void => {
        handleWidgetClick(e, index, draggedRecently);
    };

    const [leftWidth, setLeftWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleResizerMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleResizerMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
        const newLeftWidth = ((clientX - containerRect.left) / containerRect.width) * 100;
        const clampedWidth = Math.max(20, Math.min(80, newLeftWidth));
        setLeftWidth(clampedWidth);
    }, [isDragging]);

    const handleResizerMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }, [isDragging]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleResizerMouseMove);
            window.addEventListener('mouseup', handleResizerMouseUp);
            window.addEventListener('touchmove', handleResizerMouseMove as EventListener);
            window.addEventListener('touchend', handleResizerMouseUp);
        } else {
            window.removeEventListener('mousemove', handleResizerMouseMove);
            window.removeEventListener('mouseup', handleResizerMouseUp);
            window.removeEventListener('touchmove', handleResizerMouseMove as EventListener);
            window.removeEventListener('touchend', handleResizerMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleResizerMouseMove);
            window.removeEventListener('mouseup', handleResizerMouseUp);
            window.removeEventListener('touchmove', handleResizerMouseMove as EventListener);
            window.removeEventListener('touchend', handleResizerMouseUp);
        };
    }, [isDragging, handleResizerMouseMove, handleResizerMouseUp]);

    const [deletedWidget, setDeletedWidget] = useState<Widget | null>(null);
    const [deletedWidgetIndex, setDeletedWidgetIndex] = useState<number | null>(null);
    const [showUndoNotification, setShowUndoNotification] = useState(false);
    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleDeleteWidget = (index: number): void => {
        const widgetToDelete = config.widgets[index];
        setDeletedWidget(widgetToDelete);
        setDeletedWidgetIndex(index);
        setShowUndoNotification(true);

        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
        }
        undoTimerRef.current = setTimeout(() => {
            setShowUndoNotification(false);
            setDeletedWidget(null);
            setDeletedWidgetIndex(null);
        }, 5000);

        const newWidgets = [...config.widgets];
        newWidgets.splice(index, 1);
        updateConfig({
            ...config,
            widgets: newWidgets
        });

        if (selectedWidgetIndex === index) {
            clearSelection();
        } else if (selectedWidgetIndex !== null && selectedWidgetIndex > index) {
            setSelectedWidgetIndex(selectedWidgetIndex - 1);
        }
    };

    const handleUndoDelete = (): void => {
        if (!deletedWidget || deletedWidgetIndex === null) return;

        const newWidgets = [...config.widgets];
        newWidgets.splice(deletedWidgetIndex, 0, deletedWidget);

        updateConfig({
            ...config,
            widgets: newWidgets
        });

        setShowUndoNotification(false);
        setDeletedWidget(null);
        setDeletedWidgetIndex(null);
        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
        }
    };

    const handleAddComponent = (type: string): void => {
        const newWidget = createWidget(type);
        const newWidgets = [...config.widgets, newWidget];
        updateConfig({
            ...config,
            widgets: newWidgets
        });

        setSelectedWidgetIndex(newWidgets.length - 1);
    };

    return (
        <div className={styles.componentSettingsSection}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>组件设置</div>
                <div className={styles.description}>可视化管理侧边栏组件，通过简单的拖拽和属性调整来定制你的侧边栏。</div>
            </div>

            <div className={styles.componentLayout} ref={containerRef}>
                <div className={styles.leftPanel} style={{ width: `calc(${leftWidth}% - 12px)`, transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <PreviewPanel
                        config={config}
                        styles={styles}
                        isLongPressing={isLongPressing}
                        draggingIndex={draggingIndex}
                        dragOverIndex={dragOverIndex}
                        selectedWidgetIndex={selectedWidgetIndex}
                        pointerPos={pointerPos}
                        clearSelection={clearSelection}
                        handlePointerMove={handlePointerMove}
                        handlePointerUp={handlePointerUp}
                        handlePointerDown={handlePointerDown}
                        handleDragStart={handleDragStart}
                        handleDragOver={handleDragOver}
                        handleDragLeave={handleDragLeave}
                        handleDragEnd={handleDragEnd}
                        handleDrop={handleDrop}
                        handleWidgetClick={handleWidgetClickWrapper}
                        handleDeleteWidget={handleDeleteWidget}
                        LauncherItemPreview={LauncherItemPreview}
                        VolumeWidgetPreview={VolumeWidgetPreview}
                        FilesWidgetPreview={FilesWidgetPreview}
                        DragToLaunchWidgetPreview={DragToLaunchWidgetPreview}
                        ToolbarWidgetPreview={ToolbarWidgetPreview}
                        ICCCeControlPreview={ICCCeControlPreview}
                    />
                </div>

                <div
                    className={styles.resizer}
                    onMouseDown={handleResizerMouseDown}
                    onTouchStart={handleResizerMouseDown}
                    style={{
                        cursor: isDragging ? 'col-resize' : 'col-resize',
                        backgroundColor: isDragging ? 'var(--colorBrandBackground2Pressed)' : 'var(--colorNeutralStroke1)'
                    }}
                />

                <div className={styles.rightPanel} style={{ width: `calc(${100 - leftWidth}% - 95px)`, transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <PropertiesPanel
                        config={config}
                        updateConfig={updateConfig}
                        styles={styles}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        selectedWidget={selectedWidget}
                        updateWidgetProperty={updateWidgetProperty}
                        onDeselectWidget={clearSelection}
                        onAddComponent={handleAddComponent}
                        onDragEnd={handleDragEnd}
                    />
                </div>
            </div>
            {showUndoNotification && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    backgroundColor: 'var(--colorNeutralBackgroundInverted)',
                    color: 'var(--colorNeutralForegroundInverted)',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    boxShadow: 'var(--shadow8)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 10000,
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <span>已删除组件</span>
                    <Button
                        appearance="primary"
                        size="small"
                        onClick={handleUndoDelete}
                    >
                        撤销
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ComponentSettings;

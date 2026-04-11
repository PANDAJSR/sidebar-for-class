import React, { DragEvent, PointerEvent } from 'react';
import { mergeClasses, Button } from "@fluentui/react-components";
import { DeleteRegular } from "@fluentui/react-icons";

interface Widget {
    type: 'launcher' | 'volume_slider' | 'files' | 'drag_to_launch' | 'toolbar' | 'iccce_control';
    layout?: string;
    targets?: Array<{ name: string; target: string; args: string[] }>;
    range?: [number, number];
    folder_path?: string;
    max_count?: number;
    name?: string;
    show_all_time?: boolean;
    tools?: string[];
    functions?: string[];
    show_only_when_running?: boolean;
}

interface Config {
    widgets: Widget[];
}

interface PreviewPanelProps {
    config: Config;
    styles: {
        previewPanel: string;
        widgetList: string;
        widgetItem: string;
        widgetItemSelected: string;
        widgetDragging: string;
        widgetDragOver: string;
        widgetHidden: string;
        widgetDropZone: string;
        widgetDropZoneDragOver: string;
        dragGhost: string;
        widgetType: string;
        widgetInfo: string;
    };
    isLongPressing: boolean;
    draggingIndex: number | null;
    dragOverIndex: number | null;
    selectedWidgetIndex: number | null;
    pointerPos: { x: number; y: number };
    clearSelection: () => void;
    handlePointerMove: (e: PointerEvent) => void;
    handlePointerUp: (index: number | null) => void;
    handlePointerDown: (e: PointerEvent, index: number) => void;
    handleDragStart: (e: DragEvent, index: number) => void;
    handleDragOver: (e: DragEvent, index: number) => void;
    handleDragLeave: (index: number) => void;
    handleDragEnd: () => void;
    handleDrop: (e: DragEvent, index: number) => void;
    handleWidgetClick: (e: React.MouseEvent, index: number) => void;
    handleDeleteWidget: (index: number) => void;
    LauncherItemPreview: React.ComponentType<{ name?: string; target?: string; args?: string[]; widgetIndex: number; targetIndex: number }>;
    VolumeWidgetPreview: React.ComponentType<Widget>;
    FilesWidgetPreview: React.ComponentType<Widget & { widgetIndex: number }>;
    DragToLaunchWidgetPreview: React.ComponentType<Widget & { widgetIndex: number }>;
    ToolbarWidgetPreview: React.ComponentType<Widget>;
    ICCCeControlPreview: React.ComponentType<Widget>;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
    config,
    styles,
    isLongPressing,
    draggingIndex,
    dragOverIndex,
    selectedWidgetIndex,
    pointerPos,
    clearSelection,
    handlePointerMove,
    handlePointerUp,
    handlePointerDown,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDragEnd,
    handleDrop,
    handleWidgetClick,
    handleDeleteWidget,
    LauncherItemPreview,
    VolumeWidgetPreview,
    FilesWidgetPreview,
    DragToLaunchWidgetPreview,
    ToolbarWidgetPreview,
    ICCCeControlPreview
}) => {
    const WIDGET_TYPE_NAMES: Record<string, string> = {
        launcher: '启动器',
        volume_slider: '音量控制',
        files: '文件列表',
        drag_to_launch: '拖放速启',
        toolbar: '快捷工具栏',
        iccce_control: 'ICC-CE 控制'
    };

    const handlePointerUpWrapper = (e: PointerEvent) => {
        handlePointerUp(dragOverIndex);
    };

    return (
        <div
            className={styles.previewPanel}
            style={{
                justifyContent: 'flex-start',
                overflowY: 'auto',
                touchAction: isLongPressing ? 'none' : 'auto'
            }}
            onClick={clearSelection}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpWrapper}
            onPointerCancel={handlePointerUpWrapper}
        >
            <div className={styles.widgetList} style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                {config.widgets.map((widget, index) => (
                    <div
                        key={index}
                        data-widget-index={index}
                        draggable={!isLongPressing}
                        onPointerDown={(e) => handlePointerDown(e, index)}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={(e) => {
                            if (e.currentTarget.contains(e.relatedTarget)) return;
                            handleDragLeave(index);
                        }}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, index)}
                        className={mergeClasses(
                            styles.widgetItem,
                            selectedWidgetIndex === index && styles.widgetItemSelected,
                            draggingIndex === index && styles.widgetDragging,
                            dragOverIndex === index && styles.widgetDragOver,
                            isLongPressing && draggingIndex === index && styles.widgetHidden
                        )}
                        onClick={(e) => handleWidgetClick(e, index)}
                        onContextMenu={(e) => {
                            if (isLongPressing) e.preventDefault();
                        }}
                    >
                        <div style={{
                            pointerEvents: 'none',
                            userSelect: 'none',
                            marginBottom: selectedWidgetIndex === index ? '12px' : '0'
                        }}>
                            {widget.type === 'launcher' && (
                                <div className={`launcher-group layout-${widget.layout || 'vertical'}`}>
                                    {widget.targets?.map((target, tIndex) => (
                                        <LauncherItemPreview key={tIndex} {...target} widgetIndex={index} targetIndex={tIndex} />
                                    ))}
                                </div>
                            )}
                            {widget.type === 'volume_slider' && <VolumeWidgetPreview {...widget} />}
                            {widget.type === 'files' && <FilesWidgetPreview {...widget} widgetIndex={index} />}
                            {widget.type === 'drag_to_launch' && (
                                <div className="launcher-group layout-vertical">
                                    <DragToLaunchWidgetPreview {...widget} widgetIndex={index} />
                                </div>
                            )}
                            {widget.type === 'toolbar' && <ToolbarWidgetPreview {...widget} />}
                            {widget.type === 'iccce_control' && <ICCCeControlPreview {...widget} />}
                        </div>

                        {selectedWidgetIndex === index && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: '1px solid var(--colorNeutralStroke2)',
                                paddingTop: '8px'
                            }}>
                                <div className={styles.widgetType} style={{ marginBottom: 0 }}>
                                    {WIDGET_TYPE_NAMES[widget.type] || widget.type}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className={styles.widgetInfo}>
                                        {widget.name || (
                                            widget.type === 'launcher' ? `${widget.targets?.length || 0} 个目标` : 
                                            widget.type === 'toolbar' ? `${widget.tools?.length || 0} 个工具` : 
                                            widget.type === 'iccce_control' ? `${widget.functions?.length || 0} 个功能` :
                                            (WIDGET_TYPE_NAMES[widget.type] || widget.type)
                                        )}
                                    </div>
                                    <Button
                                        icon={<DeleteRegular />}
                                        appearance="subtle"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteWidget(index);
                                        }}
                                        aria-label="删除组件"
                                        title="删除组件"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <div
                    style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100px' }}
                    onDragOver={(e) => handleDragOver(e, config.widgets.length)}
                    onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget)) return;
                        handleDragLeave(config.widgets.length);
                    }}
                    onDrop={(e) => handleDrop(e, config.widgets.length)}
                >
                    <div
                        data-widget-index={config.widgets.length}
                        className={mergeClasses(
                            styles.widgetDropZone,
                            dragOverIndex === config.widgets.length && styles.widgetDropZoneDragOver
                        )}
                    />
                </div>
            </div>

            {isLongPressing && draggingIndex !== null && (
                <div
                    className={styles.dragGhost}
                    style={{
                        left: pointerPos.x,
                        top: pointerPos.y,
                        width: '200px',
                        opacity: 0.8,
                        pointerEvents: 'none',
                        position: 'fixed',
                        transform: 'translate(-50%, -50%) scale(1.05)',
                        zIndex: 1000,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'var(--colorNeutralBackground1)',
                        padding: '12px'
                    }}
                >
                    {(() => {
                        const widget = config.widgets[draggingIndex];
                        return (
                            <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
                                {widget.type === 'launcher' && (
                                    <div className={`launcher-group layout-${widget.layout || 'vertical'}`}>
                                        {widget.targets?.map((target, tIndex) => (
                                            <LauncherItemPreview key={tIndex} {...target} widgetIndex={draggingIndex} targetIndex={tIndex} />
                                        ))}
                                    </div>
                                )}
                                {widget.type === 'volume_slider' && <VolumeWidgetPreview {...widget} />}
                                {widget.type === 'files' && <FilesWidgetPreview {...widget} widgetIndex={draggingIndex} />}
                                {widget.type === 'drag_to_launch' && (
                                    <DragToLaunchWidgetPreview {...widget} widgetIndex={draggingIndex} />
                                )}
                                {widget.type === 'toolbar' && <ToolbarWidgetPreview {...widget} />}
                                {widget.type === 'iccce_control' && <ICCCeControlPreview {...widget} />}
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default PreviewPanel;
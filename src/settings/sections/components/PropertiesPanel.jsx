/**
 * 属性面板组件
 * 显示选中组件的属性，支持编辑组件的各种配置
 * @param {Object} styles - 样式对象
 * @param {string} activeTab - 当前激活的标签页
 * @param {Function} setActiveTab - 设置激活标签页的函数
 * @param {Object} selectedWidget - 当前选中的组件对象
 * @param {Function} updateWidgetProperty - 更新组件属性的函数
 * @param {Function} onDeselectWidget - 取消选择组件的回调函数
 */

import { useState } from 'react';
import 'mdui/components/card.js';
import 'mdui/components/slider.js';
import 'mdui/components/switch.js';
import 'mdui/components/text-field.js';
import 'mdui/components/dropdown.js';
import 'mdui/components/menu.js';
import 'mdui/components/menu-item.js';
import 'mdui/components/button.js';
import 'mdui/components/tabs.js';
import 'mdui/components/tab.js';
import 'mdui/components/tab-panel.js';
import 'mdui/components/divider.js';
import 'mdui/components/button-icon.js';
import 'mdui/components/icon.js';

const PropertiesPanel = ({
    config,
    updateConfig,
    styles,
    activeTab,
    setActiveTab,
    selectedWidget,
    updateWidgetProperty,
    onDeselectWidget,
    onAddComponent,
    onDragEnd
}) => {
    // 当前正在编辑的目标索引（用于启动器组件）
    const [editingTargetIndex, setEditingTargetIndex] = useState(null);

    // 工具栏拖拽状态
    const [draggingToolIndex, setDraggingToolIndex] = useState(null);
    const [dragOverToolIndex, setDragOverToolIndex] = useState(null);

    // 处理标签页切换事件
    const handleTabChange = (e) => {
        const newTab = e.target.value;
        setActiveTab(newTab);
        if (newTab === 'library' && onDeselectWidget) {
            onDeselectWidget();
        }
    };

    // 添加新的启动目标
    const handleAddTarget = () => {
        const currentTargets = selectedWidget.targets || [];
        const newTarget = {
            name: '新目标',
            target: '',
            args: []
        };
        updateWidgetProperty('targets', [...currentTargets, newTarget]);
        setEditingTargetIndex(currentTargets.length);
    };

    // 删除启动目标
    const handleDeleteTarget = (index) => {
        const currentTargets = selectedWidget.targets || [];
        const newTargets = currentTargets.filter((_, i) => i !== index);
        updateWidgetProperty('targets', newTargets);
        if (editingTargetIndex === index) {
            setEditingTargetIndex(null);
        } else if (editingTargetIndex > index) {
            setEditingTargetIndex(editingTargetIndex - 1);
        }
    };

    // 更新启动目标
    const handleUpdateTarget = (index, field, value) => {
        const currentTargets = selectedWidget.targets || [];
        const newTargets = currentTargets.map((target, i) => {
            if (i === index) {
                return { ...target, [field]: value };
            }
            return target;
        });
        updateWidgetProperty('targets', newTargets);
    };

    // 移动启动目标位置
    const handleMoveTarget = (index, direction) => {
        const currentTargets = selectedWidget.targets || [];
        if (direction === 'up' && index > 0) {
            const newTargets = [...currentTargets];
            [newTargets[index - 1], newTargets[index]] = [newTargets[index], newTargets[index - 1]];
            updateWidgetProperty('targets', newTargets);
            if (editingTargetIndex === index) {
                setEditingTargetIndex(index - 1);
            } else if (editingTargetIndex === index - 1) {
                setEditingTargetIndex(index);
            }
        } else if (direction === 'down' && index < currentTargets.length - 1) {
            const newTargets = [...currentTargets];
            [newTargets[index], newTargets[index + 1]] = [newTargets[index + 1], newTargets[index]];
            updateWidgetProperty('targets', newTargets);
            if (editingTargetIndex === index) {
                setEditingTargetIndex(index + 1);
            } else if (editingTargetIndex === index + 1) {
                setEditingTargetIndex(index);
            }
        }
    };

    // --- 工具栏组件处理函数 ---

    // 添加工具项
    const handleAddTool = () => {
        const currentTools = selectedWidget.tools || [];
        updateWidgetProperty('tools', [...currentTools, 'screenshot']);
    };

    // 删除工具项
    const handleDeleteTool = (index) => {
        const currentTools = selectedWidget.tools || [];
        const newTools = currentTools.filter((_, i) => i !== index);
        updateWidgetProperty('tools', newTools);
    };

    // 更新工具项
    const handleUpdateTool = (index, newValue) => {
        const currentTools = selectedWidget.tools || [];
        const newTools = [...currentTools];
        newTools[index] = newValue;
        updateWidgetProperty('tools', newTools);
    };

    // 工具项拖拽开始
    const handleToolDragStart = (e, index) => {
        setDraggingToolIndex(index);
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
    };

    // 工具项拖拽悬停
    const handleToolDragOver = (e, index) => {
        e.preventDefault();
        if (draggingToolIndex === null || draggingToolIndex === index) return;
        setDragOverToolIndex(index);
    };

    // 工具项放置
    const handleToolDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggingToolIndex === null || draggingToolIndex === targetIndex) {
            setDraggingToolIndex(null);
            setDragOverToolIndex(null);
            return;
        }

        const currentTools = selectedWidget.tools || [];
        const newTools = [...currentTools];
        const draggedTool = newTools[draggingToolIndex];

        newTools.splice(draggingToolIndex, 1);
        newTools.splice(targetIndex, 0, draggedTool);

        updateWidgetProperty('tools', newTools);
        setDraggingToolIndex(null);
        setDragOverToolIndex(null);
    };

    // --- ICCCE 控制组件处理函数 ---

    // 添加功能项
    const handleAddFunction = () => {
        const currentFunctions = selectedWidget.functions || [];
        updateWidgetProperty('functions', [...currentFunctions, 'randone']);
    };

    // 删除功能项
    const handleDeleteFunction = (index) => {
        const currentFunctions = selectedWidget.functions || [];
        const newFunctions = currentFunctions.filter((_, i) => i !== index);
        updateWidgetProperty('functions', newFunctions);
    };

    // 更新功能项
    const handleUpdateFunction = (index, newValue) => {
        const currentFunctions = selectedWidget.functions || [];
        const newFunctions = [...currentFunctions];
        newFunctions[index] = newValue;
        updateWidgetProperty('functions', newFunctions);
    };

    // 功能项拖拽开始
    const [draggingFuncIndex, setDraggingFuncIndex] = useState(null);
    const [dragOverFuncIndex, setDragOverFuncIndex] = useState(null);

    const handleFuncDragStart = (e, index) => {
        setDraggingFuncIndex(index);
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
    };

    // 功能项拖拽悬停
    const handleFuncDragOver = (e, index) => {
        e.preventDefault();
        if (draggingFuncIndex === null || draggingFuncIndex === index) return;
        setDragOverFuncIndex(index);
    };

    // 功能项放置
    const handleFuncDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggingFuncIndex === null || draggingFuncIndex === targetIndex) {
            setDraggingFuncIndex(null);
            setDragOverFuncIndex(null);
            return;
        }

        const currentFunctions = selectedWidget.functions || [];
        const newFunctions = [...currentFunctions];
        const draggedFunc = newFunctions[draggingFuncIndex];

        newFunctions.splice(draggingFuncIndex, 1);
        newFunctions.splice(targetIndex, 0, draggedFunc);

        updateWidgetProperty('functions', newFunctions);
        setDraggingFuncIndex(null);
        setDragOverFuncIndex(null);
    };

    // 处理库组件拖拽开始
    const handleLibraryDragStart = (e, type) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('application/react-dnd-type', type);
    };

    return (
        <div className={styles.propertiesPanel}>
            {/* 标签页导航 */}
            <mdui-tabs active-tab={activeTab} onChange={handleTabChange}>
                <mdui-tab value="properties" onClick={() => setActiveTab('properties')}>属性</mdui-tab>
                <mdui-tab value="library" onClick={() => { setActiveTab('library'); onDeselectWidget && onDeselectWidget(); }}>组件库</mdui-tab>
            </mdui-tabs>

            {/* 属性标签页内容 */}
            {activeTab === 'properties' && selectedWidget && (
                <div className={styles.propertiesContent}>
                    <div className={styles.propertyGroup}>
                        <div className={styles.panelTitle} style={{ fontSize: '22px', fontWeight: '600', marginBottom: '8px' }}>组件属性</div>
                        <div style={{ color: 'var(--mdui-color-on-surface-variant)', fontSize: '14px' }}>编辑选中组件的属性</div>
                    </div>

                    {/* 启动器组件的属性 */}
                    {selectedWidget.type === 'launcher' && (
                        <div className={styles.propertySection}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>布局方式</div>
                                <mdui-dropdown>
                                    <mdui-button slot="trigger" variant="outlined" style={{ width: '100%', justifyContent: 'space-between' }}>
                                        {{
                                            'vertical': '列表',
                                            'grid': '网格（最大3×n）',
                                            'grid_no_text': '无文字网格（最大4×n）'
                                        }[selectedWidget.layout || 'vertical'] || '列表'}
                                    </mdui-button>
                                    <mdui-menu>
                                        <mdui-menu-item
                                            value="vertical"
                                            onClick={() => updateWidgetProperty('layout', 'vertical')}
                                        >列表</mdui-menu-item>
                                        <mdui-menu-item
                                            value="grid"
                                            onClick={() => updateWidgetProperty('layout', 'grid')}
                                        >网格（最大3×n）</mdui-menu-item>
                                        <mdui-menu-item
                                            value="grid_no_text"
                                            onClick={() => updateWidgetProperty('layout', 'grid_no_text')}
                                        >无文字网格（最大4×n）</mdui-menu-item>
                                    </mdui-menu>
                                </mdui-dropdown>
                            </div>

                            <mdui-divider style={{ margin: '20px 0' }} />

                            <div className={styles.propertyGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div className={styles.sectionTitle} style={{ fontSize: '18px', fontWeight: '600' }}>启动目标</div>
                                    <mdui-button
                                        variant="filled"
                                        icon="add"
                                        onClick={handleAddTarget}
                                    >
                                        添加目标
                                    </mdui-button>
                                </div>
                                {/* 渲染所有启动目标 */}
                                {(selectedWidget.targets || []).map((target, index) => (
                                    <mdui-card
                                        key={index}
                                        variant="filled"
                                        style={{
                                            padding: '16px',
                                            marginBottom: '16px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--mdui-color-on-surface)' }}>目标 {index + 1}</div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <mdui-button-icon
                                                    icon="arrow_upward"
                                                    disabled={index === 0}
                                                    onClick={() => handleMoveTarget(index, 'up')}
                                                />
                                                <mdui-button-icon
                                                    icon="arrow_downward"
                                                    disabled={index === (selectedWidget.targets?.length || 0) - 1}
                                                    onClick={() => handleMoveTarget(index, 'down')}
                                                />
                                                <mdui-button-icon
                                                    icon="delete"
                                                    onClick={() => handleDeleteTarget(index)}
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                                            <div className={styles.label}>显示名称</div>
                                            <mdui-text-field
                                                value={target.name || ''}
                                                onChange={(e) => handleUpdateTarget(index, 'name', e.target.value)}
                                                placeholder="输入显示名称"
                                                variant="outlined"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                                            <div className={styles.label}>目标路径或 URI</div>
                                            <mdui-text-field
                                                value={target.target || ''}
                                                onChange={(e) => handleUpdateTarget(index, 'target', e.target.value)}
                                                placeholder="例如: notepad.exe 或 classisland://app/test"
                                                variant="outlined"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <div className={styles.label}>启动参数</div>
                                            <mdui-text-field
                                                value={Array.isArray(target.args) ? target.args.join(' ') : ''}
                                                onChange={(e) => handleUpdateTarget(index, 'args', e.target.value.split(' ').filter(arg => arg.trim()))}
                                                placeholder="输入启动参数，用空格分隔"
                                                variant="outlined"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    </mdui-card>
                                ))}
                                {/* 无目标时的提示 */}
                                {(selectedWidget.targets || []).length === 0 && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '24px',
                                        color: 'var(--mdui-color-on-surface-variant)'
                                    }}>
                                        暂无启动目标，点击上方按钮添加
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 音量控制组件的属性 */}
                    {selectedWidget.type === 'volume_slider' && (
                        <div className={styles.propertySection}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>最小值</div>
                                <div className={styles.rangeContainer}>
                                    <mdui-slider
                                        min={0}
                                        max={100}
                                        step={10}
                                        value={selectedWidget.range?.[0] || 0}
                                        onChange={(e) => {
                                            const currentMax = selectedWidget.range?.[1] || 100;
                                            const newVal = Math.min(parseInt(e.target.value), currentMax);
                                            updateWidgetProperty('range', [newVal, currentMax]);
                                        }}
                                    />
                                    <span className={styles.rangeValue}>{selectedWidget.range?.[0] || 0}%</span>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>最大值</div>
                                <div className={styles.rangeContainer}>
                                    <mdui-slider
                                        min={0}
                                        max={100}
                                        step={10}
                                        value={selectedWidget.range?.[1] || 100}
                                        onChange={(e) => {
                                            const currentMin = selectedWidget.range?.[0] || 0;
                                            const newVal = Math.max(parseInt(e.target.value), currentMin);
                                            updateWidgetProperty('range', [currentMin, newVal]);
                                        }}
                                    />
                                    <span className={styles.rangeValue}>{selectedWidget.range?.[1] || 100}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 文件列表组件的属性 */}
                    {selectedWidget.type === 'files' && (
                        <div className={styles.propertySection}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>文件夹路径</div>
                                <mdui-text-field
                                    value={selectedWidget.folder_path || ''}
                                    onChange={(e) => updateWidgetProperty('folder_path', e.target.value)}
                                    variant="outlined"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>最大显示数量</div>
                                <mdui-text-field
                                    type="number"
                                    value={selectedWidget.max_count || 10}
                                    onChange={(e) => updateWidgetProperty('max_count', parseInt(e.target.value) || 10)}
                                    variant="outlined"
                                    style={{ width: '200px' }}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>布局方向</div>
                                <mdui-dropdown>
                                    <mdui-button slot="trigger" variant="outlined" style={{ width: '120px' }}>
                                        {{
                                            'vertical': '垂直',
                                            'horizontal': '水平'
                                        }[selectedWidget.layout || 'vertical'] || '垂直'}
                                    </mdui-button>
                                    <mdui-menu>
                                        <mdui-menu-item
                                            value="vertical"
                                            onClick={() => updateWidgetProperty('layout', 'vertical')}
                                        >垂直</mdui-menu-item>
                                        <mdui-menu-item
                                            value="horizontal"
                                            onClick={() => updateWidgetProperty('layout', 'horizontal')}
                                        >水平</mdui-menu-item>
                                    </mdui-menu>
                                </mdui-dropdown>
                            </div>
                        </div>
                    )}

                    {/* 拖放速启组件的属性 */}
                    {selectedWidget.type === 'drag_to_launch' && (
                        <div className={styles.propertySection}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>显示名称</div>
                                <mdui-text-field
                                    value={selectedWidget.name || ''}
                                    onChange={(e) => updateWidgetProperty('name', e.target.value)}
                                    variant="outlined"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>目标路径</div>
                                <mdui-text-field
                                    value={selectedWidget.targets || ''}
                                    onChange={(e) => updateWidgetProperty('targets', e.target.value)}
                                    placeholder="例如: C:\\Program Files\\LocalSend\\localsend_app.exe {{source}}"
                                    variant="outlined"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--mdui-color-on-surface-variant)', marginTop: '-8px', marginBottom: '16px' }}>
                                {"{{source}}"} 表示拖放的文件路径，会在运行时自动替换为实际文件路径
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.switchRow}>
                                    <div className={styles.label}>是否始终显示</div>
                                    <mdui-switch
                                        checked={selectedWidget.show_all_time || false}
                                        onChange={(e) => updateWidgetProperty('show_all_time', e.target.checked)}
                                    />
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--mdui-color-on-surface-variant)', marginTop: '-8px', marginBottom: '16px' }}>
                                开启后，即使侧边栏不是通过检测到拖放自动展开的，也会显示
                            </div>
                        </div>
                    )}

                    {/* 工具栏组件的属性 */}
                    {selectedWidget.type === 'toolbar' && (
                        <div className={styles.propertySection}>
                            <div className={styles.propertyGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div className={styles.sectionTitle} style={{ fontSize: '18px', fontWeight: '600' }}>显示的工具</div>
                                    <mdui-button
                                        variant="filled"
                                        icon="add"
                                        onClick={handleAddTool}
                                    >
                                        添加工具
                                    </mdui-button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(selectedWidget.tools || []).map((toolId, index) => {
                                        const toolOptions = [
                                            { id: 'screenshot', label: '截图' },
                                            { id: 'show_desktop', label: '显示桌面' },
                                            { id: 'taskview', label: '任务视图' },
                                            { id: 'close_front_window', label: '关闭窗口' },
                                            { id: 'timer', label: '计时器' },
                                            { id: 'touch_keyboard', label: '触摸键盘' },
                                        ];
                                        const currentTool = toolOptions.find(t => t.id === toolId) || { id: toolId, label: toolId };

                                        return (
                                            <div
                                                key={`${index}-${toolId}`}
                                                draggable
                                                onDragStart={(e) => handleToolDragStart(e, index)}
                                                onDragOver={(e) => handleToolDragOver(e, index)}
                                                onDrop={(e) => handleToolDrop(e, index)}
                                                onDragEnd={() => {
                                                    setDraggingToolIndex(null);
                                                    setDragOverToolIndex(null);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '8px',
                                                    backgroundColor: draggingToolIndex === index
                                                        ? 'var(--mdui-color-surface-variant)'
                                                        : dragOverToolIndex === index
                                                            ? 'var(--mdui-color-surface-container-high)'
                                                            : 'var(--mdui-color-surface-container)',
                                                    border: '1px solid var(--mdui-color-outline-variant)',
                                                    borderRadius: '8px',
                                                    cursor: 'default',
                                                    opacity: draggingToolIndex === index ? 0.5 : 1,
                                                    transition: 'all 0.1s ease'
                                                }}
                                            >
                                                <div style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--mdui-color-on-surface-variant)' }}>
                                                    <mdui-icon name="drag_handle"></mdui-icon>
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <mdui-dropdown>
                                                        <mdui-button slot="trigger" variant="text" style={{ width: '100%', justifyContent: 'flex-start' }}>
                                                            {currentTool.label}
                                                        </mdui-button>
                                                        <mdui-menu>
                                                            {toolOptions.map(option => (
                                                                <mdui-menu-item
                                                                    key={option.id}
                                                                    value={option.id}
                                                                    onClick={() => handleUpdateTool(index, option.id)}
                                                                >
                                                                    {option.label}
                                                                </mdui-menu-item>
                                                            ))}
                                                        </mdui-menu>
                                                    </mdui-dropdown>
                                                </div>

                                                <mdui-button-icon
                                                    icon="delete"
                                                    onClick={() => handleDeleteTool(index)}
                                                />
                                            </div>
                                        );
                                    })}

                                    {(selectedWidget.tools || []).length === 0 && (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '12px',
                                            color: 'var(--mdui-color-on-surface-variant)',
                                            fontSize: '12px',
                                            border: '1px dashed var(--mdui-color-outline)',
                                            borderRadius: '8px'
                                        }}>
                                            暂无工具，点击上方按钮添加
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ICCCE 控制组件的属性 */}
                    {selectedWidget.type === 'iccce_control' && (
                        <div className={styles.propertySection}>
                            <div className={styles.propertyGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div className={styles.sectionTitle} style={{ fontSize: '18px', fontWeight: '600' }}>显示的功能</div>
                                    <mdui-button
                                        variant="filled"
                                        icon="add"
                                        onClick={handleAddFunction}
                                    >
                                        添加功能
                                    </mdui-button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(selectedWidget.functions || []).map((funcId, index) => {
                                        const funcOptions = [
                                            { id: 'randone', label: '单次抽' },
                                            { id: 'rand', label: '随机抽' },
                                            { id: 'timer', label: '计时器' },
                                            { id: 'whiteboard', label: '白板' },
                                            { id: 'toggle', label: '切换显隐' },
                                        ];
                                        const currentFunc = funcOptions.find(f => f.id === funcId || (f.id === 'toggle' && funcId === 'show')) || { id: funcId, label: funcId };

                                        return (
                                            <div
                                                key={`${index}-${funcId}`}
                                                draggable
                                                onDragStart={(e) => handleFuncDragStart(e, index)}
                                                onDragOver={(e) => handleFuncDragOver(e, index)}
                                                onDrop={(e) => handleFuncDrop(e, index)}
                                                onDragEnd={() => {
                                                    setDraggingFuncIndex(null);
                                                    setDragOverFuncIndex(null);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '8px',
                                                    backgroundColor: draggingFuncIndex === index
                                                        ? 'var(--mdui-color-surface-variant)'
                                                        : dragOverFuncIndex === index
                                                            ? 'var(--mdui-color-surface-container-high)'
                                                            : 'var(--mdui-color-surface-container)',
                                                    border: '1px solid var(--mdui-color-outline-variant)',
                                                    borderRadius: '8px',
                                                    cursor: 'default',
                                                    opacity: draggingFuncIndex === index ? 0.5 : 1,
                                                    transition: 'all 0.1s ease'
                                                }}
                                            >
                                                <div style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--mdui-color-on-surface-variant)' }}>
                                                    <mdui-icon name="drag_handle"></mdui-icon>
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <mdui-dropdown>
                                                        <mdui-button slot="trigger" variant="text" style={{ width: '100%', justifyContent: 'flex-start' }}>
                                                            {currentFunc.label}
                                                        </mdui-button>
                                                        <mdui-menu>
                                                            {funcOptions.map(option => (
                                                                <mdui-menu-item
                                                                    key={option.id}
                                                                    value={option.id}
                                                                    onClick={() => handleUpdateFunction(index, option.id)}
                                                                >
                                                                    {option.label}
                                                                </mdui-menu-item>
                                                            ))}
                                                        </mdui-menu>
                                                    </mdui-dropdown>
                                                </div>

                                                <mdui-button-icon
                                                    icon="delete"
                                                    onClick={() => handleDeleteFunction(index)}
                                                />
                                            </div>
                                        );
                                    })}

                                    {(selectedWidget.functions || []).length === 0 && (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '12px',
                                            color: 'var(--mdui-color-on-surface-variant)',
                                            fontSize: '12px',
                                            border: '1px dashed var(--mdui-color-outline)',
                                            borderRadius: '8px'
                                        }}>
                                            暂无功能，点击上方按钮添加
                                        </div>
                                    )}
                                </div>
                            </div>

                            <mdui-divider style={{ margin: '20px 0' }} />

                            <div className={styles.propertyGroup}>
                                <div className={styles.switchRow}>
                                    <span style={{ fontSize: '14px' }}>仅在 ICC-CE 运行时显示该组件</span>
                                    <mdui-switch
                                        checked={selectedWidget.show_only_when_running !== false}
                                        onChange={(e) => updateWidgetProperty('show_only_when_running', e.target.checked)}
                                    />
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--mdui-color-on-surface-variant)', marginTop: '4px' }}>
                                    开启后，若未检测到 InkCanvasForClass.exe 进程，此组件将自动隐藏。
                                </div>
                            </div>

                            <mdui-divider style={{ margin: '20px 0' }} />

                            <mdui-card variant="filled" style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--mdui-color-primary)' }}>
                                    <mdui-icon name="info"></mdui-icon>
                                    <span style={{ fontWeight: '600', fontSize: '13px' }}>使用建议</span>
                                </div>
                                <div style={{ display: 'block', marginBottom: '16px', color: 'var(--mdui-color-on-surface-variant)', fontSize: '12px' }}>
                                    建议前往"辅助工具"设置打开"ICC-CE 兼容"模式，以获得最佳的交互体验。
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '500' }}>ICC-CE 兼容模式</span>
                                    <mdui-switch
                                        checked={config?.helper_tools?.icc_compatibility || false}
                                        onChange={(e) => {
                                            updateConfig({
                                                ...config,
                                                helper_tools: {
                                                    ...config.helper_tools,
                                                    icc_compatibility: e.target.checked
                                                }
                                            });
                                            // 实时生效逻辑
                                            const uri = e.target.checked ? 'icc://thoroughHideOn' : 'icc://thoroughHideOff';
                                            if (window.electronAPI && window.electronAPI.launchApp) {
                                                window.electronAPI.launchApp(uri);
                                            }
                                        }}
                                    />
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--mdui-color-on-surface-variant)', marginTop: '4px' }}>
                                    开启后，本软件启动时将自动隐藏 ICC-CE 侧边栏，以避免界面上的交互冲突。
                                </div>
                            </mdui-card>
                        </div>
                    )}
                </div>
            )}

            {/* 组件库标签页内容 */}
            {activeTab === 'library' && (
                <div className={styles.propertiesContent}>
                    <div className={styles.panelTitle} style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px' }}>组件库</div>
                    <div className={styles.libraryGrid}>
                        {/* 启动器组件 */}
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('launcher')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'launcher')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <mdui-icon name="rocket"></mdui-icon>
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>启动器</span>
                                <span className={styles.libraryItemDesc}>快速启动应用程序或文件</span>
                            </div>
                        </div>

                        {/* 音量控制组件 */}
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('volume_slider')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'volume_slider')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <mdui-icon name="volume_up"></mdui-icon>
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>音量控制</span>
                                <span className={styles.libraryItemDesc}>滑动调节系统音量</span>
                            </div>
                        </div>

                        {/* 拖放速启组件 */}
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('drag_to_launch')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'drag_to_launch')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <mdui-icon name="input"></mdui-icon>
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>拖放速启</span>
                                <span className={styles.libraryItemDesc}>拖拽文件到此处快速打开</span>
                            </div>
                        </div>

                        {/* 文件列表组件 */}
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('files')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'files')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <mdui-icon name="folder"></mdui-icon>
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>文件列表</span>
                                <span className={styles.libraryItemDesc}>显示指定文件夹内容</span>
                            </div>
                        </div>

                        {/* 工具栏组件 */}
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('toolbar')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'toolbar')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <mdui-icon name="build"></mdui-icon>
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>工具栏</span>
                                <span className={styles.libraryItemDesc}>包含截图、显示桌面等工具</span>
                            </div>
                        </div>

                        {/* ICCCE 控制组件 */}
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('iccce_control')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'iccce_control')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <mdui-icon name="school"></mdui-icon>
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>ICC-CE 控制</span>
                                <span className={styles.libraryItemDesc}>集成 ICC-CE 随机抽选、白板等功能</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 未选择组件时的提示 */}
            {activeTab === 'properties' && !selectedWidget && (
                <div className={styles.propertiesContent}>
                    <div className={styles.propertyGroup}>
                        <div className={styles.panelTitle} style={{ fontSize: '22px', fontWeight: '600', marginBottom: '8px' }}>选择组件</div>
                        <div style={{ color: 'var(--mdui-color-on-surface-variant)', fontSize: '14px' }}>点击左侧组件以编辑其属性</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertiesPanel;

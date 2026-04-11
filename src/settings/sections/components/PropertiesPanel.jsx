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
import Card from '@mui/joy/Card';
import Slider from '@mui/joy/Slider';
import Switch from '@mui/joy/Switch';
import Input from '@mui/joy/Input';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Button from '@mui/joy/Button';
import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import Divider from '@mui/joy/Divider';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import Box from '@mui/joy/Box';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import InfoIcon from '@mui/icons-material/Info';
import RocketIcon from '@mui/icons-material/Rocket';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import InputIcon from '@mui/icons-material/Input';
import FolderIcon from '@mui/icons-material/Folder';
import BuildIcon from '@mui/icons-material/Build';
import SchoolIcon from '@mui/icons-material/School';

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
    const [editingTargetIndex, setEditingTargetIndex] = useState(null);
    const [draggingToolIndex, setDraggingToolIndex] = useState(null);
    const [dragOverToolIndex, setDragOverToolIndex] = useState(null);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'library' && onDeselectWidget) {
            onDeselectWidget();
        }
    };

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

    const handleAddTool = () => {
        const currentTools = selectedWidget.tools || [];
        updateWidgetProperty('tools', [...currentTools, 'screenshot']);
    };

    const handleDeleteTool = (index) => {
        const currentTools = selectedWidget.tools || [];
        const newTools = currentTools.filter((_, i) => i !== index);
        updateWidgetProperty('tools', newTools);
    };

    const handleUpdateTool = (index, newValue) => {
        const currentTools = selectedWidget.tools || [];
        const newTools = [...currentTools];
        newTools[index] = newValue;
        updateWidgetProperty('tools', newTools);
    };

    const handleToolDragStart = (e, index) => {
        setDraggingToolIndex(index);
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
    };

    const handleToolDragOver = (e, index) => {
        e.preventDefault();
        if (draggingToolIndex === null || draggingToolIndex === index) return;
        setDragOverToolIndex(index);
    };

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

    const handleAddFunction = () => {
        const currentFunctions = selectedWidget.functions || [];
        updateWidgetProperty('functions', [...currentFunctions, 'randone']);
    };

    const handleDeleteFunction = (index) => {
        const currentFunctions = selectedWidget.functions || [];
        const newFunctions = currentFunctions.filter((_, i) => i !== index);
        updateWidgetProperty('functions', newFunctions);
    };

    const handleUpdateFunction = (index, newValue) => {
        const currentFunctions = selectedWidget.functions || [];
        const newFunctions = [...currentFunctions];
        newFunctions[index] = newValue;
        updateWidgetProperty('functions', newFunctions);
    };

    const [draggingFuncIndex, setDraggingFuncIndex] = useState(null);
    const [dragOverFuncIndex, setDragOverFuncIndex] = useState(null);

    const handleFuncDragStart = (e, index) => {
        setDraggingFuncIndex(index);
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
    };

    const handleFuncDragOver = (e, index) => {
        e.preventDefault();
        if (draggingFuncIndex === null || draggingFuncIndex === index) return;
        setDragOverFuncIndex(index);
    };

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

    const handleLibraryDragStart = (e, type) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('application/react-dnd-type', type);
    };

    return (
        <div className={styles.propertiesPanel}>
            <Tabs
                value={activeTab}
                onChange={(_, value) => handleTabChange(value)}
            >
                <TabList>
                    <Tab value="properties">属性</Tab>
                    <Tab value="library">组件库</Tab>
                </TabList>
            </Tabs>

            {activeTab === 'properties' && selectedWidget && (
                <div className={styles.propertiesContent}>
                    <div className={styles.propertyGroup}>
                        <Typography level="h5" sx={{ mb: 1 }}>组件属性</Typography>
                        <Typography level="body-sm" sx={{ color: 'var(--joy-palette-text-secondary)' }}>编辑选中组件的属性</Typography>
                    </div>

                    {selectedWidget.type === 'launcher' && (
                        <div className={styles.propertySection}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>布局方式</div>
                                <Select
                                    value={selectedWidget.layout || 'vertical'}
                                    onChange={(_, value) => updateWidgetProperty('layout', value)}
                                    sx={{ width: '100%' }}
                                >
                                    <Option value="vertical">列表</Option>
                                    <Option value="grid">网格（最大3×n）</Option>
                                    <Option value="grid_no_text">无文字网格（最大4×n）</Option>
                                </Select>
                            </div>

                            <Divider sx={{ my: 2 }} />

                            <div className={styles.propertyGroup}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography level="title-md" sx={{ fontWeight: 600 }}>启动目标</Typography>
                                    <Button
                                        variant="solid"
                                        size="sm"
                                        onClick={handleAddTarget}
                                        startDecorator={<span>+</span>}
                                    >
                                        添加目标
                                    </Button>
                                </Box>
                                {(selectedWidget.targets || []).map((target, index) => (
                                    <Card key={index} variant="soft" sx={{ p: 2, mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Typography level="body-sm" sx={{ fontWeight: 600 }}>目标 {index + 1}</Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <IconButton
                                                    size="sm"
                                                    variant="plain"
                                                    disabled={index === 0}
                                                    onClick={() => handleMoveTarget(index, 'up')}
                                                >
                                                    ↑
                                                </IconButton>
                                                <IconButton
                                                    size="sm"
                                                    variant="plain"
                                                    disabled={index === (selectedWidget.targets?.length || 0) - 1}
                                                    onClick={() => handleMoveTarget(index, 'down')}
                                                >
                                                    ↓
                                                </IconButton>
                                                <IconButton
                                                    size="sm"
                                                    variant="plain"
                                                    color="danger"
                                                    onClick={() => handleDeleteTarget(index)}
                                                >
                                                    ×
                                                </IconButton>
                                            </Box>
                                        </Box>
                                        <Box className={styles.formGroup} sx={{ mb: 1.5 }}>
                                            <div className={styles.label}>显示名称</div>
                                            <Input
                                                value={target.name || ''}
                                                onChange={(e) => handleUpdateTarget(index, 'name', e.target.value)}
                                                placeholder="输入显示名称"
                                                variant="outlined"
                                                size="sm"
                                                sx={{ width: '100%' }}
                                            />
                                        </Box>
                                        <Box className={styles.formGroup} sx={{ mb: 1.5 }}>
                                            <div className={styles.label}>目标路径或 URI</div>
                                            <Input
                                                value={target.target || ''}
                                                onChange={(e) => handleUpdateTarget(index, 'target', e.target.value)}
                                                placeholder="例如: notepad.exe 或 classisland://app/test"
                                                variant="outlined"
                                                size="sm"
                                                sx={{ width: '100%' }}
                                            />
                                        </Box>
                                        <Box className={styles.formGroup}>
                                            <div className={styles.label}>启动参数</div>
                                            <Input
                                                value={Array.isArray(target.args) ? target.args.join(' ') : ''}
                                                onChange={(e) => handleUpdateTarget(index, 'args', e.target.value.split(' ').filter(arg => arg.trim()))}
                                                placeholder="输入启动参数，用空格分隔"
                                                variant="outlined"
                                                size="sm"
                                                sx={{ width: '100%' }}
                                            />
                                        </Box>
                                    </Card>
                                ))}
                                {(selectedWidget.targets || []).length === 0 && (
                                    <Box sx={{ textAlign: 'center', py: 3, color: 'var(--joy-palette-text-secondary)' }}>
                                        暂无启动目标，点击上方按钮添加
                                    </Box>
                                )}
                            </div>
                        </div>
                    )}

                    {selectedWidget.type === 'volume_slider' && (
                        <div className={styles.propertySection}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>最小值</div>
                                <Box className={styles.rangeContainer}>
                                    <Slider
                                        min={0}
                                        max={100}
                                        step={10}
                                        value={selectedWidget.range?.[0] || 0}
                                        onChange={(_, value) => {
                                            const currentMax = selectedWidget.range?.[1] || 100;
                                            const newVal = Math.min(value, currentMax);
                                            updateWidgetProperty('range', [newVal, currentMax]);
                                        }}
                                    />
                                    <span className={styles.rangeValue}>{selectedWidget.range?.[0] || 0}%</span>
                                </Box>
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>最大值</div>
                                <Box className={styles.rangeContainer}>
                                    <Slider
                                        min={0}
                                        max={100}
                                        step={10}
                                        value={selectedWidget.range?.[1] || 100}
                                        onChange={(_, value) => {
                                            const currentMin = selectedWidget.range?.[0] || 0;
                                            const newVal = Math.max(value, currentMin);
                                            updateWidgetProperty('range', [currentMin, newVal]);
                                        }}
                                    />
                                    <span className={styles.rangeValue}>{selectedWidget.range?.[1] || 100}%</span>
                                </Box>
                            </div>
                        </div>
                    )}

                    {selectedWidget.type === 'files' && (
                        <div className={styles.propertySection}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>文件夹路径</div>
                                <Input
                                    value={selectedWidget.folder_path || ''}
                                    onChange={(e) => updateWidgetProperty('folder_path', e.target.value)}
                                    variant="outlined"
                                    size="sm"
                                    sx={{ width: '100%' }}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>最大显示数量</div>
                                <Input
                                    type="number"
                                    value={selectedWidget.max_count || 10}
                                    onChange={(e) => updateWidgetProperty('max_count', parseInt(e.target.value) || 10)}
                                    variant="outlined"
                                    size="sm"
                                    sx={{ width: 200 }}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>布局方向</div>
                                <Select
                                    value={selectedWidget.layout || 'vertical'}
                                    onChange={(_, value) => updateWidgetProperty('layout', value)}
                                    size="sm"
                                    sx={{ width: 120 }}
                                >
                                    <Option value="vertical">垂直</Option>
                                    <Option value="horizontal">水平</Option>
                                </Select>
                            </div>
                        </div>
                    )}

                    {selectedWidget.type === 'drag_to_launch' && (
                        <div className={styles.propertySection}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>显示名称</div>
                                <Input
                                    value={selectedWidget.name || ''}
                                    onChange={(e) => updateWidgetProperty('name', e.target.value)}
                                    variant="outlined"
                                    size="sm"
                                    sx={{ width: '100%' }}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>目标路径</div>
                                <Input
                                    value={selectedWidget.targets || ''}
                                    onChange={(e) => updateWidgetProperty('targets', e.target.value)}
                                    placeholder="例如: C:\Program Files\LocalSend\localsend_app.exe {{source}}"
                                    variant="outlined"
                                    size="sm"
                                    sx={{ width: '100%' }}
                                />
                            </div>
                            <Typography level="body-xs" sx={{ color: 'var(--joy-palette-text-secondary)', mt: -1, mb: 2 }}>
                                {"{{source}}"} 表示拖放的文件路径，会在运行时自动替换为实际文件路径
                            </Typography>
                            <div className={styles.formGroup}>
                                <Box className={styles.switchRow}>
                                    <span className={styles.label}>是否始终显示</span>
                                    <Switch
                                        checked={selectedWidget.show_all_time || false}
                                        onChange={(e) => updateWidgetProperty('show_all_time', e.target.checked)}
                                    />
                                </Box>
                            </div>
                            <Typography level="body-xs" sx={{ color: 'var(--joy-palette-text-secondary)', mt: -1, mb: 2 }}>
                                开启后，即使侧边栏不是通过检测到拖放自动展开的，也会显示
                            </Typography>
                        </div>
                    )}

                    {selectedWidget.type === 'toolbar' && (
                        <div className={styles.propertySection}>
                            <div className={styles.propertyGroup}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography level="title-md" sx={{ fontWeight: 600 }}>显示的工具</Typography>
                                    <Button
                                        variant="solid"
                                        size="sm"
                                        onClick={handleAddTool}
                                        startDecorator={<span>+</span>}
                                    >
                                        添加工具
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                                            <Box
                                                key={`${index}-${toolId}`}
                                                draggable
                                                onDragStart={(e) => handleToolDragStart(e, index)}
                                                onDragOver={(e) => handleToolDragOver(e, index)}
                                                onDrop={(e) => handleToolDrop(e, index)}
                                                onDragEnd={() => {
                                                    setDraggingToolIndex(null);
                                                    setDragOverToolIndex(null);
                                                }}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    p: 1,
                                                    backgroundColor: draggingToolIndex === index
                                                        ? 'var(--joy-palette-background-level2)'
                                                        : dragOverToolIndex === index
                                                            ? 'var(--joy-palette-background-level3)'
                                                            : 'var(--joy-palette-background-level1)',
                                                    border: '1px solid var(--joy-palette-divider)',
                                                    borderRadius: '8px',
                                                    cursor: 'default',
                                                    opacity: draggingToolIndex === index ? 0.5 : 1,
                                                    transition: 'all 0.1s ease'
                                                }}
                                            >
                                                <Box sx={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--joy-palette-text-secondary)' }}>
                                                    <DragHandleIcon sx={{ fontSize: 18 }} />
                                                </Box>

                                                <Box sx={{ flex: 1 }}>
                                                    <Select
                                                        value={toolId}
                                                        onChange={(_, value) => handleUpdateTool(index, value)}
                                                        size="sm"
                                                        sx={{ width: '100%' }}
                                                    >
                                                        {toolOptions.map(option => (
                                                            <Option key={option.id} value={option.id}>
                                                                {option.label}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Box>

                                                <IconButton
                                                    size="sm"
                                                    variant="plain"
                                                    color="danger"
                                                    onClick={() => handleDeleteTool(index)}
                                                >
                                                    ×
                                                </IconButton>
                                            </Box>
                                        );
                                    })}

                                    {(selectedWidget.tools || []).length === 0 && (
                                        <Box sx={{
                                            textAlign: 'center',
                                            py: 2,
                                            color: 'var(--joy-palette-text-secondary)',
                                            fontSize: '12px',
                                            border: '1px dashed var(--joy-palette-divider)',
                                            borderRadius: '8px'
                                        }}>
                                            暂无工具，点击上方按钮添加
                                        </Box>
                                    )}
                                </Box>
                            </div>
                        </div>
                    )}

                    {selectedWidget.type === 'iccce_control' && (
                        <div className={styles.propertySection}>
                            <div className={styles.propertyGroup}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography level="title-md" sx={{ fontWeight: 600 }}>显示的功能</Typography>
                                    <Button
                                        variant="solid"
                                        size="sm"
                                        onClick={handleAddFunction}
                                        startDecorator={<span>+</span>}
                                    >
                                        添加功能
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                                            <Box
                                                key={`${index}-${funcId}`}
                                                draggable
                                                onDragStart={(e) => handleFuncDragStart(e, index)}
                                                onDragOver={(e) => handleFuncDragOver(e, index)}
                                                onDrop={(e) => handleFuncDrop(e, index)}
                                                onDragEnd={() => {
                                                    setDraggingFuncIndex(null);
                                                    setDragOverFuncIndex(null);
                                                }}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    p: 1,
                                                    backgroundColor: draggingFuncIndex === index
                                                        ? 'var(--joy-palette-background-level2)'
                                                        : dragOverFuncIndex === index
                                                            ? 'var(--joy-palette-background-level3)'
                                                            : 'var(--joy-palette-background-level1)',
                                                    border: '1px solid var(--joy-palette-divider)',
                                                    borderRadius: '8px',
                                                    cursor: 'default',
                                                    opacity: draggingFuncIndex === index ? 0.5 : 1,
                                                    transition: 'all 0.1s ease'
                                                }}
                                            >
                                                <Box sx={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--joy-palette-text-secondary)' }}>
                                                    <DragHandleIcon sx={{ fontSize: 18 }} />
                                                </Box>

                                                <Box sx={{ flex: 1 }}>
                                                    <Select
                                                        value={funcId === 'show' ? 'toggle' : funcId}
                                                        onChange={(_, value) => handleUpdateFunction(index, value)}
                                                        size="sm"
                                                        sx={{ width: '100%' }}
                                                    >
                                                        {funcOptions.map(option => (
                                                            <Option key={option.id} value={option.id}>
                                                                {option.label}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Box>

                                                <IconButton
                                                    size="sm"
                                                    variant="plain"
                                                    color="danger"
                                                    onClick={() => handleDeleteFunction(index)}
                                                >
                                                    ×
                                                </IconButton>
                                            </Box>
                                        );
                                    })}

                                    {(selectedWidget.functions || []).length === 0 && (
                                        <Box sx={{
                                            textAlign: 'center',
                                            py: 2,
                                            color: 'var(--joy-palette-text-secondary)',
                                            fontSize: '12px',
                                            border: '1px dashed var(--joy-palette-divider)',
                                            borderRadius: '8px'
                                        }}>
                                            暂无功能，点击上方按钮添加
                                        </Box>
                                    )}
                                </Box>
                            </div>

                            <Divider sx={{ my: 2 }} />

                            <div className={styles.propertyGroup}>
                                <Box className={styles.switchRow}>
                                    <span style={{ fontSize: '14px' }}>仅在 ICC-CE 运行时显示该组件</span>
                                    <Switch
                                        checked={selectedWidget.show_only_when_running !== false}
                                        onChange={(e) => updateWidgetProperty('show_only_when_running', e.target.checked)}
                                    />
                                </Box>
                                <Typography level="body-xs" sx={{ color: 'var(--joy-palette-text-secondary)', mt: 0.5 }}>
                                    开启后，若未检测到 InkCanvasForClass.exe 进程，此组件将自动隐藏。
                                </Typography>
                            </div>

                            <Divider sx={{ my: 2 }} />

                            <Card variant="soft" sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'var(--joy-palette-primary-500)' }}>
                                    <InfoIcon sx={{ fontSize: 18 }} />
                                    <Typography level="body-sm" sx={{ fontWeight: 600 }}>使用建议</Typography>
                                </Box>
                                <Typography level="body-xs" sx={{ display: 'block', mb: 2, color: 'var(--joy-palette-text-secondary)' }}>
                                    建议前往"辅助工具"设置打开"ICC-CE 兼容"模式，以获得最佳的交互体验。
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>ICC-CE 兼容模式</span>
                                    <Switch
                                        checked={config?.helper_tools?.icc_compatibility || false}
                                        onChange={(e) => {
                                            updateConfig({
                                                ...config,
                                                helper_tools: {
                                                    ...config.helper_tools,
                                                    icc_compatibility: e.target.checked
                                                }
                                            });
                                            const uri = e.target.checked ? 'icc://thoroughHideOn' : 'icc://thoroughHideOff';
                                            if (window.electronAPI && window.electronAPI.launchApp) {
                                                window.electronAPI.launchApp(uri);
                                            }
                                        }}
                                    />
                                </Box>
                                <Typography level="body-xs" sx={{ color: 'var(--joy-palette-text-secondary)', mt: 0.5 }}>
                                    开启后，本软件启动时将自动隐藏 ICC-CE 侧边栏，以避免界面上的交互冲突。
                                </Typography>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'library' && (
                <div className={styles.propertiesContent}>
                    <Typography level="h5" sx={{ mb: 2 }}>组件库</Typography>
                    <div className={styles.libraryGrid}>
                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('launcher')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'launcher')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <RocketIcon />
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>启动器</span>
                                <span className={styles.libraryItemDesc}>快速启动应用程序或文件</span>
                            </div>
                        </div>

                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('volume_slider')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'volume_slider')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <VolumeUpIcon />
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>音量控制</span>
                                <span className={styles.libraryItemDesc}>滑动调节系统音量</span>
                            </div>
                        </div>

                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('drag_to_launch')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'drag_to_launch')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <InputIcon />
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>拖放速启</span>
                                <span className={styles.libraryItemDesc}>拖拽文件到此处快速打开</span>
                            </div>
                        </div>

                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('files')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'files')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <FolderIcon />
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>文件列表</span>
                                <span className={styles.libraryItemDesc}>显示指定文件夹内容</span>
                            </div>
                        </div>

                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('toolbar')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'toolbar')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <BuildIcon />
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>工具栏</span>
                                <span className={styles.libraryItemDesc}>包含截图、显示桌面等工具</span>
                            </div>
                        </div>

                        <div
                            className={styles.libraryItem}
                            onClick={() => onAddComponent('iccce_control')}
                            draggable
                            onDragStart={(e) => handleLibraryDragStart(e, 'iccce_control')}
                            onDragEnd={onDragEnd}
                            style={{ cursor: 'grab' }}
                        >
                            <div className={styles.libraryItemIcon}>
                                <SchoolIcon />
                            </div>
                            <div className={styles.libraryItemContent}>
                                <span className={styles.libraryItemTitle}>ICC-CE 控制</span>
                                <span className={styles.libraryItemDesc}>集成 ICC-CE 随机抽选、白板等功能</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'properties' && !selectedWidget && (
                <div className={styles.propertiesContent}>
                    <div className={styles.propertyGroup}>
                        <Typography level="h5" sx={{ mb: 1 }}>选择组件</Typography>
                        <Typography level="body-sm" sx={{ color: 'var(--joy-palette-text-secondary)' }}>点击左侧组件以编辑其属性</Typography>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertiesPanel;
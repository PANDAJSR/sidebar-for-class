/**
 * 自动化设置组件
 * 管理自动执行的脚本和任务
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {Object} styles - 样式对象
 */

import { useState, useEffect } from 'react';
import 'mdui/components/card.js';
import 'mdui/components/text-field.js';
import 'mdui/components/button.js';
import 'mdui/components/dropdown.js';
import 'mdui/components/menu.js';
import 'mdui/components/menu-item.js';
import 'mdui/components/checkbox.js';
import 'mdui/components/button-icon.js';
import 'mdui/components/icon.js';
import ScriptEditorModal from '../components/ScriptEditorModal';
import CreateScriptModal from '../components/CreateScriptModal';

const AutomationSettings = ({ config, updateConfig, styles }) => {
    // 获取当前的自动化任务列表
    const automatic = config.automatic || [];
    const [editorOpen, setEditorOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [currentScriptIndex, setCurrentScriptIndex] = useState(-1);
    const [existingScripts, setExistingScripts] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState({});

    // 获取 data 目录下的现有脚本
    const fetchScripts = async () => {
        try {
            // 传入 '.' 代表数据目录
            const files = await window.electronAPI.getFilesInFolder('.', 100);
            // 过滤出常见的脚本后缀
            const scriptExtensions = ['.bat', '.cmd', '.js', '.ps1', '.py', '.sh'];
            const scripts = files
                .filter(f => scriptExtensions.some(ext => f.name.toLowerCase().endsWith(ext)))
                .map(f => f.name);
            setExistingScripts(scripts);
        } catch (err) {
            console.error('Failed to fetch scripts:', err);
        }
    };

    useEffect(() => {
        fetchScripts();
    }, []);

    // 添加新任务
    const handleAddTask = () => {
        const newTask = {
            name: '',
            on: ['startup'],
            script: ''
        };
        updateConfig({
            ...config,
            automatic: [...automatic, newTask]
        });
    };

    // 删除任务
    const handleDeleteTask = (index) => {
        const newAutomatic = automatic.filter((_, i) => i !== index);
        updateConfig({
            ...config,
            automatic: newAutomatic
        });
    };

    // 更新任务属性
    const handleUpdateTask = (index, field, value) => {
        const newAutomatic = automatic.map((task, i) => {
            if (i === index) {
                return { ...task, [field]: value };
            }
            return task;
        });
        updateConfig({
            ...config,
            automatic: newAutomatic
        });
    };

    // 切换触发条件
    const handleToggleOn = (index, condition) => {
        const task = automatic[index];
        const currentOn = task.on || [];
        let newOn;
        if (currentOn.includes(condition)) {
            newOn = currentOn.filter(c => c !== condition);
        } else {
            newOn = [...currentOn, condition];
        }
        handleUpdateTask(index, 'on', newOn);
    };

    const handleCreateScript = (filename) => {
        handleUpdateTask(currentScriptIndex, 'script', filename);
        // 刷新列表以包含新创建的文件
        fetchScripts();
        // 延迟一点打开编辑器，确保状态已更新
        setTimeout(() => {
            setEditorOpen(true);
        }, 100);
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>自动化</div>
                <div className={styles.description}>配置在特定事件发生时自动运行的脚本或程序。</div>
            </div>

            <div className={styles.groupTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>任务列表</span>
                <mdui-button
                    variant="filled"
                    icon="add"
                    onClick={handleAddTask}
                >
                    添加任务
                </mdui-button>
            </div>

            {automatic.length === 0 ? (
                <mdui-card variant="filled" className={styles.card}>
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--mdui-color-on-surface-variant)' }}>
                        暂无自动化任务，点击上方按钮添加。
                    </div>
                </mdui-card>
            ) : (
                automatic.map((task, index) => (
                    <mdui-card key={index} variant="filled" className={styles.card} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <mdui-icon name="play_arrow" style={{ color: 'var(--mdui-color-primary)' }}></mdui-icon>
                                <span style={{ fontWeight: '600', fontSize: '14px' }}>{task.name || `任务 ${index + 1}`}</span>
                            </div>
                            <mdui-button-icon
                                icon="delete"
                                onClick={() => handleDeleteTask(index)}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>任务名称</div>
                                <mdui-text-field
                                    value={task.name || ''}
                                    onChange={(e) => handleUpdateTask(index, 'name', e.target.value)}
                                    variant="outlined"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <div className={styles.label}>脚本路径或命令</div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <mdui-text-field
                                            value={task.script || ''}
                                            onChange={(e) => handleUpdateTask(index, 'script', e.target.value)}
                                            placeholder="例如: test.bat 或 C:\\Windows\\notepad.exe"
                                            variant="outlined"
                                            style={{ width: '100%' }}
                                        />
                                        {existingScripts.length > 0 && (
                                            <mdui-dropdown
                                                open={dropdownOpen[index]}
                                                onOpenChange={(e) => {
                                                    setDropdownOpen(prev => ({ ...prev, [index]: e.target.open }));
                                                }}
                                            >
                                                <mdui-button
                                                    slot="trigger"
                                                    variant="text"
                                                    icon="arrow_drop_down"
                                                    style={{ marginTop: '4px' }}
                                                >
                                                    选择已有脚本
                                                </mdui-button>
                                                <mdui-menu style={{ maxHeight: '200px', overflow: 'auto' }}>
                                                    {existingScripts.map((script) => (
                                                        <mdui-menu-item
                                                            key={script}
                                                            value={script}
                                                            onClick={() => handleUpdateTask(index, 'script', script)}
                                                        >
                                                            {script}
                                                        </mdui-menu-item>
                                                    ))}
                                                </mdui-menu>
                                            </mdui-dropdown>
                                        )}
                                    </div>
                                    <mdui-button-icon
                                        variant="outlined"
                                        icon="note_add"
                                        onClick={() => {
                                            setCurrentScriptIndex(index);
                                            setCreateModalOpen(true);
                                        }}
                                        title="新建脚本文件"
                                    />
                                    <mdui-button-icon
                                        variant="outlined"
                                        icon="edit"
                                        onClick={() => {
                                            window.electronAPI.openWithNotepad(task.script);
                                        }}
                                        disabled={!task.script}
                                        title="在记事本中打开"
                                    />
                                    <mdui-button-icon
                                        icon="play_arrow"
                                        onClick={() => {
                                            window.electronAPI.launchApp(task.script);
                                        }}
                                        disabled={!task.script}
                                        title="立即试运行"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className={styles.label} style={{ marginBottom: '12px' }}>触发器</div>
                                <div style={{ display: 'flex', gap: '24px' }}>
                                    <mdui-checkbox
                                        checked={task.on?.includes('startup')}
                                        onChange={() => handleToggleOn(index, 'startup')}
                                    >
                                        在 SidebarForClass 启动时
                                    </mdui-checkbox>
                                    <mdui-checkbox
                                        checked={task.on?.includes('shutdown')}
                                        onChange={() => handleToggleOn(index, 'shutdown')}
                                    >
                                        在 SidebarForClass 退出时
                                    </mdui-checkbox>
                                </div>
                            </div>
                        </div>
                    </mdui-card>
                ))
            )}

            <CreateScriptModal
                isOpen={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onCreate={handleCreateScript}
            />

            <ScriptEditorModal
                isOpen={editorOpen}
                onOpenChange={setEditorOpen}
                filePath={currentScriptIndex >= 0 ? automatic[currentScriptIndex]?.script : ''}
            />

            <div className={styles.helpText} style={{ marginTop: '16px' }}>
                提示：相对路径将相对于程序的数据目录 (data/) 进行解析。脚本将以隐藏窗口模式静默运行。
            </div>
        </div>
    );
};

export default AutomationSettings;

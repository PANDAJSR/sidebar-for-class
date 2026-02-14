/**
 * 数据管理设置组件
 * 管理 data 目录下的所有文件
 */

import React, { useState, useEffect, useCallback } from 'react';
import 'mdui/components/card.js';
import 'mdui/components/button.js';
import 'mdui/components/button-icon.js';
import 'mdui/components/tooltip.js';
import 'mdui/components/chip.js';
import {
    AddRegular,
    DeleteRegular,
    EditRegular,
    DocumentRegular,
    ArrowClockwiseRegular,
    RenameRegular,
    InfoRegular,
    BotRegular
} from "@fluentui/react-icons";
import ScriptEditorModal from '../components/ScriptEditorModal';
import CreateScriptModal from '../components/CreateScriptModal';
import RenameFileModal from '../components/RenameFileModal';
import ConfirmDialog from '../components/ConfirmDialog';

const DataSettings = ({ config, updateConfig, styles }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editorOpen, setEditorOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedFilePath, setSelectedFilePath] = useState('');
    const [fileToRename, setFileToRename] = useState('');
    const [fileToDelete, setFileToDelete] = useState('');

    // 获取所有在自动化中引用的脚本及其对应的任务名称/索引
    const scriptToTasks = React.useMemo(() => {
        const map = new Map();
        if (!config || !config.automatic) return map;
        
        config.automatic.forEach((task, index) => {
            if (task.script) {
                const tasks = map.get(task.script) || [];
                // 优先使用任务名称，否则显示任务编号
                tasks.push(task.name || `任务 ${index + 1}`);
                map.set(task.script, tasks);
            }
        });
        return map;
    }, [config]);

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            // 获取 data 目录下的所有文件
            const result = await window.electronAPI.getFilesInFolder('.', 500);
            setFiles(result);
        } catch (err) {
            console.error('Failed to fetch files:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleCreateFile = async (filename) => {
        try {
            // 创建空文件
            await window.electronAPI.writeFile(filename, '');
            await fetchFiles();
            setSelectedFilePath(filename);
            setEditorOpen(true);
        } catch (err) {
            console.error('Failed to create file:', err);
        }
    };

    const handleDeleteFile = (filename) => {
        setFileToDelete(filename);
        setConfirmOpen(true);
    };

    const onDeleteConfirm = async () => {
        try {
            await window.electronAPI.deleteFile(fileToDelete);
            await fetchFiles();
        } catch (err) {
            console.error('Failed to delete file:', err);
        }
    };

    const handleRenameFile = (filename) => {
        setFileToRename(filename);
        setRenameModalOpen(true);
    };

    const onRenameConfirm = async (oldName, newName) => {
        try {
            await window.electronAPI.renameFile(oldName, newName);
            
            // 如果该文件被自动化引用，自动更新配置
            if (scriptToTasks.has(oldName)) {
                const newAutomatic = config.automatic.map(task => {
                    if (task.script === oldName) {
                        return { ...task, script: newName };
                    }
                    return task;
                });
                updateConfig({
                    ...config,
                    automatic: newAutomatic
                });
            }

            await fetchFiles();
        } catch (err) {
            console.error('Failed to rename file:', err);
            // 可以在这里加个错误提示
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    const getFileBadge = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const badges = [];

        // 添加文件类型徽标
        let chipType = 'default';
        switch (ext) {
            case 'js': chipType = 'primary'; break;
            case 'json': chipType = 'success'; break;
            case 'bat': case 'cmd': chipType = 'error'; break;
            case 'ps1': chipType = 'info'; break;
            default: chipType = 'default';
        }

        badges.push(
            <mdui-chip key="ext" variant="outlined" selectable={false} type={chipType}>
                {ext.toUpperCase()}
            </mdui-chip>
        );

        if (filename.toLowerCase() === 'config.json') {
            badges.push(
                <mdui-chip key="config" variant="filled" selectable={false} type="primary">
                    当前配置
                </mdui-chip>
            );
        }

        if (scriptToTasks.has(filename)) {
            const tasks = scriptToTasks.get(filename);
            badges.push(
                <mdui-tooltip key="auto" content={`此脚本已被自动化任务使用: ${tasks.join('、')}`}>
                    <mdui-chip variant="assist" selectable={false} type="info">
                        <BotRegular slot="icon" />
                        自动化引用
                    </mdui-chip>
                </mdui-tooltip>
            );
        }

        return <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>{badges}</div>;
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>数据管理</div>
                <div className={styles.description}>管理数据目录 (data/) 中的所有脚本和配置文件。</div>
            </div>

            <div className={styles.groupTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>文件列表</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <mdui-button
                        variant="outlined"
                        size="small"
                        onClick={fetchFiles}
                        disabled={loading}
                    >
                        <ArrowClockwiseRegular slot="icon" />
                        刷新
                    </mdui-button>
                    <mdui-button
                        variant="filled"
                        size="small"
                        onClick={() => setCreateModalOpen(true)}
                    >
                        <AddRegular slot="icon" />
                        新建文件
                    </mdui-button>
                </div>
            </div>

            <mdui-card variant="filled" className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ backgroundColor: 'rgb(var(--mdui-color-surface-container))' }}>
                        <tr>
                            <th style={{ width: '40%', padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>文件名</th>
                            <th style={{ width: '15%', padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>类型</th>
                            <th style={{ width: '30%', padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>修改时间</th>
                            <th style={{ width: '15%', padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                                    数据目录为空
                                </td>
                            </tr>
                        ) : (
                            files.map((file) => (
                                <tr key={file.name} style={{ borderTop: '1px solid rgb(var(--mdui-color-surface-variant))' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                            <DocumentRegular />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {file.name}
                                            </span>
                                            {file.name.toLowerCase() === 'config.json' && (
                                                <mdui-tooltip content="这是应用程序的主配置文件">
                                                    <InfoRegular style={{ fontSize: '14px', color: 'rgb(var(--mdui-color-primary))', flexShrink: 0 }} />
                                                </mdui-tooltip>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        {getFileBadge(file.name)}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: 'rgb(var(--mdui-color-on-surface-variant))' }}>
                                        {formatDate(file.mtime)}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <mdui-tooltip content="编辑">
                                                <mdui-button-icon
                                                    onClick={() => {
                                                        setSelectedFilePath(file.name);
                                                        setEditorOpen(true);
                                                    }}
                                                >
                                                    <EditRegular />
                                                </mdui-button-icon>
                                            </mdui-tooltip>
                                            <mdui-tooltip content="重命名">
                                                <mdui-button-icon
                                                    onClick={() => handleRenameFile(file.name)}
                                                >
                                                    <RenameRegular />
                                                </mdui-button-icon>
                                            </mdui-tooltip>
                                            <mdui-tooltip content="删除">
                                                <mdui-button-icon
                                                    onClick={() => handleDeleteFile(file.name)}
                                                    disabled={file.name.toLowerCase() === 'config.json'}
                                                >
                                                    <DeleteRegular />
                                                </mdui-button-icon>
                                            </mdui-tooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </mdui-card>

            <CreateScriptModal
                isOpen={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onCreate={handleCreateFile}
            />

            <ScriptEditorModal
                isOpen={editorOpen}
                onOpenChange={setEditorOpen}
                filePath={selectedFilePath}
                onSave={fetchFiles}
            />

            <RenameFileModal
                isOpen={renameModalOpen}
                onOpenChange={setRenameModalOpen}
                oldName={fileToRename}
                referencedTasks={scriptToTasks.get(fileToRename)}
                onRename={onRenameConfirm}
            />

            <ConfirmDialog
                isOpen={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="确认删除"
                content={`确定要删除文件 ${fileToDelete} 吗？`}
                onConfirm={onDeleteConfirm}
            />
        </div>
    );
};

export default DataSettings;

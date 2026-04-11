/**
 * 数据管理设置组件
 * 管理 data 目录下的所有文件
 */

import React, { useState, useEffect, useCallback } from 'react';
import Card from '@mui/joy/Card';
import Button from '@mui/joy/Button';
import IconButton from '@mui/joy/IconButton';
import Tooltip from '@mui/joy/Tooltip';
import Chip from '@mui/joy/Chip';
import Typography from '@mui/joy/Typography';
import Box from '@mui/joy/Box';
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

    const scriptToTasks = React.useMemo(() => {
        const map = new Map();
        if (!config || !config.automatic) return map;
        
        config.automatic.forEach((task, index) => {
            if (task.script) {
                const tasks = map.get(task.script) || [];
                tasks.push(task.name || `任务 ${index + 1}`);
                map.set(task.script, tasks);
            }
        });
        return map;
    }, [config]);

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
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
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    const getFileBadge = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const badges = [];

        let chipColor = 'neutral';
        switch (ext) {
            case 'js': chipColor = 'primary'; break;
            case 'json': chipColor = 'success'; break;
            case 'bat':
            case 'cmd': chipColor = 'danger'; break;
            case 'ps1': chipColor = 'info'; break;
            default: chipColor = 'neutral';
        }

        badges.push(
            <Chip key="ext" variant="outlined" size="sm" color={chipColor}>
                {ext.toUpperCase()}
            </Chip>
        );

        if (filename.toLowerCase() === 'config.json') {
            badges.push(
                <Chip key="config" variant="solid" size="sm" color="primary">
                    当前配置
                </Chip>
            );
        }

        if (scriptToTasks.has(filename)) {
            const tasks = scriptToTasks.get(filename);
            badges.push(
                <Tooltip key="auto" title={`此脚本已被自动化任务使用: ${tasks.join('、')}`}>
                    <Chip variant="soft" size="sm" color="info" startDecorator={<BotRegular />}>
                        自动化引用
                    </Chip>
                </Tooltip>
            );
        }

        return <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>{badges}</Box>;
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>数据管理</div>
                <div className={styles.description}>管理数据目录 (data/) 中的所有脚本和配置文件。</div>
            </div>

            <div className={styles.groupTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>文件列表</span>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="sm"
                        onClick={fetchFiles}
                        disabled={loading}
                        startDecorator={<ArrowClockwiseRegular />}
                    >
                        刷新
                    </Button>
                    <Button
                        variant="solid"
                        size="sm"
                        onClick={() => setCreateModalOpen(true)}
                        startDecorator={<AddRegular />}
                    >
                        新建文件
                    </Button>
                </Box>
            </div>

            <Card variant="soft" className={styles.card} sx={{ p: 0, overflow: 'hidden' }}>
                <Box sx={{ overflowX: 'auto' }}>
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <Box component="thead" sx={{ backgroundColor: 'var(--joy-palette-background-level2)' }}>
                            <tr>
                                <th style={{ width: '40%', padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>文件名</th>
                                <th style={{ width: '15%', padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>类型</th>
                                <th style={{ width: '30%', padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>修改时间</th>
                                <th style={{ width: '15%', padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>操作</th>
                            </tr>
                        </Box>
                        <Box component="tbody">
                            {files.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                                        数据目录为空
                                    </td>
                                </tr>
                            ) : (
                                files.map((file) => (
                                    <tr key={file.name} style={{ borderTop: '1px solid var(--joy-palette-divider)' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                                                <DocumentRegular />
                                                <Typography level="body-sm" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {file.name}
                                                </Typography>
                                                {file.name.toLowerCase() === 'config.json' && (
                                                    <Tooltip title="这是应用程序的主配置文件">
                                                        <InfoRegular style={{ fontSize: '14px', color: 'var(--joy-palette-primary-500)', flexShrink: 0 }} />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {getFileBadge(file.name)}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <Typography level="body-sm" sx={{ color: 'var(--joy-palette-text-secondary)' }}>
                                                {formatDate(file.mtime)}
                                            </Typography>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="编辑">
                                                    <IconButton
                                                        size="sm"
                                                        variant="plain"
                                                        onClick={() => {
                                                            setSelectedFilePath(file.name);
                                                            setEditorOpen(true);
                                                        }}
                                                    >
                                                        <EditRegular />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="重命名">
                                                    <IconButton
                                                        size="sm"
                                                        variant="plain"
                                                        onClick={() => handleRenameFile(file.name)}
                                                    >
                                                        <RenameRegular />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="删除">
                                                    <IconButton
                                                        size="sm"
                                                        variant="plain"
                                                        color="danger"
                                                        onClick={() => handleDeleteFile(file.name)}
                                                        disabled={file.name.toLowerCase() === 'config.json'}
                                                    >
                                                        <DeleteRegular />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </Box>
                    </Box>
                </Box>
            </Card>

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
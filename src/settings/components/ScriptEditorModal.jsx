import { useState, useEffect, useRef } from 'react';
import 'mdui/components/dialog.js';
import 'mdui/components/button.js';
import 'mdui/components/circular-progress.js';
import Editor, { loader } from "@monaco-editor/react";

// 配置 Monaco 使用 CDN 加载，避免 Electron 中 Worker 路径问题
loader.config({
    paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs'
    }
});

const ScriptEditorModal = ({ isOpen, onOpenChange, filePath, onSave }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const dialogRef = useRef(null);

    useEffect(() => {
        if (isOpen && filePath) {
            loadFileContent();
        }
    }, [isOpen, filePath]);

    // 控制对话框的打开/关闭
    useEffect(() => {
        const dialog = dialogRef.current;
        if (dialog) {
            if (isOpen) {
                dialog.open = true;
            } else {
                dialog.open = false;
            }
        }
    }, [isOpen]);

    const loadFileContent = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await window.electronAPI.readFile(filePath);
            setContent(result);
        } catch (err) {
            console.error('Failed to load file:', err);
            // If file doesn't exist, we might want to start with empty content
            if (err.message.includes('File not found')) {
                setContent('');
            } else {
                setError('无法读取文件内容：' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await window.electronAPI.writeFile(filePath, content);
            if (onSave) onSave();
            onOpenChange(false);
        } catch (err) {
            console.error('Failed to save file:', err);
            setError('保存失败：' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const getLanguage = (path) => {
        if (!path) return 'plaintext';
        const ext = path.split('.').pop().toLowerCase();
        switch (ext) {
            case 'js': return 'javascript';
            case 'ts': return 'typescript';
            case 'json': return 'json';
            case 'bat': case 'cmd': return 'bat';
            case 'ps1': return 'powershell';
            case 'py': return 'python';
            case 'sh': return 'shell';
            case 'html': return 'html';
            case 'css': return 'css';
            default: return 'plaintext';
        }
    };

    return (
        <mdui-dialog
            ref={dialogRef}
            onClose={() => onOpenChange(false)}
            style={{ maxWidth: '90vw', width: '800px', height: '80vh' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ fontSize: '20px', fontWeight: '500', marginBottom: '16px' }}>
                    编辑脚本: {filePath}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {error && (
                        <div style={{
                            marginBottom: '10px',
                            padding: '12px 16px',
                            backgroundColor: 'var(--mdui-color-error-container)',
                            color: 'var(--mdui-color-on-error-container)',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}>
                            <strong>错误</strong><br />
                            {error}
                        </div>
                    )}

                    <div style={{
                        flex: 1,
                        border: '1px solid var(--mdui-color-outline)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '16px' }}>
                                <mdui-circular-progress />
                                <span>正在加载内容...</span>
                            </div>
                        ) : (
                            <Editor
                                height="100%"
                                language={getLanguage(filePath)}
                                value={content}
                                onChange={(value) => setContent(value)}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    automaticLayout: true,
                                    scrollBeyondLastLine: false,
                                }}
                            />
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <mdui-button variant="text" onClick={() => onOpenChange(false)}>
                        取消
                    </mdui-button>
                    <mdui-button
                        variant="filled"
                        onClick={handleSave}
                        loading={saving}
                        disabled={loading}
                    >
                        保存
                    </mdui-button>
                </div>
            </div>
        </mdui-dialog>
    );
};

export default ScriptEditorModal;

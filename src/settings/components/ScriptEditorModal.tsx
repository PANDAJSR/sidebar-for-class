import { useState, useEffect } from 'react';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import Button from '@mui/joy/Button';
import CircularProgress from '@mui/joy/CircularProgress';
import Typography from '@mui/joy/Typography';
import Box from '@mui/joy/Box';
import Editor, { loader } from "@monaco-editor/react";

loader.config({
    paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs'
    }
});

interface ScriptEditorModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    filePath: string;
    onSave?: () => void;
}

const ScriptEditorModal: React.FC<ScriptEditorModalProps> = ({ isOpen, onOpenChange, filePath, onSave }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && filePath) {
            loadFileContent();
        }
    }, [isOpen, filePath]);

    const loadFileContent = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await window.electronAPI.readFile(filePath);
            setContent(result);
        } catch (err) {
            console.error('Failed to load file:', err);
            if (err instanceof Error && err.message.includes('File not found')) {
                setContent('');
            } else {
                setError('无法读取文件内容：' + (err instanceof Error ? err.message : String(err)));
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
            setError('保存失败：' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const getLanguage = (path: string): string => {
        if (!path) return 'plaintext';
        const ext = path.split('.').pop()?.toLowerCase() || '';
        switch (ext) {
            case 'js': return 'javascript';
            case 'ts': return 'typescript';
            case 'json': return 'json';
            case 'bat':
            case 'cmd': return 'bat';
            case 'ps1': return 'powershell';
            case 'py': return 'python';
            case 'sh': return 'shell';
            case 'html': return 'html';
            case 'css': return 'css';
            default: return 'plaintext';
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={() => onOpenChange(false)}
        >
            <ModalDialog
                size="lg"
                sx={{ maxWidth: '90vw', width: 800, height: '80vh', display: 'flex' }}
            >
            <DialogTitle sx={{ fontSize: '20px', fontWeight: 500 }}>
                编辑脚本: {filePath}
            </DialogTitle>
            <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {error && (
                    <Box sx={{
                        mb: 1.5,
                        p: 1.5,
                        backgroundColor: 'var(--joy-palette-danger-container)',
                        color: 'var(--joy-palette-on-danger-container)',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}>
                        <strong>错误</strong><br />
                        {error}
                    </Box>
                )}

                <Box sx={{
                    flex: 1,
                    border: '1px solid var(--joy-palette-divider)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
                            <CircularProgress />
                            <span>正在加载内容...</span>
                        </Box>
                    ) : (
                        <Editor
                            height="100%"
                            language={getLanguage(filePath)}
                            value={content}
                            onChange={(value) => setContent(value || '')}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                            }}
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button variant="text" onClick={() => onOpenChange(false)}>
                    取消
                </Button>
                <Button
                    variant="solid"
                    onClick={handleSave}
                    loading={saving}
                    disabled={loading}
                >
                    保存
                </Button>
            </DialogActions>
            </ModalDialog>
        </Modal>
    );
};

export default ScriptEditorModal;
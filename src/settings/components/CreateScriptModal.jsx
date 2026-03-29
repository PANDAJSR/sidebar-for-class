import { useState, useRef, useEffect } from 'react';
import 'mdui/components/dialog.js';
import 'mdui/components/button.js';
import 'mdui/components/text-field.js';

const CreateScriptModal = ({ isOpen, onOpenChange, onCreate }) => {
    const [filename, setFilename] = useState('');
    const dialogRef = useRef(null);

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

    const handleCreate = () => {
        if (!filename) return;

        // 确保有后缀名，默认 .bat
        let finalName = filename;
        if (!finalName.includes('.')) {
            finalName += '.bat';
        }

        onCreate(finalName);
        setFilename('');
        onOpenChange(false);
    };

    const handleClose = () => {
        setFilename('');
        onOpenChange(false);
    };

    return (
        <mdui-dialog
            ref={dialogRef}
            onClose={handleClose}
            style={{ maxWidth: '400px' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '20px', fontWeight: '500', marginBottom: '16px' }}>
                    新建脚本
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <mdui-text-field
                        label="脚本文件名"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="例如: myscript.bat"
                        variant="outlined"
                        style={{ width: '100%' }}
                        helper={!filename ? '请输入文件名' : ''}
                    />
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--mdui-color-on-surface-variant)' }}>
                        支持 .bat, .js, .ps1 等。如果不输入后缀，将默认创建 .bat 文件。
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <mdui-button variant="text" onClick={handleClose}>
                        取消
                    </mdui-button>
                    <mdui-button
                        variant="filled"
                        onClick={handleCreate}
                        disabled={!filename}
                    >
                        创建
                    </mdui-button>
                </div>
            </div>
        </mdui-dialog>
    );
};

export default CreateScriptModal;

import { useState } from 'react';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Typography from '@mui/joy/Typography';

const CreateScriptModal = ({ isOpen, onOpenChange, onCreate }) => {
    const [filename, setFilename] = useState('');

    const handleCreate = () => {
        if (!filename) return;

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
        <Modal open={isOpen} onClose={handleClose}>
            <ModalDialog size="md" sx={{ maxWidth: 520, width: '90vw' }}>
            <DialogTitle sx={{ fontSize: '20px', fontWeight: 500 }}>
                新建脚本
            </DialogTitle>
            <DialogContent>
                <FormControl sx={{ mt: 1 }}>
                    <FormLabel>脚本文件名</FormLabel>
                    <Input
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="例如: myscript.bat"
                        variant="outlined"
                        sx={{ width: '100%' }}
                    />
                    {!filename && (
                        <Typography level="body-xs" sx={{ color: 'var(--joy-palette-danger-500)', mt: 0.5 }}>
                            请输入文件名
                        </Typography>
                    )}
                </FormControl>
                <Typography level="body-xs" sx={{ color: 'var(--joy-palette-text-secondary)', mt: 1 }}>
                    支持 .bat, .js, .ps1 等。如果不输入后缀，将默认创建 .bat 文件。
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button variant="text" onClick={handleClose}>
                    取消
                </Button>
                <Button
                    variant="solid"
                    onClick={handleCreate}
                    disabled={!filename}
                >
                    创建
                </Button>
            </DialogActions>
            </ModalDialog>
        </Modal>
    );
};

export default CreateScriptModal;

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogSurface,
    DialogTitle,
    DialogContent,
    DialogBody,
    DialogActions,
    Button,
    Field,
    Input,
    MessageBar,
    MessageBarTitle,
    MessageBarBody
} from "@fluentui/react-components";
import { Warning16Regular } from "@fluentui/react-icons";

interface RenameFileModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    oldName: string;
    referencedTasks: string[] | null;
    onRename: (oldName: string, newName: string) => void;
}

const RenameFileModal: React.FC<RenameFileModalProps> = ({ isOpen, onOpenChange, oldName, referencedTasks, onRename }) => {
    const [newName, setNewName] = useState('');
    const isConfigJson = oldName?.toLowerCase() === 'config.json';
    const isReferenced = referencedTasks && referencedTasks.length > 0;

    useEffect(() => {
        if (isOpen) {
            setNewName(oldName);
        }
    }, [isOpen, oldName]);

    const handleRename = () => {
        if (!newName || newName === oldName) {
            onOpenChange(false);
            return;
        }
        onRename(oldName, newName);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>重命名文件</DialogTitle>
                    <DialogContent>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {isConfigJson && (
                                <MessageBar intent="warning">
                                    <MessageBarBody>
                                        <MessageBarTitle>警告</MessageBarTitle>
                                        config.json 是程序的主配置文件。重命名此文件将导致程序无法读取您的配置（如窗口位置、组件设置等），程序可能会恢复到默认状态。
                                    </MessageBarBody>
                                </MessageBar>
                            )}

                            {isReferenced && !isConfigJson && (
                                <MessageBar intent="info">
                                    <MessageBarBody>
                                        <MessageBarTitle>提示</MessageBarTitle>
                                        此文件正在被 <b>{referencedTasks.join('、')}</b> 使用。重命名后，系统会自动更新相关自动化配置，无需担心引用失效。
                                    </MessageBarBody>
                                </MessageBar>
                            )}
                            
                            <Field label="新文件名" validationState={newName ? 'none' : 'error'} validationMessage={newName ? '' : '请输入文件名'}>
                                <Input 
                                    value={newName} 
                                    onChange={(_, data) => setNewName(data.value)} 
                                    placeholder="请输入新文件名"
                                    autoComplete="off"
                                />
                            </Field>
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => onOpenChange(false)}>取消</Button>
                        <Button 
                            appearance={isConfigJson ? "danger" : "primary"} 
                            onClick={handleRename} 
                            disabled={!newName || newName === oldName}
                        >
                            {isConfigJson ? "确认修改配置名" : "重命名"}
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};

export default RenameFileModal;
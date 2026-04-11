import { useState, useEffect } from 'react';
import Card from '@mui/joy/Card';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Checkbox from '@mui/joy/Checkbox';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import EditIcon from '@mui/icons-material/Edit';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ScriptEditorModal from '../components/ScriptEditorModal';
import CreateScriptModal from '../components/CreateScriptModal';

interface AutomaticTask {
    name: string;
    on: string[];
    script: string;
}

interface Config {
    automatic?: AutomaticTask[];
}

interface Styles {
    section: string;
    sectionHeader: string;
    title: string;
    description: string;
    groupTitle: string;
    card: string;
    formGroup: string;
    label: string;
    helpText: string;
}

interface AutomationSettingsProps {
    config: Config;
    updateConfig: (config: Config) => void;
    styles: Styles;
}

const AutomationSettings: React.FC<AutomationSettingsProps> = ({ config, updateConfig, styles }) => {
    const automatic = config.automatic || [];
    const [editorOpen, setEditorOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [currentScriptIndex, setCurrentScriptIndex] = useState(-1);
    const [existingScripts, setExistingScripts] = useState<string[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({});

    const fetchScripts = async (): Promise<void> => {
        try {
            const files = await window.electronAPI.getFilesInFolder('.', 100);
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

    const handleAddTask = (): void => {
        const newTask: AutomaticTask = {
            name: '',
            on: ['startup'],
            script: ''
        };
        updateConfig({
            ...config,
            automatic: [...automatic, newTask]
        });
    };

    const handleDeleteTask = (index: number): void => {
        const newAutomatic = automatic.filter((_, i) => i !== index);
        updateConfig({
            ...config,
            automatic: newAutomatic
        });
    };

    const handleUpdateTask = (index: number, field: string, value: string | string[]): void => {
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

    const handleToggleOn = (index: number, condition: string): void => {
        const task = automatic[index];
        const currentOn = task.on || [];
        let newOn: string[];
        if (currentOn.includes(condition)) {
            newOn = currentOn.filter(c => c !== condition);
        } else {
            newOn = [...currentOn, condition];
        }
        handleUpdateTask(index, 'on', newOn);
    };

    const handleCreateScript = (filename: string): void => {
        handleUpdateTask(currentScriptIndex, 'script', filename);
        fetchScripts();
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
                <Button
                    variant="solid"
                    startDecorator={<NoteAddIcon />}
                    onClick={handleAddTask}
                >
                    添加任务
                </Button>
            </div>

            {automatic.length === 0 ? (
                <Card variant="soft" className={styles.card}>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Typography level="body-sm" sx={{ color: 'var(--joy-palette-text-secondary)' }}>
                            暂无自动化任务，点击上方按钮添加。
                        </Typography>
                    </div>
                </Card>
            ) : (
                automatic.map((task, index) => (
                    <Card key={index} variant="soft" className={styles.card} sx={{ mb: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <PlayArrowIcon sx={{ color: 'var(--joy-palette-primary-500)' }} />
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>{task.name || `任务 ${index + 1}`}</span>
                            </div>
                            <IconButton
                                variant="plain"
                                color="danger"
                                onClick={() => handleDeleteTask(index)}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div className={styles.formGroup}>
                                <div className={styles.label}>任务名称</div>
                                <Input
                                    value={task.name || ''}
                                    onChange={(e) => handleUpdateTask(index, 'name', e.target.value)}
                                    variant="outlined"
                                    placeholder="输入任务名称"
                                    sx={{ width: '100%' }}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <div className={styles.label}>脚本路径或命令</div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <Input
                                            value={task.script || ''}
                                            onChange={(e) => handleUpdateTask(index, 'script', e.target.value)}
                                            placeholder="例如: test.bat 或 C:\Windows\notepad.exe"
                                            variant="outlined"
                                            sx={{ width: '100%' }}
                                        />
                                        {existingScripts.length > 0 && (
                                            <FormControl sx={{ mt: 1 }}>
                                                <Select
                                                    value=""
                                                    onChange={(_, value) => handleUpdateTask(index, 'script', value as string)}
                                                    placeholder="选择已有脚本"
                                                    startDecorator={<ArrowDropDownIcon />}
                                                >
                                                    {existingScripts.map((script) => (
                                                        <Option key={script} value={script}>
                                                            {script}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    </div>
                                    <IconButton
                                        variant="outlined"
                                        onClick={() => {
                                            setCurrentScriptIndex(index);
                                            setCreateModalOpen(true);
                                        }}
                                        title="新建脚本文件"
                                    >
                                        <NoteAddIcon />
                                    </IconButton>
                                    <IconButton
                                        variant="outlined"
                                        onClick={() => {
                                            window.electronAPI.openWithNotepad(task.script);
                                        }}
                                        disabled={!task.script}
                                        title="在记事本中打开"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        variant="plain"
                                        onClick={() => {
                                            window.electronAPI.launchApp(task.script);
                                        }}
                                        disabled={!task.script}
                                        title="立即试运行"
                                    >
                                        <PlayArrowIcon />
                                    </IconButton>
                                </div>
                            </div>

                            <div>
                                <div className={styles.label} style={{ mb: 1 }}>触发器</div>
                                <div style={{ display: 'flex', gap: 3 }}>
                                    <Checkbox
                                        checked={task.on?.includes('startup')}
                                        onChange={() => handleToggleOn(index, 'startup')}
                                        label="在 SidebarForClass 启动时"
                                    />
                                    <Checkbox
                                        checked={task.on?.includes('shutdown')}
                                        onChange={() => handleToggleOn(index, 'shutdown')}
                                        label="在 SidebarForClass 退出时"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
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

            <div className={styles.helpText} style={{ mt: 2 }}>
                提示：相对路径将相对于程序的数据目录 (data/) 进行解析。脚本将以隐藏窗口模式静默运行。
            </div>
        </div>
    );
};

export default AutomationSettings;

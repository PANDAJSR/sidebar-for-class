import React from 'react';
import Card from '@mui/joy/Card';
import Switch from '@mui/joy/Switch';

interface HelperTools {
    auto_kill_similar?: boolean;
    auto_kill_timer?: boolean;
    icc_compatibility?: boolean;
}

interface Config {
    helper_tools?: HelperTools;
}

interface Styles {
    section: string;
    sectionHeader: string;
    title: string;
    description: string;
    groupTitle: string;
    card: string;
    formGroup: string;
    switchRow: string;
    label: string;
    helpText: string;
}

interface HelperSettingsProps {
    config: Config;
    updateConfig: (config: Config) => void;
    styles: Styles;
}

const HelperSettings: React.FC<HelperSettingsProps> = ({ config, updateConfig, styles }) => {
    const helperTools = config.helper_tools || {};

    const handleToggle = async (key: string, value: boolean): Promise<void> => {
        const newConfig: Config = {
            ...config,
            helper_tools: {
                ...helperTools,
                [key]: value
            }
        };

        updateConfig(newConfig);

        if (key === 'icc_compatibility') {
            const uri = value ? 'icc://thoroughHideOn' : 'icc://thoroughHideOff';
            if (window.electronAPI && window.electronAPI.isProcessRunning) {
                const isRunning = await window.electronAPI.isProcessRunning('InkCanvasForClass.exe');
                if (isRunning) {
                    if (window.electronAPI.launchApp) {
                        window.electronAPI.launchApp(uri);
                    }
                } else {
                    console.log('[HelperSettings] InkCanvasForClass.exe not running, skipping URI launch.');
                }
            } else if (window.electronAPI && window.electronAPI.launchApp) {
                window.electronAPI.launchApp(uri);
            }
        }
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>辅助工具</div>
                <div className={styles.description}>一些提高效率或解决冲突的辅助功能。</div>
            </div>

            <div className={styles.groupTitle}>通用</div>
            <Card variant="soft" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.switchRow}>
                        <div className={styles.label}>自动查杀同类软件窗口</div>
                        <Switch
                            checked={helperTools.auto_kill_similar || false}
                            onChange={(e) => handleToggle('auto_kill_similar', e.target.checked)}
                        />
                    </div>
                    <div className={styles.helpText}>启动时自动关闭其他可能产生冲突的同类软件窗口</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.switchRow}>
                        <div className={styles.label}>自动查杀同类软件计时器并打开本软件的计时器</div>
                        <Switch
                            checked={helperTools.auto_kill_timer || false}
                            onChange={(e) => handleToggle('auto_kill_timer', e.target.checked)}
                        />
                    </div>
                    <div className={styles.helpText}>检测并关闭希沃计时器等同类软件，并自动启动本软件计时器</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.switchRow}>
                        <div className={styles.label}>ICC-CE兼容</div>
                        <Switch
                            checked={helperTools.icc_compatibility || false}
                            onChange={(e) => handleToggle('icc_compatibility', e.target.checked)}
                        />
                    </div>
                    <div className={styles.helpText}>启动后隐藏ICC-CE侧边栏来避免界面上的冲突</div>
                </div>
            </Card>
        </div>
    );
};

export default HelperSettings;

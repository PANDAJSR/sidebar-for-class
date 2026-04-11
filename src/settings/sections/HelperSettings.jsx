/**
 * 辅助工具设置组件
 * 提供一些辅助性的功能设置
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {Object} styles - 样式对象
 */

import React from 'react';
import Card from '@mui/joy/Card';
import Switch from '@mui/joy/Switch';

const HelperSettings = ({ config, updateConfig, styles }) => {
    const helperTools = config.helper_tools || {};

    const handleToggle = async (key, value) => {
        const newConfig = {
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
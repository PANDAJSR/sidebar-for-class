/**
 * 辅助工具设置组件
 * 提供一些辅助性的功能设置
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {Object} styles - 样式对象
 */

import React from 'react';
import 'mdui/components/card.js';
import 'mdui/components/switch.js';

const HelperSettings = ({ config, updateConfig, styles }) => {
    // 确保 helper_tools 对象存在
    const helperTools = config.helper_tools || {};

    const handleToggle = async (key, value) => {
        const newConfig = {
            ...config,
            helper_tools: {
                ...helperTools,
                [key]: value
            }
        };

        // 立即更新 UI 状态和发送预览
        updateConfig(newConfig);

        // 如果是 ICC-CE 兼容设置，立即执行对应的 URI
        if (key === 'icc_compatibility') {
            const uri = value ? 'icc://thoroughHideOn' : 'icc://thoroughHideOff';
            if (window.electronAPI && window.electronAPI.isProcessRunning) {
                // 异步检查进程状态，避免阻塞 Switch 状态切换
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
            <mdui-card variant="filled" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.switchRow}>
                        <div className={styles.label}>自动查杀同类软件窗口</div>
                        <mdui-switch
                            checked={helperTools.auto_kill_similar || false}
                            onChange={(e) => handleToggle('auto_kill_similar', e.target.checked)}
                        />
                    </div>
                    <div className={styles.helpText}>启动时自动关闭其他可能产生冲突的同类软件窗口</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.switchRow}>
                        <div className={styles.label}>自动查杀同类软件计时器并打开本软件的计时器</div>
                        <mdui-switch
                            checked={helperTools.auto_kill_timer || false}
                            onChange={(e) => handleToggle('auto_kill_timer', e.target.checked)}
                        />
                    </div>
                    <div className={styles.helpText}>检测并关闭希沃计时器等同类软件，并自动启动本软件计时器</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.switchRow}>
                        <div className={styles.label}>ICC-CE兼容</div>
                        <mdui-switch
                            checked={helperTools.icc_compatibility || false}
                            onChange={(e) => handleToggle('icc_compatibility', e.target.checked)}
                        />
                    </div>
                    <div className={styles.helpText}>启动后隐藏ICC-CE侧边栏来避免界面上的冲突</div>
                </div>
            </mdui-card>
        </div>
    );
};

export default HelperSettings;

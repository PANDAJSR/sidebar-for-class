/**
 * 基本设置组件
 * 显示应用程序的基本设置选项
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {Object} styles - 样式对象
 */

import React from 'react';
import 'mdui/components/card.js';

const BasicSettings = ({ config, updateConfig, styles }) => {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>基本设置</div>
                <div className={styles.description}>配置应用程序的基本选项和偏好设置。</div>
            </div>
            <div className={styles.groupTitle}>常规</div>
            <mdui-card variant="filled" className={styles.card}>
                <div className={styles.formGroup}>
                    <span style={{ color: 'rgb(var(--mdui-color-on-surface-variant))' }}>
                        基本设置内容将在这里显示。
                    </span>
                </div>
            </mdui-card>
        </div>
    );
};

export default BasicSettings;

/**
 * 基本设置组件
 * 显示应用程序的基本设置选项
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {Object} styles - 样式对象
 */

import React from 'react';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';

const BasicSettings = ({ config, updateConfig, styles }) => {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>基本设置</div>
                <div className={styles.description}>配置应用程序的基本选项和偏好设置。</div>
            </div>
            <div className={styles.groupTitle}>常规</div>
            <Card variant="soft" className={styles.card}>
                <div className={styles.formGroup}>
                    <Typography level="body-sm" sx={{ color: 'var(--joy-palette-text-secondary)' }}>
                        基本设置内容将在这里显示。
                    </Typography>
                </div>
            </Card>
        </div>
    );
};

export default BasicSettings;
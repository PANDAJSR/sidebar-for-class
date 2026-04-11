import React from 'react';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';

interface Config {
    [key: string]: unknown;
}

interface Styles {
    section: string;
    sectionHeader: string;
    title: string;
    description: string;
    groupTitle: string;
    card: string;
    formGroup: string;
}

interface BasicSettingsProps {
    config: Config;
    updateConfig: (config: Config) => void;
    styles: Styles;
}

const BasicSettings: React.FC<BasicSettingsProps> = ({ config, updateConfig, styles }) => {
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

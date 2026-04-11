import React from 'react';
import Card from '@mui/joy/Card';
import Switch from '@mui/joy/Switch';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';

interface TimerConfig {
    auto_hide_seconds?: number;
    enable_animations?: boolean | string;
    enable_sound?: boolean;
}

interface Config {
    timer?: TimerConfig;
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
    switchRow: string;
    helpText: string;
}

interface TimerSettingsProps {
    config: Config;
    updateConfig: (config: Config) => void;
    styles: Styles;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({ config, updateConfig, styles }) => {
    const timerConfig = config.timer || {};

    const handleAutoHideChange = (value: number): void => {
        const newConfig: Config = {
            ...config,
            timer: {
                ...timerConfig,
                auto_hide_seconds: value
            }
        };
        updateConfig(newConfig);
    };

    const handleAnimationsChange = (value: string): void => {
        const newConfig: Config = {
            ...config,
            timer: {
                ...timerConfig,
                enable_animations: value
            }
        };
        updateConfig(newConfig);
    };

    const handleSoundChange = (checked: boolean): void => {
        const newConfig: Config = {
            ...config,
            timer: {
                ...timerConfig,
                enable_sound: checked
            }
        };
        updateConfig(newConfig);
    };

    const options = [
        { label: '禁用', value: 0 },
        { label: '3秒', value: 3 },
        { label: '5秒', value: 5 },
        { label: '10秒', value: 10 }
    ];

    const animationOptions = [
        { label: '开启', value: 'on' },
        { label: '关闭', value: 'off' },
        { label: '部分关闭', value: 'partial' }
    ];

    const currentAutoHide = timerConfig.auto_hide_seconds || 0;

    let animationValue: string = timerConfig.enable_animations as string || 'on';
    if (typeof animationValue === 'boolean') {
        animationValue = animationValue ? 'on' : 'off';
    } else if (!animationValue) {
        animationValue = 'on';
    }

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>计时器设置</div>
                <div className={styles.description}>配置计时器的行为和自动化选项。</div>
            </div>

            <div className={styles.groupTitle}>常规</div>
            <Card variant="soft" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>自动收起至迷你模式</div>
                    <Select
                        value={currentAutoHide}
                        onChange={(_, value) => handleAutoHideChange(value as number)}
                        sx={{ width: 120 }}
                    >
                        {options.map((option) => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                    <div className={styles.helpText}>当计时器处于计时状态且无操作达到设定时间后，自动切换到迷你模式。</div>
                </div>
            </Card>

            <div className={styles.groupTitle}>动画</div>
            <Card variant="soft" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>启用动画</div>
                    <Select
                        value={animationValue}
                        onChange={(_, value) => handleAnimationsChange(value as string)}
                        sx={{ width: 120 }}
                    >
                        {animationOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                    <div className={styles.helpText}>开启：启用所有动画；部分关闭：只禁用窗口缩放动画，保留计时器数字切换动画；关闭：禁用所有过渡动画。</div>
                </div>
            </Card>

            <div className={styles.groupTitle}>声音</div>
            <Card variant="soft" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.switchRow}>
                        <div className={styles.label}>计时器提示音</div>
                        <Switch
                            checked={timerConfig.enable_sound !== false}
                            onChange={(e) => handleSoundChange(e.target.checked)}
                        />
                    </div>
                    <div className={styles.helpText}>倒计时结束时播放提示音。</div>
                </div>
            </Card>
        </div>
    );
};

export default TimerSettings;

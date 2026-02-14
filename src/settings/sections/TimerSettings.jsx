/**
 * 计时器设置组件
 * 提供计时器相关的配置选项
 * @param {Object} config - 配置对象
 * @param {Function} updateConfig - 更新配置的回调函数
 * @param {Object} styles - 样式对象
 */

import React from 'react';
import 'mdui/components/card.js';
import 'mdui/components/switch.js';
import 'mdui/components/dropdown.js';
import 'mdui/components/menu.js';
import 'mdui/components/menu-item.js';
import 'mdui/components/button.js';

const TimerSettings = ({ config, updateConfig, styles }) => {
    // 确保 timer 配置对象存在
    const timerConfig = config.timer || {};

    const handleAutoHideChange = (value) => {
        const newConfig = {
            ...config,
            timer: {
                ...timerConfig,
                auto_hide_seconds: value
            }
        };
        updateConfig(newConfig);
    };

    const handleAnimationsChange = (value) => {
        const newConfig = {
            ...config,
            timer: {
                ...timerConfig,
                enable_animations: value
            }
        };
        updateConfig(newConfig);
    };

    const handleSoundChange = (checked) => {
        const newConfig = {
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

    // 获取当前选中的选项，如果没有设置则默认为禁用(0)
    const currentAutoHide = timerConfig.auto_hide_seconds || 0;
    const currentOption = options.find(opt => opt.value === currentAutoHide) || options[0];

    // 获取动画设置，默认为开启('on')
    // 兼容旧配置：如果 enable_animations 是布尔值，转换为新格式
    let animationValue = timerConfig.enable_animations;
    if (typeof animationValue === 'boolean') {
        animationValue = animationValue ? 'on' : 'off';
    } else if (!animationValue) {
        animationValue = 'on';
    }
    const currentAnimationOption = animationOptions.find(opt => opt.value === animationValue) || animationOptions[0];

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>计时器设置</div>
                <div className={styles.description}>配置计时器的行为和自动化选项。</div>
            </div>

            <div className={styles.groupTitle}>常规</div>
            <mdui-card variant="filled" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>自动收起至迷你模式</div>
                    <mdui-dropdown>
                        <mdui-button slot="trigger" variant="tonal" style={{ width: '120px' }}>
                            {currentOption.label}
                        </mdui-button>
                        <mdui-menu>
                            {options.map((option) => (
                                <mdui-menu-item
                                    key={option.value}
                                    value={option.value}
                                    onClick={() => handleAutoHideChange(option.value)}
                                >
                                    {option.label}
                                </mdui-menu-item>
                            ))}
                        </mdui-menu>
                    </mdui-dropdown>
                    <div className={styles.helpText}>当计时器处于计时状态且无操作达到设定时间后，自动切换到迷你模式。</div>
                </div>
            </mdui-card>

            <div className={styles.groupTitle}>动画</div>
            <mdui-card variant="filled" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>启用动画</div>
                    <mdui-dropdown>
                        <mdui-button slot="trigger" variant="tonal" style={{ width: '120px' }}>
                            {currentAnimationOption.label}
                        </mdui-button>
                        <mdui-menu>
                            {animationOptions.map((option) => (
                                <mdui-menu-item
                                    key={option.value}
                                    value={option.value}
                                    onClick={() => handleAnimationsChange(option.value)}
                                >
                                    {option.label}
                                </mdui-menu-item>
                            ))}
                        </mdui-menu>
                    </mdui-dropdown>
                    <div className={styles.helpText}>开启：启用所有动画；部分关闭：只禁用窗口缩放动画，保留计时器数字切换动画；关闭：禁用所有过渡动画。</div>
                </div>
            </mdui-card>

            <div className={styles.groupTitle}>声音</div>
            <mdui-card variant="filled" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.switchRow}>
                        <div className={styles.label}>计时器提示音</div>
                        <mdui-switch
                            checked={timerConfig.enable_sound !== false}
                            onChange={(e) => handleSoundChange(e.target.checked)}
                        />
                    </div>
                    <div className={styles.helpText}>倒计时结束时播放提示音。</div>
                </div>
            </mdui-card>
        </div>
    );
};

export default TimerSettings;

import React from 'react';
import Card from '@mui/joy/Card';
import Slider from '@mui/joy/Slider';

interface Transforms {
    animation_speed?: number;
    size?: number;
    panel?: {
        width?: number;
        height?: number;
    };
    theme_color?: string;
}

interface Config {
    transforms?: Transforms;
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
    rangeContainer: string;
    rangeValue: string;
    colorPickerContainer: string;
    colorInput: string;
    colorValue: string;
    helpText: string;
}

interface StyleSettingsProps {
    config: Config;
    handleTransformChange: (key: string, value: number | string | { width?: number; height?: number }) => void;
    styles: Styles;
}

const StyleSettings: React.FC<StyleSettingsProps> = ({ config, handleTransformChange, styles }) => {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>界面样式</div>
                <div className={styles.description}>配置侧边栏的动画速度、缩放比例和展开后的尺寸。</div>
            </div>

            <Card variant="soft" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>动画速度</div>
                    <div className={styles.rangeContainer}>
                        <Slider
                            min={0.1}
                            max={3}
                            step={0.1}
                            value={config.transforms?.animation_speed}
                            onChange={(_, value) => handleTransformChange('animation_speed', value as number)}
                        />
                        <span className={styles.rangeValue}>{config.transforms?.animation_speed?.toFixed(1)}x</span>
                    </div>
                    <div className={styles.helpText}>设置侧边栏展开和收起的动画播放速度</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>整体缩放</div>
                    <div className={styles.rangeContainer}>
                        <Slider
                            min={50}
                            max={200}
                            step={10}
                            value={config.transforms?.size}
                            onChange={(_, value) => handleTransformChange('size', value as number)}
                        />
                        <span className={styles.rangeValue}>{config.transforms?.size}%</span>
                    </div>
                    <div className={styles.helpText}>侧边栏窗口的全局缩放比例</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>展开后宽度</div>
                    <div className={styles.rangeContainer}>
                        <Slider
                            min={300}
                            max={800}
                            step={10}
                            value={config.transforms?.panel?.width || 450}
                            onChange={(_, value) => {
                                const currentPanelConfig = config.transforms?.panel || {};
                                handleTransformChange('panel', { ...currentPanelConfig, width: value as number });
                            }}
                        />
                        <span className={styles.rangeValue}>{config.transforms?.panel?.width || 450}px</span>
                    </div>
                    <div className={styles.helpText}>侧边栏展开后的宽度</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>展开后高度</div>
                    <div className={styles.rangeContainer}>
                        <Slider
                            min={300}
                            max={800}
                            step={10}
                            value={config.transforms?.panel?.height || 400}
                            onChange={(_, value) => {
                                const currentPanelConfig = config.transforms?.panel || {};
                                handleTransformChange('panel', { ...currentPanelConfig, height: value as number });
                            }}
                        />
                        <span className={styles.rangeValue}>{config.transforms?.panel?.height || 400}px</span>
                    </div>
                    <div className={styles.helpText}>侧边栏展开后的高度</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>主题色</div>
                    <div className={styles.colorPickerContainer}>
                        <input
                            type="color"
                            value={config.transforms?.theme_color || '#5865F2'}
                            onChange={(e) => handleTransformChange('theme_color', e.target.value)}
                            className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{config.transforms?.theme_color || '#5865F2'}</span>
                    </div>
                    <div className={styles.helpText}>设置侧边栏的主题强调色</div>
                </div>
            </Card>
        </div>
    );
};

export default StyleSettings;

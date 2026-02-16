/**
 * 样式设置组件
 * 配置侧边栏的动画速度和整体缩放
 * @param {Object} config - 配置对象
 * @param {Function} handleTransformChange - 处理变换属性变化的回调函数
 * @param {Object} styles - 样式对象
 */

import React from 'react';
import 'mdui/components/card.js';
import 'mdui/components/slider.js';

const StyleSettings = ({ config, handleTransformChange, styles }) => {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>界面样式</div>
                <div className={styles.description}>配置侧边栏的动画速度、缩放比例和展开后的尺寸。</div>
            </div>

            <mdui-card variant="filled" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>动画速度</div>
                    <div className={styles.rangeContainer}>
                        <mdui-slider
                            min={0.1}
                            max={3}
                            step={0.1}
                            value={config.transforms.animation_speed}
                            onChange={(e) => handleTransformChange('animation_speed', parseFloat(e.target.value))}
                        />
                        <span className={styles.rangeValue}>{config.transforms.animation_speed.toFixed(1)}x</span>
                    </div>
                    <div className={styles.helpText}>设置侧边栏展开和收起的动画播放速度</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>整体缩放</div>
                    <div className={styles.rangeContainer}>
                        <mdui-slider
                            min={50}
                            max={200}
                            step={10}
                            value={config.transforms.size}
                            onChange={(e) => handleTransformChange('size', parseInt(e.target.value))}
                        />
                        <span className={styles.rangeValue}>{config.transforms.size}%</span>
                    </div>
                    <div className={styles.helpText}>侧边栏窗口的全局缩放比例</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>展开后宽度</div>
                    <div className={styles.rangeContainer}>
                        <mdui-slider
                            min={300}
                            max={800}
                            step={10}
                            value={config.transforms?.panel?.width || 450}
                            onChange={(e) => {
                                const newWidth = parseInt(e.target.value);
                                const currentPanelConfig = config.transforms?.panel || {};
                                handleTransformChange('panel', { ...currentPanelConfig, width: newWidth });
                            }}
                        />
                        <span className={styles.rangeValue}>{config.transforms?.panel?.width || 450}px</span>
                    </div>
                    <div className={styles.helpText}>侧边栏展开后的宽度</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>展开后高度</div>
                    <div className={styles.rangeContainer}>
                        <mdui-slider
                            min={300}
                            max={800}
                            step={10}
                            value={config.transforms?.panel?.height || 400}
                            onChange={(e) => {
                                const newHeight = parseInt(e.target.value);
                                const currentPanelConfig = config.transforms?.panel || {};
                                handleTransformChange('panel', { ...currentPanelConfig, height: newHeight });
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
            </mdui-card>
        </div>
    );
};

export default StyleSettings;
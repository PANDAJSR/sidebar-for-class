/**
 * 窗口设置组件
 * 配置侧边栏窗口的显示器、位置和尺寸
 * @param {Object} config - 配置对象
 * @param {Function} handleTransformChange - 处理变换属性变化的回调函数
 * @param {Object} styles - 样式对象
 */

import React, { useState, useEffect } from 'react';
import 'mdui/components/card.js';
import 'mdui/components/slider.js';
import 'mdui/components/switch.js';
import 'mdui/components/text-field.js';
import 'mdui/components/dropdown.js';
import 'mdui/components/menu.js';
import 'mdui/components/menu-item.js';
import 'mdui/components/button.js';

const WindowSettings = ({ config, handleTransformChange, styles }) => {
    const [displays, setDisplays] = useState([]);
    const expandMode = config.transforms?.expand_mode || 'drag';
    const expandModeLabels = {
        click: '点击展开',
        drag: '拖动展开',
        both: '点击和拖动'
    };

    useEffect(() => {
        const fetchDisplays = async () => {
            const displayList = await window.electronAPI.getDisplays();
            setDisplays(displayList);
        };
        fetchDisplays();

        const removeListener = window.electronAPI.onDisplaysUpdated((updatedDisplays) => {
            setDisplays(updatedDisplays);
        });

        return () => {
            if (removeListener) removeListener();
        };
    }, []);

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>窗口设置</div>
                <div className={styles.description}>配置侧边栏窗口的显示器、位置和尺寸。</div>
            </div>

            <div className={styles.groupTitle}>显示器</div>
            <mdui-card variant="filled" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>选择显示器</div>
                    <mdui-dropdown>
                        <mdui-button slot="trigger" variant="tonal" style={{ width: '120px' }}>
                            {displays[config.transforms.display]
                                ? (displays[config.transforms.display].label || `显示器 ${config.transforms.display} (${displays[config.transforms.display].bounds.width}x${displays[config.transforms.display].bounds.height})`)
                                : `显示器 ${config.transforms.display}`}
                        </mdui-button>
                        <mdui-menu>
                            {displays.map((display, index) => (
                                <mdui-menu-item
                                    key={index}
                                    value={index.toString()}
                                    onClick={() => handleTransformChange('display', index)}
                                >
                                    {display.label || `显示器 ${index} (${display.bounds.width}x${display.bounds.height})`}
                                </mdui-menu-item>
                            ))}
                        </mdui-menu>
                    </mdui-dropdown>
                    <div className={styles.helpText}>选择侧边栏所在的屏幕</div>
                </div>
            </mdui-card>

            <div className={styles.groupTitle}>位置与尺寸</div>
            <mdui-card variant="filled" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>垂直位置</div>
                    <div className={styles.rangeContainer}>
                        <mdui-slider
                            min={0}
                            max={config.displayBounds?.height || 2000}
                            value={config.transforms.posy}
                            onChange={(e) => handleTransformChange('posy', parseInt(e.target.value))}
                        />
                        <span className={styles.rangeValue}>{config.transforms.posy}px</span>
                    </div>
                    <div className={styles.helpText}>侧边栏中心的垂直坐标</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>初始高度</div>
                    <mdui-text-field
                        type="number"
                        value={config.transforms.height}
                        onChange={(e) => handleTransformChange('height', parseInt(e.target.value))}
                        end-icon="px"
                        style={{ width: '200px' }}
                    />
                    <div className={styles.helpText}>收起状态下侧边栏的高度</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.switchRow}>
                        <div className={styles.label}>自动收起</div>
                        <mdui-switch
                            checked={config.transforms.auto_hide}
                            onChange={(e) => handleTransformChange('auto_hide', e.target.checked)}
                        />
                    </div>
                    <div className={styles.helpText}>失去焦点时自动收起侧边栏</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>展开方式</div>
                    <mdui-dropdown>
                        <mdui-button slot="trigger" variant="tonal" style={{ width: '180px' }}>
                            {expandModeLabels[expandMode] || expandModeLabels.drag}
                        </mdui-button>
                        <mdui-menu>
                            <mdui-menu-item value="click" onClick={() => handleTransformChange('expand_mode', 'click')}>
                                {expandModeLabels.click}
                            </mdui-menu-item>
                            <mdui-menu-item value="drag" onClick={() => handleTransformChange('expand_mode', 'drag')}>
                                {expandModeLabels.drag}
                            </mdui-menu-item>
                            <mdui-menu-item value="both" onClick={() => handleTransformChange('expand_mode', 'both')}>
                                {expandModeLabels.both}
                            </mdui-menu-item>
                        </mdui-menu>
                    </mdui-dropdown>
                    <div className={styles.helpText}>设置收起状态下通过点击、拖动或两者都可来展开侧边栏</div>
                </div>
            </mdui-card>
        </div>
    );
};

export default WindowSettings;

import React, { useState, useEffect } from 'react';
import Card from '@mui/joy/Card';
import Slider from '@mui/joy/Slider';
import Switch from '@mui/joy/Switch';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';

const WindowSettings = ({ config, handleTransformChange, styles }) => {
    const [displays, setDisplays] = useState([]);

    const expandMode = config.transforms?.expand_mode || 'drag';
    const clickExpandStyle = config.transforms?.click_expand_style || 'bar';

    const expandModeLabels = {
        click: '点击展开',
        drag: '拖动展开',
        both: '点击和拖动'
    };

    const clickStyleLabels = {
        bar: '默认细条',
        edge_tab: '贴边把手'
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
            <Card variant="soft" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>选择显示器</div>
                    <Select
                        value={config.transforms.display?.toString() || '0'}
                        onChange={(_, value) => handleTransformChange('display', parseInt(value))}
                        sx={{ width: 200 }}
                    >
                        {displays.map((display, index) => (
                            <Option key={index} value={index.toString()}>
                                {display.label || `显示器 ${index} (${display.bounds.width}x${display.bounds.height})`}
                            </Option>
                        ))}
                    </Select>
                    <div className={styles.helpText}>选择侧边栏所在的屏幕</div>
                </div>
            </Card>

            <div className={styles.groupTitle}>位置与尺寸</div>
            <Card variant="soft" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>垂直位置</div>
                    <div className={styles.rangeContainer}>
                        <Slider
                            min={0}
                            max={config.displayBounds?.height || 2000}
                            value={config.transforms.posy}
                            onChange={(_, value) => handleTransformChange('posy', value)}
                        />
                        <span className={styles.rangeValue}>{config.transforms.posy}px</span>
                    </div>
                    <div className={styles.helpText}>侧边栏中心的垂直坐标</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>初始高度</div>
                    <Input
                        type="number"
                        value={config.transforms.height}
                        onChange={(e) => handleTransformChange('height', parseInt(e.target.value, 10))}
                        endDecorator="px"
                        sx={{ width: 200 }}
                    />
                    <div className={styles.helpText}>收起状态下侧边栏的高度</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.switchRow}>
                        <div className={styles.label}>自动收起</div>
                        <Switch
                            checked={config.transforms.auto_hide}
                            onChange={(e) => handleTransformChange('auto_hide', e.target.checked)}
                        />
                    </div>
                    <div className={styles.helpText}>失去焦点时自动收起侧边栏</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>展开方式</div>
                    <Select
                        value={expandMode}
                        onChange={(_, value) => handleTransformChange('expand_mode', value)}
                        sx={{ width: 180 }}
                    >
                        <Option value="click">{expandModeLabels.click}</Option>
                        <Option value="drag">{expandModeLabels.drag}</Option>
                        <Option value="both">{expandModeLabels.both}</Option>
                    </Select>
                    <div className={styles.helpText}>设置收起状态下通过点击、拖动或两者都可来展开侧边栏</div>
                </div>

                {expandMode === 'click' && (
                    <div className={styles.formGroup}>
                        <div className={styles.label}>点击展开样式</div>
                        <Select
                            value={clickExpandStyle}
                            onChange={(_, value) => handleTransformChange('click_expand_style', value)}
                            sx={{ width: 200 }}
                        >
                            <Option value="bar">{clickStyleLabels.bar}</Option>
                            <Option value="edge_tab">{clickStyleLabels.edge_tab}</Option>
                        </Select>
                        <div className={styles.helpText}>仅在"点击展开"模式下可选，贴边把手将使用水平滑入/滑出动画</div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default WindowSettings;
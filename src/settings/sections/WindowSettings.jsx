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
    const clickExpandStyle = config.transforms?.click_expand_style || 'bar';

    const expandModeLabels = {
        click: 'Click Expand',
        drag: 'Drag Expand',
        both: 'Click + Drag'
    };

    const clickStyleLabels = {
        bar: 'Default Bar',
        edge_tab: 'Edge Handle'
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
                <div className={styles.title}>Window Settings</div>
                <div className={styles.description}>Configure display, position and size for the sidebar window.</div>
            </div>

            <div className={styles.groupTitle}>Display</div>
            <mdui-card variant="filled" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>Choose Display</div>
                    <mdui-dropdown>
                        <mdui-button slot="trigger" variant="tonal" style={{ width: '170px' }}>
                            {displays[config.transforms.display]
                                ? (displays[config.transforms.display].label || `Display ${config.transforms.display} (${displays[config.transforms.display].bounds.width}x${displays[config.transforms.display].bounds.height})`)
                                : `Display ${config.transforms.display}`}
                        </mdui-button>
                        <mdui-menu>
                            {displays.map((display, index) => (
                                <mdui-menu-item
                                    key={index}
                                    value={index.toString()}
                                    onClick={() => handleTransformChange('display', index)}
                                >
                                    {display.label || `Display ${index} (${display.bounds.width}x${display.bounds.height})`}
                                </mdui-menu-item>
                            ))}
                        </mdui-menu>
                    </mdui-dropdown>
                    <div className={styles.helpText}>Select which monitor the sidebar should stay on.</div>
                </div>
            </mdui-card>

            <div className={styles.groupTitle}>Position and Size</div>
            <mdui-card variant="filled" className={styles.card}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>Vertical Position</div>
                    <div className={styles.rangeContainer}>
                        <mdui-slider
                            min={0}
                            max={config.displayBounds?.height || 2000}
                            value={config.transforms.posy}
                            onChange={(e) => handleTransformChange('posy', parseInt(e.target.value, 10))}
                        />
                        <span className={styles.rangeValue}>{config.transforms.posy}px</span>
                    </div>
                    <div className={styles.helpText}>Vertical center position of sidebar.</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>Collapsed Height</div>
                    <mdui-text-field
                        type="number"
                        value={config.transforms.height}
                        onChange={(e) => handleTransformChange('height', parseInt(e.target.value, 10))}
                        end-icon="px"
                        style={{ width: '200px' }}
                    />
                    <div className={styles.helpText}>Height when sidebar is collapsed.</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.switchRow}>
                        <div className={styles.label}>Auto Collapse</div>
                        <mdui-switch
                            checked={config.transforms.auto_hide}
                            onChange={(e) => handleTransformChange('auto_hide', e.target.checked)}
                        />
                    </div>
                    <div className={styles.helpText}>Collapse automatically after losing focus.</div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>Expand Mode</div>
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
                    <div className={styles.helpText}>Choose how the sidebar opens while collapsed.</div>
                </div>

                {expandMode === 'click' && (
                    <div className={styles.formGroup}>
                        <div className={styles.label}>Click Expand Style</div>
                        <mdui-dropdown>
                            <mdui-button slot="trigger" variant="tonal" style={{ width: '200px' }}>
                                {clickStyleLabels[clickExpandStyle] || clickStyleLabels.bar}
                            </mdui-button>
                            <mdui-menu>
                                <mdui-menu-item value="bar" onClick={() => handleTransformChange('click_expand_style', 'bar')}>
                                    {clickStyleLabels.bar}
                                </mdui-menu-item>
                                <mdui-menu-item value="edge_tab" onClick={() => handleTransformChange('click_expand_style', 'edge_tab')}>
                                    {clickStyleLabels.edge_tab}
                                </mdui-menu-item>
                            </mdui-menu>
                        </mdui-dropdown>
                        <div className={styles.helpText}>Available only for Click Expand. Edge Handle uses horizontal slide in/out animation.</div>
                    </div>
                )}
            </mdui-card>
        </div>
    );
};

export default WindowSettings;

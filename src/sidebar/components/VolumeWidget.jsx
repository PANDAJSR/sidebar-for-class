/**
 * 音量控制组件
 * 显示一个音量滑块，用于调整系统音量
 * @param {Array<number>} range - 音量范围 [最小值, 最大值]，默认为 [0, 100]
 */

import React, { useState, useEffect, useRef } from 'react';
import 'mdui/components/slider.js';
import 'mdui/components/card.js';

const VolumeWidget = ({ range, isPreview = false }) => {
    // 当前音量值（0-100）
    const [volume, setVolume] = useState(0);
    // 音量范围的最小值和最大值
    const min = range ? range[0] : 0;
    const max = range ? range[1] : 100;
    // mdui-slider 的 ref
    const sliderRef = useRef(null);

    /**
     * 组件挂载时获取当前系统音量
     */
    useEffect(() => {
        window.electronAPI.getVolume()
            .then(vol => setVolume(vol))
            .catch(err => console.error('获取音量失败:', err));
    }, []);

    /**
     * 处理音量滑块变化事件
     * 使用 mdui-slider 的 input 事件
     */
    const handleVolumeChange = (e) => {
        const val = parseInt(e.target.value);
        setVolume(val);  // 更新本地状态
        if (!isPreview) {
            window.electronAPI.setVolume(val);  // 更新系统音量
        }
    };

    return (
        <mdui-card variant="elevated" className="volume-slider-container">
            <div className="volume-slider-row">
                <div className="volume-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                </div>
                <div className="slider-wrapper">
                    <mdui-slider
                        ref={sliderRef}
                        className="volume-slider"
                        min={min}
                        max={max}
                        value={volume}
                        onInput={handleVolumeChange}
                        disabled={isPreview}
                        nolabel
                    />
                </div>
                <div className="volume-value">{volume}%</div>
            </div>
        </mdui-card>
    );
};

export default VolumeWidget;

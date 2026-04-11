import React, { useState, useEffect } from 'react';

interface VolumeWidgetProps {
    range?: [number, number];
    isPreview?: boolean;
}

const VolumeWidget: React.FC<VolumeWidgetProps> = ({ range, isPreview = false }) => {
    const [volume, setVolume] = useState(0);
    const min = range ? range[0] : 0;
    const max = range ? range[1] : 100;

    useEffect(() => {
        window.electronAPI.getVolume()
            .then((vol: number) => setVolume(vol))
            .catch((err: Error) => console.error('获取音量失败:', err));
    }, []);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        setVolume(val);

        if (!isPreview) {
            window.electronAPI.setVolume(val);
        }
    };

    return (
        <div className="volume-slider-container">
            <div className="volume-slider-row">
                <div className="volume-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                </div>

                <div className="slider-wrapper">
                    <input
                        type="range"
                        className="volume-slider"
                        min={min}
                        max={max}
                        value={volume}
                        onChange={handleVolumeChange}
                        onInput={handleVolumeChange}
                        disabled={isPreview}
                    />
                </div>

                <div className="volume-value">{volume}%</div>
            </div>
        </div>
    );
};

export default VolumeWidget;

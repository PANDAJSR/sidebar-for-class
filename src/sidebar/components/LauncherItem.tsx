import React, { useState, useEffect } from 'react';

export const iconCache: Map<string, string> = new Map();
export const pendingIcons: Map<string, Promise<string | null>> = new Map();

interface LauncherItemProps {
    name: string;
    target: string;
    args?: string[];
    isPreview?: boolean;
}

const LauncherItem: React.FC<LauncherItemProps> = ({ name, target, args, isPreview = false }) => {
    const [icon, setIcon] = useState<string | null>(iconCache.get(target) || null);

    useEffect(() => {
        if (!target) {
            setIcon(null);
            return;
        }

        if (iconCache.has(target)) {
            setIcon(iconCache.get(target) || null);
            return;
        }

        if (pendingIcons.has(target)) {
            pendingIcons.get(target)?.then(iconDataUrl => {
                if (iconDataUrl) setIcon(iconDataUrl);
            });
            return;
        }

        const iconPromise = window.electronAPI.getFileIcon(target)
            .then(iconDataUrl => {
                if (iconDataUrl) {
                    iconCache.set(target, iconDataUrl);
                    setIcon(iconDataUrl);
                }
                return iconDataUrl;
            })
            .catch((err: Error) => {
                console.error('获取图标失败:', err);
                return null;
            })
            .finally(() => {
                pendingIcons.delete(target);
            });

        pendingIcons.set(target, iconPromise);
    }, [target]);

    const handleClick = (e: React.MouseEvent) => {
        if (isPreview) {
            e.stopPropagation();
            return;
        }
        e.stopPropagation();
        window.electronAPI.launchApp(target, args || []);
    };

    return (
        <button
            type="button"
            className="launcher-item"
            onClick={handleClick}
            title={name}
        >
            <div className="launcher-icon">
                {icon ? (
                    <img src={icon} alt={name} />
                ) : (
                    <div className="launcher-icon-placeholder" />
                )}
            </div>
            <span className="launcher-name">{name}</span>
        </button>
    );
};

export default LauncherItem;

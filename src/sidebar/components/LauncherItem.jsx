/**
 * 启动器项组件
 * 显示一个可点击的应用启动项，包含图标和名称
 * @param {string} name - 显示名称
 * @param {string} target - 目标应用路径或 URI
 * @param {Array<string>} args - 启动参数数组
 */

import React, { useState, useEffect } from 'react';

// 全局图标缓存，避免重复从主进程获取相同的图标
// 格式: { [target]: dataUrl }
export const iconCache = new Map();
// 正在进行的图标请求，避免并发重复请求同一个图标
export const pendingIcons = new Map();

const LauncherItem = ({ name, target, args, isPreview = false }) => {
    // 图标状态：存储从主进程获取的图标数据 URL
    const [icon, setIcon] = useState(iconCache.get(target) || null);

    /**
     * 加载应用图标
     * 当 target 改变时，从主进程获取对应的文件图标
     */
    useEffect(() => {
        if (!target) {
            setIcon(null);
            return;
        }

        // 1. 检查缓存
        if (iconCache.has(target)) {
            setIcon(iconCache.get(target));
            return;
        }

        // 2. 检查是否有正在进行的请求
        if (pendingIcons.has(target)) {
            pendingIcons.get(target).then(iconDataUrl => {
                if (iconDataUrl) setIcon(iconDataUrl);
            });
            return;
        }

        // 3. 发起新请求
        const iconPromise = window.electronAPI.getFileIcon(target)
            .then(iconDataUrl => {
                if (iconDataUrl) {
                    iconCache.set(target, iconDataUrl);
                    setIcon(iconDataUrl);
                }
                return iconDataUrl;
            })
            .catch(err => {
                console.error('获取图标失败:', err);
                return null;
            })
            .finally(() => {
                pendingIcons.delete(target);
            });

        pendingIcons.set(target, iconPromise);
    }, [target]);

    /**
     * 处理点击事件
     * 启动目标应用
     * @param {Event} e - 点击事件对象
     */
    const handleClick = (e) => {
        if (isPreview) {
            e.stopPropagation();
            return;
        }
        e.stopPropagation();  // 阻止事件冒泡，避免触发侧边栏的拖拽
        window.electronAPI.launchApp(target, args || []);  // 调用主进程启动应用
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

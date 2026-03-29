/**
 * 侧边栏导航组件
 * 显示设置页面的标签页导航
 * @param {string} selectedTab - 当前选中的标签页
 * @param {Function} onTabSelect - 标签页选择回调函数
 * @param {Object} styles - 样式对象
 */

import React from 'react';
import 'mdui/mdui.css';
import 'mdui/components/navigation-rail.js';
import 'mdui/components/navigation-rail-item.js';

const SidebarNav = ({ selectedTab, onTabSelect, styles }) => {
    const handleTabClick = (tabValue) => {
        onTabSelect(tabValue);
    };

    return (
        <aside className={styles.sidebar}>
            <mdui-navigation-rail value={selectedTab}>
                <mdui-navigation-rail-item
                    value="basic"
                    icon="settings"
                    onClick={() => handleTabClick('basic')}
                >
                    基本
                </mdui-navigation-rail-item>
                <mdui-navigation-rail-item
                    value="window"
                    icon="desktop_windows"
                    onClick={() => handleTabClick('window')}
                >
                    窗口
                </mdui-navigation-rail-item>
                <mdui-navigation-rail-item
                    value="style"
                    icon="brush"
                    onClick={() => handleTabClick('style')}
                >
                    样式
                </mdui-navigation-rail-item>
                <mdui-navigation-rail-item
                    value="components"
                    icon="apps"
                    onClick={() => handleTabClick('components')}
                >
                    组件
                </mdui-navigation-rail-item>
                <mdui-navigation-rail-item
                    value="automation"
                    icon="smart_toy"
                    onClick={() => handleTabClick('automation')}
                >
                    自动化
                </mdui-navigation-rail-item>
                <mdui-navigation-rail-item
                    value="data"
                    icon="storage"
                    onClick={() => handleTabClick('data')}
                >
                    数据
                </mdui-navigation-rail-item>
                <mdui-navigation-rail-item
                    value="timer"
                    icon="timer"
                    onClick={() => handleTabClick('timer')}
                >
                    计时器
                </mdui-navigation-rail-item>
                <mdui-navigation-rail-item
                    value="tools"
                    icon="build"
                    onClick={() => handleTabClick('tools')}
                >
                    辅助工具
                </mdui-navigation-rail-item>
            </mdui-navigation-rail>
        </aside>
    );
};

export default SidebarNav;

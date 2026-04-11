/**
 * 侧边栏导航组件
 * 显示设置页面的标签页导航
 * @param {string} selectedTab - 当前选中的标签页
 * @param {Function} onTabSelect - 标签页选择回调函数
 * @param {Object} styles - 样式对象
 */

import React from 'react';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import SettingsIcon from '@mui/icons-material/Settings';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import BrushIcon from '@mui/icons-material/Brush';
import AppsIcon from '@mui/icons-material/Apps';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StorageIcon from '@mui/icons-material/Storage';
import TimerIcon from '@mui/icons-material/Timer';
import BuildIcon from '@mui/icons-material/Build';

const iconMap = {
    basic: SettingsIcon,
    window: DesktopWindowsIcon,
    style: BrushIcon,
    components: AppsIcon,
    automation: SmartToyIcon,
    data: StorageIcon,
    timer: TimerIcon,
    tools: BuildIcon
};

const labelMap = {
    basic: '基本',
    window: '窗口',
    style: '样式',
    components: '组件',
    automation: '自动化',
    data: '数据',
    timer: '计时器',
    tools: '辅助工具'
};

const SidebarNav = ({ selectedTab, onTabSelect, styles }) => {
    const handleTabClick = (tabValue) => {
        onTabSelect(tabValue);
    };

    const tabs = ['basic', 'window', 'style', 'components', 'automation', 'data', 'timer', 'tools'];

    return (
        <aside className={styles.sidebar}>
            <List
                orientation="vertical"
                size="sm"
                sx={{
                    '--List-item-radius': '8px',
                    '--List-item-paddingY': '8px',
                    '--List-item-paddingX': '12px',
                }}
            >
                {tabs.map((tab) => {
                    const Icon = iconMap[tab];
                    return (
                        <ListItem key={tab}>
                            <ListItemButton
                                selected={selectedTab === tab}
                                onClick={() => handleTabClick(tab)}
                                sx={{
                                    borderRadius: '8px',
                                    '&.Mui-selected': {
                                        backgroundColor: 'var(--joy-palette-primary-container)',
                                        color: 'var(--joy-palette-on-primary-container)',
                                        '&:hover': {
                                            backgroundColor: 'var(--joy-palette-primary-containerHover)',
                                        }
                                    }
                                }}
                            >
                                <ListItemDecorator>
                                    {Icon && <Icon sx={{ fontSize: 20 }} />}
                                </ListItemDecorator>
                                <ListItemContent>
                                    {labelMap[tab]}
                                </ListItemContent>
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </aside>
    );
};

export default SidebarNav;
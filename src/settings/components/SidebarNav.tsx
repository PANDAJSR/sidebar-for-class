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

type TabValue = 'basic' | 'window' | 'style' | 'components' | 'automation' | 'data' | 'timer' | 'tools';

interface SidebarNavProps {
    selectedTab: TabValue;
    onTabSelect: (tab: TabValue) => void;
    styles: {
        sidebar: string;
    };
}

const iconMap: Record<TabValue, React.ComponentType<{ sx?: object }>> = {
    basic: SettingsIcon,
    window: DesktopWindowsIcon,
    style: BrushIcon,
    components: AppsIcon,
    automation: SmartToyIcon,
    data: StorageIcon,
    timer: TimerIcon,
    tools: BuildIcon,
};

const labelMap: Record<TabValue, string> = {
    basic: '基本',
    window: '窗口',
    style: '样式',
    components: '组件',
    automation: '自动化',
    data: '数据',
    timer: '计时器',
    tools: '辅助工具',
};

const tabs: TabValue[] = ['basic', 'window', 'style', 'components', 'automation', 'data', 'timer', 'tools'];

const SidebarNav: React.FC<SidebarNavProps> = ({ selectedTab, onTabSelect, styles }) => {
    const handleTabClick = (tabValue: TabValue) => {
        onTabSelect(tabValue);
    };

    return (
        <aside className={styles.sidebar}>
            <List
                orientation="vertical"
                size="sm"
                sx={{
                    '--List-item-radius': '8px',
                    '--List-item-paddingY': '8px',
                    '--List-item-paddingX': '12px',
                    width: '100%',
                }}
            >
                {tabs.map((tab) => {
                    const Icon = iconMap[tab];
                    const isSelected = selectedTab === tab;

                    return (
                        <ListItem key={tab}>
                            <ListItemButton
                                selected={isSelected}
                                aria-current={isSelected ? 'page' : undefined}
                                onClick={() => handleTabClick(tab)}
                                sx={{
                                    borderRadius: '8px',
                                    minHeight: '40px',
                                    position: 'relative',
                                    color: isSelected
                                        ? 'var(--colorNeutralForeground1)'
                                        : 'var(--colorNeutralForeground2)',
                                    fontWeight: isSelected ? 600 : 400,
                                    '&:hover': {
                                        backgroundColor: isSelected
                                            ? 'var(--colorNeutralBackground1Selected)'
                                            : 'var(--colorNeutralBackground1Hover)',
                                    },
                                    '&.Mui-selected': {
                                        backgroundColor: 'var(--colorNeutralBackground1Selected)',
                                        color: 'var(--colorNeutralForeground1)',
                                        '&:hover': {
                                            backgroundColor: 'var(--colorNeutralBackground1Hover)',
                                        },
                                    },
                                }}
                            >
                                <ListItemDecorator>
                                    {Icon && <Icon sx={{ fontSize: 20, color: 'currentColor' }} />}
                                </ListItemDecorator>
                                <ListItemContent>{labelMap[tab]}</ListItemContent>
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </aside>
    );
};

export default SidebarNav;
import React from 'react';

interface ToolbarProps {
    tools?: string[];
    isExpanded?: boolean;
    collapse?: () => void;
    isPreview?: boolean;
    onScreenshot?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ tools = [], isExpanded, collapse, isPreview = false, onScreenshot }) => {
    const columns = Math.min(Math.max(tools.length, 1), 5);

    const handleToolClick = async (tool: string) => {
        if (isPreview) return;
        
        if (tool === 'screenshot') {
            if (onScreenshot) {
                onScreenshot();
            } else if (window.electronAPI && window.electronAPI.screenshot) {
                try {
                    if (isExpanded && collapse) {
                        collapse();
                        await new Promise(resolve => setTimeout(resolve, 400));
                    }

                    await window.electronAPI.screenshot();
                } catch (error) {
                    console.error('Screenshot failed:', error);
                }
            }
        } else if (tool === 'show_desktop' && window.electronAPI && window.electronAPI.showDesktop) {
            window.electronAPI.showDesktop();
        } else if (tool === 'taskview' && window.electronAPI && window.electronAPI.taskview) {
            window.electronAPI.taskview();
        } else if (tool === 'close_front_window' && window.electronAPI && window.electronAPI.blurAndCloseFrontWindow) {
            window.electronAPI.blurAndCloseFrontWindow();
        } else if (tool === 'timer' && window.electronAPI && window.electronAPI.openTimerWindow) {
            window.electronAPI.openTimerWindow();
        } else if (tool === 'touch_keyboard' && window.electronAPI && window.electronAPI.openFile) {
            window.electronAPI.openFile('C:\\Program Files\\Common Files\\microsoft shared\\ink\\TabTip.exe');
        } else {
            console.log(`工具按钮被点击: ${tool}`);
        }
    };

    const getToolIcon = (tool: string): string => {
        const iconMap: Record<string, string> = {
            'screenshot': 'fa-camera',
            'show_desktop': 'fa-desktop',
            'taskview': 'fa-columns',
            'close_front_window': 'fa-times',
            'timer': 'fa-stopwatch',
            'touch_keyboard': 'fa-keyboard',
        };
        return iconMap[tool] || 'fa-tools';
    };

    const getToolDisplayName = (tool: string): string => {
        const nameMap: Record<string, string> = {
            'screenshot': '截图',
            'show_desktop': '显示桌面',
            'taskview': '任务视图',
            'close_front_window': '关闭窗口',
            'timer': '计时器',
            'touch_keyboard': '触摸键盘',
        };
        return nameMap[tool] || tool;
    };

    return (
        <div className={`toolbar-widget ${tools.length === 1 ? 'single-tool' : ''}`}>
            <div className="toolbar-buttons" style={{ '--toolbar-columns': columns }}>
                {tools.map((tool, index) => (
                    <button
                        key={index}
                        type="button"
                        className="toolbar-button"
                        onClick={() => handleToolClick(tool)}
                        title={getToolDisplayName(tool)}
                    >
                        <div className="toolbar-icon">
                            <i className={`fas ${getToolIcon(tool)}`}></i>
                        </div>
                        <span className="toolbar-button-text">{getToolDisplayName(tool)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Toolbar;

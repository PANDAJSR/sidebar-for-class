/**
 * 工具栏组件
 * 显示工具按钮，每行最多显示5个按钮，超过自动换行
 * @param {Array<string>} tools - 工具名称数组
 * @param {boolean} isExpanded - 侧边栏是否展开
 * @param {Function} collapse - 收起侧边栏的函数
 */
import React from 'react';

const Toolbar = ({ tools = [], isExpanded, collapse, isPreview = false, onScreenshot }) => {
    /**
     * 处理工具按钮点击事件
     * @param {string} tool - 工具名称
     */
    const handleToolClick = async (tool) => {
        if (isPreview) return;
        
        // 根据不同的工具执行不同的操作
        if (tool === 'screenshot') {
            if (onScreenshot) {
                onScreenshot();
            } else if (window.electronAPI && window.electronAPI.screenshot) {
                try {
                    // 如果侧边栏是展开的，先收起并等待动画完成
                    if (isExpanded && collapse) {
                        collapse();
                        // 等待收起动画完成（默认300ms，加上一些缓冲时间）
                        await new Promise(resolve => setTimeout(resolve, 400));
                    }

                    // 执行截图
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

    /**
     * 获取工具对应的图标类名
     * @param {string} tool - 工具名称
     * @returns {string} - FontAwesome 图标类名
     */
    const getToolIcon = (tool) => {
        const iconMap = {
            'screenshot': 'fa-camera',
            'show_desktop': 'fa-desktop',
            'taskview': 'fa-columns',
            'close_front_window': 'fa-times',
            'timer': 'fa-stopwatch',
            'touch_keyboard': 'fa-keyboard',
        };
        return iconMap[tool] || 'fa-tools';
    };

    /**
     * 获取工具对应的中文显示名称
     * @param {string} tool - 工具名称
     * @returns {string} - 中文名称
     */
    const getToolDisplayName = (tool) => {
        const nameMap = {
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
            <div className="toolbar-buttons">
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

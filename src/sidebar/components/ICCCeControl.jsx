/**
 * ICC-CE 控制组件
 * 提供 ICC 相关的快速控制功能
 * @param {Array<string>} functions - 功能名称数组
 * @param {boolean} isExpanded - 侧边栏是否展开
 * @param {Function} collapse - 收起侧边栏的函数
 * @param {boolean} isPreview - 是否为预览模式
 */
import React from 'react';

const ICCCEControl = ({ functions = [], isExpanded, collapse, isPreview = false }) => {
    const columns = Math.min(Math.max(functions.length, 1), 5);

    /**
     * 处理功能按钮点击事件
     * @param {string} func - 功能名称
     */
    const handleFuncClick = async (func) => {
        if (isPreview) return;

        const uriMap = {
            'randone': 'icc://randone',
            'rand': 'icc://rand',
            'timer': 'icc://timer',
            'whiteboard': 'icc://whiteboard',
            'show': 'icc://toggle',
            'toggle': 'icc://toggle',
        };

        const uri = uriMap[func];
        if (uri && window.electronAPI && window.electronAPI.launchApp) {
            // 如果侧边栏是展开的，先收起
            if (isExpanded && collapse) {
                collapse();
                // 给一点动画缓冲时间
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            window.electronAPI.launchApp(uri, []);
        } else {
            console.log(`功能按钮被点击: ${func}`);
        }
    };

    /**
     * 获取功能对应的图标类名
     * @param {string} func - 功能名称
     * @returns {string} - FontAwesome 图标类名
     */
    const getFuncIcon = (func) => {
        const iconMap = {
            'randone': 'fa-user-check',
            'rand': 'fa-users',
            'timer': 'fa-stopwatch',
            'whiteboard': 'fa-chalkboard',
            'show': 'fa-eye',
        };
        return iconMap[func] || 'fa-cog';
    };

    /**
     * 获取功能对应的中文显示名称
     * @param {string} func - 功能名称
     * @returns {string} - 中文名称
     */
    const getFuncDisplayName = (func) => {
        const nameMap = {
            'randone': '单次抽',
            'rand': '随机抽',
            'timer': '计时器',
            'whiteboard': '白板',
            'show': '切换显隐',
            'toggle': '切换显隐',
        };
        return nameMap[func] || func;
    };

    return (
        <div className={`toolbar-widget iccce-control-widget ${functions.length === 1 ? 'single-tool' : ''}`}>
            <div className="toolbar-buttons" style={{ '--toolbar-columns': columns }}>
                <div className="widget-header-title-inner">ICC-CE</div>
                {functions.map((func, index) => (
                    <button
                        key={index}
                        type="button"
                        className="toolbar-button"
                        onClick={() => handleFuncClick(func)}
                        title={getFuncDisplayName(func)}
                    >
                        <div className="toolbar-icon">
                            <i className={`fas ${getFuncIcon(func)}`}></i>
                        </div>
                        <span className="toolbar-button-text">{getFuncDisplayName(func)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ICCCEControl;

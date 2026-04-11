import React from 'react';

interface ICCCeControlProps {
    functions?: string[];
    isExpanded?: boolean;
    collapse?: () => void;
    isPreview?: boolean;
}

const ICCCeControl: React.FC<ICCCeControlProps> = ({ functions = [], isExpanded, collapse, isPreview = false }) => {
    const columns = Math.min(Math.max(functions.length, 1), 5);

    const handleFuncClick = async (func: string) => {
        if (isPreview) return;

        const uriMap: Record<string, string> = {
            'randone': 'icc://randone',
            'rand': 'icc://rand',
            'timer': 'icc://timer',
            'whiteboard': 'icc://whiteboard',
            'show': 'icc://toggle',
            'toggle': 'icc://toggle',
        };

        const uri = uriMap[func];
        if (uri && window.electronAPI && window.electronAPI.launchApp) {
            if (isExpanded && collapse) {
                collapse();
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            window.electronAPI.launchApp(uri, []);
        } else {
            console.log(`功能按钮被点击: ${func}`);
        }
    };

    const getFuncIcon = (func: string): string => {
        const iconMap: Record<string, string> = {
            'randone': 'fa-user-check',
            'rand': 'fa-users',
            'timer': 'fa-stopwatch',
            'whiteboard': 'fa-chalkboard',
            'show': 'fa-eye',
        };
        return iconMap[func] || 'fa-cog';
    };

    const getFuncDisplayName = (func: string): string => {
        const nameMap: Record<string, string> = {
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

export default ICCCeControl;

/**
 * 侧边栏 UI 样式更新逻辑
 * 根据展开进度计算并应用侧边栏的样式和窗口尺寸
 * @param {HTMLElement} sidebar - 侧边栏 DOM 元素
 * @param {Object} currentConfig - 当前配置对象
 * @param {number} progress - 展开进度（0-1）
 * @param {number} START_W - 收起状态的宽度
 * @param {number} TARGET_W - 展开状态的目标宽度
 * @param {number} START_H - 收起状态的高度
 * @param {number} TARGET_H - 展开状态的目标高度
 * @param {number} SCALE - 缩放比例
 * @param {Function} setIgnoreMouse - 设置鼠标穿透的函数
 * @param {Function} throttledResize - 节流的窗口调整大小函数
 */

export function updateSidebarStyles(sidebar, currentConfig, progress, START_W, TARGET_W, START_H, TARGET_H, SCALE, setIgnoreMouse, throttledResize) {
    // 将进度限制在 0-1 之间
    progress = Math.max(0, Math.min(1, progress));

    // 根据进度计算当前尺寸和样式值（线性插值）
    const baseWidth = START_W + (TARGET_W - START_W) * progress;      // 宽度
    const baseHeight = START_H + (TARGET_H - START_H) * progress;     // 高度
    const currentRadius = 4 + (12 * progress);                        // 圆角半径
    const currentMargin = 6 + (6 * progress);                          // 左边距

    // 应用计算出的样式
    sidebar.style.width = `${baseWidth}px`;
    sidebar.style.height = `${baseHeight}px`;
    sidebar.style.borderRadius = `${currentRadius}px`;
    sidebar.style.marginLeft = `${currentMargin}px`;

    // 如果配置了窗口变换和显示器边界，则调整窗口大小和位置
    if (currentConfig?.transforms && currentConfig?.displayBounds) {
        const { posy } = currentConfig.transforms;  // 垂直位置偏移
        const { y: screenY, height: screenH } = currentConfig.displayBounds;  // 显示器边界
        let targetWinW, targetWinH;

        // 根据展开状态计算窗口尺寸
        if (progress <= 0) {
            // 收起状态：窗口很小
            targetWinW = 20 * SCALE;
            targetWinH = (START_H + 40) * SCALE;
            setIgnoreMouse(false);  // 恢复鼠标事件接收
        } else {
            // 展开状态：根据实际 DOM 尺寸计算窗口大小
            const rect = sidebar.getBoundingClientRect();
            targetWinW = Math.floor(rect.width + 100 * SCALE);   // 宽度加上边距
            targetWinH = Math.ceil(rect.height + 40 * SCALE);   // 高度加上边距
        }

        // 计算窗口垂直位置，确保窗口不会超出屏幕边界
        const startCenterY = screenY + posy;  // 初始中心 Y 坐标
        const expandedWinH = (TARGET_H + 120) * SCALE;  // 展开时的窗口高度
        // 计算安全的中心 Y 坐标，确保窗口完全在屏幕内
        const safeCenterY = Math.max(
            screenY + expandedWinH / 2 + 20,  // 上边界
            Math.min(screenY + screenH - expandedWinH / 2 - 20, startCenterY)  // 下边界
        );
        // 根据进度插值计算当前中心 Y 坐标
        const currentCenterY = startCenterY + (safeCenterY - startCenterY) * progress;
        const newWindowY = currentCenterY - (targetWinH / 2);  // 窗口顶部 Y 坐标

        // 在完全收起或展开时立即调整，否则节流调整（避免频繁调用）
        if (progress === 0 || progress === 1) {
            window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY);
        } else {
            throttledResize(targetWinW, targetWinH, newWindowY);
        }
    }

    // 根据进度计算背景颜色（从灰色渐变到白色，不透明）
    const gray = Math.floor(156 + (255 - 156) * progress);
    sidebar.style.background = `rgb(${gray}, ${gray}, ${gray})`;
}

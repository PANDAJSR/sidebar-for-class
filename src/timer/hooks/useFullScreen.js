import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 全屏管理 Hook
 * 处理全屏状态的切换、退出和同步
 *
 * @param {Object} options - 配置选项
 * @param {boolean} options.isMiniMode - 当前是否处于迷你模式
 * @param {Function} options.setIsMiniMode - 设置迷你模式状态的函数
 * @param {string} options.enableAnimations - 动画设置 ('on' | 'off')
 * @returns {Object} 全屏相关的状态和操作函数
 */
export const useFullScreen = ({ isMiniMode, setIsMiniMode, enableAnimations }) => {
  // 全屏状态
  const [isFullScreen, setIsFullScreen] = useState(false);
  // 使用 ref 来避免闭包问题
  const isFullScreenRef = useRef(isFullScreen);

  // 保持 ref 始终是最新值
  useEffect(() => {
    isFullScreenRef.current = isFullScreen;
  }, [isFullScreen]);

  /**
   * 退出全屏
   */
  const exitFullScreen = useCallback(async () => {
    if (window.electronAPI && window.electronAPI.setFullScreen) {
      await window.electronAPI.setFullScreen(false, enableAnimations === 'on');
    }
    // 状态更新由 onFullScreenChanged 事件处理
  }, [enableAnimations]);

  /**
   * 切换全屏状态
   */
  const toggleFullScreen = useCallback(async () => {
    const nextFullScreen = !isFullScreenRef.current;

    // 如果要进入全屏，且当前是迷你模式，先退出迷你模式
    if (nextFullScreen && isMiniMode) {
      setIsMiniMode(false);
      if (window.electronAPI && window.electronAPI.resizeWindow) {
        window.electronAPI.resizeWindow(600, 400, undefined, enableAnimations === 'on');
      }
    }

    if (window.electronAPI && window.electronAPI.setFullScreen) {
      await window.electronAPI.setFullScreen(nextFullScreen, enableAnimations === 'on');
    }
    // 状态更新由 onFullScreenChanged 事件处理，不要在这里手动设置
  }, [isMiniMode, setIsMiniMode, enableAnimations]);

  // 监听全屏状态变化（当用户按 ESC 退出全屏时同步状态）
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onFullScreenChanged) {
      const unsubscribe = window.electronAPI.onFullScreenChanged((isFullScreenState) => {
        setIsFullScreen(isFullScreenState);
      });
      return unsubscribe;
    }
  }, []);

  // 手动监听 ESC 键，确保在任何情况下都能退出全屏
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreenRef.current) {
        exitFullScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitFullScreen]);

  // 全屏模式下禁用窗口拖动
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      if (isFullScreen) {
        root.classList.add('fullscreen-mode');
      } else {
        root.classList.remove('fullscreen-mode');
      }
    }
  }, [isFullScreen]);

  return {
    isFullScreen,
    isFullScreenRef,
    toggleFullScreen,
    exitFullScreen,
  };
};

export default useFullScreen;

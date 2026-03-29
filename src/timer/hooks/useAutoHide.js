import { useEffect, useRef } from 'react';

/**
 * 自动隐藏管理 Hook
 * 当计时器运行且在指定时间内无用户操作时，自动切换到迷你模式
 *
 * @param {Object} params - 配置参数
 * @param {boolean} params.isRunning - 计时器是否正在运行
 * @param {boolean} params.isMiniMode - 当前是否处于迷你模式
 * @param {boolean} params.isFullScreen - 当前是否处于全屏模式
 * @param {number} params.autoHideSeconds - 自动隐藏前的等待秒数（0 表示不自动隐藏）
 * @param {Function} params.toggleMiniMode - 切换到迷你模式的函数
 */
export const useAutoHide = ({
  isRunning,
  isMiniMode,
  isFullScreen,
  autoHideSeconds,
  toggleMiniMode,
}) => {
  // 使用 ref 存储定时器 ID，便于清理
  const autoHideTimeoutRef = useRef(null);

  useEffect(() => {
    /**
     * 重置自动隐藏定时器
     * 当用户有操作时调用此函数
     */
    const resetTimeout = () => {
      // 清除现有定时器
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }

      // 只有在计时器运行、非迷你模式、非全屏模式且设置了自动隐藏时间时才启动定时器
      if (isRunning && !isMiniMode && !isFullScreen && autoHideSeconds > 0) {
        autoHideTimeoutRef.current = setTimeout(() => {
          toggleMiniMode();
        }, autoHideSeconds * 1000);
      }
    };

    // 初始化定时器
    resetTimeout();

    /**
     * 处理用户活动事件
     */
    const handleActivity = () => {
      resetTimeout();
    };

    // 监听用户操作事件
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // 清理函数
    return () => {
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [isRunning, isMiniMode, isFullScreen, autoHideSeconds, toggleMiniMode]);
};

export default useAutoHide;

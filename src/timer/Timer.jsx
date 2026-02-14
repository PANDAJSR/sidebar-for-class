import React, { useState, useEffect } from 'react';
import AnimatedDigit from './AnimatedDigit';
import { useTimer, useFullScreen, useConfig, useAutoHide } from './hooks';

/**
 * 计时器主组件
 * 整合倒计时和正计时功能，支持迷你模式、全屏模式和自动隐藏
 */
const Timer = () => {
  // ===== 状态管理 =====
  // 迷你模式状态
  const [isMiniMode, setIsMiniMode] = useState(false);

  // 配置管理（自动隐藏时间、动画设置、音效设置）
  const {
    autoHideSeconds,
    enableAnimations,
    enableSound,
  } = useConfig();

  // 全屏管理
  const {
    isFullScreen,
    isFullScreenRef,
    toggleFullScreen,
    exitFullScreen,
  } = useFullScreen({
    isMiniMode,
    setIsMiniMode,
    enableAnimations,
  });

  // 计时器核心逻辑
  const {
    timeInSeconds,
    isRunning,
    mode,
    isMiniModeRef,
    formatTimeDigits,
    handleStartPause,
    handleReset,
    handleModeChange,
    adjustTimeDigit,
    calculateProgress,
  } = useTimer({
    enableSound,
    exitFullScreen,
    toggleMiniMode: () => toggleMiniMode(!isMiniMode),
  });

  // 更新迷你模式 ref，供 useTimer 使用
  useEffect(() => {
    isMiniModeRef.current = isMiniMode;
  }, [isMiniMode, isMiniModeRef]);

  // 自动隐藏管理
  useAutoHide({
    isRunning,
    isMiniMode,
    isFullScreen,
    autoHideSeconds,
    toggleMiniMode: () => toggleMiniMode(!isMiniMode),
  });

  // ===== 操作函数 =====

  /**
   * 切换迷你模式
   * 在迷你模式和普通模式之间切换，同时调整窗口大小
   *
   * @param {boolean} nextMiniMode - 目标迷你模式状态
   */
  const toggleMiniMode = async (nextMiniMode) => {
    // 如果当前在全屏模式，先退出全屏
    if (isFullScreenRef.current) {
      await exitFullScreen();
    }

    setIsMiniMode(nextMiniMode);

    // 调整窗口大小
    if (window.electronAPI && window.electronAPI.resizeWindow) {
      const targetHeight = nextMiniMode ? 200 : 400;
      window.electronAPI.resizeWindow(
        600,
        targetHeight,
        undefined,
        enableAnimations === 'on'
      );
    }
  };

  /**
   * 处理迷你模式按钮点击
   */
  const handleMiniModeToggle = () => {
    toggleMiniMode(!isMiniMode);
  };

  /**
   * 关闭窗口
   */
  const handleClose = () => {
    if (window.electronAPI && window.electronAPI.closeWindow) {
      window.electronAPI.closeWindow();
    } else {
      window.close();
    }
  };

  /**
   * 处理开始/暂停
   */
  const onStartPause = () => {
    handleStartPause();
  };

  /**
   * 处理重置
   */
  const onReset = () => {
    handleReset();
  };

  // ===== 渲染辅助函数 =====

  // 获取格式化后的时间数字
  const { h1, h2, m1, m2, s1, s2 } = formatTimeDigits(timeInSeconds);

  /**
   * 渲染单个数字组件
   *
   * @param {string} value - 数字值
   * @param {string} type - 类型 ('h' | 'm' | 's')
   * @param {number} multiplier - 倍数（用于十位/个位）
   * @returns {JSX.Element} 数字组件
   */
  const renderDigit = (value, type, multiplier) => {
    const hideControls = isRunning || mode === 'countup';
    return (
      <div className={`time-part ${isRunning ? 'running' : ''} ${hideControls ? 'hide-controls' : ''}`}>
        <button
          className="adjustment-button-top"
          onClick={() => adjustTimeDigit(type, 1, multiplier)}
        >
          <i className="fa-solid fa-plus"></i>
        </button>
        <AnimatedDigit value={parseInt(value, 10)} />
        <button
          className="adjustment-button-bottom"
          onClick={() => adjustTimeDigit(type, -1, multiplier)}
        >
          <i className="fa-solid fa-minus"></i>
        </button>
      </div>
    );
  };

  // ===== 副作用：应用迷你模式样式 =====
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      if (isMiniMode) {
        root.classList.add('mini-mode');
      } else {
        root.classList.remove('mini-mode');
      }
    }
  }, [isMiniMode]);

  // ===== 渲染 =====
  return (
    <div className={`timer-container ${isMiniMode ? 'mini-mode-container' : ''}`}>
      {/* 进度条 */}
      {isRunning && (
        <div className="timer-progress-bar">
          <div
            className="timer-progress-fill"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      )}

      {/* 关闭按钮 */}
      <button
        className="close-window-button"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
      >
        <i className="fa-solid fa-xmark"></i>
      </button>

      {/* 全屏按钮 */}
      {isRunning && (
        <button
          className="fullscreen-button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFullScreen();
          }}
          title={isFullScreen ? "退出全屏" : "全屏显示"}
        >
          <i className={`fa-solid ${isFullScreen ? 'fa-compress' : 'fa-maximize'}`}></i>
        </button>
      )}

      {/* 迷你模式按钮 */}
      {(isRunning || isMiniMode) && (
        <button
          className="mini-mode-button"
          onClick={(e) => {
            e.stopPropagation();
            handleMiniModeToggle();
          }}
          title={isMiniMode ? "退出迷你模式" : "进入迷你模式"}
        >
          <i className={`fa-solid ${isMiniMode ? 'fa-up-right-and-down-left-from-center' : 'fa-down-left-and-up-right-to-center'}`}></i>
        </button>
      )}

      {/* 模式切换标签 */}
      {!isMiniMode && (
        <div className={`timer-tabs ${isRunning ? 'hidden' : ''}`}>
          <button
            className={`tab-button ${mode === 'countdown' ? 'active' : ''}`}
            onClick={() => handleModeChange('countdown')}
          >
            倒计时
          </button>
          <button
            className={`tab-button ${mode === 'countup' ? 'active' : ''}`}
            onClick={() => handleModeChange('countup')}
          >
            正计时
          </button>
        </div>
      )}

      {/* 时间显示 */}
      <div className="time-display">
        {renderDigit(h1, 'h', 10)}
        {renderDigit(h2, 'h', 1)}
        <span className="time-separator">:</span>
        {renderDigit(m1, 'm', 10)}
        {renderDigit(m2, 'm', 1)}
        <span className="time-separator">:</span>
        {renderDigit(s1, 's', 10)}
        {renderDigit(s2, 's', 1)}
      </div>

      {/* 控制按钮 */}
      {!isMiniMode && (
        <div className="control-buttons">
          <button onClick={onStartPause} className={isRunning ? 'pause' : 'start'}>
            {isRunning ? <i className="fa-solid fa-pause"></i> : <i className="fa-solid fa-play"></i>}
          </button>
          <button onClick={onReset} className="reset">
            <i className="fa-solid fa-rotate-left"></i>
          </button>
        </div>
      )}

    </div>
  );
};

export default Timer;

import React, { useState, useEffect } from 'react';
import AnimatedDigit from './AnimatedDigit';
import { useTimer, useFullScreen, useConfig, useAutoHide } from './hooks';

type TimerMode = 'countdown' | 'countup';
type AnimationSetting = 'on' | 'off' | 'reduce';

interface UseConfigReturn {
  autoHideSeconds: number;
  enableAnimations: AnimationSetting;
  enableSound: boolean;
  setAutoHideSeconds: (value: number) => void;
  setEnableAnimations: (value: AnimationSetting) => void;
  setEnableSound: (value: boolean) => void;
}

interface UseFullScreenReturn {
  isFullScreen: boolean;
  isFullScreenRef: React.MutableRefObject<boolean>;
  toggleFullScreen: () => Promise<void>;
  exitFullScreen: () => Promise<void>;
}

interface UseTimerReturn {
  initialTime: number;
  timeInSeconds: number;
  isRunning: boolean;
  mode: TimerMode;
  isMiniModeRef: React.MutableRefObject<boolean>;
  setInitialTime: React.Dispatch<React.SetStateAction<number>>;
  setTimeInSeconds: React.Dispatch<React.SetStateAction<number>>;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setMode: React.Dispatch<React.SetStateAction<TimerMode>>;
  formatTimeDigits: (totalSeconds: number) => {
    h1: string;
    h2: string;
    m1: string;
    m2: string;
    s1: string;
    s2: string;
  };
  handleStartPause: () => void;
  handleReset: () => void;
  handleModeChange: (newMode: TimerMode) => void;
  adjustTimeDigit: (type: 'h' | 'm' | 's', amount: number, multiplier: number) => void;
  calculateProgress: () => number;
}

const Timer: React.FC = () => {
  const [isMiniMode, setIsMiniMode] = useState<boolean>(false);

  const config: UseConfigReturn = useConfig();

  const fullScreen: UseFullScreenReturn = useFullScreen({
    isMiniMode,
    setIsMiniMode,
    enableAnimations: config.enableAnimations,
  });

  const timer: UseTimerReturn = useTimer({
    enableSound: config.enableSound,
    exitFullScreen: fullScreen.exitFullScreen,
    toggleMiniMode: () => toggleMiniMode(!isMiniMode),
  });

  useEffect(() => {
    timer.isMiniModeRef.current = isMiniMode;
  }, [isMiniMode, timer.isMiniModeRef]);

  useAutoHide({
    isRunning: timer.isRunning,
    isMiniMode,
    isFullScreen: fullScreen.isFullScreen,
    autoHideSeconds: config.autoHideSeconds,
    toggleMiniMode: () => toggleMiniMode(!isMiniMode),
  });

  const toggleMiniMode = async (nextMiniMode: boolean): Promise<void> => {
    if (fullScreen.isFullScreenRef.current) {
      await fullScreen.exitFullScreen();
    }

    setIsMiniMode(nextMiniMode);

    if (window.electronAPI && window.electronAPI.resizeWindow) {
      const targetHeight = nextMiniMode ? 200 : 400;
      window.electronAPI.resizeWindow(
        600,
        targetHeight,
        undefined,
        config.enableAnimations === 'on'
      );
    }
  };

  const handleMiniModeToggle = (): void => {
    toggleMiniMode(!isMiniMode);
  };

  const handleClose = (): void => {
    if (window.electronAPI && window.electronAPI.closeWindow) {
      window.electronAPI.closeWindow();
    } else {
      window.close();
    }
  };

  const onStartPause = (): void => {
    timer.handleStartPause();
  };

  const onReset = (): void => {
    timer.handleReset();
  };

  const { h1, h2, m1, m2, s1, s2 } = timer.formatTimeDigits(timer.timeInSeconds);

  const renderDigit = (value: string, type: 'h' | 'm' | 's', multiplier: number): JSX.Element => {
    const hideControls = timer.isRunning || timer.mode === 'countup';
    return (
      <div className={`time-part ${timer.isRunning ? 'running' : ''} ${hideControls ? 'hide-controls' : ''}`}>
        <button
          className="adjustment-button-top"
          onClick={() => timer.adjustTimeDigit(type, 1, multiplier)}
        >
          <i className="fa-solid fa-plus"></i>
        </button>
        <AnimatedDigit value={parseInt(value, 10)} />
        <button
          className="adjustment-button-bottom"
          onClick={() => timer.adjustTimeDigit(type, -1, multiplier)}
        >
          <i className="fa-solid fa-minus"></i>
        </button>
      </div>
    );
  };

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

  return (
    <div className={`timer-container ${isMiniMode ? 'mini-mode-container' : ''}`}>
      {timer.isRunning && (
        <div className="timer-progress-bar">
          <div
            className="timer-progress-fill"
            style={{ width: `${timer.calculateProgress()}%` }}
          />
        </div>
      )}

      <button
        className="close-window-button"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
      >
        <i className="fa-solid fa-xmark"></i>
      </button>

      {timer.isRunning && (
        <button
          className="fullscreen-button"
          onClick={(e) => {
            e.stopPropagation();
            fullScreen.toggleFullScreen();
          }}
          title={fullScreen.isFullScreen ? "退出全屏" : "全屏显示"}
        >
          <i className={`fa-solid ${fullScreen.isFullScreen ? 'fa-compress' : 'fa-maximize'}`}></i>
        </button>
      )}

      {(timer.isRunning || isMiniMode) && (
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

      {!isMiniMode && (
        <div className={`timer-tabs ${timer.isRunning ? 'hidden' : ''}`}>
          <button
            className={`tab-button ${timer.mode === 'countdown' ? 'active' : ''}`}
            onClick={() => timer.handleModeChange('countdown')}
          >
            倒计时
          </button>
          <button
            className={`tab-button ${timer.mode === 'countup' ? 'active' : ''}`}
            onClick={() => timer.handleModeChange('countup')}
          >
            正计时
          </button>
        </div>
      )}

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

      {!isMiniMode && (
        <div className="control-buttons">
          <button onClick={onStartPause} className={timer.isRunning ? 'pause' : 'start'}>
            {timer.isRunning ? <i className="fa-solid fa-pause"></i> : <i className="fa-solid fa-play"></i>}
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

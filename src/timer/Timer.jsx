import React, { useState, useEffect, useRef } from 'react';

const AnimatedDigit = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [nextValue, setNextValue] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);
  const animationEndTimeoutRef = useRef(null);

  useEffect(() => {
    // If the target value is already what we're aiming for, do nothing
    const currentTarget = nextValue !== null ? nextValue : displayValue;
    if (value === currentTarget) return;

    if (isAnimating) {
      // INTERRUPT: Finish current animation immediately
      if (animationEndTimeoutRef.current) clearTimeout(animationEndTimeoutRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      setDisplayValue(nextValue);
      setNextValue(value);
      setIsAnimating(false);

      // Re-trigger animation in next tick
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        animationEndTimeoutRef.current = setTimeout(() => {
          setDisplayValue(value);
          setNextValue(null);
          setIsAnimating(false);
        }, 300);
      }, 20);
    } else {
      // START NEW: Normal animation flow
      setNextValue(value);
      setIsAnimating(true);

      if (animationEndTimeoutRef.current) clearTimeout(animationEndTimeoutRef.current);
      animationEndTimeoutRef.current = setTimeout(() => {
        setDisplayValue(value);
        setNextValue(null);
        setIsAnimating(false);
      }, 300);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationEndTimeoutRef.current) clearTimeout(animationEndTimeoutRef.current);
    };
  }, [value]);

  return (
    <div className="digit-container">
      <div className={`digit-inner ${isAnimating ? 'animating' : ''}`}>
        <div className="digit-item">
          <span className="value">{displayValue}</span>
        </div>
        <div className="digit-item">
          <span className="value">{nextValue !== null ? nextValue : ''}</span>
        </div>
      </div>
    </div>
  );
};

const Timer = () => {
  const [initialTime, setInitialTime] = useState(5 * 60);
  const [timeInSeconds, setTimeInSeconds] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('countdown');
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [autoHideSeconds, setAutoHideSeconds] = useState(0);
  const [enableAnimations, setEnableAnimations] = useState('on');
  const [enableSound, setEnableSound] = useState(true);
  const timerRef = useRef(null);
  const isFullScreenRef = useRef(isFullScreen);
  const audioRef = useRef(new Audio('/TimerDownNotice.wav'));
  const startTimeRef = useRef(null);
  const elapsedTimeRef = useRef(0);

  // 保持 ref 始终是最新值，避免闭包问题
  useEffect(() => {
    isFullScreenRef.current = isFullScreen;
  }, [isFullScreen]);

  useEffect(() => {
    const checkOS = async () => {
      if (window.electronAPI && window.electronAPI.getOSInfo) {
        try {
          const info = await window.electronAPI.getOSInfo();
          // Windows 11 build number starts from 22000
          const isWin11 = info.platform === 'win32' && parseInt(info.release.split('.')[2]) >= 22000;
          
          if (!isWin11) {
            const root = document.getElementById('root');
            if (root) {
              // Increase background opacity for non-Win11 systems
              root.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            }
          }
        } catch (error) {
          console.error('Failed to get OS info:', error);
        }
      }
    };
    checkOS();

    const loadConfig = async () => {
      if (window.electronAPI && window.electronAPI.getConfig) {
        try {
          const config = await window.electronAPI.getConfig();
          if (config.timer && config.timer.auto_hide_seconds !== undefined) {
            setAutoHideSeconds(config.timer.auto_hide_seconds);
          }
          if (config.timer && config.timer.enable_animations !== undefined) {
            let animValue = config.timer.enable_animations;
            // 兼容旧配置：布尔值转换为新格式
            if (typeof animValue === 'boolean') {
              animValue = animValue ? 'on' : 'off';
            }
            setEnableAnimations(animValue);
          }
          if (config.timer && config.timer.enable_sound !== undefined) {
            setEnableSound(config.timer.enable_sound);
          }
        } catch (error) {
          console.error('Failed to load config:', error);
        }
      }
    };
    loadConfig();

    if (window.electronAPI && window.electronAPI.onConfigUpdated) {
      window.electronAPI.onConfigUpdated((newConfig) => {
        if (newConfig.timer && newConfig.timer.auto_hide_seconds !== undefined) {
          setAutoHideSeconds(newConfig.timer.auto_hide_seconds);
        }
        if (newConfig.timer && newConfig.timer.enable_animations !== undefined) {
          let animValue = newConfig.timer.enable_animations;
          // 兼容旧配置：布尔值转换为新格式
          if (typeof animValue === 'boolean') {
            animValue = animValue ? 'on' : 'off';
          }
          setEnableAnimations(animValue);
        }
        if (newConfig.timer && newConfig.timer.enable_sound !== undefined) {
          setEnableSound(newConfig.timer.enable_sound);
        }
      });
    }
  }, []);

  const toggleMiniMode = async () => {
    // 如果当前在全屏模式，先退出全屏
    if (isFullScreenRef.current) {
      await exitFullScreen();
    }

    const nextMiniMode = !isMiniMode;
    setIsMiniMode(nextMiniMode);

    if (window.electronAPI && window.electronAPI.resizeWindow) {
      // 获取当前窗口高度，计算新的 Y 坐标以保持视觉平衡
      const targetHeight = nextMiniMode ? 200 : 400;

      // 简单地让窗口在高度变化时，Y 坐标偏移一半的差值，
      // 这样窗口看起来是往中心缩小的，而不是往下长或者往上缩
      window.electronAPI.resizeWindow(600, targetHeight, undefined, enableAnimations === 'on');
    }
  };

  const toggleFullScreen = async () => {
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
  };

  const exitFullScreen = async () => {
    if (window.electronAPI && window.electronAPI.setFullScreen) {
      await window.electronAPI.setFullScreen(false, enableAnimations === 'on');
    }
    // 状态更新由 onFullScreenChanged 事件处理
  };

  // 监听全屏状态变化（当用户按 ESC 退出全屏时同步状态）
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onFullScreenChanged) {
      const unsubscribe = window.electronAPI.onFullScreenChanged((isFullScreenState) => {
        setIsFullScreen(isFullScreenState);
      });
      return unsubscribe;
    }
  }, []);

  // 根据动画设置应用/移除 no-transition 类
  // 只有当 enableAnimations 为 'off' 时才完全禁用过渡动画
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      if (enableAnimations === 'off') {
        root.classList.add('no-transition');
      } else {
        root.classList.remove('no-transition');
      }
    }
  }, [enableAnimations]);

  // 窗口调整大小时禁用过渡动画，避免视觉上的"追赶"效果
  useEffect(() => {
    let resizeTimer;
    const handleResize = () => {
      const root = document.getElementById('root');
      if (root) {
        root.classList.add('no-transition');
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          // 只有当动画不是完全禁用时才移除 no-transition 类
          if (enableAnimations !== 'off') {
            root.classList.remove('no-transition');
          }
        }, 100);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [enableAnimations]);

  // 手动监听 ESC 键，确保在任何情况下都能退出全屏
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreenRef.current) {
        exitFullScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let autoHideTimeout;

    const resetTimeout = () => {
      if (autoHideTimeout) clearTimeout(autoHideTimeout);
      if (isRunning && !isMiniMode && !isFullScreen && autoHideSeconds > 0) {
        autoHideTimeout = setTimeout(() => {
          toggleMiniMode();
        }, autoHideSeconds * 1000);
      }
    };

    // 初始化计时
    resetTimeout();

    // 监听用户操作
    const handleActivity = () => {
      resetTimeout();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    return () => {
      if (autoHideTimeout) clearTimeout(autoHideTimeout);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [isRunning, isMiniMode, isFullScreen, autoHideSeconds]);

  useEffect(() => {
    if (isRunning) {
      // 恢复时重新记录开始时间
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - startTimeRef.current) / 1000);

        if (deltaSeconds > 0) {
          // 更新已计时时长
          elapsedTimeRef.current += deltaSeconds;
          // 重新记录开始时间，保留余数毫秒以保证精度
          startTimeRef.current = now - ((now - startTimeRef.current) % 1000);

          setTimeInSeconds((prevTime) => {
            let newTime;
            if (mode === 'countdown') {
              newTime = Math.max(0, prevTime - deltaSeconds);
            } else {
              newTime = prevTime + deltaSeconds;
            }

            // 检查是否结束（倒计时到0）
            if (mode === 'countdown' && newTime === 0 && prevTime > 0) {
              // 倒计时结束，停止计时
              setIsRunning(false);
              // 播放提示音
              if (enableSound && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(err => console.log('Audio play failed:', err));
              }
              // 退出迷你模式和全屏
              if (isMiniMode) {
                toggleMiniMode();
              }
              exitFullScreen();
            }

            return newTime;
          });
        }
      }, 100); // 每100ms检查一次，保证精度
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, isMiniMode, enableSound]);

  useEffect(() => {
    if (isRunning) {
      document.body.classList.add('timer-running');
    } else {
      document.body.classList.remove('timer-running');
    }
  }, [isRunning]);

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

  const formatTimeDigits = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const s = String(seconds).padStart(2, '0');

    return {
      h1: h[0], h2: h[1],
      m1: m[0], m2: m[1],
      s1: s[0], s2: s[1],
    };
  };

  const handleStartPause = () => {
    const nextIsRunning = !isRunning;
    if (nextIsRunning) {
      // 开始：重置已计时时长
      elapsedTimeRef.current = 0;
    }
    setIsRunning(nextIsRunning);
    // 暂停时退出全屏
    if (!nextIsRunning) {
      exitFullScreen();
    }
  };

  const handleReset = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setTimeInSeconds(mode === 'countdown' ? initialTime : 0);
    // 重置已计时时长
    elapsedTimeRef.current = 0;
    startTimeRef.current = null;
    // 重置时退出全屏
    exitFullScreen();
  };

  const handleModeChange = (newMode) => {
    if (isRunning) return;
    setMode(newMode);
    setTimeInSeconds(newMode === 'countdown' ? initialTime : 0);
  };

  const adjustTimeDigit = (type, amount, multiplier) => {
    const totalAdjustment = amount * multiplier;
    setTimeInSeconds((prevTime) => {
      let hours = Math.floor(prevTime / 3600);
      let minutes = Math.floor((prevTime % 3600) / 60);
      let seconds = prevTime % 60;

      switch (type) {
        case 'h':
          hours = (hours + totalAdjustment + 100) % 100;
          break;
        case 'm':
          minutes = (minutes + totalAdjustment + 60) % 60;
          break;
        case 's':
          seconds = (seconds + totalAdjustment + 60) % 60;
          break;
        default:
          break;
      }

      const newTotalSeconds = hours * 3600 + minutes * 60 + seconds;
      const finalTime = Math.max(0, newTotalSeconds);
      if (mode === 'countdown') {
        setInitialTime(finalTime);
      }
      return finalTime;
    });
  };

  const { h1, h2, m1, m2, s1, s2 } = formatTimeDigits(timeInSeconds);

  const renderDigit = (value, type, multiplier) => {
    const hideControls = isRunning || mode === 'countup';
    return (
      <div className={`time-part ${isRunning ? 'running' : ''} ${hideControls ? 'hide-controls' : ''}`}>
        <button className="adjustment-button-top" onClick={() => adjustTimeDigit(type, 1, multiplier)}>
          <i className="fa-solid fa-plus"></i>
        </button>
        <AnimatedDigit value={parseInt(value, 10)} />
        <button className="adjustment-button-bottom" onClick={() => adjustTimeDigit(type, -1, multiplier)}>
          <i className="fa-solid fa-minus"></i>
        </button>
      </div>
    );
  };

  const handleClose = () => {
    if (window.electronAPI && window.electronAPI.closeWindow) {
      window.electronAPI.closeWindow();
    } else {
      window.close();
    }
  };

  // 计算进度条百分比
  const calculateProgress = () => {
    if (mode === 'countdown') {
      if (initialTime === 0) return 0;
      return ((initialTime - timeInSeconds) / initialTime) * 100;
    } else {
      // 正计时模式：以60分钟为满进度，超过则保持100%
      const maxTime = 60 * 60; // 60分钟
      return Math.min((timeInSeconds / maxTime) * 100, 100);
    }
  };

  return (
    <div
      className={`timer-container ${isMiniMode ? 'mini-mode-container' : ''}`}
    >
      {isRunning && (
        <div className="timer-progress-bar">
          <div
            className="timer-progress-fill"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      )}
      <button className="close-window-button" onClick={(e) => {
        e.stopPropagation(); // 防止触发父级的点击恢复逻辑
        handleClose();
      }}>
        <i className="fa-solid fa-xmark"></i>
      </button>
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
      {(isRunning || isMiniMode) && (
        <button
          className="mini-mode-button"
          onClick={(e) => {
            e.stopPropagation(); // 防止重复触发
            toggleMiniMode();
          }}
          title={isMiniMode ? "退出迷你模式" : "进入迷你模式"}
        >
          <i className={`fa-solid ${isMiniMode ? 'fa-up-right-and-down-left-from-center' : 'fa-down-left-and-up-right-to-center'}`}></i>
        </button>
      )}
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
          <button onClick={handleStartPause} className={isRunning ? 'pause' : 'start'}>
            {isRunning ? <i className="fa-solid fa-pause"></i> : <i className="fa-solid fa-play"></i>}
          </button>
          <button onClick={handleReset} className="reset">
            <i className="fa-solid fa-rotate-left"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default Timer;

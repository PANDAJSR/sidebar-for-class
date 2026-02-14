import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 计时器核心逻辑 Hook
 * 管理倒计时/正计时的状态、时间计算和结束处理
 *
 * @param {Object} options - 配置选项
 * @param {boolean} options.enableSound - 是否启用结束音效
 * @param {Function} options.exitFullScreen - 退出全屏的函数
 * @param {Function} options.toggleMiniMode - 切换迷你模式的函数
 * @returns {Object} 计时器相关的状态和操作函数
 */
export const useTimer = ({ enableSound, exitFullScreen, toggleMiniMode }) => {
  // 初始时间（秒）
  const [initialTime, setInitialTime] = useState(5 * 60);
  // 当前时间（秒）
  const [timeInSeconds, setTimeInSeconds] = useState(initialTime);
  // 是否正在运行
  const [isRunning, setIsRunning] = useState(false);
  // 计时模式：'countdown' 倒计时 | 'countup' 正计时
  const [mode, setMode] = useState('countdown');

  // 定时器引用
  const timerRef = useRef(null);
  // 开始时间引用（用于精确计算）
  const startTimeRef = useRef(null);
  // 已计时时长引用（用于暂停后继续）
  const elapsedTimeRef = useRef(0);
  // 音频对象引用
  const audioRef = useRef(new Audio('/TimerDownNotice.wav'));
  // 迷你模式状态引用（用于在定时器中读取最新值）
  const isMiniModeRef = useRef(false);

  /**
   * 格式化时间为数字组件所需的对象格式
   *
   * @param {number} totalSeconds - 总秒数
   * @returns {Object} 包含各数位值的对象 { h1, h2, m1, m2, s1, s2 }
   */
  const formatTimeDigits = useCallback((totalSeconds) => {
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
  }, []);

  /**
   * 处理开始/暂停按钮点击
   */
  const handleStartPause = useCallback(() => {
    const nextIsRunning = !isRunning;
    if (nextIsRunning) {
      // 开始计时：重置已计时时长
      elapsedTimeRef.current = 0;
    }
    setIsRunning(nextIsRunning);
    // 暂停时退出全屏
    if (!nextIsRunning) {
      exitFullScreen();
    }
  }, [isRunning, exitFullScreen]);

  /**
   * 处理重置按钮点击
   */
  const handleReset = useCallback(() => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setTimeInSeconds(mode === 'countdown' ? initialTime : 0);
    // 重置已计时时长
    elapsedTimeRef.current = 0;
    startTimeRef.current = null;
    // 重置时退出全屏
    exitFullScreen();
  }, [mode, initialTime, exitFullScreen]);

  /**
   * 切换计时模式
   *
   * @param {string} newMode - 新模式 ('countdown' | 'countup')
   */
  const handleModeChange = useCallback((newMode) => {
    if (isRunning) return; // 运行时不能切换模式
    setMode(newMode);
    setTimeInSeconds(newMode === 'countdown' ? initialTime : 0);
  }, [isRunning, initialTime]);

  /**
   * 调整时间数字
   *
   * @param {string} type - 调整类型 ('h' 小时 | 'm' 分钟 | 's' 秒)
   * @param {number} amount - 调整量 (+1 或 -1)
   * @param {number} multiplier - 倍数 (用于十位调整)
   */
  const adjustTimeDigit = useCallback((type, amount, multiplier) => {
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
  }, [mode]);

  /**
   * 计算进度条百分比
   *
   * @returns {number} 进度百分比 (0-100)
   */
  const calculateProgress = useCallback(() => {
    if (mode === 'countdown') {
      if (initialTime === 0) return 0;
      return ((initialTime - timeInSeconds) / initialTime) * 100;
    } else {
      // 正计时模式：以60分钟为满进度，超过则保持100%
      const maxTime = 60 * 60; // 60分钟
      return Math.min((timeInSeconds / maxTime) * 100, 100);
    }
  }, [mode, initialTime, timeInSeconds]);

  // 计时器核心逻辑
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
              if (isMiniModeRef.current) {
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
  }, [isRunning, mode, enableSound, exitFullScreen, toggleMiniMode]);

  // 根据运行状态添加/移除 body 类名
  useEffect(() => {
    if (isRunning) {
      document.body.classList.add('timer-running');
    } else {
      document.body.classList.remove('timer-running');
    }
  }, [isRunning]);

  return {
    // 状态
    initialTime,
    timeInSeconds,
    isRunning,
    mode,
    isMiniModeRef,

    // 设置函数
    setInitialTime,
    setTimeInSeconds,
    setIsRunning,
    setMode,

    // 操作函数
    formatTimeDigits,
    handleStartPause,
    handleReset,
    handleModeChange,
    adjustTimeDigit,
    calculateProgress,
  };
};

export default useTimer;

import { useState, useEffect, useRef, useCallback } from 'react';

type TimerMode = 'countdown' | 'countup';

interface UseTimerOptions {
  enableSound: boolean;
  exitFullScreen: () => Promise<void>;
  toggleMiniMode: () => Promise<void>;
}

interface TimeDigits {
  h1: string;
  h2: string;
  m1: string;
  m2: string;
  s1: string;
  s2: string;
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
  formatTimeDigits: (totalSeconds: number) => TimeDigits;
  handleStartPause: () => void;
  handleReset: () => void;
  handleModeChange: (newMode: TimerMode) => void;
  adjustTimeDigit: (type: 'h' | 'm' | 's', amount: number, multiplier: number) => void;
  calculateProgress: () => number;
}

export const useTimer = ({
  enableSound,
  exitFullScreen,
  toggleMiniMode,
}: UseTimerOptions): UseTimerReturn => {
  const [initialTime, setInitialTime] = useState<number>(5 * 60);
  const [timeInSeconds, setTimeInSeconds] = useState<number>(initialTime);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [mode, setMode] = useState<TimerMode>('countdown');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement>(new Audio('/TimerDownNotice.wav'));
  const isMiniModeRef = useRef<boolean>(false);

  const formatTimeDigits = useCallback((totalSeconds: number): TimeDigits => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const s = String(seconds).padStart(2, '0');

    return {
      h1: h[0],
      h2: h[1],
      m1: m[0],
      m2: m[1],
      s1: s[0],
      s2: s[1],
    };
  }, []);

  const handleStartPause = useCallback((): void => {
    const nextIsRunning = !isRunning;
    if (nextIsRunning) {
      elapsedTimeRef.current = 0;
    }
    setIsRunning(nextIsRunning);
    if (!nextIsRunning) {
      exitFullScreen();
    }
  }, [isRunning, exitFullScreen]);

  const handleReset = useCallback((): void => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setTimeInSeconds(mode === 'countdown' ? initialTime : 0);
    elapsedTimeRef.current = 0;
    startTimeRef.current = null;
    exitFullScreen();
  }, [mode, initialTime, exitFullScreen]);

  const handleModeChange = useCallback((newMode: TimerMode): void => {
    if (isRunning) return;
    setMode(newMode);
    setTimeInSeconds(newMode === 'countdown' ? initialTime : 0);
  }, [isRunning, initialTime]);

  const adjustTimeDigit = useCallback((type: 'h' | 'm' | 's', amount: number, multiplier: number): void => {
    const totalAdjustment = amount * multiplier;
    setTimeInSeconds((prevTime: number) => {
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

  const calculateProgress = useCallback((): number => {
    if (mode === 'countdown') {
      if (initialTime === 0) return 0;
      return ((initialTime - timeInSeconds) / initialTime) * 100;
    } else {
      const maxTime = 60 * 60;
      return Math.min((timeInSeconds / maxTime) * 100, 100);
    }
  }, [mode, initialTime, timeInSeconds]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - (startTimeRef.current || now)) / 1000);

        if (deltaSeconds > 0) {
          elapsedTimeRef.current += deltaSeconds;
          startTimeRef.current = now - ((now - (startTimeRef.current || now)) % 1000);

          setTimeInSeconds((prevTime: number) => {
            let newTime: number;
            if (mode === 'countdown') {
              newTime = Math.max(0, prevTime - deltaSeconds);
            } else {
              newTime = prevTime + deltaSeconds;
            }

            if (mode === 'countdown' && newTime === 0 && prevTime > 0) {
              setIsRunning(false);
              if (enableSound && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(err => console.log('Audio play failed:', err));
              }
              if (isMiniModeRef.current) {
                toggleMiniMode();
              }
              exitFullScreen();
            }

            return newTime;
          });
        }
      }, 100);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, enableSound, exitFullScreen, toggleMiniMode]);

  useEffect(() => {
    if (isRunning) {
      document.body.classList.add('timer-running');
    } else {
      document.body.classList.remove('timer-running');
    }
  }, [isRunning]);

  return {
    initialTime,
    timeInSeconds,
    isRunning,
    mode,
    isMiniModeRef,
    setInitialTime,
    setTimeInSeconds,
    setIsRunning,
    setMode,
    formatTimeDigits,
    handleStartPause,
    handleReset,
    handleModeChange,
    adjustTimeDigit,
    calculateProgress,
  };
};

export default useTimer;

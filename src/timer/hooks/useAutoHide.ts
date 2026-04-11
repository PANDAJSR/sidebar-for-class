import { useEffect, useRef } from 'react';

interface UseAutoHideOptions {
  isRunning: boolean;
  isMiniMode: boolean;
  isFullScreen: boolean;
  autoHideSeconds: number;
  toggleMiniMode: () => void;
}

export const useAutoHide = ({
  isRunning,
  isMiniMode,
  isFullScreen,
  autoHideSeconds,
  toggleMiniMode,
}: UseAutoHideOptions): void => {
  const autoHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetTimeout = (): void => {
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }

      if (isRunning && !isMiniMode && !isFullScreen && autoHideSeconds > 0) {
        autoHideTimeoutRef.current = setTimeout(() => {
          toggleMiniMode();
        }, autoHideSeconds * 1000);
      }
    };

    resetTimeout();

    const handleActivity = (): void => {
      resetTimeout();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);

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

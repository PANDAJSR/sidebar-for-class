import { useState, useEffect, useRef, useCallback } from 'react';

type AnimationSetting = 'on' | 'off' | 'reduce';

interface UseFullScreenOptions {
  isMiniMode: boolean;
  setIsMiniMode: React.Dispatch<React.SetStateAction<boolean>>;
  enableAnimations: AnimationSetting;
}

interface UseFullScreenReturn {
  isFullScreen: boolean;
  isFullScreenRef: React.MutableRefObject<boolean>;
  toggleFullScreen: () => Promise<void>;
  exitFullScreen: () => Promise<void>;
}

export const useFullScreen = ({
  isMiniMode,
  setIsMiniMode,
  enableAnimations,
}: UseFullScreenOptions): UseFullScreenReturn => {
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const isFullScreenRef = useRef<boolean>(isFullScreen);

  useEffect(() => {
    isFullScreenRef.current = isFullScreen;
  }, [isFullScreen]);

  const exitFullScreen = useCallback(async (): Promise<void> => {
    if (window.electronAPI && window.electronAPI.setFullScreen) {
      await window.electronAPI.setFullScreen(false, enableAnimations === 'on');
    }
  }, [enableAnimations]);

  const toggleFullScreen = useCallback(async (): Promise<void> => {
    const nextFullScreen = !isFullScreenRef.current;

    if (nextFullScreen && isMiniMode) {
      setIsMiniMode(false);
      if (window.electronAPI && window.electronAPI.resizeWindow) {
        window.electronAPI.resizeWindow(600, 400, undefined, enableAnimations === 'on');
      }
    }

    if (window.electronAPI && window.electronAPI.setFullScreen) {
      await window.electronAPI.setFullScreen(nextFullScreen, enableAnimations === 'on');
    }
  }, [isMiniMode, setIsMiniMode, enableAnimations]);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onFullScreenChanged) {
      const unsubscribe = window.electronAPI.onFullScreenChanged((isFullScreenState: boolean) => {
        setIsFullScreen(isFullScreenState);
      });
      return unsubscribe;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isFullScreenRef.current) {
        exitFullScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitFullScreen]);

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

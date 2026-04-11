import { useState, useEffect } from 'react';

type AnimationSetting = 'on' | 'off' | 'reduce';

interface TimerConfig {
  timer?: {
    auto_hide_seconds?: number;
    enable_animations?: AnimationSetting | boolean;
    enable_sound?: boolean;
  };
}

interface ConfigCallback {
  (config: TimerConfig): void;
}

interface UseConfigReturn {
  autoHideSeconds: number;
  enableAnimations: AnimationSetting;
  enableSound: boolean;
  setAutoHideSeconds: React.Dispatch<React.SetStateAction<number>>;
  setEnableAnimations: React.Dispatch<React.SetStateAction<AnimationSetting>>;
  setEnableSound: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useConfig = (): UseConfigReturn => {
  const [autoHideSeconds, setAutoHideSeconds] = useState<number>(0);
  const [enableAnimations, setEnableAnimations] = useState<AnimationSetting>('on');
  const [enableSound, setEnableSound] = useState<boolean>(true);

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

  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = (): void => {
      const root = document.getElementById('root');
      if (root) {
        root.classList.add('no-transition');
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
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

  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      if (window.electronAPI && window.electronAPI.getConfig) {
        try {
          const config: TimerConfig = await window.electronAPI.getConfig();

          if (config.timer && config.timer.auto_hide_seconds !== undefined) {
            setAutoHideSeconds(config.timer.auto_hide_seconds);
          }

          if (config.timer && config.timer.enable_animations !== undefined) {
            let animValue: AnimationSetting | boolean = config.timer.enable_animations;
            if (typeof animValue === 'boolean') {
              animValue = animValue ? 'on' : 'off';
            }
            setEnableAnimations(animValue as AnimationSetting);
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
      window.electronAPI.onConfigUpdated((newConfig: TimerConfig) => {
        if (newConfig.timer && newConfig.timer.auto_hide_seconds !== undefined) {
          setAutoHideSeconds(newConfig.timer.auto_hide_seconds);
        }
        if (newConfig.timer && newConfig.timer.enable_animations !== undefined) {
          let animValue: AnimationSetting | boolean = newConfig.timer.enable_animations;
          if (typeof animValue === 'boolean') {
            animValue = animValue ? 'on' : 'off';
          }
          setEnableAnimations(animValue as AnimationSetting);
        }
        if (newConfig.timer && newConfig.timer.enable_sound !== undefined) {
          setEnableSound(newConfig.timer.enable_sound);
        }
      });
    }
  }, []);

  return {
    autoHideSeconds,
    enableAnimations,
    enableSound,
    setAutoHideSeconds,
    setEnableAnimations,
    setEnableSound,
  };
};

export default useConfig;

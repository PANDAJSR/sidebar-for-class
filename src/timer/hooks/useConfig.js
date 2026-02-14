import { useState, useEffect } from 'react';

/**
 * 配置管理 Hook
 * 负责加载和同步应用配置，包括自动隐藏时间、动画设置和音效设置
 *
 * @returns {Object} 配置相关的状态和更新函数
 *   - autoHideSeconds: 自动隐藏秒数
 *   - enableAnimations: 动画设置 ('on' | 'off' | 'reduce')
 *   - enableSound: 是否启用音效
 *   - setAutoHideSeconds: 设置自动隐藏秒数
 *   - setEnableAnimations: 设置动画开关
 *   - setEnableSound: 设置音效开关
 */
export const useConfig = () => {
  // 自动隐藏秒数（0 表示不自动隐藏）
  const [autoHideSeconds, setAutoHideSeconds] = useState(0);
  // 动画设置：'on' 开启, 'off' 关闭, 'reduce' 减少动画
  const [enableAnimations, setEnableAnimations] = useState('on');
  // 是否启用音效
  const [enableSound, setEnableSound] = useState(true);

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

  // 初始化：加载配置
  useEffect(() => {
    const loadConfig = async () => {
      if (window.electronAPI && window.electronAPI.getConfig) {
        try {
          const config = await window.electronAPI.getConfig();

          // 加载自动隐藏设置
          if (config.timer && config.timer.auto_hide_seconds !== undefined) {
            setAutoHideSeconds(config.timer.auto_hide_seconds);
          }

          // 加载动画设置
          if (config.timer && config.timer.enable_animations !== undefined) {
            let animValue = config.timer.enable_animations;
            // 兼容旧配置：布尔值转换为新格式
            if (typeof animValue === 'boolean') {
              animValue = animValue ? 'on' : 'off';
            }
            setEnableAnimations(animValue);
          }

          // 加载音效设置
          if (config.timer && config.timer.enable_sound !== undefined) {
            setEnableSound(config.timer.enable_sound);
          }
        } catch (error) {
          console.error('Failed to load config:', error);
        }
      }
    };
    loadConfig();

    // 监听配置更新事件
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

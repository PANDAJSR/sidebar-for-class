/**
 * 计时器模块自定义 Hooks 入口文件
 * 统一导出所有与计时器相关的自定义 Hooks
 */

// 全屏管理 Hook
export { useFullScreen } from './useFullScreen';

// 配置管理 Hook
export { useConfig } from './useConfig';

// 自动隐藏管理 Hook
export { useAutoHide } from './useAutoHide';

// 计时器核心逻辑 Hook
export { useTimer } from './useTimer';

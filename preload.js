const { contextBridge, ipcRenderer } = require('electron');

/**
 * 预加载脚本：在渲染进程和主进程之间架起桥梁
 * 安全地暴露部分 API 给渲染进程
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // 调整窗口大小
    resizeWindow: (width, height, y, animate) => ipcRenderer.send('resize-window', width, height, y, animate),

    // 实时调整窗口大小（用于拖拽调整）
    resizeWindowRealtime: (width, height) => ipcRenderer.send('resize-window-realtime', width, height),

    // 设置鼠标穿透（预留接口）
    setIgnoreMouse: (ignore, forward) => ipcRenderer.send('set-ignore-mouse', ignore, forward),

    // 获取配置信息
    getConfig: () => ipcRenderer.invoke('get-config'),
    updateConfig: (config) => ipcRenderer.send('update-config', config),
    previewConfig: (config) => ipcRenderer.send('preview-config', config),
    onConfigUpdated: (callback) => ipcRenderer.on('config-updated', (event, config) => callback(config)),

    // 启动外部应用
    launchApp: (target, args) => ipcRenderer.send('launch-app', target, args),

    // 获取文件图标
    getFileIcon: (path) => ipcRenderer.invoke('get-file-icon', path),

    // 设置窗口置顶状态
    setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),

    // 系统信息
    getOSInfo: () => ipcRenderer.invoke('get-os-info'),

    // 音量控制
    getVolume: () => ipcRenderer.invoke('get-volume'),
    setVolume: (value) => ipcRenderer.send('set-volume', value),

    // 检查进程是否正在运行
    isProcessRunning: (processName) => ipcRenderer.invoke('is-process-running', processName),

    // 获取文件夹下的文件
    getFilesInFolder: (path, maxCount) => ipcRenderer.invoke('get-files-in-folder', path, maxCount),

    // 读写文件
    readFile: (path) => ipcRenderer.invoke('read-file', path),
    writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
    deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
    renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),

    // 执行任意命令
    executeCommand: (command) => ipcRenderer.send('execute-command', command),

    // 获取文件路径 (解决 Context Isolation 导致 file.path 为空的问题)
    getFilePath: (file) => {
        const { webUtils } = require('electron');
        if (webUtils && webUtils.getPathForFile) {
            return webUtils.getPathForFile(file);
        }
        return file.path;
    },

    // 打开设置窗口
    openSettings: () => ipcRenderer.send('open-settings'),

    // 打开计时器窗口
    openTimerWindow: () => ipcRenderer.send('open-timer-window'),

    // 获取显示器信息
    getDisplays: () => ipcRenderer.invoke('get-displays'),
    // 监听显示器更新
    onDisplaysUpdated: (callback) => {
        const subscription = (event, displays) => callback(displays);
        ipcRenderer.on('displays-updated', subscription);
        return () => ipcRenderer.removeListener('displays-updated', subscription);
    },

    // 显示桌面（模拟 Win+D）
    showDesktop: () => ipcRenderer.send('show-desktop'),

    // 任务视图（模拟 Win+Tab）
    taskview: () => ipcRenderer.send('taskview'),

    // 截图
    screenshot: () => ipcRenderer.invoke('screenshot'),

    // 关闭当前窗口
    closeWindow: () => ipcRenderer.send('close-window'),

    // 全屏控制
    setFullScreen: (flag, animate) => ipcRenderer.send('set-fullscreen', flag, animate),
    isFullScreen: () => ipcRenderer.invoke('is-fullscreen'),
    onFullScreenChanged: (callback) => {
        const subscription = (event, isFullScreen) => callback(isFullScreen);
        ipcRenderer.on('fullscreen-changed', subscription);
        return () => ipcRenderer.removeListener('fullscreen-changed', subscription);
    },

    // 关闭窗口
    closeFrontWindow: () => ipcRenderer.send('close-front-window'),
    
    // 使侧边栏失去焦点并关闭前台窗口
    blurAndCloseFrontWindow: () => ipcRenderer.send('blur-and-close-front-window'),

    // 打开文件/文件夹
    openFile: (path) => ipcRenderer.send('open-file', path),
    openFolder: (path) => ipcRenderer.send('open-folder', path),
    openWithNotepad: (path) => ipcRenderer.send('open-with-notepad', path),
    copyImage: (path) => ipcRenderer.send('copy-image', path),
    saveEditedImage: (path, data) => ipcRenderer.send('save-edited-image', path, data),

    // 窗口焦点事件
    onWindowBlur: (callback) => {
        const subscription = (event) => callback();
        ipcRenderer.on('window-blur', subscription);
        return () => ipcRenderer.removeListener('window-blur', subscription);
    },
});


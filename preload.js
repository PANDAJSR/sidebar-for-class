const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Script start', {
    pid: process.pid,
    platform: process.platform,
    userAgent: process.versions.electron
});

process.on('uncaughtException', (error) => {
    console.error('[Preload] uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('[Preload] unhandledRejection', reason);
});

window.addEventListener('DOMContentLoaded', () => {
    console.log('[Preload] DOMContentLoaded');
});

contextBridge.exposeInMainWorld('electronAPI', {
    resizeWindow: (width, height, y, animate) => ipcRenderer.send('resize-window', width, height, y, animate),

    resizeWindowRealtime: (width, height) => ipcRenderer.send('resize-window-realtime', width, height),

    setIgnoreMouse: (ignore, forward) => ipcRenderer.send('set-ignore-mouse', ignore, forward),

    getConfig: () => ipcRenderer.invoke('get-config'),
    updateConfig: (config) => ipcRenderer.send('update-config', config),
    previewConfig: (config) => ipcRenderer.send('preview-config', config),
    onConfigUpdated: (callback) => ipcRenderer.on('config-updated', (_event, config) => callback(config)),

    launchApp: (target, args) => ipcRenderer.send('launch-app', target, args),

    getFileIcon: (path) => ipcRenderer.invoke('get-file-icon', path),

    setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),

    getOSInfo: () => ipcRenderer.invoke('get-os-info'),

    getVolume: () => ipcRenderer.invoke('get-volume'),
    setVolume: (value) => ipcRenderer.send('set-volume', value),

    isProcessRunning: (processName) => ipcRenderer.invoke('is-process-running', processName),

    getFilesInFolder: (path, maxCount) => ipcRenderer.invoke('get-files-in-folder', path, maxCount),

    readFile: (path) => ipcRenderer.invoke('read-file', path),
    writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
    deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
    renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),

    executeCommand: (command) => ipcRenderer.send('execute-command', command),

    getFilePath: (file) => {
        const { webUtils } = require('electron');
        if (webUtils && webUtils.getPathForFile) {
            return webUtils.getPathForFile(file);
        }
        return file.path;
    },

    openSettings: () => ipcRenderer.send('open-settings'),

    openTimerWindow: () => ipcRenderer.send('open-timer-window'),

    getDisplays: () => ipcRenderer.invoke('get-displays'),
    onDisplaysUpdated: (callback) => {
        const subscription = (_event, displays) => callback(displays);
        ipcRenderer.on('displays-updated', subscription);
        return () => ipcRenderer.removeListener('displays-updated', subscription);
    },

    showDesktop: () => ipcRenderer.send('show-desktop'),

    taskview: () => ipcRenderer.send('taskview'),

    screenshot: () => ipcRenderer.invoke('screenshot'),

    closeWindow: () => ipcRenderer.send('close-window'),

    setFullScreen: (flag, animate) => ipcRenderer.send('set-fullscreen', flag, animate),
    isFullScreen: () => ipcRenderer.invoke('is-fullscreen'),
    onFullScreenChanged: (callback) => {
        const subscription = (_event, isFullScreen) => callback(isFullScreen);
        ipcRenderer.on('fullscreen-changed', subscription);
        return () => ipcRenderer.removeListener('fullscreen-changed', subscription);
    },

    closeFrontWindow: () => ipcRenderer.send('close-front-window'),

    blurAndCloseFrontWindow: () => ipcRenderer.send('blur-and-close-front-window'),

    openFile: (path) => ipcRenderer.send('open-file', path),
    openFolder: (path) => ipcRenderer.send('open-folder', path),
    openWithNotepad: (path) => ipcRenderer.send('open-with-notepad', path),
    copyImage: (path) => ipcRenderer.send('copy-image', path),
    saveEditedImage: (path, data) => ipcRenderer.send('save-edited-image', path, data),

    onWindowBlur: (callback) => {
        const subscription = () => callback();
        ipcRenderer.on('window-blur', subscription);
        return () => ipcRenderer.removeListener('window-blur', subscription);
    },
});

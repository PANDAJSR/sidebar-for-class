import { contextBridge, ipcRenderer } from 'electron';

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
    resizeWindow: (width: number, height: number, y: number, animate?: boolean) => ipcRenderer.send('resize-window', width, height, y, animate),

    resizeWindowRealtime: (width: number, height: number) => ipcRenderer.send('resize-window-realtime', width, height),

    setIgnoreMouse: (ignore: boolean, forward?: boolean) => ipcRenderer.send('set-ignore-mouse', ignore, forward),

    getConfig: () => ipcRenderer.invoke('get-config'),
    updateConfig: (config: unknown) => ipcRenderer.send('update-config', config),
    previewConfig: (config: unknown) => ipcRenderer.send('preview-config', config),
    onConfigUpdated: (callback: (config: unknown) => void) => ipcRenderer.on('config-updated', (_event, config) => callback(config)),

    launchApp: (target: string, args?: string[]) => ipcRenderer.send('launch-app', target, args),

    getFileIcon: (path: string) => ipcRenderer.invoke('get-file-icon', path),

    setAlwaysOnTop: (flag: boolean) => ipcRenderer.send('set-always-on-top', flag),

    getOSInfo: () => ipcRenderer.invoke('get-os-info'),

    getVolume: () => ipcRenderer.invoke('get-volume'),
    setVolume: (value: number) => ipcRenderer.send('set-volume', value),

    isProcessRunning: (processName: string) => ipcRenderer.invoke('is-process-running', processName),

    getFilesInFolder: (path: string, maxCount?: number) => ipcRenderer.invoke('get-files-in-folder', path, maxCount),

    readFile: (path: string) => ipcRenderer.invoke('read-file', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
    deleteFile: (path: string) => ipcRenderer.invoke('delete-file', path),
    renameFile: (oldPath: string, newPath: string) => ipcRenderer.invoke('rename-file', oldPath, newPath),

    executeCommand: (command: string) => ipcRenderer.send('execute-command', command),

    getFilePath: (file: { path: string }) => {
        const { webUtils } = require('electron');
        if (webUtils && webUtils.getPathForFile) {
            return webUtils.getPathForFile(file);
        }
        return file.path;
    },

    openSettings: () => ipcRenderer.send('open-settings'),

    openTimerWindow: () => ipcRenderer.send('open-timer-window'),

    getDisplays: () => ipcRenderer.invoke('get-displays'),
    onDisplaysUpdated: (callback: (displays: unknown) => void) => {
        const subscription = (_event: unknown, displays: unknown) => callback(displays);
        ipcRenderer.on('displays-updated', subscription);
        return () => ipcRenderer.removeListener('displays-updated', subscription);
    },

    showDesktop: () => ipcRenderer.send('show-desktop'),

    taskview: () => ipcRenderer.send('taskview'),

    screenshot: () => ipcRenderer.invoke('screenshot'),

    closeWindow: () => ipcRenderer.send('close-window'),

    setFullScreen: (flag: boolean, animate?: boolean) => ipcRenderer.send('set-fullscreen', flag, animate),
    isFullScreen: () => ipcRenderer.invoke('is-fullscreen'),
    onFullScreenChanged: (callback: (isFullScreen: boolean) => void) => {
        const subscription = (_event: unknown, isFullScreen: boolean) => callback(isFullScreen);
        ipcRenderer.on('fullscreen-changed', subscription);
        return () => ipcRenderer.removeListener('fullscreen-changed', subscription);
    },

    closeFrontWindow: () => ipcRenderer.send('close-front-window'),

    blurAndCloseFrontWindow: () => ipcRenderer.send('blur-and-close-front-window'),

    openFile: (path: string) => ipcRenderer.send('open-file', path),
    openFolder: (path: string) => ipcRenderer.send('open-folder', path),
    openWithNotepad: (path: string) => ipcRenderer.send('open-with-notepad', path),
    copyImage: (path: string) => ipcRenderer.send('copy-image', path),
    saveEditedImage: (path: string, data: string) => ipcRenderer.send('save-edited-image', path, data),

    onWindowBlur: (callback: () => void) => {
        const subscription = () => callback();
        ipcRenderer.on('window-blur', subscription);
        return () => ipcRenderer.removeListener('window-blur', subscription);
    },
});
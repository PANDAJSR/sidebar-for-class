interface ElectronAPI {
  resizeWindow: (width: number, height: number, y: number, animate?: boolean) => void;
  resizeWindowRealtime: (width: number, height: number) => void;
  setIgnoreMouse: (ignore: boolean, forward?: boolean) => void;
  getConfig: () => Promise<unknown>;
  updateConfig: (config: unknown) => void;
  previewConfig: (config: unknown) => void;
  onConfigUpdated: (callback: (config: unknown) => void) => void;
  launchApp: (target: string, args?: string[]) => void;
  getFileIcon: (path: string) => Promise<string | null>;
  setAlwaysOnTop: (flag: boolean) => void;
  getOSInfo: () => Promise<{ platform: string; release: string }>;
  getVolume: () => Promise<number>;
  setVolume: (value: number) => void;
  isProcessRunning: (processName: string) => Promise<boolean>;
  getFilesInFolder: (path: string, maxCount?: number) => Promise<Array<{name: string; path: string; mtime: Date; isDirectory: boolean}>>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<boolean>;
  deleteFile: (path: string) => Promise<boolean>;
  renameFile: (oldPath: string, newPath: string) => Promise<boolean>;
  executeCommand: (command: string) => void;
  getFilePath: (file: { path: string }) => string;
  openSettings: () => void;
  openTimerWindow: () => void;
  getDisplays: () => Promise<unknown>;
  onDisplaysUpdated: (callback: (displays: unknown) => void) => () => void;
  showDesktop: () => void;
  taskview: () => void;
  screenshot: () => Promise<{ path: string; previews: Array<{ label: string; preview: string }> }>;
  closeWindow: () => void;
  setFullScreen: (flag: boolean, animate?: boolean) => void;
  isFullScreen: () => Promise<boolean>;
  onFullScreenChanged: (callback: (isFullScreen: boolean) => void) => () => void;
  closeFrontWindow: () => void;
  blurAndCloseFrontWindow: () => void;
  openFile: (path: string) => void;
  openFolder: (path: string) => void;
  openWithNotepad: (path: string) => void;
  copyImage: (path: string) => void;
  saveEditedImage: (path: string, data: string) => void;
  onWindowBlur: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
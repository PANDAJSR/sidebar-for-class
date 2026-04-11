import { BrowserWindow } from 'electron';

declare module 'electron' {
  interface BrowserWindow {
    _originalBounds?: Electron.Rectangle;
    _isFullScreenAnimating?: boolean;
    _programmaticFullScreen?: boolean;
  }
}
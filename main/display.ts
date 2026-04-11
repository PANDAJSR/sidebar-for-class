import { screen, Display } from 'electron';

function getTargetDisplay(displayIndex: number = 0): Display {
  const displays = screen.getAllDisplays();
  return (displayIndex < displays.length)
    ? displays[displayIndex]
    : screen.getPrimaryDisplay();
}

function getDisplayBounds(displayIndex: number = 0): Electron.Rectangle {
  const targetDisplay = getTargetDisplay(displayIndex);
  return targetDisplay.bounds;
}

function getAllDisplays(): Display[] {
  return screen.getAllDisplays();
}

function calculateWindowYPosition(yPos: number, height: number, screenBounds: Electron.Rectangle): number {
  const { y: screenY, height: screenHeight } = screenBounds;

  if (yPos < screenY) return screenY;
  if (yPos + height > screenY + screenHeight) return screenY + screenHeight - height;
  return yPos;
}

function calculateWindowXPosition(xPos: number, width: number, screenBounds: Electron.Rectangle): number {
  const { x: screenX, width: screenWidth } = screenBounds;

  if (xPos + width > screenX + screenWidth) return screenX + screenWidth - width;
  return xPos;
}

export {
  getTargetDisplay,
  getDisplayBounds,
  getAllDisplays,
  calculateWindowYPosition,
  calculateWindowXPosition
};
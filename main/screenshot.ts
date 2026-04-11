import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import sharp from 'sharp';

interface ScreenshotPreview {
  label: string;
  preview: string;
}

interface ScreenshotResult {
  path: string;
  previews: ScreenshotPreview[];
}

interface Display {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

async function takeScreenshot(): Promise<ScreenshotResult> {
  try {
    const desktopPath = path.join(os.homedir(), 'Desktop');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `screenshot_${timestamp}.png`;
    const filepath = path.join(desktopPath, filename);

    await new Promise(resolve => setTimeout(resolve, 400));

    const screenshot = require('screenshot-desktop');
    const displays = await screenshot.listDisplays() as Display[];
    console.log('Found displays:', displays);

    const images = await screenshot.all() as Buffer[];

    if (!images || images.length === 0) {
      throw new Error('No screenshots captured');
    }

    const previews: ScreenshotPreview[] = [];

    if (images.length === 1) {
      fs.writeFileSync(filepath, images[0]);
    } else {
      const bounds = calculateTotalBounds(displays);
      const totalWidth = bounds.maxX - bounds.minX;
      const totalHeight = bounds.maxY - bounds.minY;

      console.log('Total canvas size:', totalWidth, 'x', totalHeight);

      await mergeScreenshots(images, displays, bounds, totalWidth, totalHeight, filepath);
    }

    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      console.log('Screenshot saved to:', filepath, 'Size:', stats.size, 'bytes');

      const totalPreviewBuffer = await sharp(filepath)
        .sharpen({ sigma: 1, m1: 2, m2: 20 })
        .webp({ quality: 90 })
        .toBuffer();

      previews.push({
        label: '全部显示器',
        preview: `data:image/webp;base64,${totalPreviewBuffer.toString('base64')}`
      });

      if (images.length > 1) {
        for (let i = 0; i < images.length; i++) {
          const displayPreviewBuffer = await sharp(images[i])
            .sharpen({ sigma: 1, m1: 2, m2: 20 })
            .webp({ quality: 90 })
            .toBuffer();

          previews.push({
            label: `显示器 ${i + 1}`,
            preview: `data:image/webp;base64,${displayPreviewBuffer.toString('base64')}`
          });
        }
      }

      return {
        path: filepath,
        previews: previews
      };
    } else {
      throw new Error('Screenshot file not created');
    }
  } catch (err) {
    console.error('Screenshot error:', err);
    throw err;
  }
}

function calculateTotalBounds(displays: Display[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  displays.forEach(display => {
    minX = Math.min(minX, display.left);
    minY = Math.min(minY, display.top);
    maxX = Math.max(maxX, display.right);
    maxY = Math.max(maxY, display.bottom);
  });

  return { minX, minY, maxX, maxY };
}

interface CompositeOperation {
  input: Buffer;
  left: number;
  top: number;
}

async function mergeScreenshots(
  images: Buffer[],
  displays: Display[],
  bounds: { minX: number; minY: number },
  totalWidth: number,
  totalHeight: number,
  filepath: string
): Promise<void> {
  const { minX, minY } = bounds;

  const compositeOperations: CompositeOperation[] = [];

  for (let i = 0; i < displays.length; i++) {
    const display = displays[i];
    const image = images[i];

    const offsetX = display.left - minX;
    const offsetY = display.top - minY;

    compositeOperations.push({
      input: image,
      left: offsetX,
      top: offsetY
    });
  }

  await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
    .composite(compositeOperations)
    .png()
    .toFile(filepath);
}

export {
  takeScreenshot
};
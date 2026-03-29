/**
 * 截图模块
 * 负责屏幕截图功能
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const screenshot = require('screenshot-desktop');

/**
 * 执行截图并保存到桌面
 * @returns {Promise<string>} 截图文件路径
 */
async function takeScreenshot() {
  try {
    const sharp = require('sharp');

    // 获取用户桌面路径
    const desktopPath = path.join(os.homedir(), 'Desktop');

    // 生成时间戳文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `screenshot_${timestamp}.png`;
    const filepath = path.join(desktopPath, filename);

    // 等待一小段时间，让渲染进程完成收起动画
    await new Promise(resolve => setTimeout(resolve, 400));

    // 获取所有显示器
    const displays = await screenshot.listDisplays();
    console.log('Found displays:', displays);

    // 截取所有屏幕（返回的是 Buffer 数组）
    const images = await screenshot.all();

    if (!images || images.length === 0) {
      throw new Error('No screenshots captured');
    }

    const previews = [];

    // 如果只有一个显示器，直接保存
    if (images.length === 1) {
      fs.writeFileSync(filepath, images[0]);
    } else {
      // 计算所有显示器的总边界
      const bounds = calculateTotalBounds(displays);
      const totalWidth = bounds.maxX - bounds.minX;
      const totalHeight = bounds.maxY - bounds.minY;

      console.log('Total canvas size:', totalWidth, 'x', totalHeight);

      // 创建画布并合并所有截图
      await mergeScreenshots(images, displays, bounds, totalWidth, totalHeight, filepath);
    }

    // 验证文件是否创建成功
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      console.log('Screenshot saved to:', filepath, 'Size:', stats.size, 'bytes');

      // 1. 处理合并后的全屏预览
      const totalPreviewBuffer = await sharp(filepath)
        .sharpen({ sigma: 1, m1: 2, m2: 20 })
        .webp({ quality: 90 })
        .toBuffer();
      
      previews.push({
        label: '全部显示器',
        preview: `data:image/webp;base64,${totalPreviewBuffer.toString('base64')}`
      });

      // 2. 如果有多个显示器，处理每个显示器的预览
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

/**
 * 计算所有显示器的总边界
 * @param {Array} displays - 显示器数组
 * @returns {Object} 边界对象 { minX, minY, maxX, maxY }
 */
function calculateTotalBounds(displays) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  displays.forEach(display => {
    minX = Math.min(minX, display.left);
    minY = Math.min(minY, display.top);
    maxX = Math.max(maxX, display.right);
    maxY = Math.max(maxY, display.bottom);
  });

  return { minX, minY, maxX, maxY };
}

/**
 * 合并多个截图到一个文件
 * @param {Array<Buffer>} images - 截图 Buffer 数组
 * @param {Array} displays - 显示器数组
 * @param {Object} bounds - 边界对象
 * @param {number} totalWidth - 总宽度
 * @param {number} totalHeight - 总高度
 * @param {string} filepath - 输出文件路径
 */
async function mergeScreenshots(images, displays, bounds, totalWidth, totalHeight, filepath) {
  const { minX, minY } = bounds;
  
  const compositeOperations = [];

  for (let i = 0; i < displays.length; i++) {
    const display = displays[i];
    const image = images[i];

    // 计算相对于总边界的偏移量
    const offsetX = display.left - minX;
    const offsetY = display.top - minY;

    compositeOperations.push({
      input: image,
      left: offsetX,
      top: offsetY
    });
  }

  // 创建画布并合并所有图片
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

module.exports = {
  takeScreenshot
};

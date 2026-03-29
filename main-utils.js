const { app, shell, screen, ipcMain } = require('electron');
const path = require('path');
const { spawn, execSync, execFile } = require('child_process');
const fs = require('fs');

let loudnessModule = null;

function getLoudness() {
    if (process.platform === 'darwin') {
        return null;
    }
    if (!loudnessModule) {
        loudnessModule = require('loudness');
    }
    return loudnessModule;
}

/**
 * 从 URI 协议中解析出关联的可执行文件路径
 * @param {string} protocol - URI 协议头 (例如: "ms-settings")
 * @returns {string|null} - 返回可执行文件的路径，如果未找到则返回 null
 */
function getExePathFromProtocol(protocol) {
    try {
        // 构建注册表查询路径
        const regPath = `HKEY_CLASSES_ROOT\\${protocol}\\shell\\open\\command`;
        // 执行注册表查询命令
        const output = execSync(`reg query "${regPath}" /ve`, { encoding: 'utf8' });
        // 解析输出结果
        const match = output.match(/\s+REG_SZ\s+(.*)/);
        if (match) {
            let command = match[1].trim();
            let exePath = '';
            // 处理带引号的路径
            if (command.startsWith('"')) {
                const endQuoteIndex = command.indexOf('"', 1);
                if (endQuoteIndex !== -1) exePath = command.substring(1, endQuoteIndex);
            } else {
                // 处理不带引号的路径
                exePath = command.split(' ')[0];
            }
            // 验证文件是否存在
            if (exePath && fs.existsSync(exePath)) return exePath;
        }
    } catch (e) {
        console.error(`查询协议 ${protocol} 失败:`, e.message);
    }
    return null;
}

/**
 * 获取系统音量
 * @returns {Promise<number>} - 返回当前音量值 (0-100)
 */
async function getSystemVolume() {
    try {
        const loudness = getLoudness();
        if (!loudness) return 0;

        // 如果系统处于静音状态，视作音量为 0
        const isMuted = await loudness.getMuted();
        if (isMuted) return 0;

        const volume = await loudness.getVolume();
        return volume;
    } catch (error) {
        console.error('Failed to get system volume:', error);
        return 0;
    }
}

let isSettingVolume = false;
let pendingVolume = null;

/**
 * 设置系统音量
 * @param {number} value - 音量值 (0-100)
 */
async function setSystemVolume(value) {
    const loudness = getLoudness();
    if (!loudness) return;

    // 防止过于频繁调用
    if (isSettingVolume) {
        pendingVolume = value;
        return;
    }

    isSettingVolume = true;
    try {
        // 显式调整音量
        await loudness.setVolume(value);

        // 解决音量设置为 0 无法静音的问题
        // 当音量为 0 时，强制开启静音；当音量大于 0 时，强制关闭静音
        if (value === 0) {
            await loudness.setMuted(true);
        } else {
            await loudness.setMuted(false);
        }
    } catch (error) {
        console.error('Failed to set system volume:', error);
    } finally {
        isSettingVolume = false;
        if (pendingVolume !== null) {
            const next = pendingVolume;
            pendingVolume = null;
            // 处理在设置期间产生的最新音量请求
            setSystemVolume(next);
        }
    }
}


module.exports = {
    getExePathFromProtocol,
    getSystemVolume,
    setSystemVolume
};

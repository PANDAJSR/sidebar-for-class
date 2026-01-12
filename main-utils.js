const { app, shell, screen, ipcMain } = require('electron');
const path = require('path');
const { spawn, execSync, execFile } = require('child_process');
const fs = require('fs');

const volumeControlExe = path.join(__dirname, 'VolumeControl.exe');

function ensureVolumeControlExe() {
    if (fs.existsSync(volumeControlExe)) return true;
    try {
        console.log('Compiling VolumeControl.exe...');
        const frameworkPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
        if (fs.existsSync(frameworkPath)) {
            execSync(`"${frameworkPath}" /out:"${volumeControlExe}" "${path.join(__dirname, 'VolumeControl.cs')}"`);
            return fs.existsSync(volumeControlExe);
        }
    } catch (e) {
        console.error('Compilation failed:', e);
    }
    return false;
}

// 尝试初始化编译
ensureVolumeControlExe();

async function runVolumeControl(args) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(volumeControlExe)) {
            if (!ensureVolumeControlExe()) {
                reject(new Error('VolumeControl.exe not found and compilation failed'));
                return;
            }
        }
        execFile(volumeControlExe, args, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
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
        const stdout = await runVolumeControl(['get']);
        const vol = parseInt(stdout, 10);
        return isNaN(vol) ? 0 : vol;
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
    // 防止过于频繁调用
    if (isSettingVolume) {
        pendingVolume = value;
        return;
    }

    isSettingVolume = true;
    try {
        await runVolumeControl(['set', Math.round(value).toString()]);
    } catch (error) {
        console.error('Failed to set system volume:', error);
    } finally {
        isSettingVolume = false;
        if (pendingVolume !== null) {
            const next = pendingVolume;
            pendingVolume = null;
            setSystemVolume(next);
        }
    }
}


module.exports = {
    getExePathFromProtocol,
    getSystemVolume,
    setSystemVolume
};

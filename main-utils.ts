import { execSync } from 'child_process';
import * as fs from 'fs';

let loudnessModule: typeof import('loudness') | null = null;

function getLoudness(): typeof import('loudness') | null {
    if (process.platform === 'darwin') {
        return null;
    }
    if (!loudnessModule) {
        loudnessModule = require('loudness');
    }
    return loudnessModule;
}

function getExePathFromProtocol(protocol: string): string | null {
    try {
        const regPath = `HKEY_CLASSES_ROOT\\${protocol}\\shell\\open\\command`;
        const output = execSync(`reg query "${regPath}" /ve`, { encoding: 'utf8' });
        const match = output.match(/\s+REG_SZ\s+(.*)/);
        if (match) {
            let command = match[1].trim();
            let exePath = '';
            if (command.startsWith('"')) {
                const endQuoteIndex = command.indexOf('"', 1);
                if (endQuoteIndex !== -1) exePath = command.substring(1, endQuoteIndex);
            } else {
                exePath = command.split(' ')[0];
            }
            if (exePath && fs.existsSync(exePath)) return exePath;
        }
    } catch (e) {
        console.error(`查询协议 ${protocol} 失败:`, (e as Error).message);
    }
    return null;
}

async function getSystemVolume(): Promise<number> {
    try {
        const loudness = getLoudness();
        if (!loudness) return 0;

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
let pendingVolume: number | null = null;

async function setSystemVolume(value: number): Promise<void> {
    const loudness = getLoudness();
    if (!loudness) return;

    if (isSettingVolume) {
        pendingVolume = value;
        return;
    }

    isSettingVolume = true;
    try {
        await loudness.setVolume(value);

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
            setSystemVolume(next);
        }
    }
}

export {
    getExePathFromProtocol,
    getSystemVolume,
    setSystemVolume
};
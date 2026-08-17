const { BrowserWindow } = require('electron');
const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('./ErrorLogger');
import type { ILegendaryStatus } from '../../types/index';

function getLegendaryPath(): string {
    const candidates = [
        path.join(__dirname, '..', '..', '..', 'bin', 'legendary.exe'),
        path.join(__dirname, '..', '..', '..', 'bin', 'legendary_windows_x64.exe'),
        path.join(__dirname, '..', '..', '..', 'legendary', 'legendary.exe'),
        path.join(process.cwd(), 'bin', 'legendary.exe'),
        path.join(process.cwd(), 'bin', 'legendary_windows_x64.exe'),
    ];

    for (const p of candidates) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return candidates[0];
}

const legendaryExePath: string = getLegendaryPath();

async function checkLegendaryStatus(): Promise<ILegendaryStatus> {
    return new Promise((resolve) => {
        execFile(legendaryExePath, ['status', '--json'], (error: Error | null, stdout: string, stderr: string) => {
            if (error) {
                logger.error('Failed to get legendary status: ' + stderr);
                return resolve({ loggedIn: false, error: stderr });
            }
            try {
                const statusInfo = JSON.parse(stdout);
                resolve({ loggedIn: !!statusInfo.account_id, data: statusInfo });
            } catch (err) {
                resolve({ loggedIn: false, error: 'Failed to parse JSON' });
            }
        });
    });
}

async function loginEpicGames(): Promise<string> {
    return new Promise((resolve, reject) => {
        const authWindow = new BrowserWindow({
            width: 520,
            height: 720,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            },
            autoHideMenuBar: true,
            title: "Login Epic Games"
        });

        const epicLoginUrl = "https://legendary.gl/epiclogin";
        let isResolved = false;

        const checkPageForAuthCode = async () => {
            if (isResolved) return;
            try {
                const jsonString = await authWindow.webContents.executeJavaScript('document.body ? document.body.innerText : ""');
                if (jsonString && jsonString.includes('{')) {
                    const match = jsonString.match(/\{[\s\S]*\}/);
                    if (match) {
                        const parsed = JSON.parse(match[0]);
                        const authCode = parsed.authorizationCode || parsed.code || parsed.exchangeCode || parsed.sid;
                        if (authCode) {
                            isResolved = true;
                            authWindow.close();

                            const authArgs = parsed.authorizationCode
                                ? ['auth', '--code', parsed.authorizationCode]
                                : parsed.sid
                                ? ['auth', '--sid', parsed.sid]
                                : ['auth', '--code', authCode];

                            execFile(legendaryExePath, authArgs, (error: Error | null, stdout: string, stderr: string) => {
                                if (error) {
                                    logger.error('Legendary Auth failed: ' + stderr);
                                    reject('Autenticação no Legendary falhou: ' + stderr);
                                } else {
                                    resolve('Login efetuado com sucesso!');
                                }
                            });
                        }
                    }
                }
            } catch (err) {
                // Not a json page yet, continue waiting
            }
        };

        authWindow.webContents.on('did-finish-load', checkPageForAuthCode);
        authWindow.webContents.on('did-navigate', checkPageForAuthCode);
        authWindow.webContents.on('did-redirect-navigation', checkPageForAuthCode);

        authWindow.on('closed', () => {
            if (!isResolved) {
                reject('A janela de login foi fechada pelo usuário.');
            }
        });

        authWindow.loadURL(epicLoginUrl);
    });
}

function runLegendaryApp(appName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(legendaryExePath, ['launch', appName], {
            shell: false,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let output: string = '';
        let errorOutput: string = '';

        child.stdout?.on('data', (data: Buffer) => {
            output += data.toString();
        });

        child.stderr?.on('data', (data: Buffer) => {
            errorOutput += data.toString();
        });

        child.on('close', (code: number) => {
            if (code === 0) {
                resolve(`Output: ${output}`);
            } else {
                reject(`Error executing legendary launch: ${errorOutput}`);
            }
        });

        child.on('error', (err: Error) => {
            reject(`Error: ${err.message}`);
        });
    });
}

module.exports = {
    checkLegendaryStatus,
    loginEpicGames,
    runLegendaryApp,
    legendaryExePath
};

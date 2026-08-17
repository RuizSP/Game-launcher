const { BrowserWindow } = require('electron');
const { spawn, execFile } = require('child_process');
const path = require('path');
const logger = require('./ErrorLogger');
import { ILegendaryStatus, IEpicAuthData } from '../../types/index';

const legendaryExePath: string = path.join(__dirname, '..', '..', '..', 'bin', 'legendary.exe');

async function checkLegendaryStatus(): Promise<ILegendaryStatus> {
    return new Promise((resolve, reject) => {
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
            width: 500,
            height: 700,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            },
            autoHideMenuBar: true,
            title: "Login Epic Games"
        });

        const epicLoginUrl = "https://www.epicgames.com/id/login?redirectUrl=https%3A%2F%2Fwww.epicgames.com%2Fid%2Fapi%2Fredirect";
        
        authWindow.webContents.on('did-redirect-navigation', async (event: any, url: string) => {
            if (url.includes('api/redirect')) {
                try {
                    const jsonString = await authWindow.webContents.executeJavaScript('document.body.innerText');
                    const authData: IEpicAuthData = JSON.parse(jsonString);
                    
                    if (authData.sid || authData.authorizationCode) {
                        authWindow.close();
                        
                        const authArg = authData.sid ? ['auth', '--sid', authData.sid] : ['auth', '--code', authData.authorizationCode];
                        
                        execFile(legendaryExePath, authArg, (error: Error | null, stdout: string, stderr: string) => {
                            if (error) {
                                logger.error('Legendary Auth failed: ' + stderr);
                                reject('Autenticação no Legendary falhou: ' + stderr);
                            } else {
                                resolve('Login efetuado com sucesso!');
                            }
                        });
                    }
                } catch(err) {
                    console.error("Não foi possível parsear os dados de login: ", err);
                }
            }
        });

        authWindow.on('closed', () => {
            reject('A janela de login foi fechada pelo usuário.');
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

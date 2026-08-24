import { app, BrowserWindow, ipcMain, shell, dialog, IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import { spawn } from 'child_process';
import fs from 'fs';
import { IGame } from './types/index';

const steamApiConection = require('./scripts/SteamApiConection');
const findEpicInstalledGames = require('./scripts/GameFinders/EpicGameFinder');
const findLegendaryInstalledGames = require('./scripts/GameFinders/LegendaryGameFinder');
const { checkLegendaryStatus, loginEpicGames, runLegendaryApp, checkLegendaryInstalled, installLegendaryApp } = require('./scripts/Managers/LegendaryAuthManager');
const logger = require('./scripts/Managers/ErrorLogger');
const { getCurrentGameData, saveGameData, createGameObject } = require('./scripts/Managers/GameDataManager');

async function getGames(library: string): Promise<void> {
  console.log(library);
  if (library === 'steam') {
    await steamApiConection();
  } else if (library === 'epic' || library === 'legendary') {
    await findLegendaryInstalledGames();
  }
}

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 500,
    minWidth: 900,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'));

  let gameData: IGame | null = null; 
  ipcMain.on('navigate', (event: IpcMainEvent, page: string, game: IGame | null) => {
    gameData = game; 
    const targetPath = path.isAbsolute(page) ? page : path.join(__dirname, '..', page);
    mainWindow.loadFile(targetPath).catch(err => console.log("Falha ao mudar de página: " + err.message));
  });
  
  ipcMain.handle('load-game-data', (): IGame | null => { 
    return gameData;
  });
 
  mainWindow.setMenuBarVisibility(false);

  ipcMain.on('open-addgame', () => {
     createAddGameWindow();
  });
};

function createAddGameWindow(): void {
  const formWindow = new BrowserWindow({
    width: 800,
    height: 600,
    modal: true, 
    parent: BrowserWindow.getFocusedWindow() || undefined, 
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  formWindow.setMenuBarVisibility(false);
  formWindow.loadFile(path.join(__dirname, '..', 'src', 'form.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('play-game', async (event: IpcMainInvokeEvent, executablePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const command = `"${executablePath}"`;
    const child = spawn(command, [], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

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
        reject(`Error executing file: ${errorOutput}`);
      }
    });

    child.on('error', (err: Error) => {
      reject(`Error: ${err.message}`);
    });
  });
});

ipcMain.on('run-steam-app', (event: IpcMainEvent, steamAppId: number | string) => {
  const steamUrl = `steam://run/${steamAppId}`;
  shell.openExternal(steamUrl).catch(err => console.error(`Failed to open Steam app: ${err.message}`));
});

ipcMain.handle('dialog:openFile', async (event: IpcMainInvokeEvent, name: string, extension: string[]): Promise<string | null> => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: name, extensions: extension }]
    });
    
    const { canceled, filePaths } = result;
    
    if (canceled) {
      console.log("operação cancelada");
      return null;
    } else {
      console.log("caminho do arquivo" + filePaths[0]);
      return filePaths[0];
    }
  } catch (err: any) {
    console.log("Failed to open file: " + err.message);
    return null;
  }
});

ipcMain.handle('sync-libraries', async (event: IpcMainInvokeEvent, library: string): Promise<void> => {
  await getGames(library);
});

ipcMain.handle('check-legendary-status', async () => {
  return await checkLegendaryStatus();
});

ipcMain.handle('login-epic-games', async () => {
  return await loginEpicGames();
});

ipcMain.handle('run-legendary-app', async (event: IpcMainInvokeEvent, appName: string) => {
  return await runLegendaryApp(appName);
});

ipcMain.handle('check-legendary-installed', async (event: IpcMainInvokeEvent, appName: string): Promise<boolean> => {
  return await checkLegendaryInstalled(appName);
});

ipcMain.handle('install-legendary-app', async (event: IpcMainInvokeEvent, appName: string): Promise<string> => {
  return await installLegendaryApp(appName);
});

ipcMain.handle('app-quit', () => {
  app.quit();
});

ipcMain.handle('save-games-json', async (event: IpcMainInvokeEvent, games: IGame[]): Promise<string> => {
  await saveGameData(games);
  return 'Games JSON saved successfully';
});

ipcMain.handle('fetch-game-data', async (): Promise<IGame[]> => {
  try {
    const documentsPath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Documents', 'MeuGameLauncher', 'gameData.json');
    if (fs.existsSync(documentsPath)) {
      const data = await fs.promises.readFile(documentsPath, 'utf-8');
      return JSON.parse(data);
    } else {
      console.log('Criando arquivos ...');
      const dirPath = path.dirname(documentsPath);
      if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
      }
      await fs.promises.writeFile(documentsPath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
  } catch (error) {
    throw error;
  }
});

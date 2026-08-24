import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI, IGame } from './types/index';

const electronAPI: IElectronAPI = {
  openForm: () => ipcRenderer.send('open-addgame'),
  saveGamesJson: (games: IGame[]) => ipcRenderer.invoke('save-games-json', games),
  playGame: (executablePath: string) => ipcRenderer.invoke('play-game', executablePath),
  runSteamApp: (steamId: number | string) => ipcRenderer.send('run-steam-app', steamId),
  syncLibraries: (library: string) => ipcRenderer.invoke('sync-libraries', library),
  openFileDialog: (name: string, extension: string[]) => ipcRenderer.invoke('dialog:openFile', name, extension),
  navigate: (page: string, game: IGame | null) => ipcRenderer.send('navigate', page, game),
  loadGameData: () => ipcRenderer.invoke('load-game-data'),
  quitApp: () => ipcRenderer.invoke('app-quit'),
  fetchGameData: () => ipcRenderer.invoke('fetch-game-data'),
  checkLegendaryStatus: () => ipcRenderer.invoke('check-legendary-status'),
  loginEpicGames: () => ipcRenderer.invoke('login-epic-games'),
  runLegendaryApp: (appName: string) => ipcRenderer.invoke('run-legendary-app', appName),
  installLegendaryApp: (appName: string) => ipcRenderer.invoke('install-legendary-app', appName),
  checkLegendaryInstalled: (appName: string) => ipcRenderer.invoke('check-legendary-installed', appName)
};

contextBridge.exposeInMainWorld('electron', electronAPI);

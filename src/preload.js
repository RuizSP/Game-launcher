// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// preload.js
// preload.js
const { contextBridge, ipcRenderer, ipcMain } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openForm: () => ipcRenderer.send('open-addgame'),
  saveGamesJson: (games) => ipcRenderer.invoke('save-games-json', games),
  playGame: (executablePath) => ipcRenderer.invoke('play-game', executablePath),
  runSteamApp: (steamId) => ipcRenderer.send('run-steam-app', steamId),
  syncLibraries: (library)=> ipcRenderer.invoke('sync-libraries', library),
  openFileDialog: (name, extension) => ipcRenderer.invoke('dialog:openFile', name, extension),
  navigate: (page, game)=> ipcRenderer.send('navigate', page, game),
  loadGameData: () => ipcRenderer.invoke('load-game-data'),
  quitApp: () => ipcRenderer.invoke('app-quit'),
  fetchGameData: () => ipcRenderer.invoke('fetch-game-data')
});





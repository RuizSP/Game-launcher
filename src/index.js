const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('node:path');
const { spawn } = require('child_process');
const fs = require('fs');
const { title } = require('node:process');
const steamApiConection = require('./scripts/SteamApiConection');
const findEpicInstalledGames = require('./scripts/GameFinders/EpicGameFinder');
const logger = require('./scripts/Managers/ErrorLogger');
const { getCurrentGameData, saveGameData,createGameObject} = require('./scripts/Managers/GameDataManager');

async function getGames(library)
{
  console.log(library);
  if(library === 'steam'){
    await steamApiConection();
  }else if(library === 'epic'){
    await findEpicInstalledGames();
  }
}


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 500,
    minWidth: 900,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

 
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));


  //event to change page:
  let gameData; 
  ipcMain.on('navigate', (event, page, game) =>{
    gameData= game; 
    mainWindow.loadFile(page).catch(err => console.log("Falha ao mudar de página: " + err.message));
  });
  ipcMain.handle('load-game-data', () =>{ 
    return gameData;
  })
 
  mainWindow.setMenuBarVisibility(false);

  //listen to an event to open the addGame window
  ipcMain.on('open-addgame', ()=>{
     createAddGameWindow();
  });

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};


function createAddGameWindow() {
  const formWindow  = new BrowserWindow({
    width: 800,
    height: 600,
    modal: true, // Makes the form window modal
    parent: BrowserWindow.getFocusedWindow(), // Makes it a child of the currently focused window
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });
  
  formWindow.setMenuBarVisibility(false);
  formWindow.loadFile('./src/form.html');

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

//Handler to run an .exe:
ipcMain.handle('play-game', async(event, executablePath) =>{
  return new Promise((resolve, reject)=>{
    const command = `"${executablePath}"`;
    const child = spawn(command, [], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data)=>{
      output += data.toString();
    });

    child.stderr.on('data', (data) =>{
      errorOutput += data.toString();
    })

    child.on('close', (code) =>{
      if(code === 0){
        resolve(`Output: ${output}`);
      }else{
        reject(`Error executing file: ${errorOutput}`);
      }
    });

    child.on('error', (err) => {
      reject(`Error: ${err.message}`);
    });

  });
});

  //listen to an event to run steam games:
  ipcMain.on('run-steam-app', (event, steamAppId)=>{
    const steamUrl = `steam://run/${steamAppId}`;
    shell.openExternal(steamUrl).catch(err => console.error(`Failed to open Steam app: ${err.message}`));
  });


  //listen to an event to open an file dialogbox:
  ipcMain.handle('dialog:openFile', async (event, name, extension) =>{
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{name:name, extensions:extension}]
    }).catch(err => console.log("Failed to open file: " + err.message));
    
    const {canceled, filePaths} = result;
    
    
    if(canceled){
      console.log("operação cancelada");
      return null;
    }else{
      console.log("caminho do arquivo"+ filePaths[0]);
      return filePaths[0];
    }
  });

  ipcMain.handle('sync-libraries', async(event,library) =>{
    await getGames(library);
  })

  ipcMain.handle('app-quit', ()=>{
    app.quit();
  })

  //handler to save the games on a JSON:
  ipcMain.handle('save-games-json', async (event, games) => {
    saveGameData(games);
    return 'Games JSON saved successfully';
  });


  ipcMain.handle('fetch-game-data', async ()=>{
    try
    {
      const documentsPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Documents', 'MeuGameLauncher', 'gameData.json');
      if(fs.existsSync(documentsPath))
        {
          const data = await fs.promises.readFile(documentsPath, 'utf-8');
          return JSON.parse(data);
        }else{
          console.log('Criando arquivos ...');
          fs.promises.writeFile(documentsPath, JSON.stringify([], null,2), 'utf-8');
        }
      
    }catch(error)
    {
      throw error;
    }
  })

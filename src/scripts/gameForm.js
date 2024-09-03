// para o formulario de adicionar games:
const gameForm = document.getElementById('gameForm');
const fileInput = document.getElementById('fileInput');
const imageInput = document.getElementById('imageInput');
const btnback = document.getElementById('btnBack');

let games;

async function fetchgames()
{
  try {
    games = await window.electron.fetchGameData();
  }catch(err)
  {
    console.log('Error fetching games', err);
  }

}

fetchgames();


gameForm.addEventListener('submit', (event) =>{
  event.preventDefault();

  const title = document.getElementById('title').value;
  const cover = document.getElementById('cover').value;
  const description = document.getElementById('description').value;
  const exe = document.getElementById('executablePath').value;
  
  addGame(title, cover, description,  exe);
  clear();

});

//ajustar função, remover savegamesJson e utilizar gameDatamanager
function addGame (gameTitle, gameCover, gameDescription, gmaeExe) {
  const game = {
    title: gameTitle,
    cover: gameCover,
    description: gameDescription,
    exe:gmaeExe
  }
  
  games.push(game);
  window.electron.saveGamesJson(games)
  .then(()=> console.log("Game added and JSON saved successfully."))
  .catch(error => console.error('Error saving JSON:', error));
}

function clear()
{
  document.getElementById('title').value = null;
  document.getElementById('cover').value = null;
  document.getElementById('executablePath').value = null;
  document.getElementById('description').value = null;
}

fileInput.addEventListener('click', async () =>{
  const filePath = await window.electron.openFileDialog('Executables', ['exe']);
  if(filePath){
    document.getElementById('executablePath').value = filePath;
  }
});

imageInput.addEventListener('click', async() =>{
  const imagePath = await window.electron.openFileDialog('Images', ['png', 'jpg']);
  if(imagePath)
    {
      document.getElementById('cover').value = imagePath;
    }

});

window.onerror = function(msg, url, linenumber)
{
  alert('Cannot add Game: ' + msg);
}

btnback.addEventListener('click', async ()=> {
  window.electron.navigate('src/index.html', null);
});
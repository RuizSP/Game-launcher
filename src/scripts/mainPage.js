// scripts/mainPage.js
const library = document.querySelector(".library");
const btnAddGame = document.querySelector("#btnAddGame");
const btnSteamSync = document.querySelector("#btnSteam");
const btnEpicSync = document.querySelector("#btnEpic");
const btnQuit = document.querySelector("#btnQuit");
const searchBar = document.querySelector(".search-bar input");
const loadBar = document.getElementById('load-bar');

let isSideMenuVisible = true;
let games = [];
let currentFilter = 'all'; // Mantém o estado do filtro atual
let searchQuery = ''; // Mantém o estado da pesquisa atual



async function fetchgames() {
  try {
    games = await window.electron.fetchGameData();
    applyFilters();
  }catch(err)
  {
    console.log('Error fetching games', err);
  }
   
}
fetchgames();

btnAddGame.addEventListener('click', async () => {
  window.electron.navigate('src/form.html', null);
})

function updateGameList(filteredGames) {
  library.innerHTML = '';
  filteredGames.forEach(game => {
    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';

    gameContainer.addEventListener('click', () => {
      window.electron.navigate('src/GamePage.html', game);
    });

    const img = document.createElement('img');
    img.src = game.cover;
    img.alt = 'game-cover';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'fill';
    gameContainer.appendChild(img);

    const titleDiv = document.createElement('div');
    const title = document.createElement('p');
    title.innerText = game.title;
    title.style.zIndex = '1';
    titleDiv.append(title);
    gameContainer.appendChild(titleDiv);

    library.appendChild(gameContainer);
  });
}


btnSteamSync.addEventListener('click', async () => {
  try{
    loadBar.style.display = 'inline';
    await window.electron.syncLibraries('steam');
  }catch(err)
  {
    alert('Cannot sync with steam');
  }finally{
    loadBar.style.display = 'none';
    fetchgames();
  }
});

btnEpicSync.addEventListener('click', async() =>{

  try{
    loadBar.style.display = 'inline';
    await window.electron.syncLibraries('epic');
  }catch(err)
  {
    alert('Cannot find epic installed games');
  }finally{
    loadBar.style.display = 'none';
    fetchgames();
  }

})


btnQuit.addEventListener('click', () => {
  window.electron.quitApp();
});

searchBar.addEventListener('input', () => {
  searchQuery = searchBar.value; // Atualiza a consulta de pesquisa
  applyFilters(); // Aplica filtros e pesquisa após atualização
});

function libraryFilters() {
  const filterButtons = document.querySelectorAll('.filter-button');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');

      currentFilter = button.dataset.filter; // Atualiza o filtro ativo
      applyFilters(); // Aplica filtros e pesquisa após atualização
    });
  });
}

function applyFilters() {
  let filteredGames = games;

  // Aplica o filtro de biblioteca se não for 'all'
  if (currentFilter !== 'all') {
    filteredGames = filteredGames.filter(game => game.library === currentFilter);
  }

  // Aplica o filtro de pesquisa
  if (searchQuery) {
    filteredGames = filteredGames.filter(game =>
      game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  updateGameList(filteredGames);
}

// Chamadas de função
libraryFilters();

window.onerror = function(msg, url, linenumber){
  alert('Error: ' + msg + '\nUrl: '+url + '\nlineNUmber: '+ linenumber );
  return true;
};

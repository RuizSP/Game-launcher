(() => {
  const library = document.querySelector(".library") as HTMLDivElement;
  const btnAddGame = document.querySelector("#btnAddGame") as HTMLElement;
  const btnSteamSync = document.querySelector("#btnSteam") as HTMLElement;
  const btnEpicSync = document.querySelector("#btnEpic") as HTMLElement;
  const btnQuit = document.querySelector("#btnQuit") as HTMLElement;
  const searchBar = document.querySelector(".search-input") as HTMLInputElement;
  const loadBar = document.getElementById('load-bar') as HTMLDivElement;

  let games: IGame[] = [];
  let currentFilter: string = 'all';
  let searchQuery: string = '';

  async function fetchgames(): Promise<void> {
    try {
      games = await window.electron.fetchGameData();
      applyFilters();
    } catch (err) {
      console.log('Error fetching games', err);
    }
  }

  function updateGameList(filteredGames: IGame[]): void {
    if (!library) return;
    library.innerHTML = '';
    filteredGames.forEach(game => {
      const gameContainer = document.createElement('div');
      gameContainer.className = 'game-container';

      gameContainer.addEventListener('click', () => {
        window.electron.navigate('src/GamePage.html', game);
      });

      const img = document.createElement('img');
      img.src = game.cover || '';
      img.alt = 'game-cover';
      gameContainer.appendChild(img);

      const titleDiv = document.createElement('div');
      const title = document.createElement('p');
      title.innerText = game.title;
      titleDiv.append(title);
      gameContainer.appendChild(titleDiv);

      library.appendChild(gameContainer);
    });
  }

  function applyFilters(): void {
    let filteredGames = games;

    if (currentFilter !== 'all') {
      filteredGames = filteredGames.filter(game => game.library === currentFilter);
    }

    if (searchQuery) {
      filteredGames = filteredGames.filter(game =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    updateGameList(filteredGames);
  }

  function libraryFilters(): void {
    const filterGroup = document.querySelector('mdui-segmented-button-group') as HTMLElement;
    if (filterGroup) {
      filterGroup.addEventListener('change', (e: any) => {
        currentFilter = e.target.value;
        applyFilters();
      });
    }
  }

  if (btnAddGame) {
    btnAddGame.addEventListener('click', () => {
      window.electron.navigate('src/form.html', null);
    });
  }

  if (btnSteamSync) {
    btnSteamSync.addEventListener('click', async () => {
      try {
        if (loadBar) loadBar.style.display = 'block';
        await window.electron.syncLibraries('steam');
      } catch (err) {
        alert('Cannot sync with steam');
      } finally {
        if (loadBar) loadBar.style.display = 'none';
        fetchgames();
      }
    });
  }

  if (btnEpicSync) {
    btnEpicSync.addEventListener('click', async () => {
      try {
        if (loadBar) loadBar.style.display = 'block';
        const status = await window.electron.checkLegendaryStatus();

        if (!status.loggedIn) {
          if (loadBar) loadBar.style.display = 'none';
          const loginResult = await window.electron.loginEpicGames();
          console.log(loginResult);
          if (loadBar) loadBar.style.display = 'block';
        }

        await window.electron.syncLibraries('legendary');
      } catch (err) {
        console.error(err);
        alert('Erro ao sincronizar jogos da Epic/Legendary: ' + err);
      } finally {
        if (loadBar) loadBar.style.display = 'none';
        fetchgames();
      }
    });
  }

  if (btnQuit) {
    btnQuit.addEventListener('click', () => {
      window.electron.quitApp();
    });
  }

  if (searchBar) {
    searchBar.addEventListener('input', (event: Event) => {
      const target = event.target as HTMLInputElement;
      searchQuery = target.value || '';
      applyFilters();
    });
  }

  libraryFilters();
  fetchgames();

  window.onerror = function (msg: string | Event, url?: string, linenumber?: number): boolean {
    console.error('Error: ' + msg + '\nUrl: ' + url + '\nlineNUmber: ' + linenumber);
    return true;
  };
})();

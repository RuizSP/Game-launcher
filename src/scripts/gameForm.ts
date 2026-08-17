(() => {
  const gameForm = document.getElementById('gameForm') as HTMLFormElement;
  const fileInput = document.getElementById('fileInput') as HTMLElement;
  const imageInput = document.getElementById('imageInput') as HTMLElement;
  const btnback = document.getElementById('btnBack') as HTMLElement;

  let games: IGame[] = [];

  async function fetchgames(): Promise<void> {
    try {
      games = await window.electron.fetchGameData() || [];
    } catch (err) {
      console.log('Error fetching games', err);
    }
  }

  function addGame(gameTitle: string, gameCover: string, gameDescription: string, gameExe: string): void {
    const game: IGame = {
      title: gameTitle,
      cover: gameCover,
      description: gameDescription,
      exe: gameExe,
      library: 'local'
    };

    games.push(game);
    window.electron.saveGamesJson(games)
      .then(() => {
        alert('Jogo adicionado com sucesso!');
        window.electron.navigate('src/index.html', null);
      })
      .catch(error => console.error('Error saving JSON:', error));
  }

  function clear(title: HTMLInputElement, cover: HTMLInputElement, description: HTMLInputElement, exe: HTMLInputElement): void {
    if (title) title.value = '';
    if (cover) cover.value = '';
    if (exe) exe.value = '';
    if (description) description.value = '';
  }

  if (gameForm) {
    gameForm.addEventListener('submit', (event: Event) => {
      event.preventDefault();

      const titleInput = document.getElementById('title') as HTMLInputElement;
      const coverInput = document.getElementById('cover') as HTMLInputElement;
      const descriptionInput = document.getElementById('description') as HTMLInputElement;
      const exeInput = document.getElementById('executablePath') as HTMLInputElement;

      if (!titleInput?.value || !exeInput?.value) {
        alert('Título e Executável são obrigatórios!');
        return;
      }

      addGame(titleInput.value, coverInput?.value || '', descriptionInput?.value || '', exeInput.value);
      clear(titleInput, coverInput, descriptionInput, exeInput);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('click', async () => {
      const filePath = await window.electron.openFileDialog('Executables', ['exe', 'bat']);
      if (filePath) {
        const exeInput = document.getElementById('executablePath') as HTMLInputElement;
        if (exeInput) exeInput.value = filePath;
      }
    });
  }

  if (imageInput) {
    imageInput.addEventListener('click', async () => {
      const imagePath = await window.electron.openFileDialog('Images', ['png', 'jpg', 'jpeg', 'webp']);
      if (imagePath) {
        const coverInput = document.getElementById('cover') as HTMLInputElement;
        if (coverInput) coverInput.value = imagePath;
      }
    });
  }

  if (btnback) {
    btnback.addEventListener('click', () => {
      window.electron.navigate('src/index.html', null);
    });
  }

  fetchgames();

  window.onerror = function (msg: string | Event, url?: string, linenumber?: number): void {
    console.error('Error: ' + msg + '\nUrl: ' + url + '\nlineNUmber: ' + linenumber);
  };
})();

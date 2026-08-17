(() => {
  const gameTitle = document.getElementById("gameTitle") as HTMLHeadingElement;
  const description = document.getElementById("gdText") as HTMLParagraphElement;
  const gameCover = document.getElementById("gamePage") as HTMLBodyElement;
  const backbutton = document.getElementById('backButton') as HTMLElement;
  const playbutton = document.getElementById('playButton') as HTMLElement;
  const pageTitle = document.getElementsByTagName('title');
  const gameTagContainer = document.getElementById('game-tags') as HTMLDivElement;
  const timePlayed = document.getElementById('time-played') as HTMLSpanElement;

  let game: IGame | null = null;

  if (backbutton) {
    backbutton.addEventListener('click', () => {
      window.electron.navigate("src/index.html", null);
    });
  }

  async function updateGameDescription(): Promise<void> {
    try {
      game = await window.electron.loadGameData();
      if (game) {
        if (pageTitle && pageTitle[0]) pageTitle[0].text = game.title;
        if (gameTitle) gameTitle.innerText = game.title || 'No title available';
        if (description) description.innerText = game.description || 'No description available';
        if (gameCover && game.cover) {
          gameCover.style.backgroundImage = `url('${game.cover.replace(/'/g, "\\'")}')`;
        }
        const gameTags = game.tags;
        if (timePlayed) timePlayed.innerText = toHour(game.timePlayed || 0);
        if (gameTagContainer && gameTags) {
          gameTagContainer.innerHTML = '';
          gameTags.forEach(tag => {
            const tagElement = document.createElement('mdui-chip');
            tagElement.innerText = tag.description;
            gameTagContainer.append(tagElement);
          });
        }
      } else {
        console.error("No game data found");
      }
    } catch (error) {
      console.error("Failed to load game data: ", error);
    }

    addEventToPlayButton();
  }

  function addEventToPlayButton(): void {
    if (!playbutton) return;
    playbutton.addEventListener('click', () => {
      if (!game) return;
      console.log("clicou em jogar");
      if (game.library === 'steam') {
        runSteamApp(game.appid as number | string);
      } else if (game.library === 'legendary') {
        runLegendaryApp((game.appid as string) || (game.exe as string));
      } else {
        runExecutable(game.exe as string);
      }
    });
  }

  function runLegendaryApp(appName: string): void {
    console.log('Launch Legendary App:', appName);
    window.electron.runLegendaryApp(appName)
      .then(output => console.log(output))
      .catch(error => console.error(error));
  }

  function runSteamApp(steamAppId: number | string): void {
    console.log(steamAppId);
    window.electron.runSteamApp(steamAppId);
  }

  function runExecutable(executable: string): void {
    console.log(executable);
    window.electron.playGame(executable)
      .then(output => console.log(output))
      .catch(error => console.error(error));
  }

  function toHour(time: number): string {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    return `${hours}h ${minutes}min`;
  }

  updateGameDescription();
})();

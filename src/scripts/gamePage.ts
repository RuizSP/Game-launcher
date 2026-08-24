(() => {
  const gameTitle = document.getElementById("gameTitle") as HTMLHeadingElement;
  const description = document.getElementById("gdText") as HTMLParagraphElement;
  const gameCover = document.getElementById("gamePage") as HTMLBodyElement;
  const backbutton = document.getElementById('backButton') as HTMLElement;
  const playbutton = document.getElementById('playButton') as HTMLElement;
  const pageTitle = document.getElementsByTagName('title');
  const gameTagContainer = document.getElementById('game-tags') as HTMLDivElement;
  const timePlayed = document.getElementById('time-played') as HTMLSpanElement;
  const installStatus = document.getElementById('install-status') as HTMLSpanElement;
  const progressContainer = document.getElementById('installProgressContainer') as HTMLDivElement;
  const progressText = document.getElementById('installProgressText') as HTMLSpanElement;

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

        // Verifica status de instalação
        await updateInstallationState();
      } else {
        console.error("No game data found");
      }
    } catch (error) {
      console.error("Failed to load game data: ", error);
    }

    setupActionButton();
  }

  async function updateInstallationState(): Promise<void> {
    if (!game) return;

    if (game.library === 'legendary') {
      try {
        const isInstalled = await window.electron.checkLegendaryInstalled(game.appid as string);
        game.isInstalled = isInstalled;
      } catch (e) {
        // mantém valor prévio
      }

      if (game.isInstalled) {
        if (installStatus) {
          installStatus.innerText = 'Instalado';
          installStatus.style.color = '#4CAF50';
        }
        if (playbutton) {
          playbutton.innerHTML = '<mdui-icon slot="icon" name="play_arrow"></mdui-icon> Jogar';
        }
      } else {
        if (installStatus) {
          installStatus.innerText = 'Não Instalado (Nuvem)';
          installStatus.style.color = '#FFA726';
        }
        if (playbutton) {
          playbutton.innerHTML = '<mdui-icon slot="icon" name="download"></mdui-icon> Baixar Jogo';
        }
      }
    } else {
      if (installStatus) {
        installStatus.innerText = 'Pronto';
        installStatus.style.color = '#4CAF50';
      }
      if (playbutton) {
        playbutton.innerHTML = '<mdui-icon slot="icon" name="play_arrow"></mdui-icon> Jogar';
      }
    }
  }

  function setupActionButton(): void {
    if (!playbutton) return;

    playbutton.addEventListener('click', async () => {
      if (!game) return;

      if (game.library === 'legendary') {
        if (!game.isInstalled) {
          // Inicia download e instalação
          await handleInstallLegendary();
        } else {
          // Executa o jogo instalado
          runLegendaryApp((game.appid as string) || (game.exe as string));
        }
      } else if (game.library === 'steam') {
        runSteamApp(game.appid as number | string);
      } else {
        runExecutable(game.exe as string);
      }
    });
  }

  async function handleInstallLegendary(): Promise<void> {
    if (!game || !game.appid) return;

    try {
      if (playbutton) playbutton.setAttribute('disabled', 'true');
      if (progressContainer) progressContainer.style.display = 'flex';
      if (progressText) progressText.innerText = 'Baixando e instalando...';

      const result = await window.electron.installLegendaryApp(game.appid as string);
      console.log(result);

      game.isInstalled = true;

      // Atualiza no gameData.json
      try {
        const allGames = await window.electron.fetchGameData();
        const targetIndex = allGames.findIndex(g => g.appid === game?.appid);
        if (targetIndex !== -1) {
          allGames[targetIndex].isInstalled = true;
          await window.electron.saveGamesJson(allGames);
        }
      } catch (err) {
        console.error('Erro ao atualizar gameData.json:', err);
      }

      await updateInstallationState();
      alert('Jogo baixado e instalado com sucesso!');
    } catch (err: any) {
      console.error('Falha na instalação:', err);
      alert('Erro ao instalar o jogo: ' + (err?.message || err));
    } finally {
      if (progressContainer) progressContainer.style.display = 'none';
      if (playbutton) playbutton.removeAttribute('disabled');
    }
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

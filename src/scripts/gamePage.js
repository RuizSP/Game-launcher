const gameTitle = document.getElementById("gameTitle");
const description = document.getElementById("gdText");
const gameCover = document.getElementById("gamePage");
const backbutton = document.getElementById('backButton');
const playbutton = document.getElementById('playButton');
const pageTitle = document.getElementsByTagName('title');
const gameTagContainer = document.getElementById('game-tags');
const timePlayed = document.getElementById('time-played');
let game;



backbutton.addEventListener('click', ()=>{
    window.electron.navigate("src/index.html", null)
})


async function updateGameDescription() {
  try {
    game = await window.electron.loadGameData(); // Await to ensure data is loaded
    if (game) {
      pageTitle[0].value = game.title;
      gameTitle.innerText = game.title || 'No title available';
      description.innerText = game.description || 'No description available';
      gameCover.style.backgroundImage = `url(${game.cover})`; // Assuming cover is a URL
      const gameTags = game.tags;
      timePlayed.innerText = toHour(game.timePlayed);
      gameTags?.forEach(tag => {
        const tagElement = document.createElement('p');
        tagElement.classList.add('tag');
        tagElement.innerText = tag.description;
        gameTagContainer.append(tagElement);
      });
      
    } else {
      console.error("No game data found");
    }
  } catch (error) {
    console.error("Failed to load game data: ", error);
  }

  addEventToPlayButton();
}

updateGameDescription();

function addEventToPlayButton()
{
  playbutton.addEventListener('click', ()=>{
    console.log("clicou em jogar");
    if(game.library ==='steam')
      {
        runSteamApp(game.appid);
      }
    else
      {
        runExecutable(game.exe);    
      }
  });
}

function runSteamApp(steamAppId)
{
  console.log(steamAppId);
  window.electron.runSteamApp(steamAppId);
}

function runExecutable(executable)
{
  console.log(executable);
  window.electron.playGame(executable)
  .then(output => console.log(output))
  .catch(error => console.error(error));
}

function toHour(time)
{
  const hours = Math.floor(time/60);
  const minutes = time % 60;
  return `${hours}h ${minutes}min`;

}

const key = "suaChave";
const id = "seuID";
const url =`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001//?key=${key}&steamid=${id}&include_appinfo=tru&include_played_free_games=1&format=json`;



const logger = require('./Managers/ErrorLogger');
const {getCurrentGameData, saveGameData, createGameObject} = require('./Managers/GameDataManager');


async function steamApiConection() {
    await fetchSteamGameData();
}

async function getOwnedGames() {   
    const response = await fetch(url);
    const data = await response.json();
    return data.response.games;
}

async function getGameDetails(appid) {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data[appid]?.success) {
        return data[appid].data;
    } else {
        console.error(`Failed to retrieve details for appId: ${appid}`);
        logger.error(`Failed to retrieve details for appId: ${appid}`);
        return null;
    }
}

async function fetchSteamGameData() {
    const games = await getOwnedGames();
    const gameDetailsArray = [];
    let existingGames = [];
    existingGames = await getCurrentGameData();

    for (let i = 0; i < games.length; i++) {
        const gameDetails = await getGameDetails(games[i].appid);
        if (gameDetails) {
            const existingGame = existingGames.find((g) => g.appid === games[i].appid);
            if(!existingGame)
                {
                  const gameObject =  createGameObject({
                
                        title: gameDetails.name,
                        appid: games[i].appid,
                        description: gameDetails.short_description || 'No description available',
                        cover: gameDetails.header_image || 'No image available',
                        library:"steam",
                        timePlayed: games[i].playtime_forever,
                        tags: gameDetails.genres,
                        icon: games[i].img_icon_url
                      
                    });
                    gameDetailsArray.push(gameObject);
                }
        }
    }

    //Combine the existing game with the new ones.
    const updatedGames = [...existingGames, ...gameDetailsArray];
    console.log('Succesfully imported steam games !');
    saveGameData(updatedGames);
}

module.exports = steamApiConection;

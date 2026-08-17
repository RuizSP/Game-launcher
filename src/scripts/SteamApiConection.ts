const key: string = "suaChave";
const id: string = "seuID";
const url: string = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001//?key=${key}&steamid=${id}&include_appinfo=true&include_played_free_games=1&format=json`;

const logger = require('./Managers/ErrorLogger');
const { getCurrentGameData, saveGameData, createGameObject } = require('./Managers/GameDataManager');
import { ISteamGameDetails, ISteamOwnedGame, IGame } from '../types/index';

async function steamApiConection(): Promise<void> {
    await fetchSteamGameData();
}

async function getOwnedGames(): Promise<ISteamOwnedGame[]> {   
    const response = await fetch(url);
    const data = await response.json();
    return data.response.games;
}

async function getGameDetails(appid: number): Promise<ISteamGameDetails | null> {
    const detailUrl = `https://store.steampowered.com/api/appdetails?appids=${appid}`;
    const response = await fetch(detailUrl);
    const data = await response.json();
    
    if (data[appid]?.success) {
        return data[appid].data;
    } else {
        console.error(`Failed to retrieve details for appId: ${appid}`);
        logger.error(`Failed to retrieve details for appId: ${appid}`);
        return null;
    }
}

async function fetchSteamGameData(): Promise<void> {
    const games: ISteamOwnedGame[] = await getOwnedGames();
    const gameDetailsArray: IGame[] = [];
    let existingGames: IGame[] = await getCurrentGameData();

    for (let i = 0; i < games.length; i++) {
        const gameDetails: ISteamGameDetails | null = await getGameDetails(games[i].appid);
        if (gameDetails) {
            const existingGame = existingGames.find((g) => g.appid === games[i].appid);
            if (!existingGame) {
                const gameObject = createGameObject({
                    title: gameDetails.name,
                    appid: games[i].appid,
                    description: gameDetails.short_description || 'No description available',
                    cover: gameDetails.header_image || 'No image available',
                    library: "steam",
                    timePlayed: games[i].playtime_forever,
                    tags: gameDetails.genres as any,
                    icon: games[i].img_icon_url
                });
                gameDetailsArray.push(gameObject);
            }
        }
    }

    // Combine the existing games with the new ones.
    const updatedGames: IGame[] = [...existingGames, ...gameDetailsArray];
    console.log('Succesfully imported steam games !');
    saveGameData(updatedGames);
}

module.exports = steamApiConection;

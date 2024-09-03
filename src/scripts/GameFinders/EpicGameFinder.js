
const { getCurrentGameData, createGameObject, saveGameData } = require('../Managers/GameDataManager');
const searchGames = require('./GameFinder');
const igdbRequisition = require('../MetaDataApi/IGDBApiConection');
const logger = require('../Managers/ErrorLogger');

const directory =  'C:/ProgramData/Epic/EpicGamesLauncher/Data/Manifests';
const extension = '.item';
const desiredProperty = "DisplayName";

function normalizeTitle(title)
{
    if(title === title.toUpperCase())
        {
            return title.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
    return title;
}

// Função para procurar jogos instalados
async function findInstalledGames() {
    try {
        const existingGames = await getCurrentGameData();
        
        const newGames = await searchGames(directory, extension, desiredProperty);
        //filter imported games
        const filteredGames = newGames.filter(game =>
            !existingGames.some(existingGame => existingGame.title === game.title)
        )

        if(filteredGames.length === 0)
        {
            logger.info('No new Games Found');
            return;
        }

        const gamesData = await fetchGameDetailsFromIGDB(filteredGames.map(item =>item.title));
        const gameObjects = await createGameObjects(gamesData, filteredGames);
        await updateGameData(gameObjects);
       
    } catch (err) {
        logger.error(""+ err);
        console.error('Error in findInstalledGames:', err);
    }
}

// Função para buscar detalhes dos jogos no IGDB
async function fetchGameDetailsFromIGDB(gameTitles) {
    const whereCondition = `name = "${gameTitles.join('"| name = "')}"`;
    return await igdbRequisition('games', '*', whereCondition);
}

// Função para criar objetos de jogos com base nos dados do IGDB
async function createGameObjects(gamesData, launchPaths) {
    const coverIds = gamesData.map(element => element.cover);
    const gameCovers = await fetchGameCovers(coverIds);
    return gamesData.map((gameData) => {
        const coverData = gameCovers.find(cover => cover.id === gameData.cover);
        const exePath = launchPaths.find(game =>game.title === gameData.name).exe;
        if (!coverData) {
            logger.error(`No cover found for game: ${gameData.name}`);
            return null;
        }
        const coverUrl = "https:" + coverData.url.replace('t_thumb', 't_cover_big');
        return createGameObject({
            title: gameData.name,
            cover: coverUrl,
            appid: gameData.id,
            genres: gameData.genres,
            library: "epic",
            description: gameData.storyline || gameData.summary,
            exe: exePath
        });
    }).filter(game => game !== null); // Remove jogos sem capas correspondentes
}

// Função para buscar as capas dos jogos no IGDB
async function fetchGameCovers(coverIds) {
    if (!coverIds.length) return [];

    const whereCondition = `id = ${coverIds.join("| id = ")}`;
    try {
        const covers = await igdbRequisition('covers', "id, url", whereCondition);
        if (covers.length !== coverIds.length) {
            logger.error("Mismatch between coverIds and covers returned.");
        }
        return covers;
    } catch (err) {
        logger.error("Error fetching game covers: " + err.message);
        console.error("Error fetching game covers:", err);
        return [];
    }
}

// Função para atualizar os dados dos jogos no JSON
async function updateGameData(newGameObjects) {
    const existingGames = await getCurrentGameData();
    const updatedGames = [...existingGames, ...newGameObjects];
    await saveGameData(updatedGames);
}

module.exports = findInstalledGames;





const { execFile } = require('child_process');
const { getCurrentGameData, createGameObject, saveGameData } = require('../Managers/GameDataManager');
const { legendaryExePath } = require('../Managers/LegendaryAuthManager');
const igdbRequisition = require('../MetaDataApi/IGDBApiConection');
const logger = require('../Managers/ErrorLogger');

// Função para procurar jogos instalados via Legendary
async function findLegendaryInstalledGames() {
    try {
        const existingGames = await getCurrentGameData();
        
        // Pega a lista de jogos instalados em formato JSON usando o legendary
        const installedGamesRaw = await new Promise((resolve, reject) => {
            execFile(legendaryExePath, ['list-installed', '--json'], (error, stdout, stderr) => {
                if (error) {
                    return reject('Failed to list legendary games: ' + stderr);
                }
                resolve(stdout);
            });
        });

        const newGames = JSON.parse(installedGamesRaw);
        
        if (!newGames || newGames.length === 0) {
            logger.info('No Legendary games found.');
            return;
        }

        // Filtra jogos que já existem no JSON local
        const filteredGames = newGames.filter(game =>
            !existingGames.some(existingGame => existingGame.appid === game.app_name)
        );

        if (filteredGames.length === 0) {
            logger.info('No new Legendary games to add.');
            return;
        }

        // Busca dados no IGDB baseados no título (app_title)
        const gamesData = await fetchGameDetailsFromIGDB(filteredGames.map(item => item.app_title));
        const gameObjects = await createGameObjects(gamesData, filteredGames);
        await updateGameData(gameObjects);
       
    } catch (err) {
        logger.error("LegendaryGameFinder error: " + err);
        console.error('Error in findLegendaryInstalledGames:', err);
        throw err; // Repassa o erro para a UI lidar se necessário
    }
}

// Função para buscar detalhes dos jogos no IGDB
async function fetchGameDetailsFromIGDB(gameTitles) {
    if (!gameTitles.length) return [];
    
    // Escapa as aspas corretamente para a query do IGDB
    const safeTitles = gameTitles.map(title => title.replace(/"/g, '\\"'));
    const whereCondition = `name = "${safeTitles.join('"| name = "')}"`;
    return await igdbRequisition('games', '*', whereCondition);
}

// Função para criar objetos de jogos com base nos dados do IGDB e do Legendary
async function createGameObjects(gamesData, legendaryGames) {
    const coverIds = gamesData.map(element => element.cover).filter(id => id !== undefined);
    const gameCovers = await fetchGameCovers(coverIds);
    
    return legendaryGames.map((legGame) => {
        // Tenta encontrar o jogo correspondente no retorno do IGDB pelo nome
        const gameData = gamesData.find(g => g.name.toLowerCase() === legGame.app_title.toLowerCase());
        
        let coverUrl = 'public/eos-icons--loading.svg'; // Placeholder default
        let description = 'Nenhuma descrição disponível';
        let genres = [];
        
        if (gameData) {
            const coverData = gameCovers.find(cover => cover.id === gameData.cover);
            if (coverData) {
                coverUrl = "https:" + coverData.url.replace('t_thumb', 't_cover_big');
            }
            description = gameData.storyline || gameData.summary || description;
            genres = gameData.genres || genres;
        } else {
            logger.info(`IGDB data not found for Legendary game: ${legGame.app_title}. Using fallback data.`);
        }

        return createGameObject({
            title: legGame.app_title,
            cover: coverUrl,
            appid: legGame.app_name, // app_name é o ID pro Legendary
            genres: genres,
            library: "legendary",
            description: description,
            exe: legGame.app_name // O exe pro legendary é apenas o nome do app pra lançar via linha de comando
        });
    });
}

// Função para buscar as capas dos jogos no IGDB
async function fetchGameCovers(coverIds) {
    if (!coverIds.length) return [];

    const whereCondition = `id = ${coverIds.join("| id = ")}`;
    try {
        const covers = await igdbRequisition('covers', "id, url", whereCondition);
        return covers;
    } catch (err) {
        logger.error("Error fetching game covers: " + err.message);
        return [];
    }
}

// Função para atualizar os dados dos jogos no JSON
async function updateGameData(newGameObjects) {
    const existingGames = await getCurrentGameData();
    const updatedGames = [...existingGames, ...newGameObjects];
    await saveGameData(updatedGames);
}

module.exports = findLegendaryInstalledGames;

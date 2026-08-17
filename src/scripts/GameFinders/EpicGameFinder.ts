const { getCurrentGameData, createGameObject, saveGameData } = require('../Managers/GameDataManager');
const searchGames = require('./GameFinder');
const igdbRequisition = require('../MetaDataApi/IGDBApiConection');
const logger = require('../Managers/ErrorLogger');
import { IGame, IIGDBGame, IIGDBCover, IGameFinderResult } from '../../types/index';

const directory: string = 'C:/ProgramData/Epic/EpicGamesLauncher/Data/Manifests';
const extension: string = '.item';
const desiredProperty: string = "DisplayName";

function normalizeTitle(title: string): string {
    if(title === title.toUpperCase()) {
        return title.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return title;
}

// Função para procurar jogos instalados
async function findInstalledGames(): Promise<void> {
    try {
        const existingGames: IGame[] = await getCurrentGameData();
        
        const newGames: IGameFinderResult[] = await searchGames(directory, extension, desiredProperty);
        //filter imported games
        const filteredGames: IGameFinderResult[] = newGames.filter(game =>
            !existingGames.some(existingGame => existingGame.title === game.title)
        );

        if(filteredGames.length === 0) {
            logger.info('No new Games Found');
            return;
        }

        const gamesData: IIGDBGame[] = await fetchGameDetailsFromIGDB(filteredGames.map(item => item.title));
        const gameObjects: IGame[] = await createGameObjects(gamesData, filteredGames);
        await updateGameData(gameObjects);
       
    } catch (err: any) {
        logger.error("" + err);
        console.error('Error in findInstalledGames:', err);
    }
}

// Função para buscar detalhes dos jogos no IGDB
async function fetchGameDetailsFromIGDB(gameTitles: string[]): Promise<IIGDBGame[]> {
    const whereCondition: string = `name = "${gameTitles.join('"| name = "')}"`;
    return await igdbRequisition('games', '*', whereCondition);
}

// Função para criar objetos de jogos com base nos dados do IGDB
async function createGameObjects(gamesData: IIGDBGame[], launchPaths: IGameFinderResult[]): Promise<IGame[]> {
    const coverIds: number[] = gamesData.map(element => element.cover).filter((id): id is number => id !== undefined);
    const gameCovers: IIGDBCover[] = await fetchGameCovers(coverIds);
    return gamesData.map((gameData: IIGDBGame) => {
        const coverData = gameCovers.find(cover => cover.id === gameData.cover);
        const matchGame = launchPaths.find(game => game.title === gameData.name);
        const exePath = matchGame ? matchGame.exe : undefined;
        if (!coverData) {
            logger.error(`No cover found for game: ${gameData.name}`);
            return null;
        }
        const coverUrl: string = "https:" + coverData.url.replace('t_thumb', 't_cover_big');
        return createGameObject({
            title: gameData.name,
            cover: coverUrl,
            appid: gameData.id,
            genres: gameData.genres,
            library: "epic",
            description: gameData.storyline || gameData.summary,
            exe: exePath
        });
    }).filter((game): game is IGame => game !== null); // Remove jogos sem capas correspondentes
}

// Função para buscar as capas dos jogos no IGDB
async function fetchGameCovers(coverIds: number[]): Promise<IIGDBCover[]> {
    if (!coverIds.length) return [];

    const whereCondition: string = `id = ${coverIds.join("| id = ")}`;
    try {
        const covers: IIGDBCover[] = await igdbRequisition('covers', "id, url", whereCondition);
        if (covers.length !== coverIds.length) {
            logger.error("Mismatch between coverIds and covers returned.");
        }
        return covers;
    } catch (err: any) {
        logger.error("Error fetching game covers: " + err.message);
        console.error("Error fetching game covers:", err);
        return [];
    }
}

// Função para atualizar os dados dos jogos no JSON
async function updateGameData(newGameObjects: IGame[]): Promise<void> {
    const existingGames: IGame[] = await getCurrentGameData();
    const updatedGames: IGame[] = [...existingGames, ...newGameObjects];
    await saveGameData(updatedGames);
}

module.exports = findInstalledGames;

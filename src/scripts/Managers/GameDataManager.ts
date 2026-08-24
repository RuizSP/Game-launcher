const logger = require('../Managers/ErrorLogger');
const fs = require('fs');
const path = require('path');
import { IGame, IGameParams } from '../../types/index';

const DATA_FILE: string = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Documents', 'MeuGameLauncher', 'gameData.json');

async function getCurrentGameData(): Promise<IGame[]> {
    if(fs.existsSync(DATA_FILE)){
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(rawData);
    }
    return [];
}

async function saveGameData(games: IGame[]): Promise<void> {
    const jsonData: string = JSON.stringify(games, null, 2);
    fs.writeFileSync(DATA_FILE, jsonData, 'utf8');
}

function createGameObject(params: IGameParams): IGame {
    return {
        title: params.title,
        appid: params.appid,
        description: params.description,
        cover: params.cover,
        library: params.library,
        timePlayed: params.timePlayed,
        tags: params.tags,
        icon: params.icon,
        exe: params.exe,
        genres: params.genres,
        isInstalled: params.isInstalled
    };
}

module.exports = {
    getCurrentGameData,
    saveGameData,
    createGameObject
};

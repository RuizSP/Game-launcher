const fs = require('fs');
const path = require('path');
const logger = require('../Managers/ErrorLogger');
import { IGameFinderResult } from '../../types/index';

async function searchGames(directory: string, extension: string, desiredProperty: string): Promise<IGameFinderResult[]> {
    let gamesFinded: IGameFinderResult[] = [];

    try {
        const files: string[] = await fs.promises.readdir(directory);
        const itemFiles: string[] = files.filter((file: string) => path.extname(file) === extension);
        
        for (const file of itemFiles) {
            const filePath: string = path.join(directory, file);
            try {
                const data: string = await fs.promises.readFile(filePath, 'utf-8');
                const jsonObject: any = JSON.parse(data);
                if (jsonObject.hasOwnProperty(desiredProperty)) {
                    const gameInfo: IGameFinderResult = {
                        title: jsonObject[desiredProperty],
                        exe: path.join(jsonObject['InstallLocation'], jsonObject['LaunchExecutable'])
                    };
                    gamesFinded.push(gameInfo);
                }
            } catch(err: any) {
                logger.error(err.message);
                console.log(err);
            }
        }
    } catch(err: any) {
        logger.error(err.message);
        console.log(err);
    }
    return gamesFinded;
}

module.exports = searchGames;

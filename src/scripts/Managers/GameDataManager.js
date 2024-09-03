
const logger = require('../Managers/ErrorLogger');
const fs= require('fs');
const path = require('path');

const DATA_FILE =  path.join(process.env.HOME || process.env.USERPROFILE, 'Documents', 'MeuGameLauncher', 'gameData.json');

async function getCurrentGameData()
{
    if(fs.existsSync(DATA_FILE)){
        const rawData = fs.readFileSync(DATA_FILE);
        return JSON.parse(rawData);
    }

    return [];
}

async function saveGameData(games) 
{
    const jsonData = JSON.stringify(games, null,2);
    fs.writeFileSync(DATA_FILE, jsonData,'utf8');
}


function createGameObject({ title, appid, description, cover, library, timePlayed, tags, icon, exe }) {
    return {
        title,
        appid,
        description,
        cover,
        library,
        timePlayed,
        tags,
        icon,
        exe
    };
}

module.exports = {
    getCurrentGameData,
    saveGameData,
    createGameObject
};
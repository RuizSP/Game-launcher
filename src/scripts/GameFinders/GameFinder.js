
const fs = require('fs');
const path = require('path');
const logger = require('../Managers/ErrorLogger');

async function searchGames(directory, extension, desiredProperty)
{
   
    let gamesFinded = [];

    try{
        const files = await fs.promises.readdir(directory);
        const itemFiles = files.filter(file => path.extname(file) === extension);
        
        for(file of itemFiles){
                const filePath = path.join(directory, file);
                try{
                    const data = await fs.promises.readFile(filePath,'utf-8');
                    const jsonObject = JSON.parse(data);
                    if(jsonObject.hasOwnProperty(desiredProperty)){
                        const gameInfo = {
                            title: jsonObject[desiredProperty],
                            exe: path.join(jsonObject['InstallLocation'], jsonObject['LaunchExecutable'])
                        }
                        gamesFinded.push(gameInfo);
                    }

                }catch(err){
                    logger.error(err.message);
                    console.log(err);
                }
        }
        
   }catch(err){
        logger.error(err.message);
        console.log(err);
   }
   return gamesFinded;
}

module.exports =  searchGames;

const { execFile } = require('child_process');
const { getCurrentGameData, createGameObject, saveGameData } = require('../Managers/GameDataManager');
const { legendaryExePath } = require('../Managers/LegendaryAuthManager');
const logger = require('../Managers/ErrorLogger');
import type { IGame } from '../../types/index';

interface IEpicKeyImage {
    type: string;
    url: string;
    width?: number;
    height?: number;
}

interface ILegendaryGameEntry {
    app_name: string;
    app_title: string;
    title?: string;
    metadata?: {
        title?: string;
        description?: string;
        keyImages?: IEpicKeyImage[];
        categories?: Array<{ path: string }>;
        mainGameItem?: any;
    };
    is_dlc?: boolean;
    executable?: string;
    install_path?: string;
    [key: string]: unknown;
}

async function findLegendaryGames(): Promise<void> {
    try {
        const existingGames: IGame[] = await getCurrentGameData();

        // 1. Tenta obter jogos instalados e todos os jogos da conta
        const [installedRaw, allGamesRaw] = await Promise.all([
            runLegendaryCommand(['list-installed', '--json']).catch(() => '[]'),
            runLegendaryCommand(['list-games', '--json']).catch(() => '[]')
        ]);

        let installedGames: ILegendaryGameEntry[] = [];
        let allGames: ILegendaryGameEntry[] = [];

        try {
            installedGames = JSON.parse(installedRaw) || [];
        } catch (e) {
            installedGames = [];
        }

        try {
            allGames = JSON.parse(allGamesRaw) || [];
        } catch (e) {
            allGames = [];
        }

        // Combina as listas (priorizando installed se houver)
        const combinedMap = new Map<string, ILegendaryGameEntry>();

        allGames.forEach(game => {
            if (game.app_name) {
                // Filtra DLCs e addons puros
                const isAddon = game.metadata?.categories?.some(c => c.path === 'addons');
                if (!game.is_dlc && !isAddon) {
                    combinedMap.set(game.app_name, game);
                }
            }
        });

        installedGames.forEach(game => {
            if (game.app_name) {
                combinedMap.set(game.app_name, { ...combinedMap.get(game.app_name), ...game });
            }
        });

        const targetGames = Array.from(combinedMap.values());

        if (targetGames.length === 0) {
            logger.info('No Legendary games found.');
            return;
        }

        // Filtra jogos que já existem no JSON local
        const newGameObjects: IGame[] = [];

        for (const item of targetGames) {
            const appName = item.app_name;
            const title = item.app_title || item.metadata?.title || item.title || appName;

            const alreadyExists = existingGames.some(
                g => g.appid === appName || (g.title && g.title.toLowerCase() === title.toLowerCase())
            );

            if (!alreadyExists) {
                // Extrai a melhor capa dos keyImages da Epic
                let coverUrl = 'public/eos-icons--loading.svg';
                const images = item.metadata?.keyImages || [];
                
                const tallImage = images.find(img => img.type === 'DieselGameBoxTall' || img.type === 'OfferImageTall' || img.type === 'Thumbnail');
                const boxImage = images.find(img => img.type === 'DieselGameBox' || img.type === 'OfferImageWide');
                const anyImage = images[0];

                if (tallImage && tallImage.url) {
                    coverUrl = tallImage.url;
                } else if (boxImage && boxImage.url) {
                    coverUrl = boxImage.url;
                } else if (anyImage && anyImage.url) {
                    coverUrl = anyImage.url;
                }

                const description = item.metadata?.description || 'Jogo da Epic Games Store (Legendary)';

                newGameObjects.push(createGameObject({
                    title: title,
                    cover: coverUrl,
                    appid: appName,
                    library: 'legendary',
                    description: description,
                    exe: item.executable || appName
                }));
            }
        }

        if (newGameObjects.length > 0) {
            const updatedGames = [...existingGames, ...newGameObjects];
            await saveGameData(updatedGames);
            console.log(`Sucesso: ${newGameObjects.length} novos jogos importados da Epic/Legendary!`);
        } else {
            console.log('Todos os jogos da Epic/Legendary já estão importados.');
        }

    } catch (err: any) {
        logger.error("LegendaryGameFinder error: " + err);
        console.error('Error in findLegendaryGames:', err);
        throw err;
    }
}

function runLegendaryCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        execFile(legendaryExePath, args, { maxBuffer: 1024 * 1024 * 50 }, (error: Error | null, stdout: string, stderr: string) => {
            if (error) {
                return reject(stderr || error.message);
            }
            resolve(stdout);
        });
    });
}

module.exports = findLegendaryGames;

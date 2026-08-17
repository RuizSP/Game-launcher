import logger from '../Managers/ErrorLogger';

const clientId: string = 'seuClientId';
const clientSecret: string = 'seuClientSecret';
const authorization: string = 'suaAutorização';
const apiURL: string = 'https://api.igdb.com/v4/';

async function getAccessToken(): Promise<string> {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
        })
    });

    const data = await response.json();
    return data.access_token;
}

async function igdbRequisition(endpoint: string, field_param: string, where_param: string): Promise<any> {
    try {
        const response = await fetch(apiURL + endpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Client-ID': clientId,
                'Authorization': authorization,
                'Content-Type': 'text/plain'
            },
            body: `fields ${field_param}; where ${where_param};`
        });
        
        const data = await response.json(); // Retorna os dados do JSON
        return data; // Retorna os dados para quem chamar essa função
    } catch (err: any) {
        logger.error(err.message);
        console.error('Error:', err);
        throw err; // Lança o erro para ser tratado onde a função foi chamada
    }
}

export = igdbRequisition;

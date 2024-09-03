const logger = require("../Managers/ErrorLogger");

const clientId = 'seuClientId';
const clientSecret ='seuClientSecret';
const authorization ='suaAutorização';
const apiURL = 'https://api.igdb.com/v4/';


async function getAccessToken()
{
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers:{
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


async function igdbRequisition(endpoint, field_param, where_param) {
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
    } catch (err) {
        logger.error(err.message);
        console.error('Error:', err);
        throw err; // Lança o erro para ser tratado onde a função foi chamada
    }
}


module.exports = igdbRequisition;
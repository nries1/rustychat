const { initTwitchClientDev, initTwitchClientProd, startDb, initChatClient } = require('./utils');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000

async function main() {
    console.log(`rustybot starting in ${process.env.NODE_ENV} mode`)
    const twitchClient = await (process.env.NODE_ENV === `production` ? initTwitchClientProd() : initTwitchClientDev());
    initChatClient(twitchClient, ['RylaiCrestfallen', 'rustydota2'])
}

const startConnection = () => {
    startDb().then(() => {
        console.log('database started')
        main().then(() => {
            console.log('twitch client connection started')
        }).then(() => {
            app.listen(PORT, () => {
                console.log(`rustybot server is listening on port ${PORT}`)
            });
        }).catch(e => {
            console.log('connection error ', e)
        })
    }).catch(e => {
        console.log('ERROR STARTING DATABASE');
        console.log(e);
    })
}

startConnection();
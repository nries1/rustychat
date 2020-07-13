const { initTwitchClientDev, initTwitchClientProd, startDb, initChatClient, keepAlive } = require('./utils');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000


app.get('/', (req, res, next) => {
    return res.status(200).send(`I'm alive.`)
})

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
        }).then(() => {
            keepAlive()
        }).catch(e => {
            console.log('connection error ', e)
        })
    }).catch(e => {
        console.log('ERROR STARTING DATABASE');
        console.log(e);
    })
}

startConnection();
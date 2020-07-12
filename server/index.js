const { initTwitchClientDev, initTwitchClientProd startDb, initChatClient } = require('./utils');

async function main() {
    const twitchClient = process.env.NODE_ENV === `production` ? initTwitchClientProd() : initTwitchClientDev();
    initChatClient(twitchClient, ['RylaiCrestfallen', 'rustydota2'])
}

const startConnection = () => {
    startDb().then(() => {
        console.log('database started')
        main().then(() => {
            console.log('connection started')
        }).catch(e => {
            console.log('connection error ', e)
        })
    }).catch(e => {
        console.log('ERROR STARTING DATABASE');
        console.log(e);
    })
}

startConnection();
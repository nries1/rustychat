const { initTwitchClient, startDb, initChatClient } = require('./utils');
const dotenv = require('dotenv').config().parsed;

async function main() {
    const twitchClient = initTwitchClient(dotenv);
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
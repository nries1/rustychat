const { initTwitchClient, startDb, initChatClient } = require('./utils');
const { startTrivia } = require('./trivia')

async function main() {
    const twitchClient = initTwitchClient();
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
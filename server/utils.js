const dotenv = require('dotenv').config().parsed;
const TwitchClient = require('twitch');
const ChatClient = require('twitch-chat-client');
const { dota2 } = require('../emotes');
const fs = require('fs');
const { db, User } = require('./db');
const { TriviaGame } = require('./trivia');

const parseEnv = () => {
    const data = fs.readFileSync('.env', {encoding:'utf8', flag:'r'});
    return data.split('\n').reduce((out, variable) => {
        const keyArray = variable.replace('\r', '').split('=');
        out.push(keyArray);
        if (keyArray[1] === 'null' || keyArray[1] === 'true' || keyArray[1] === 'false') keyArray[1] = eval(keyArray[1]);
        return out;
    }, [])
}

const writeEnv = tokenObj => {
    const keys = Object.keys(tokenObj).map(key => [key, tokenObj[key]])
    const strings = keys.map(keyPair => keyPair.join('='))
    const string = strings.join('\n');
    fs.writeFileSync('.env', string);
}

const getgold = async (name) => {
    const gold = (await User.findOne({ where: { name } })).gold;
    return gold;
}

const tellGold = (client, channel, username) => {
    getgold(username).then(gold => {
        client.say(channel, `${username} has ${gold} gold`)
    }).catch(e => {
        console.log('ERROR GETING GOLD');
        console.log(e);
    })
}

const initTwitchClient = () => {
    const clientId = dotenv.CLIENT_ID;
    const accessToken = dotenv.ACCESS_TOKEN;
    const refreshToken = dotenv.REFRESH_TOKEN;
    const clientSecret = dotenv.CLIENT_SECRET;
    const dbPw = dotenv.PSQL_PW;
    const dbUn = dotenv.PSQL_USER;
    const expiryTimestamp = eval(dotenv.EXPIRY_TIMESTAMP);
    const twitchClient = TwitchClient.withCredentials(clientId, accessToken, undefined, {
        clientSecret,
        refreshToken,
        expiry: expiryTimestamp === null ? null : new Date(expiryTimestamp),
        onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
            const newTokenData = {
                CLIENT_ID: clientId,
                CLIENT_SECRET: clientSecret,
                ACCESS_TOKEN: accessToken,
                REFRESH_TOKEN: refreshToken,
                EXPIRY_TIMESTAMP: expiryDate === null ? null : expiryDate.getTime(),
                PSQL_PW: dbPw,
                PSQL_USER: dbUn
            };
            await writeEnv(newTokenData)  // fs.writeFile('./tokens.json', JSON.stringify(newTokenData, null, 4), 'UTF-8')
        }
    });
    return twitchClient
}

const initChatClient = async (twitchClient, channels) => {
    const chatClient = ChatClient.forTwitchClient(twitchClient, { channels, requestMembershipEvents: true });
    await chatClient.connect();
    let game;
    chatClient.onJoin((channel, user) => {
        chatClient.say(channel, `${user} joined the channel`);
    })
    chatClient.onPrivmsg((channel, user, message) => {
        console.log(`message received from ${user}`);
        if (message === '!suprusty') {
            chatClient.say(channel, `sup ${user} :)`);
        } else if (message === '!emote') {
            chatClient.say(channel, dota2[Math.floor(Math.random() * (dota2.length - 1))]);
        } else if (message === '!dice') {
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            chatClient.say(channel, `@${user} rolled a ${diceRoll}`);
        } else if (message === '!start-trivia') {
            game = new TriviaGame(chatClient, channel);
            game.start()
        } else if (message === '!stop-trivia') {
            if (game.stop) game.stop()
        } else if (['a','b','c','d','A','B','C','D'].indexOf(message) !== -1) {
            if (game.guess) game.guess(message, user)
        } else if (message === '!gold') {
            tellGold(chatClient, channel, user);
        }
    });
    chatClient.onSub((channel, user) => {
        chatClient.say(channel, `Thanks to @${user} for subscribing to the channel!`);
    });
    chatClient.onResub((channel, user, subInfo) => {
        chatClient.say(channel, `Thanks to @${user} for subscribing to the channel for a total of ${subInfo.months} months!`);
    });
    chatClient.onSubGift((channel, user, subInfo) => {
        chatClient.say(channel, `Thanks to ${subInfo.gifter} for gifting a subscription to ${user}!`);
    });
}

const startDb = async () => {
  await db.sync({ force: false })
}

module.exports = {
    parseEnv,
    writeEnv,
    initTwitchClient,
    initChatClient,
    startDb,
    tellGold
}
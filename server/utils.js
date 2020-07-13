const TwitchClient = require('twitch');
const ChatClient = require('twitch-chat-client');
const { dota2 } = require('../emotes');
const fs = require('fs');
const { db, User, Key } = require('./db');
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

const initTwitchClientDev = () => {
    const clientId = environment.CLIENT_ID;
    const accessToken = environment.ACCESS_TOKEN;
    const refreshToken = environment.REFRESH_TOKEN;
    const clientSecret = environment.CLIENT_SECRET;
    const dbPw = environment.PSQL_PW;
    const dbUn = environment.PSQL_USER;
    const expiryTimestamp = eval(environment.EXPIRY_TIMESTAMP);
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
            await writeEnv(newTokenData);
        }
    });
    return twitchClient
}

const initTwitchClientProd = async () => {
    const keys = (await Key.findAll())[0].dataValues;
    console.log('keys = ', keys);
    console.log('creating twitch client');
    const twitchClient = TwitchClient.withCredentials(keys.CLIENT_ID, keys.ACCESS_TOKEN, undefined, {
        clientSecret: keys.CLIENT_SECRET,
        refreshToken: keys.REFRESH_TOKEN,
        expiry: keys.EXPIRY_TIMESTAMP === null ? null : new Date(keys.EXPIRY_TIMESTAMP),
        onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
            try {
                await Key.update({
                        ACCESS_TOKEN: accessToken,
                        REFRESH_TOKEN: refreshToken,
                        EXPIRY_TIMESTAMP: expiryDate === null ? null : expiryDate.getTime(),
                    }, { where: { CLIENT_ID: keys.CLIENT_ID } })
            } catch(e) {
                console.log('ERROR UPDATING REFRESH TOKEN');
                console.log(e);
            } 
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
            if (game) game.stop()
        } else if (['a','b','c','d','A','B','C','D'].indexOf(message) !== -1) {
            if (game) game.guess(message, user)
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
  await db.sync({ force: false });
}

module.exports = {
    parseEnv,
    writeEnv,
    initTwitchClientDev,
    initTwitchClientProd,
    initChatClient,
    startDb,
    tellGold
}
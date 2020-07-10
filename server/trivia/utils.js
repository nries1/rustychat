const axios = require('axios');
const Entities = require('html-entities').XmlEntities;
const { User } = require('../db')

const getQuestion = async (amount) => {
    const url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
    const question = (await axios.get(url)).data;
    return question;
}

const postWinners = async (winners) => {
    await Promise.all(winners.map(async (_w) => {
        const user = await User.findOne({ where: { name: _w }})
        if (!user) return User.create({ name: _w, gold: 1})
        user.update({ gold: user.gold + 1 })
    }))
}

class TriviaGame {
    constructor(chatClient, channel) {
        this.client = chatClient;
        this.channel = channel
        this.questions = 0;
        this.usersGuessed = [];
        this.correctAnswer = null;
        this.collectingAnswers = false;
        this.roundWinners = [];
        this.roundChoices = {};
        this.on = false
    }
    start() {
        const { client, channel, askQuestion } = this;
        this.on = true;
        console.log(`Trivia game started on ${channel}`)
        client.say(channel, `Sup chat! I'm Trivia Bot :)`);
        client.say(channel, `Gimme a sec to load some questions...`)
        askQuestion.call(this);
    }
    stop() {
        const { client, channel } = this;
        this.on = false
        client.say(channel, 'Bye Bye \(^_^)\'')
        console.log(`Trivia game stopped on ${this.channel}`)
    }
    scrambleChoices(choices) {
        let out = [];
        while (choices.length) {
            const index = Math.floor(Math.random()*choices.length)
            out.push(Entities.decode(choices.splice(index,1)[0]))
        }
        return out;
    }
    choicesObject(choices) {
        return { 'a': choices[0], 'b': choices[1], 'c': choices[2], 'd': choices[3]}
    }
    resetRound() {
        this.usersGuessed = [];
        this.collectingAnswers = false;
        this.roundWinners = [];
        this.roundChoices = {};
    }
    askQuestion() {
        const { client, on, scrambleChoices, channel, choicesObject } = this;
        if (!on) return
        this.questions++;
        this.resetRound.call(this);
        console.log('round reset round winners = ', this.roundWinners);
        const game = this;
        getQuestion(this.questions).then(({results}) => {
            const { question, correct_answer, difficulty, category, incorrect_answers } = results[0]
            console.log('answer is ', correct_answer)
            game.correctAnswer = correct_answer
            const choices = scrambleChoices(incorrect_answers.concat(correct_answer))
            game.roundChoices = choicesObject(choices);
            const letters = ['a', 'b', 'c', 'd']
            client.say(channel, `Question ${this.questions}. ${Entities.decode(question)}`);
            for (let i = 0; i < choices.length; i++) {
              client.say(channel, `${letters[i]}) ${choices[i]}`)
            }
            game.collectingAnswers = true;
        }).catch(e => {
            console.log('ERROR fetching a question')
            console.log(e);
            client.say(channel, 'Looks like someone forgot to pay the cable bill...\r\nNo question for you :(')
        });
        setTimeout(() => this.distributePoints.call(this), 30000)
    }
    distributePoints() {
        const { roundWinners, client, channel, correctAnswer } = this;
        this.collectingAnswers = false;
        const game = this;
        postWinners(roundWinners).then(() => {
            client.say(channel, `The answer was ${correctAnswer}`);
            client.say(channel, `Type !gold to see your winnings`);
            game.askQuestion.call(game)
        }).catch(e => {
            console.log('ERROR POSTING ROUND WINNERS');
            console.log(e);
        })
    }
    guess(choice, user) {
        let { usersGuessed, collectingAnswers, roundChoices, correctAnswer, roundWinners } = this;
        if (usersGuessed.indexOf(user) !== -1 || !collectingAnswers) return;
        usersGuessed.push(user);
        if (roundChoices[choice.toLowerCase()] === correctAnswer) roundWinners.push(user);
    }
}

module.exports = {
    TriviaGame
}
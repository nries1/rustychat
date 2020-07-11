const Sequelize = require(`sequelize`);
const dotenv = require('dotenv').config().parsed;
const environoment = { ...process.env };
console.log(`Running on ${ process.env.PLATFORM || 'macOS'}`)
const platform = process.env.PLATFORM ? process.env.PLATFORM.trim() : null
const connectionString = platform === 'windows' ? `postgres://${dotenv.PSQL_USER}:${dotenv.PSQL_PW}@127.0.0.1:5432/twitchtrivia` : `postgres://localhost:5432/twitchtrivia`;
const dbUrl =
process.env.DATABASE_URL || connectionString;
const db = new Sequelize(dbUrl, {
  logging: false,
});

module.exports = { db, environoment };

const Sequelize = require('sequelize');
const db = require('../database.js');

const { UUID, UUIDV4, STRING, BIGINT } = Sequelize;

const Key = db.define('Key', {
    id: {
        primaryKey: true,
        type: UUID,
        defaultValue: UUIDV4,
      },
      CLIENT_ID: {
          type: STRING,
      },
      CLIENT_SECRET: {
          type: STRING,
      },
      ACCESS_TOKEN: {
        type: STRING,
      },
      EXPIRY_TIMESTAMP: {
          type: BIGINT,
      },
      REFRESH_TOKEN :{
          type: STRING
      },
      PSQL_PW: {
          type: STRING,
      },
      PSQL_USER: {
          type: STRING
      }
});

module.exports = Key
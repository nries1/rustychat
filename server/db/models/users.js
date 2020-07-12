const Sequelize = require('sequelize');
const db = require('../database.js');

const { UUID, UUIDV4, STRING, INTEGER } = Sequelize;

const User = db.define('User', {
    id: {
        primaryKey: true,
        type: UUID,
        defaultValue: UUIDV4,
      },
      gold: {
          type: INTEGER
      },
      name: {
          type: STRING
      }
});

module.exports = User
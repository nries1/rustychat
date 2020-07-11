const { db, environment } = require(`./database`);
const { User } = require(`./models/index`);

module.exports = {
    db,
    environment,
    User
}
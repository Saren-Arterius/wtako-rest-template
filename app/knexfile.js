const {CONFIG} = require('./src/config');

module.exports = {
  development: CONFIG.knex,
  staging: CONFIG.knex,
  production: CONFIG.knex
};

exports.CONFIG = {
  timezone: {
    postgres: 'Asia/Hong_Kong',
    tzoffset: 8 * 60 * 60 * 1000 // base.pug also
  },
  redis: {
    port: 6379, // Redis port
    host: 'redis', // Redis host
    family: 4, // 4 (IPv4) or 6 (IPv6)
    db: 0
  },
  knex: {
    client: 'pg',
    connection: {
      host: 'postgres',
      user: 'postgres',
      password: 'password',
      database: 'wtako_rest_template'
    }
  },
  firebase: {
    // REDACTED
  }
};

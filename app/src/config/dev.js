import {secretsDev} from './secrets-dev';

const secrets = secretsDev;
export const configDev = {
  clientConfig: {
    environment: 'dev'
  },
  upload: {
    fileSizeLimit: 100 * 1024 * 1024, // 100MB,
    avatarSizeLimit: 10 * 1024 * 1024 // 10MB,
  },
  timezone: {
    postgres: 'Asia/Hong_Kong',
    tzoffset: 8 * 60 * 60 * 1000
  },
  redis: {
    port: 6379, // Redis port
    host: secrets.redis_host, // Redis host
    password: secrets.redis_password,
    family: 4, // 4 (IPv4) or 6 (IPv6)
    db: 0
  },
  knex: {
    client: 'pg',
    connection: {
      host: secrets.pg_host,
      user: secrets.pg_user,
      password: secrets.pg_password,
      database: 'app_backend_dev'
    }
  },
  trustedHosts: {
    localhost: true,
    '127.0.0.1': true,
    'domain.tld': true,
    'dev.domain.tld': true,
    'docs.domain.tld': true,
    '192.168.1.223': true,
    '192.168.1.14': true
  },
  cfPurgeCache: {
    prependPath: null,
    defaultOptions: {
      method: 'POST',
      url: 'https://api.cloudflare.com/client/v4/zones/xxx/purge_cache',
      headers: secrets.cf_auth_headers
    }
  },
  selfBaseURL: 'https://api.domain.tld',
  jwtSecret: 'jwt_secret',
  firebase: {
    serviceAccountPath: './credentials/firebase.json',
    databaseURL: 'https://xxx.firebaseio.com/'
  }
};

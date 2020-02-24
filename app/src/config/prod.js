import {secretsProd} from './secrets-prod';

const secrets = secretsProd;
export const configProd = {
  clientConfig: {
    environment: 'prod'
  },
  upload: {
    fileSizeLimit: 10 * 1024 * 1024 // 10MB
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
      database: 'app_backend_prod'
    }
  },
  firebase: {
    serviceAccountPath: './credentials/xxx.json',
    databaseURL: 'https://xxx.firebaseio.com'
  },
  trustedHosts: {
    localhost: true
  },
  cfPurgeCache: {
    prependPath: null,
    defaultOptions: {
      method: 'POST',
      uri: 'https://api.cloudflare.com/client/v4/zones/xxx/purge_cache',
      headers: secrets.cf_auth_headers,
      json: true
    }
  }
};

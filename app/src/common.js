import Redis from 'ioredis';
import firebase from 'firebase-admin';
import {CONFIG} from './config';

const knexConfig = Object.assign({}, CONFIG.knex);
knexConfig.pool = {
  afterCreate (connection, callback) {
    connection.query(`SET TIME ZONE "${CONFIG.timezone.postgres}"`, (err) => {
      callback(err, connection);
    });
  }
};

export const knex = require('knex')(knexConfig);

export const redis = new Redis(CONFIG.redis);

/*
export const firebaseInstance = firebase.initializeApp({
  credential: firebase.credential.cert(CONFIG.firebase.credential),
  databaseURL: CONFIG.firebase.databaseURL
});
*/

// A list of redis keys
export const RK = {
  cmc_last_fetch: '[timestamp: long] | timestamp of CMC data saved in DB',
  altcoin_names_lc: 'string JSON({[altcoin_name: string]: boolean}) | a set of altcoin names fetched from CMC | Lower Case',
  exchange_names_lc: 'string JSON({[exchange_name: string]: boolean}) | a set of exchange names fetched from CMC | Lower Case',
  altcoin_names_pc: 'string JSON({[altcoin_name: string]: boolean}) | a set of altcoin names fetched from CMC | Preserve Case',
  exchange_names_pc: 'string JSON({[exchange_name: string]: boolean}) | a set of exchange names fetched from CMC | Preserve Case',
  origin_last_success: 'hash([origin: string]: [timestamp: long])'
};

Object.keys(RK).forEach((k) => {
  RK[k] = k;
});

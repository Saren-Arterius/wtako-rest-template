import Redis from 'ioredis';
import pg from 'pg';
import fbAdmin from 'firebase-admin';
import multer from 'multer';

import {configProd} from './config/prod';
import {configDev} from './config/dev';
import {secretsDev} from './config/secrets-dev';
import {secretsProd} from './config/secrets-prod';

// process.env.PROD = 1;
export const SECRETS = process.env.PROD ? secretsProd : secretsDev;
export const CONFIG = process.env.PROD ? configProd : configDev;

const knexConfig = Object.assign({}, CONFIG.knex);
knexConfig.pool = {
  afterCreate (connection, callback) {
    connection.query(`SET TIME ZONE "${CONFIG.timezone.postgres}"`, (err) => {
      callback(err, connection);
    });
  }
};

pg.types.setTypeParser(20, 'text', parseInt);

export const knex = require('knex')(knexConfig);

export const redis = new Redis(CONFIG.redis);

/*
fbAdmin.initializeApp({
  credential: fbAdmin.credential.cert(require(CONFIG.firebase.serviceAccountPath)),
  databaseURL: CONFIG.firebase.databaseURL
});
*/

export const firebase = fbAdmin;

const storage = multer.memoryStorage();
export const userPhotoUpload = multer({
  storage,
  limits: {
    fileSize: CONFIG.upload.fileSizeLimit
  }
});

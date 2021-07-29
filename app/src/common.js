import Redis from 'ioredis';
import pg from 'pg';
import multer from 'multer';
import createKnex from 'knex';
import fbAdmin from 'firebase-admin';

import {configDev} from './config/dev';
import {secretsDev} from './config/secrets-dev';
// process.env.PROD = 1;

export const SECRETS: typeof secretsDev = secretsDev;
export const CONFIG: typeof configDev = configDev;

const knexConfig = Object.assign({}, CONFIG.knex);
knexConfig.pool = {
  afterCreate (connection, callback) {
    connection.query(`SET TIME ZONE "${CONFIG.timezone.postgres}"`, (err) => {
      callback(err, connection);
    });
  }
};

pg.types.setTypeParser(20, 'text', parseInt);

export const knex = createKnex(knexConfig);

export const redis = new Redis(CONFIG.redis);

export const userFileUpload = multer({
  dest: '/data/upload',
  limits: {
    fileSize: CONFIG.upload.fileSizeLimit
  }
});

const storage = multer.memoryStorage();
export const userPhotoUploadRam = multer({
  storage,
  limits: {
    fileSize: CONFIG.upload.fileSizeLimit
  }
});

// fbAdmin.initializeApp({
//   credential: fbAdmin.credential.cert(require(CONFIG.firebase.serviceAccountPath)),
//   databaseURL: CONFIG.firebase.databaseURL
// });

export const firebase = fbAdmin;

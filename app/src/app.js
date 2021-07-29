import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import Boom from '@hapi/boom';
import url from 'url';
import jwt from 'jsonwebtoken';

import {updateDB, sleep} from './utils/misc';
import {CONFIG, knex, redis} from './common';

const app = express();

app.use(logger('dev'));
app.use(express.static('public'));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '100mb'}));
app.use(cookieParser());

app.use((req, res, next) => {
  const tmp = req.url.split('?');
  if (tmp[0].endsWith('.html')) {
    tmp[0] = tmp[0].substr(0, tmp[0].length - 5);
    req.url = tmp.join('?');
    res.header('Content-Type', 'text/html; charset=utf-8');
  }
  next();
});

// CORS
app.use((req, res, next) => {
  if (!req.headers.origin) {
    return next();
  }
  const {hostname} = url.parse(req.headers.origin);
  if (CONFIG.trustedHosts[hostname]) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') return res.send();
  return next();
});

// Anti-CSRF
app.use((req, res, next) => {
  if (req.method !== 'POST') return next();
  const check = req.headers.origin || req.headers.referer;
  if (!check) return next();
  const {hostname} = url.parse(check);
  if (!CONFIG.trustedHosts[hostname]) return next(Boom.badRequest(`Untrusted hostname ${hostname}`));
  return next();
});

app.use((req, res, next) => {
  if (req.query.http_auth) {
    req.headers.authorization = req.query.http_auth;
  }
  req.userIP = req.headers['cf-connecting-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress;
  req.deviceID = req.headers['x-gateway-id'] ||
    req.headers['X-GATEWAY-ID'];

  next();
});

// user system
app.use(async (req, res, next) => {
  const token = req.query.token || req.headers.authorization;
  if (!token || token.startsWith('Basic ')) {
    return next();
  }
  const decoded = jwt.verify(token, CONFIG.jwtSecret);
  const [profile] = await knex('profile')
    .select()
    .where('profile.address', decoded.address)
    .leftJoin('profile_instagram', 'profile.address', 'profile_instagram.ig_address').limit(1);
  if (profile) {
    req.user = profile;
  } else {
    req.user = decoded;
  }
  return next();
  /*
  if (!process.env.PROD && req.query.user_id) {
    const [user]: [User] = await knex('user').select().where('id', req.query.user_id);
    req.user = user;
    return next();
  }
  const token = req.query.token || req.headers.authorization;
  if (token === SECRETS.panel_auth) {
    let [admin]: [User] = await knex('user').select().where('id', 'admin');
    if (!admin) {
      [admin] = await knex('user').insert({
        id: 'admin',
        name: 'Admin'
      }).returning('*');
    }
    req.user = admin;
    return next();
  }
  if (!token || token.startsWith('Basic ')) {
    return next();
  }
  let auth: FirebaseAuth;
  try {
    auth = await firebase.auth().verifyIdToken(token);
    // console.log(auth);
  } catch (e) {
    console.error(e);
    return next(Boom.unauthorized('verifyIdToken failed. Token expired?'));
  }
  let [user]: [User] = await knex('user').select().where('id', auth.uid);
  if (!user) {
    // Get account create time
    let createTime;
    try {
      const fbUser = await firebase.auth().getUser(auth.uid);
      createTime = moment(fbUser.metadata.creationTime).valueOf();
    } catch (e) {
      console.error(e);
    }
    try {
      let name = auth.name;
      if (!name && auth.email) {
        name = auth.email.split('@')[0];
      }
      if (!name) {
        name = 'Please Change Name';
      }
      name = name.substr(0, 30);
      [user] = await knex('user').insert({
        id: auth.uid,
        name,
        photo_url: auth.picture || getRandomInt(0, 49),
        created_at: createTime
      }).returning('*');
    } catch (e) {
      // WTF?
      console.error(e);
      return next(Boom.internal('WTF? UID not found in DB but not unique?'));
    }
  }
  req.user = user;
  return next();
  */
});

app.use('/', require('./routes/index'));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.output) {
    return res.status(err.output.statusCode)
      .json(err.output.payload);
  }
  throw err;
});

process.on('unhandledRejection', (reason, p) => {
  console.error(reason, 'Unhandled Rejection at Promise', p);
}).on('uncaughtException', (err) => {
  console.error(err, 'Uncaught Exception thrown');
  // process.exit(1);
});

app.main = (async () => {
  if (app.worker.id !== 1) return;
  while (updateDB) {
    try {
      await updateDB();
      break;
    } catch (e) {
      console.error(e);
      await sleep(1000);
    }
  }
  console.log('[Main] worker ID:', app.worker.id);

  const value = Date.now();
  const key = 'lastStart';
  await knex('config').insert({
    key,
    value
  })
    .onConflict('key')
    .merge();
  const [pgCheck] = await knex('config').select().where('key', key);
  console.log({pgCheck});

  await redis.set(key, value);
  const redisCheck = await redis.get(key);
  console.log({redisCheck});
});

module.exports = app;

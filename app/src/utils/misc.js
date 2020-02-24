import rp from 'request-promise';
import cjkCount from 'cjk-count';
import Boom from '@hapi/boom';
import objectAssignDeep from 'object-assign-deep';

import {knex, CONFIG, redis} from '../common';
import {AuthedRequest} from '../types/auth';

export const sleep = ms => new Promise(rs => setTimeout(rs, ms));

export const updateDB = async () => {
  const cloned = JSON.parse(JSON.stringify(CONFIG.knex));
  cloned.connection.database = null;
  const createKnex = require('knex')(cloned);
  const rows = await createKnex('pg_catalog.pg_database').select().where('datname', CONFIG.knex.connection.database);
  if (!rows.length) {
    console.log('[DB] Creating database');
    await createKnex.raw(`CREATE DATABASE ${CONFIG.knex.connection.database}`);
  }
  console.log('[DB] knex migrate:latest');
  await knex.migrate.latest({directory: '../migrations'});
  console.log('[DB] Done');
};

export const revoluteDB = async () => {
  const cloned = JSON.parse(JSON.stringify(CONFIG.knex));
  cloned.connection.database = null;
  const createKnex = require('knex')(cloned);
  await createKnex('pg_stat_activity')
    .select(knex.raw('pg_terminate_backend(pid)'))
    .where('datname', CONFIG.knex.connection.database);
  await createKnex.raw(`DROP DATABASE IF EXISTS ${CONFIG.knex.connection.database}`);
  await updateDB();
};

export const tryPurgeCFCache = async (files: [String]) => {
  const body = files ?
    {files: files.map(f => `${CONFIG.cfPurgeCache.prependPath}${f}`)} :
    {purge_everything: true};
  try {
    console.log('tryPurgeCFCache', body);
    const res = await rp(Object.assign({}, CONFIG.cfPurgeCache.defaultOptions, {body}));
    console.log(res);
    return true;
  } catch (e) {
    console.error(e);
  }
  return false;
};

export const sqlJSONTables = tables => tables.map(t => knex.raw(`to_json("${t}".*) as "${t}"`));


export const paging = (req, res, next) => {
  let page = parseInt(req.params.page, 10) || 0;
  if (page < 0) page = 0;
  req.page = page;
  return next();
};

export const hasVotedUpOrDown = async (table, id, countKey, votesField = 'vote_score') => {
  for (const key of [`${table}:${id}:${votesField}:up`, `${table}:${id}:${votesField}:down`]) {
    const exist = await redis.exists(key);
    if (!exist) continue;

    // copy pf key
    const checkKey = `${key}:${countKey}`;
    const check = await redis.getBuffer(key);
    await redis.setBuffer(checkKey, check);

    // whether the tmp pfcount is updated
    const added = await redis.pfadd(checkKey, countKey);
    await redis.del(checkKey);

    // not updated = already added
    if (!parseInt(added, 10)) {
      return true;
    }
  }
  return false;
};

export const vote = async (table, id, type, countKey, votesField = 'vote_score') => {
  const [row] = await knex(table).select().where('id', id);
  if (!row) return null;

  let newScore = row[votesField];
  const alreadyVoted = await hasVotedUpOrDown(table, id, countKey, votesField);
  if (alreadyVoted) return {[votesField]: newScore};

  const upKey = `${table}:${id}:${votesField}:up`;
  const downKey = `${table}:${id}:${votesField}:down`;
  const voteKey = type === 'up' ? upKey : downKey;
  const updated = await redis.pfadd(voteKey, countKey);
  if (parseInt(updated, 10)) {
    newScore = parseInt((await redis.pfcount(upKey)), 10) - parseInt((await redis.pfcount(downKey)), 10);
    await knex(table)
      .update({
        [votesField]: newScore
      })
      .where('id', id);
  }
  return {[votesField]: newScore};
};

export const updateVotes = async (table, id, type, votesField = 'vote_score', ctx = knex) => {
  const [row] = await ctx(table).select().where('id', id);
  if (!row) return null;

  let newScore = row[votesField];

  const upKey = `${table}:${id}:${votesField}:up`;
  const downKey = `${table}:${id}:${votesField}:down`;
  newScore = parseInt((await redis.pfcount(upKey)), 10) - parseInt((await redis.pfcount(downKey)), 10);
  await ctx(table)
    .update({
      [votesField]: newScore
    })
    .where('id', id);

  return {[votesField]: newScore};
};

export const requireLogin = (req: AuthedRequest, res, next) => {
  if (!req.user) {
    return next(Boom.unauthorized('Not logged in'));
  }
  return next();
};

export const rejectBanned = (req: AuthedRequest, res, next) => {
  if (req.user.ban_reason) {
    return next(Boom.unauthorized('Banned'));
  }
  return next();
};

export const getNameLength = (name) => {
  const result = cjkCount(name);
  const cjkLength = !result ? 0 : result.length;
  return (cjkLength * 2) + (name.length - cjkLength);
};

export const nameAllowed = name => getNameLength(name) >= 2 && getNameLength(name) <= 30;

export const limiter = (key, ttl = 60) => {
  const k = `limit:${key}`;
  return {
    check: async () => {
      if (!process.env.PROD) return true;
      const e = await redis.exists(k);
      return !e;
    },
    pass: async () => {
      await redis.setex(k, ttl, 1);
    }
  };
};

export const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * ((max - min) + 1)) + min;
};

export const generateID = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const findUniqueID = async (table, idField = 'id') => {
  for (let l = 4; l < 10; l++) {
    const id = generateID(l);
    const [row] = await knex(table).select().where(idField, id);
    if (row) continue;
    return id;
  }
  throw new Error('Impossible lol wtf!');
};

type ClientConfig = typeof CONFIG.clientConfig;
export const getClientConfig = async (): Promise<ClientConfig> => {
  const conf = await redis.get('override:client-config');
  if (!conf) return Object.assign({}, CONFIG.clientConfig);
  const confObj = JSON.parse(conf);
  const cc = objectAssignDeep({}, CONFIG.clientConfig, confObj);
  return cc;
};

/*
export const requireAdminAuth = async (req: AuthedRequest, res, next) => {
  const cc = await getClientConfig();
  if (req.user && cc.admin[req.user.id]) return next();
  if (req.headers.authorization === SECRETS.panel_auth) return next();
  return next(Boom.forbidden());
};
*/

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

export const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    (Math.sin(dLat / 2) * Math.sin(dLat / 2)) +
    (Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2));
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

export const retainFields = (object, fields) => {
  const fieldSet = new Set(fields);
  Object.keys(object).forEach((f) => {
    if (!fieldSet.has(f)) delete object[f];
  });
};

/*
export const announceToAll = async (announcement) => {
  await knex.transaction(async (trx) => {
    [announcement] = await trx('announcement').insert(announcement).returning('*');
    if (process.env.PROD) {
      await firebase.messaging()
        .sendToTopic('all', {
          data: {
            url: announcement.url || '',
            place_id: announcement.place_id || '',
            franchise_id: announcement.franchise_id || '',
            type: 'announcement'
          },
          notification: {
            title: announcement.title,
            body: announcement.body
          }
        }, {
          priority: 'high'
        });
      await tryPurgeCFCache(['/announcements.html?go_gup=1', '/announcements.html']);
    }
  });
  return announcement;
};
*/

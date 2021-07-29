import axios from 'axios';
import cjkCount from 'cjk-count';
import Boom from '@hapi/boom';
import objectAssignDeep from 'object-assign-deep';
import crypto from 'crypto';
import FormData from 'form-data';
import fs from 'fs/promises';

import {knex, CONFIG, redis, firebase} from '../common';
import {AuthedRequest} from '../types/auth';
import {Notification} from '../types/tables';

export const getChatID = (senderID, recipientID) => {
  return [senderID, recipientID].sort().join('-');
};

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
    const config = Object.assign({}, CONFIG.cfPurgeCache.defaultOptions, {body});
    const res = await axios.post(config);
    console.log(res);
    return true;
  } catch (e) {
    console.error(e);
  }
  return false;
};

export const sqlJSONTables = tables => tables.map(t => knex.raw(`to_json("${t}".*) as "${t}"`));

export const randomBytes = (size = 32) => new Promise((rs, rj) => {
  crypto.randomBytes(size, (err, buf) => {
    if (err) return rj(err);
    return rs(buf.toString('hex'));
  });
});

export const paging = (req, res, next) => {
  let page = parseInt(req.params.page, 10) || 0;
  if (page < 0) page = 0;
  req.page = page;
  return next();
};

export const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1.
  res.setHeader('Pragma', 'no-cache'); // HTTP 1.0.
  res.setHeader('Expires', '0'); // Proxies.
  next();
};

export const requireLogin = (req: AuthedRequest, res, next) => {
  if (!req.user) {
    return next(Boom.unauthorized('Not logged in'));
  }
  return next();
};

export const rejectLogin = (req: AuthedRequest, res, next) => {
  if (req.user) {
    return next(Boom.badRequest('Already logged in'));
  }
  return next();
};

export const rejectBanned = (req: AuthedRequest, res, next) => {
  if (req.user.details.ban_reason) {
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

type ClientConfig = typeof CONFIG.clientConfig;
export const getClientConfig = async (): Promise<ClientConfig> => {
  const conf = await redis.get('override:client-config');
  if (!conf) return Object.assign({}, CONFIG.clientConfig);
  const confObj = JSON.parse(conf);
  const cc = objectAssignDeep({}, CONFIG.clientConfig, confObj);
  return cc;
};

export const retainFields = (object, fields) => {
  const fieldSet = new Set(fields);
  Object.keys(object).forEach((f) => {
    if (!fieldSet.has(f)) delete object[f];
  });
  return object;
};

export const tryRemoveFiles = async (files) => {
  for (const f of files) {
    try {
      await fs.rm(f, {recursive: true});
    } catch (error) {
      console.error(error);
    }
  }
};


export const clamp = (num, min, max) => {
  // eslint-disable-next-line no-nested-ternary
  return num <= min ? min : num >= max ? max : num;
};

export const axiosMultipart = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => formData.append(k, v));
  const config = {
    headers: Object.assign(
      {},
      formData.getHeaders(),
      {
        'Content-Length': formData.getLengthSync()
      }
    )
  };
  return {formData, config};
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

export function numberInGroups (n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || 0;
}

/*
export const getDisplayPriceString = (price, commas = false) => {
  if (!price) return '0';
  const n = ethers.FixedNumber.fromValue(price, 18, 'fixed').toString();
  if (!commas) return n;
  const [dec, point] = n.split('.');
  if (point === '0') return numberInGroups(dec);
  return [numberInGroups(dec), point.substr(0, 5)].join('.');
};
*/

export const notifyWithFirebase = async (trx, data, type = 'article') => {
  const [n]: [Notification] = await trx('notification').insert(data).returning('*');
  const ref = `recipient/${n.recipient}/notification-${type}`;
  return {
    ref,
    data: {[n.recipient]: n.created_at}
  };
};

export const massUpdateFirebase = async (updates) => {
  const updateMap = {};
  for (const update of updates) {
    if (updateMap[update.ref]) continue;
    updateMap[update.ref] = true;
    console.log(update);
    await firebase.database()
      .ref(update.ref)
      .update(update.data);
  }
};


export const formatDate = (ms, cut = '-') => {
  const date = new Date(ms);
  const YY = date.getFullYear() + cut;
  const MM =
    (date.getMonth() + 1 < 10
      ? `0${date.getMonth() + 1}`
      : date.getMonth() + 1) + cut;
  const DD = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  const hh = `${date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()}:`;
  const mm = `${date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()}:`;
  const ss = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
  return `${YY + MM + DD} ${hh}${mm}${ss}`;
};

export const ordinalSuffix = (i) => {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) {
    return `${i}st`;
  }
  if (j === 2 && k !== 12) {
    return `${i}nd`;
  }
  if (j === 3 && k !== 13) {
    return `${i}rd`;
  }
  return `${i}th`;
};

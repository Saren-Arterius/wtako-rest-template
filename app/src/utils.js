import {exec} from 'mz/child_process';
import {CONFIG} from './config';
import {knex} from './common';

export const sleep = ms => new Promise(rs => setTimeout(rs, ms));

export const updateDB = async () => {
  const cloned = JSON.parse(JSON.stringify(CONFIG.knex));
  cloned.connection.database = null;
  const createKnex = require('knex')(cloned);
  const rows = await createKnex('pg_catalog.pg_database').select().where('datname', CONFIG.knex.connection.database);
  if (!rows.length) {
    console.log('[DB] Creating database');
    await createKnex.raw(`CREATE DATABASE ${CONFIG.knex.connection.database}`);
    console.log('[DB] Creating extension');
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  }
  console.log('[DB] knex migrate:latest');
  await exec('npx knex migrate:latest --knexfile ../knexfile.js');
};

export const normalizeURL = (base: string, url: string) => {
  // https://www.example.com/path
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // //www.example.com/path
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  // /path
  if (url.startsWith('/')) {
    return `${base}${url.substr(1)}`;
  }
  // www.example.com/path
  if (url.split('/')[0].includes('.')) {
    return `http://${url}`;
  }
  // path
  return `${base}${url}`;
};

export const trimChar = (string, charsToRemove) => {
  const set = {};
  charsToRemove.split('').forEach((c) => { set[c] = true; });
  while (set[string.charAt(0)]) {
    string = string.substring(1);
  }
  while (set[string.charAt(string.length - 1)]) {
    string = string.substring(0, string.length - 1);
  }
  return string;
};

export const counter = (words: [string]) => {
  const freqs = {};
  words.forEach((w) => {
    freqs[w] = (freqs[w] || 0) + 1;
  });
  return freqs;
};

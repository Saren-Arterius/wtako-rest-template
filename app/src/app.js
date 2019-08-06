import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';

import Queue from 'bull';
import {updateDB, sleep} from './utils/misc';
import {CONFIG} from './common';

const queue = new Queue('worker', {redis: CONFIG.redis});

queue.process(async (job) => {
  console.log('[Worker] Working with job data', job.data);
  await sleep(1000);
  console.log('[Worker] Done');
});

const doSomething = async () => {
  console.log('[Main] Doing something');
  await sleep(1000);
  for (let i = 0; i < 3; i++) {
    queue.add({rand: Math.random()});
  }
  console.log('[Main] Done');
};

const main = async () => {
  while (main) {
    try {
      await doSomething();
    } catch (e) {
      console.error(e);
    }
    await sleep(60000);
  }
};

(async () => {
  while (main) {
    try {
      await updateDB();
      break;
    } catch (e) {
      console.error(e);
    }
  }
  await main();
})();

const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use('/', require('./routes/index'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send();
});

process.on('unhandledRejection', (e) => {
  console.error(e);
  process.exit(1);
});

process.on('unhandledException', (e) => {
  console.error(e);
  process.exit(1);
});

module.exports = app;

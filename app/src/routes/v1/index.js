import express from 'express';
import fs from 'fs';

const router = express.Router();

fs.readdirSync(__dirname)
  .filter(n => n !== 'index.js')
  .filter(n => !n.includes(' copy'))
  .map(n => n.split('.js')[0])
  .forEach((n) => {
    // console.log(n);
    router.use(`/${n}`, require(`./${n}`));
  });

module.exports = router;


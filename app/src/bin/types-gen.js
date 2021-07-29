import {updateTypes} from 'knex-types';
import {knex} from '../common';

updateTypes(knex, {output: '/src/app/src/types/tables.js'}).then(() => {
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});

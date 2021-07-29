import express from 'express';
import Boom from '@hapi/boom';
import Joi from 'joi';

import {AuthedRequest, IPRequest} from '../types/auth';
import {knex} from '../common';
import {requireLogin, retainFields, noCache} from '../utils/misc';
import {Profile} from '../types/tables';

const router = express.Router();

router.use('/v1', require('./v1'));

const schema = Joi.object({
  name: Joi.string().min(2).max(50),
  username: Joi.string().regex(/^[_.0-9a-zA-Z]{3,30}$/),
  description: Joi.string().max(2000)
});

router.get('/', (req: IPRequest, res) => {
  res.send(`Hello world! ${req.ip}`);
});

router.post('/profile', requireLogin, async (req: AuthedRequest, res, next) => {
  const {err, value} = schema.validate(req.body);
  if (err) return next(Boom.badRequest(err));
  // cannot be changed once set
  if (req.user.username) {
    delete value.username;
  }
  const updated = retainFields(value, ['name', 'username', 'description']) || {};
  if (Object.keys(updated).length === 0) return next(Boom.badRequest('nothing to be updated'));

  let profile: Profile;
  try {
    await knex.transaction(async (trx) => {
      if (updated.username) {
        const [usernameExist] = await knex('profile')
          .select()
          .where(knex.raw('UPPER(username)'), updated.username.toUpperCase())
          .andWhereNot('id', req.user.id);
        if (usernameExist) {
          throw new Error('username already exists');
        }
      }

      [profile] = await trx('profile')
        .update(updated)
        .where('id', req.user.id)
        .returning('*');
    });
  } catch (error) {
    console.log(error);
    return next(Boom.badRequest(error.message));
  }

  return res.send(profile);
});

router.get('/profile', noCache, async (req: AuthedRequest, res, next) => {
  res.send(req.user);
});

module.exports = router;

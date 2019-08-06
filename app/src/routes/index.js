import express from 'express';
import {IPRequest} from '../types/auth';

const router = express.Router();

router.get('/', (req: IPRequest, res) => {
  res.send(`Hello world! ${req.ip}`);
});

module.exports = router;

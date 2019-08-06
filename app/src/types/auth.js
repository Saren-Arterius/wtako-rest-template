import {Request} from 'express';

export interface IPRequest extends Request {
  userIP: String,
}

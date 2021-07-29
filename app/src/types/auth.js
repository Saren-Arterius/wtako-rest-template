import {Request} from 'express';

export interface IPRequest extends Request {
  userIP: String,
}

export interface User {
  address: String,
  username?: String,
  name?: String,
  description?: String,
  details?: Object,
}

export interface AuthedRequest extends IPRequest {
  user: User
}

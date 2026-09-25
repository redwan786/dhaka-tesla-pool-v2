import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { verifyAccessToken } from '../lib/auth.js';

export function authenticate(request: Request, _response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw AppError.unauthorized();
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) throw AppError.unauthorized();

  request.user = verifyAccessToken(token);
  next();
}

import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ['password', 'passwordHash', 'req.headers.authorization', 'DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET'],
    censor: '[REDACTED]',
  },
});

export const requestLogger = pinoHttp({
  logger,
  genReqId(request, response) {
    const incomingId = request.headers['x-request-id'];
    const requestId = typeof incomingId === 'string' ? incomingId : randomUUID();
    response.setHeader('x-request-id', requestId);
    return requestId;
  },
  customSuccessMessage(request, response) {
    return `${request.method} ${request.url} completed with ${response.statusCode}`;
  },
  customErrorMessage(request, response) {
    return `${request.method} ${request.url} failed with ${response.statusCode}`;
  },
});

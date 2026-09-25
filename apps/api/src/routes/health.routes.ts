import { Router } from 'express';
import { sendSuccess } from '../lib/api-response.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  sendSuccess(
    response,
    {
      status: 'ok',
      service: 'dhaka-tesla-pool-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    },
    { message: 'Service is healthy' },
  );
});

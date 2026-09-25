import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './lib/logger.js';
import { apiRouter } from './routes/index.js';
import { healthRouter } from './routes/health.routes.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.WEB_ORIGIN.split(',').map((origin) => origin.trim()),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(requestLogger);

// Canonical versioned API route.
app.use('/api', apiRouter);

// Kept as a simple infrastructure health-check alias.
app.use('/health', healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);

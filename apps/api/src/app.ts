import express from 'express';
import cors from 'cors';

export const app = express();

app.use(cors({ origin: process.env.WEB_ORIGIN?.split(',') || '*' }));
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'dhaka-tesla-pool-api',
    version: '0.1.0',
  });
});

app.use((_request, response) => {
  response.status(404).json({ message: 'Route not found' });
});

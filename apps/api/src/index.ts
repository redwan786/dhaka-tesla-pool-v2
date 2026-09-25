import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { app } from './app.js';

const port = env.PORT ?? env.API_PORT;

app.listen(port, () => {
  logger.info({ port, environment: env.NODE_ENV }, 'Dhaka Tesla Pool API started');
});

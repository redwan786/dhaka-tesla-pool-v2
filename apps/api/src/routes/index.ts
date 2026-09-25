import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { geographyRouter } from '../modules/geography/geography.routes.js';
import { passengerRouter } from '../modules/passenger/passenger.routes.js';
import { poolRouter } from '../modules/pool/pool.routes.js';
import { healthRouter } from './health.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/zones', geographyRouter);
apiRouter.use('/passenger', passengerRouter);
apiRouter.use('/driver', poolRouter);

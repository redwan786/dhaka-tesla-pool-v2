import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validate } from '../../middleware/validate.js';
import { acceptRideController } from './pool.controller.js';
import { acceptRideParamsSchema } from './pool.schemas.js';

export const poolRouter = Router();

poolRouter.use(authenticate, authorizeRoles(UserRole.DRIVER));
poolRouter.post(
  '/rides/:rideId/accept',
  validate({ params: acceptRideParamsSchema }),
  asyncHandler(acceptRideController),
);

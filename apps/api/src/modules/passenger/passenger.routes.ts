import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validate } from '../../middleware/validate.js';
import {
  cancelRideController,
  createRideController,
  getRideController,
  listRidesController,
} from './passenger.controller.js';
import { createRideSchema, rideParamsSchema } from './passenger.schemas.js';

export const passengerRouter = Router();

passengerRouter.use(authenticate, authorizeRoles(UserRole.PASSENGER));
passengerRouter.post('/rides', validate({ body: createRideSchema }), asyncHandler(createRideController));
passengerRouter.get('/rides', asyncHandler(listRidesController));
passengerRouter.get(
  '/rides/:rideId',
  validate({ params: rideParamsSchema }),
  asyncHandler(getRideController),
);
passengerRouter.post(
  '/rides/:rideId/cancel',
  validate({ params: rideParamsSchema }),
  asyncHandler(cancelRideController),
);

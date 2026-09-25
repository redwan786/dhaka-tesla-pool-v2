import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRoles } from '../../middleware/authorize.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validate } from '../../middleware/validate.js';
import {
  arrivePoolController,
  completePoolController,
  getPoolController,
  getVehicleController,
  listPoolsController,
  listRequestsController,
  startPoolController,
  updateOnlineStatusController,
} from './driver.controller.js';
import { onlineStatusSchema, poolParamsSchema } from './driver.schemas.js';

export const driverRouter = Router();

driverRouter.use(authenticate, authorizeRoles(UserRole.DRIVER));
driverRouter.get('/vehicle', asyncHandler(getVehicleController));
driverRouter.patch(
  '/online-status',
  validate({ body: onlineStatusSchema }),
  asyncHandler(updateOnlineStatusController),
);
driverRouter.get('/requests', asyncHandler(listRequestsController));
driverRouter.get('/pools', asyncHandler(listPoolsController));
driverRouter.get(
  '/pools/:poolId',
  validate({ params: poolParamsSchema }),
  asyncHandler(getPoolController),
);
driverRouter.post(
  '/pools/:poolId/arrive',
  validate({ params: poolParamsSchema }),
  asyncHandler(arrivePoolController),
);
driverRouter.post(
  '/pools/:poolId/start',
  validate({ params: poolParamsSchema }),
  asyncHandler(startPoolController),
);
driverRouter.post(
  '/pools/:poolId/complete',
  validate({ params: poolParamsSchema }),
  asyncHandler(completePoolController),
);

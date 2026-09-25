import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validate } from '../../middleware/validate.js';
import { estimateFareController, listZonesController } from './geography.controller.js';
import { fareEstimateSchema } from './geography.schemas.js';

export const geographyRouter = Router();

geographyRouter.get('/', asyncHandler(listZonesController));
geographyRouter.post(
  '/estimate',
  validate({ body: fareEstimateSchema }),
  asyncHandler(estimateFareController),
);

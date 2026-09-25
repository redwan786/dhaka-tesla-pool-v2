import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/api-response.js';
import type { FareEstimateInput } from './geography.schemas.js';
import { estimateFare, listZones } from './geography.service.js';

export async function listZonesController(_request: Request, response: Response) {
  const zones = await listZones();
  sendSuccess(response, zones, { message: 'Dhaka zones loaded' });
}

export async function estimateFareController(request: Request, response: Response) {
  const estimate = await estimateFare(request.body as FareEstimateInput);
  sendSuccess(response, estimate, { message: 'Pooled fare estimated' });
}

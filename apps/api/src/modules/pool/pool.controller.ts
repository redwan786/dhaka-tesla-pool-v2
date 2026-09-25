import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/api-response.js';
import type { AcceptRideParams } from './pool.schemas.js';
import { acceptRideIntoPool } from './pool.service.js';

export async function acceptRideController(request: Request, response: Response) {
  const { rideId } = request.params as AcceptRideParams;
  const result = await acceptRideIntoPool(rideId, request.user!);
  sendSuccess(response, result, {
    statusCode: result.createdPool ? 201 : 200,
    message: result.createdPool ? 'Ride accepted and pool created' : 'Ride added to existing pool',
  });
}

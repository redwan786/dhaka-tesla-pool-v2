import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/api-response.js';
import type { CreateRideInput, RideParams } from './passenger.schemas.js';
import {
  cancelPassengerRide,
  createPassengerRide,
  getPassengerRide,
  listPassengerRides,
} from './passenger.service.js';

export async function createRideController(request: Request, response: Response) {
  const ride = await createPassengerRide(request.body as CreateRideInput, request.user!);
  sendSuccess(response, ride, { statusCode: 201, message: 'Ride requested' });
}

export async function listRidesController(request: Request, response: Response) {
  const rides = await listPassengerRides(request.user!);
  sendSuccess(response, rides, { message: 'Passenger ride history loaded' });
}

export async function getRideController(request: Request, response: Response) {
  const { rideId } = request.params as RideParams;
  const ride = await getPassengerRide(rideId, request.user!);
  sendSuccess(response, ride, { message: 'Passenger ride loaded' });
}

export async function cancelRideController(request: Request, response: Response) {
  const { rideId } = request.params as RideParams;
  const ride = await cancelPassengerRide(rideId, request.user!);
  sendSuccess(response, ride, { message: 'Ride cancelled' });
}

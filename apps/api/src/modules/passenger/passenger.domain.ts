import { RideStatus } from '@prisma/client';
import { AppError } from '../../errors/app-error.js';
import { calculatePooledFare } from '../geography/fare.domain.js';

export const ACTIVE_RIDE_STATUSES: readonly RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.MATCHED,
  RideStatus.DRIVER_ARRIVED,
  RideStatus.STARTED,
];

export const CANCELLABLE_RIDE_STATUSES: readonly RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.MATCHED,
];

export function calculateRideRequestFare(distanceKm: number, requestedSeats: number) {
  if (!Number.isInteger(requestedSeats) || requestedSeats < 1 || requestedSeats > 3) {
    throw AppError.badRequest('INVALID_SEAT_COUNT', 'Requested seats must be between 1 and 3');
  }

  const perSeat = calculatePooledFare(distanceKm);
  return {
    requestedSeats,
    perSeat,
    totalFarePaisa: perSeat.passengerFarePaisa * requestedSeats,
  };
}

export function assertPassengerCanCancel(status: RideStatus) {
  if (!CANCELLABLE_RIDE_STATUSES.includes(status)) {
    throw AppError.conflict(
      'RIDE_CANCELLATION_NOT_ALLOWED',
      `A ride in ${status} status cannot be cancelled`,
    );
  }
}

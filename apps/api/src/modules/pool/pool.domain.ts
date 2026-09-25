import { RideStatus } from '@prisma/client';
import { AppError } from '../../errors/app-error.js';
import { requestsAreGeographicallyCompatible, type Coordinate } from '../geography/geography.domain.js';

export type PoolCapacity = {
  occupiedSeats: number;
  requestedSeats: number;
  capacity: number;
};

export type PoolRoute = {
  pickupZoneId: string;
  destination: Coordinate;
};

export type MembershipSnapshotInput = {
  poolId: string;
  rideRequestId: string;
  passengerId: string;
  requestedSeats: number;
  estimatedFarePaisa: number;
};

export function assertRideCanBeAccepted(status: RideStatus) {
  if (status !== RideStatus.REQUESTED) {
    throw AppError.conflict(
      'RIDE_NOT_REQUESTED',
      'Only a waiting ride request can be accepted',
      { status },
    );
  }
}

export function assertPoolHasCapacity({ occupiedSeats, requestedSeats, capacity }: PoolCapacity) {
  const remainingSeats = capacity - occupiedSeats;

  if (requestedSeats > remainingSeats) {
    throw AppError.conflict(
      'POOL_CAPACITY_EXCEEDED',
      `Only ${Math.max(remainingSeats, 0)} seat(s) remain in this Tesla`,
      { capacity, occupiedSeats, requestedSeats, remainingSeats: Math.max(remainingSeats, 0) },
    );
  }
}

export function assertRoutesArePoolCompatible(reference: PoolRoute, candidate: PoolRoute) {
  if (!requestsAreGeographicallyCompatible(reference, candidate)) {
    throw AppError.conflict(
      'RIDE_NOT_COMPATIBLE_WITH_OPEN_POOL',
      'The ride does not share the pickup zone and a compatible destination with the open pool',
    );
  }
}

export function buildMembershipSnapshot(input: MembershipSnapshotInput) {
  return {
    poolId: input.poolId,
    rideRequestId: input.rideRequestId,
    passengerId: input.passengerId,
    seats: input.requestedSeats,
    farePaisa: input.estimatedFarePaisa,
  };
}

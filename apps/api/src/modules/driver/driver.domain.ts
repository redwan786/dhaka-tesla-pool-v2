import { PoolStatus, RideStatus } from '@prisma/client';
import { AppError } from '../../errors/app-error.js';
import { requestsAreGeographicallyCompatible, type Coordinate } from '../geography/geography.domain.js';

export const ACTIVE_POOL_STATUSES = [
  PoolStatus.OPEN,
  PoolStatus.ARRIVED,
  PoolStatus.IN_PROGRESS,
] as const;

export type PoolCommand = 'arrive' | 'start' | 'complete';

export type PoolTransition = {
  expectedPoolStatus: PoolStatus;
  nextPoolStatus: PoolStatus;
  expectedRideStatus: RideStatus;
  nextRideStatus: RideStatus;
  auditAction: string;
  reason: string;
};

const POOL_TRANSITIONS: Record<PoolCommand, PoolTransition> = {
  arrive: {
    expectedPoolStatus: PoolStatus.OPEN,
    nextPoolStatus: PoolStatus.ARRIVED,
    expectedRideStatus: RideStatus.MATCHED,
    nextRideStatus: RideStatus.DRIVER_ARRIVED,
    auditAction: 'DRIVER_ARRIVED_AT_POOL_PICKUP',
    reason: 'Driver arrived at the pickup zone',
  },
  start: {
    expectedPoolStatus: PoolStatus.ARRIVED,
    nextPoolStatus: PoolStatus.IN_PROGRESS,
    expectedRideStatus: RideStatus.DRIVER_ARRIVED,
    nextRideStatus: RideStatus.STARTED,
    auditAction: 'POOL_TRIP_STARTED',
    reason: 'Driver started the pooled trip',
  },
  complete: {
    expectedPoolStatus: PoolStatus.IN_PROGRESS,
    nextPoolStatus: PoolStatus.COMPLETED,
    expectedRideStatus: RideStatus.STARTED,
    nextRideStatus: RideStatus.COMPLETED,
    auditAction: 'POOL_TRIP_COMPLETED',
    reason: 'Driver completed the pooled trip',
  },
};

export function getPoolTransition(command: PoolCommand, currentStatus: PoolStatus) {
  const transition = POOL_TRANSITIONS[command];
  if (transition.expectedPoolStatus !== currentStatus) {
    throw AppError.conflict(
      'INVALID_POOL_TRANSITION',
      `Cannot ${command} a pool while it is ${currentStatus}`,
      { currentStatus, requiredStatus: transition.expectedPoolStatus },
    );
  }
  return transition;
}

export function assertDriverIsOnline(isOnline: boolean) {
  if (!isOnline) {
    throw AppError.conflict(
      'DRIVER_OFFLINE',
      'Go online before viewing or accepting ride requests',
    );
  }
}

export function assertDriverCanGoOffline(hasActivePool: boolean) {
  if (hasActivePool) {
    throw AppError.conflict(
      'ACTIVE_POOL_EXISTS',
      'Complete the active pool before going offline',
    );
  }
}

export type CandidateRide = {
  pickupZoneId: string;
  destination: Coordinate;
  requestedSeats: number;
};

export type ActivePoolContext = {
  status: PoolStatus;
  occupiedSeats: number;
  reference?: { pickupZoneId: string; destination: Coordinate };
};

export function isRequestRelevantToVehicle(
  candidate: CandidateRide,
  vehicleCapacity: number,
  activePool?: ActivePoolContext,
) {
  if (candidate.requestedSeats > vehicleCapacity) return false;
  if (!activePool) return true;
  if (activePool.status !== PoolStatus.OPEN || !activePool.reference) return false;
  if (activePool.occupiedSeats + candidate.requestedSeats > vehicleCapacity) return false;
  return requestsAreGeographicallyCompatible(activePool.reference, candidate);
}

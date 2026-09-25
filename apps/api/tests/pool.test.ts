import { describe, expect, it } from 'vitest';
import { RideStatus } from '@prisma/client';
import { AppError } from '../src/errors/app-error.js';
import {
  assertPoolHasCapacity,
  assertRideCanBeAccepted,
  assertRoutesArePoolCompatible,
  buildMembershipSnapshot,
} from '../src/modules/pool/pool.domain.js';

const banani = '11111111-1111-4111-8111-111111111111';
const coordinates = {
  mohakhali: { latitude: 23.7772, longitude: 90.3997 },
  gulshan1: { latitude: 23.7806, longitude: 90.4169 },
  uttara: { latitude: 23.8759, longitude: 90.3795 },
};

describe('pool capacity', () => {
  it('allows the final seat when Bullet has exactly one seat remaining', () => {
    expect(() =>
      assertPoolHasCapacity({ occupiedSeats: 2, requestedSeats: 1, capacity: 3 }),
    ).not.toThrow();
  });

  it('rejects a second contender after the final seat was allocated', () => {
    expect(() =>
      assertPoolHasCapacity({ occupiedSeats: 3, requestedSeats: 1, capacity: 3 }),
    ).toThrowError(AppError);
  });

  it('rejects a multi-seat request that would overbook Bullet', () => {
    expect(() =>
      assertPoolHasCapacity({ occupiedSeats: 2, requestedSeats: 2, capacity: 3 }),
    ).toThrowError(expect.objectContaining({ code: 'POOL_CAPACITY_EXCEEDED' }));
  });
});

describe('pool matching', () => {
  it("matches Nusrat's and Rafiq's overlapping routes", () => {
    expect(() =>
      assertRoutesArePoolCompatible(
        { pickupZoneId: banani, destination: coordinates.mohakhali },
        { pickupZoneId: banani, destination: coordinates.gulshan1 },
      ),
    ).not.toThrow();
  });

  it('rejects a different pickup or distant destination', () => {
    expect(() =>
      assertRoutesArePoolCompatible(
        { pickupZoneId: banani, destination: coordinates.mohakhali },
        { pickupZoneId: '22222222-2222-4222-8222-222222222222', destination: coordinates.uttara },
      ),
    ).toThrowError(expect.objectContaining({ code: 'RIDE_NOT_COMPATIBLE_WITH_OPEN_POOL' }));
  });
});

describe('driver acceptance state', () => {
  it('accepts only a REQUESTED ride', () => {
    expect(() => assertRideCanBeAccepted(RideStatus.REQUESTED)).not.toThrow();
    expect(() => assertRideCanBeAccepted(RideStatus.MATCHED)).toThrowError(
      expect.objectContaining({ code: 'RIDE_NOT_REQUESTED' }),
    );
  });
});

describe('individual pool membership', () => {
  it('snapshots the passenger seats and fare on membership', () => {
    expect(
      buildMembershipSnapshot({
        poolId: 'pool-1',
        rideRequestId: 'ride-nusrat',
        passengerId: 'nusrat',
        requestedSeats: 1,
        estimatedFarePaisa: 7650,
      }),
    ).toEqual({
      poolId: 'pool-1',
      rideRequestId: 'ride-nusrat',
      passengerId: 'nusrat',
      seats: 1,
      farePaisa: 7650,
    });
  });
});

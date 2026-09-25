import { describe, expect, it } from 'vitest';
import { PoolStatus, RideStatus } from '@prisma/client';
import { AppError } from '../src/errors/app-error.js';
import {
  assertDriverCanGoOffline,
  assertDriverIsOnline,
  getPoolTransition,
  isRequestRelevantToVehicle,
} from '../src/modules/driver/driver.domain.js';

const banani = 'banani';
const mohakhali = { latitude: 23.7772, longitude: 90.3997 };
const gulshan1 = { latitude: 23.7806, longitude: 90.4169 };
const uttara = { latitude: 23.8759, longitude: 90.3795 };

describe('driver availability', () => {
  it('allows an online driver to view and accept requests', () => {
    expect(() => assertDriverIsOnline(true)).not.toThrow();
  });

  it('rejects request work while offline', () => {
    expect(() => assertDriverIsOnline(false)).toThrowError(
      expect.objectContaining({ code: 'DRIVER_OFFLINE' }),
    );
  });

  it('prevents going offline during an active pool', () => {
    expect(() => assertDriverCanGoOffline(false)).not.toThrow();
    expect(() => assertDriverCanGoOffline(true)).toThrowError(
      expect.objectContaining({ code: 'ACTIVE_POOL_EXISTS' }),
    );
  });
});

describe('driver pool lifecycle', () => {
  it.each([
    ['arrive', PoolStatus.OPEN, PoolStatus.ARRIVED, RideStatus.DRIVER_ARRIVED],
    ['start', PoolStatus.ARRIVED, PoolStatus.IN_PROGRESS, RideStatus.STARTED],
    ['complete', PoolStatus.IN_PROGRESS, PoolStatus.COMPLETED, RideStatus.COMPLETED],
  ] as const)('%s advances the pool and every active ride', (command, current, nextPool, nextRide) => {
    const transition = getPoolTransition(command, current);
    expect(transition.nextPoolStatus).toBe(nextPool);
    expect(transition.nextRideStatus).toBe(nextRide);
  });

  it.each([
    ['start', PoolStatus.OPEN],
    ['complete', PoolStatus.ARRIVED],
    ['arrive', PoolStatus.COMPLETED],
  ] as const)('rejects invalid %s transition from %s', (command, current) => {
    expect(() => getPoolTransition(command, current)).toThrowError(
      expect.objectContaining({ code: 'INVALID_POOL_TRANSITION' }),
    );
  });
});

describe('relevant driver requests', () => {
  it('shows any fitting waiting request when Bullet has no active pool', () => {
    expect(
      isRequestRelevantToVehicle(
        { pickupZoneId: banani, destination: mohakhali, requestedSeats: 3 },
        3,
      ),
    ).toBe(true);
  });

  it("keeps Rafiq's compatible request visible in Nusrat's open pool", () => {
    expect(
      isRequestRelevantToVehicle(
        { pickupZoneId: banani, destination: gulshan1, requestedSeats: 1 },
        3,
        {
          status: PoolStatus.OPEN,
          occupiedSeats: 1,
          reference: { pickupZoneId: banani, destination: mohakhali },
        },
      ),
    ).toBe(true);
  });

  it('hides over-capacity, incompatible, and already-started candidates', () => {
    expect(
      isRequestRelevantToVehicle(
        { pickupZoneId: banani, destination: gulshan1, requestedSeats: 2 },
        3,
        {
          status: PoolStatus.OPEN,
          occupiedSeats: 2,
          reference: { pickupZoneId: banani, destination: mohakhali },
        },
      ),
    ).toBe(false);
    expect(
      isRequestRelevantToVehicle(
        { pickupZoneId: banani, destination: uttara, requestedSeats: 1 },
        3,
        {
          status: PoolStatus.OPEN,
          occupiedSeats: 1,
          reference: { pickupZoneId: banani, destination: mohakhali },
        },
      ),
    ).toBe(false);
    expect(
      isRequestRelevantToVehicle(
        { pickupZoneId: banani, destination: gulshan1, requestedSeats: 1 },
        3,
        {
          status: PoolStatus.IN_PROGRESS,
          occupiedSeats: 1,
          reference: { pickupZoneId: banani, destination: mohakhali },
        },
      ),
    ).toBe(false);
  });
});

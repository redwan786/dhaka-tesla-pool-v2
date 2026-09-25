import { describe, expect, it } from 'vitest';
import { RideStatus } from '@prisma/client';
import {
  assertPassengerCanCancel,
  calculateRideRequestFare,
} from '../src/modules/passenger/passenger.domain.js';
import { createRideSchema } from '../src/modules/passenger/passenger.schemas.js';
import { AppError } from '../src/errors/app-error.js';

describe('passenger ride fare snapshot', () => {
  it('uses the per-seat fare for one requested seat', () => {
    const fare = calculateRideRequestFare(4, 1);
    expect(fare.perSeat.passengerFarePaisa).toBe(7650);
    expect(fare.totalFarePaisa).toBe(7650);
  });

  it('multiplies the individual fare for a passenger party requesting two seats', () => {
    const fare = calculateRideRequestFare(4, 2);
    expect(fare.totalFarePaisa).toBe(15300);
  });

  it('rejects an invalid seat count', () => {
    expect(() => calculateRideRequestFare(4, 4)).toThrow(AppError);
  });
});

describe('passenger cancellation rule', () => {
  it.each([RideStatus.REQUESTED, RideStatus.MATCHED])('allows cancellation from %s', (status) => {
    expect(() => assertPassengerCanCancel(status)).not.toThrow();
  });

  it.each([
    RideStatus.DRIVER_ARRIVED,
    RideStatus.STARTED,
    RideStatus.COMPLETED,
    RideStatus.CANCELLED,
  ])('rejects cancellation from %s', (status) => {
    expect(() => assertPassengerCanCancel(status)).toThrow(AppError);
  });
});

describe('ride request validation', () => {
  it('accepts one to three seats', () => {
    const result = createRideSchema.safeParse({
      pickupZoneId: '11111111-1111-4111-8111-111111111111',
      destinationZoneId: '22222222-2222-4222-8222-222222222222',
      requestedSeats: 3,
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than Bullet’s total capacity', () => {
    const result = createRideSchema.safeParse({
      pickupZoneId: '11111111-1111-4111-8111-111111111111',
      destinationZoneId: '22222222-2222-4222-8222-222222222222',
      requestedSeats: 4,
    });
    expect(result.success).toBe(false);
  });
});

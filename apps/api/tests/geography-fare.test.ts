import { describe, expect, it } from 'vitest';
import { calculatePooledFare } from '../src/modules/geography/fare.domain.js';
import {
  destinationsAreCompatible,
  estimateRouteDistanceKm,
  haversineDistanceKm,
  requestsAreGeographicallyCompatible,
} from '../src/modules/geography/geography.domain.js';

const banani = { name: 'Banani', latitude: 23.7937, longitude: 90.4066 };
const mohakhali = { name: 'Mohakhali', latitude: 23.7772, longitude: 90.3997 };
const gulshan1 = { name: 'Gulshan 1', latitude: 23.7806, longitude: 90.4169 };
const uttara = { name: 'Uttara', latitude: 23.8759, longitude: 90.3795 };

describe('hand-checkable demo distances and fares', () => {
  it('uses 4 km and 7650 paisa for Nusrat', () => {
    const distance = estimateRouteDistanceKm(banani, mohakhali);
    expect(distance).toBe(4);
    expect(calculatePooledFare(distance)).toMatchObject({
      baseFarePaisa: 3000,
      distanceChargePaisa: 6000,
      poolDiscountPaisa: 1350,
      passengerFarePaisa: 7650,
    });
  });

  it('uses 3 km and 6375 paisa for Rafiq', () => {
    const distance = estimateRouteDistanceKm(banani, gulshan1);
    expect(distance).toBe(3);
    expect(calculatePooledFare(distance)).toMatchObject({
      baseFarePaisa: 3000,
      distanceChargePaisa: 4500,
      poolDiscountPaisa: 1125,
      passengerFarePaisa: 6375,
    });
  });

  it('always returns integer paisa', () => {
    const fare = calculatePooledFare(2.37);
    expect(Number.isInteger(fare.passengerFarePaisa)).toBe(true);
    expect(Number.isInteger(fare.poolDiscountPaisa)).toBe(true);
  });
});

describe('geographic matching', () => {
  it('calculates Haversine distance between coordinates', () => {
    expect(haversineDistanceKm(mohakhali, gulshan1)).toBeGreaterThan(1);
  });

  it('treats Mohakhali and Gulshan 1 as compatible destinations', () => {
    expect(destinationsAreCompatible(mohakhali, gulshan1)).toBe(true);
  });

  it('rejects distant destinations', () => {
    expect(destinationsAreCompatible(mohakhali, uttara)).toBe(false);
  });

  it('requires the same pickup zone', () => {
    expect(
      requestsAreGeographicallyCompatible(
        { pickupZoneId: 'banani', destination: mohakhali },
        { pickupZoneId: 'banani', destination: gulshan1 },
      ),
    ).toBe(true);
    expect(
      requestsAreGeographicallyCompatible(
        { pickupZoneId: 'banani', destination: mohakhali },
        { pickupZoneId: 'gulshan', destination: gulshan1 },
      ),
    ).toBe(false);
  });
});

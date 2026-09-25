export const BASE_FARE_PAISA = 3000;
export const DISTANCE_RATE_PAISA_PER_KM = 1500;
export const POOL_DISCOUNT_PERCENT = 15;

export type FareBreakdown = {
  currency: 'BDT';
  distanceKm: number;
  baseFarePaisa: number;
  distanceChargePaisa: number;
  subtotalPaisa: number;
  poolDiscountPercent: number;
  poolDiscountPaisa: number;
  passengerFarePaisa: number;
};

export function calculatePooledFare(distanceKm: number): FareBreakdown {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    throw new Error('Distance must be a positive number');
  }

  const distanceChargePaisa = Math.ceil(distanceKm * DISTANCE_RATE_PAISA_PER_KM);
  const subtotalPaisa = BASE_FARE_PAISA + distanceChargePaisa;
  const poolDiscountPaisa = Math.floor((subtotalPaisa * POOL_DISCOUNT_PERCENT) / 100);
  const passengerFarePaisa = subtotalPaisa - poolDiscountPaisa;

  return {
    currency: 'BDT',
    distanceKm,
    baseFarePaisa: BASE_FARE_PAISA,
    distanceChargePaisa,
    subtotalPaisa,
    poolDiscountPercent: POOL_DISCOUNT_PERCENT,
    poolDiscountPaisa,
    passengerFarePaisa,
  };
}

import { AppError } from '../../errors/app-error.js';
import { prisma } from '../../lib/prisma.js';
import { calculatePooledFare } from './fare.domain.js';
import { estimateRouteDistanceKm } from './geography.domain.js';
import type { FareEstimateInput } from './geography.schemas.js';

export async function listZones() {
  return prisma.zone.findMany({ orderBy: { name: 'asc' } });
}

export async function estimateFare(input: FareEstimateInput) {
  if (input.pickupZoneId === input.destinationZoneId) {
    throw AppError.badRequest(
      'PICKUP_DESTINATION_SAME',
      'Pickup and destination must be different zones',
    );
  }

  const zones = await prisma.zone.findMany({
    where: { id: { in: [input.pickupZoneId, input.destinationZoneId] } },
  });

  const pickup = zones.find((zone) => zone.id === input.pickupZoneId);
  const destination = zones.find((zone) => zone.id === input.destinationZoneId);

  if (!pickup || !destination) throw AppError.notFound('Zone');

  const distanceKm = estimateRouteDistanceKm(pickup, destination);
  return {
    pickup,
    destination,
    fare: calculatePooledFare(distanceKm),
    assumptions: {
      pooledRide: true,
      realMapRouting: false,
      model: 'baseFare + distanceCharge - poolDiscount',
    },
  };
}

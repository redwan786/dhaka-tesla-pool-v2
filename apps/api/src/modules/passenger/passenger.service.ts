import { PoolMemberStatus, PoolStatus, RideStatus, type Prisma } from '@prisma/client';
import { AppError } from '../../errors/app-error.js';
import type { AuthenticatedUser } from '../../lib/auth.js';
import { prisma } from '../../lib/prisma.js';
import { estimateRouteDistanceKm } from '../geography/geography.domain.js';
import {
  ACTIVE_RIDE_STATUSES,
  assertPassengerCanCancel,
  calculateRideRequestFare,
} from './passenger.domain.js';
import type { CreateRideInput } from './passenger.schemas.js';

const passengerRideSummary = {
  pickupZone: true,
  destinationZone: true,
  pool: {
    select: {
      id: true,
      status: true,
      occupiedSeats: true,
      vehicle: { select: { id: true, name: true, capacity: true } },
    },
  },
} satisfies Prisma.RideRequestInclude;

export async function createPassengerRide(input: CreateRideInput, actor: AuthenticatedUser) {
  if (input.pickupZoneId === input.destinationZoneId) {
    throw AppError.badRequest(
      'PICKUP_DESTINATION_SAME',
      'Pickup and destination must be different zones',
    );
  }

  const activeRide = await prisma.rideRequest.findFirst({
    where: { passengerId: actor.id, status: { in: [...ACTIVE_RIDE_STATUSES] } },
    select: { id: true, status: true },
  });
  if (activeRide) {
    throw AppError.conflict(
      'ACTIVE_RIDE_EXISTS',
      'Complete or cancel your active ride before requesting another',
      activeRide,
    );
  }

  const zones = await prisma.zone.findMany({
    where: { id: { in: [input.pickupZoneId, input.destinationZoneId] } },
  });
  const pickup = zones.find((zone) => zone.id === input.pickupZoneId);
  const destination = zones.find((zone) => zone.id === input.destinationZoneId);
  if (!pickup || !destination) throw AppError.notFound('Zone');

  const distanceKm = estimateRouteDistanceKm(pickup, destination);
  const fare = calculateRideRequestFare(distanceKm, input.requestedSeats);

  const ride = await prisma.$transaction(async (transaction) => {
    const createdRide = await transaction.rideRequest.create({
      data: {
        passengerId: actor.id,
        pickupZoneId: pickup.id,
        destinationZoneId: destination.id,
        requestedSeats: input.requestedSeats,
        estimatedFarePaisa: fare.totalFarePaisa,
        status: RideStatus.REQUESTED,
        statusHistory: {
          create: {
            changedById: actor.id,
            fromStatus: null,
            toStatus: RideStatus.REQUESTED,
            reason: 'Passenger requested a ride',
          },
        },
      },
    });

    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'RIDE_REQUESTED',
        entityType: 'RIDE_REQUEST',
        entityId: createdRide.id,
        metadata: {
          pickupZone: pickup.name,
          destinationZone: destination.name,
          requestedSeats: input.requestedSeats,
          estimatedFarePaisa: fare.totalFarePaisa,
        },
      },
    });

    return createdRide;
  });

  return {
    ...(await prisma.rideRequest.findUniqueOrThrow({
      where: { id: ride.id },
      include: passengerRideSummary,
    })),
    fareBreakdown: fare,
  };
}

export async function listPassengerRides(actor: AuthenticatedUser) {
  return prisma.rideRequest.findMany({
    where: { passengerId: actor.id },
    include: passengerRideSummary,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function getPassengerRide(rideId: string, actor: AuthenticatedUser) {
  const ride = await prisma.rideRequest.findFirst({
    where: { id: rideId, passengerId: actor.id },
    include: {
      ...passengerRideSummary,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      payment: true,
    },
  });

  if (!ride) throw AppError.notFound('Ride');
  return ride;
}

export async function cancelPassengerRide(rideId: string, actor: AuthenticatedUser) {
  return prisma.$transaction(async (transaction) => {
    const ride = await transaction.rideRequest.findFirst({
      where: { id: rideId, passengerId: actor.id },
      include: { member: true, pool: true },
    });

    if (!ride) throw AppError.notFound('Ride');
    assertPassengerCanCancel(ride.status);

    if (ride.poolId && ride.pool && ride.member?.status === PoolMemberStatus.ACTIVE) {
      await transaction.$queryRaw`
        SELECT id FROM "Vehicle"
        WHERE id = ${ride.pool.vehicleId}
        FOR UPDATE
      `;

      await transaction.poolMember.update({
        where: { id: ride.member.id },
        data: { status: PoolMemberStatus.CANCELLED, cancelledAt: new Date() },
      });

      await transaction.pool.update({
        where: { id: ride.poolId },
        data: { occupiedSeats: { decrement: ride.requestedSeats } },
      });

      const activeMembers = await transaction.poolMember.count({
        where: { poolId: ride.poolId, status: PoolMemberStatus.ACTIVE },
      });
      if (activeMembers === 0) {
        await transaction.pool.update({
          where: { id: ride.poolId },
          data: { status: PoolStatus.CANCELLED, occupiedSeats: 0 },
        });
      }
    }

    const cancelledRide = await transaction.rideRequest.update({
      where: { id: ride.id },
      data: {
        status: RideStatus.CANCELLED,
        statusHistory: {
          create: {
            changedById: actor.id,
            fromStatus: ride.status,
            toStatus: RideStatus.CANCELLED,
            reason: 'Passenger cancelled the ride',
          },
        },
      },
      include: passengerRideSummary,
    });

    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'RIDE_CANCELLED_BY_PASSENGER',
        entityType: 'RIDE_REQUEST',
        entityId: ride.id,
        metadata: { previousStatus: ride.status },
      },
    });

    return cancelledRide;
  });
}

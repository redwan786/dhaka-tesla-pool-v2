import {
  PoolMemberStatus,
  PoolStatus,
  RideStatus,
  type Prisma,
} from '@prisma/client';
import { AppError } from '../../errors/app-error.js';
import type { AuthenticatedUser } from '../../lib/auth.js';
import { prisma } from '../../lib/prisma.js';
import { ACTIVE_POOL_STATUSES, assertDriverIsOnline } from '../driver/driver.domain.js';
import {
  assertPoolHasCapacity,
  assertRideCanBeAccepted,
  assertRoutesArePoolCompatible,
  buildMembershipSnapshot,
} from './pool.domain.js';

const poolDetails = {
  vehicle: {
    select: { id: true, name: true, capacity: true, driverId: true },
  },
  members: {
    orderBy: { joinedAt: 'asc' as const },
    include: {
      passenger: { select: { id: true, name: true } },
      rideRequest: {
        select: {
          id: true,
          status: true,
          requestedSeats: true,
          pickupZone: true,
          destinationZone: true,
        },
      },
    },
  },
} satisfies Prisma.PoolInclude;

export async function acceptRideIntoPool(rideId: string, actor: AuthenticatedUser) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { driverId: actor.id, isActive: true },
    select: { id: true, name: true, capacity: true },
  });
  if (!vehicle) throw AppError.notFound('Active driver vehicle');

  const allocation = await prisma.$transaction(async (transaction) => {
    // Every allocation for this vehicle must obtain this lock first. If two
    // requests compete for Bullet's last seat, PostgreSQL serializes them.
    await transaction.$queryRaw`
      SELECT id FROM "Vehicle"
      WHERE id = ${vehicle.id}
      FOR UPDATE
    `;

    const driver = await transaction.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: { isOnline: true },
    });
    assertDriverIsOnline(driver.isOnline);

    const ride = await transaction.rideRequest.findUnique({
      where: { id: rideId },
      include: { pickupZone: true, destinationZone: true },
    });
    if (!ride) throw AppError.notFound('Ride');
    assertRideCanBeAccepted(ride.status);

    let openPool = await transaction.pool.findFirst({
      where: { vehicleId: vehicle.id, status: { in: [...ACTIVE_POOL_STATUSES] } },
      include: {
        rides: {
          where: { member: { status: PoolMemberStatus.ACTIVE } },
          include: { pickupZone: true, destinationZone: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (openPool && openPool.status !== PoolStatus.OPEN) {
      throw AppError.conflict(
        'VEHICLE_ALREADY_ON_TRIP',
        'Complete the active trip before accepting another ride',
        { poolId: openPool.id, status: openPool.status },
      );
    }

    if (openPool) {
      const referenceRide = openPool.rides[0];
      if (!referenceRide) {
        // Defensive repair for a stale empty OPEN pool.
        await transaction.pool.update({
          where: { id: openPool.id },
          data: { status: PoolStatus.CANCELLED, occupiedSeats: 0 },
        });
        openPool = null;
      } else {
        assertRoutesArePoolCompatible(
          {
            pickupZoneId: referenceRide.pickupZoneId,
            destination: referenceRide.destinationZone,
          },
          { pickupZoneId: ride.pickupZoneId, destination: ride.destinationZone },
        );
      }
    }

    const pool = openPool
      ? openPool
      : await transaction.pool.create({
          data: { vehicleId: vehicle.id, status: PoolStatus.OPEN, occupiedSeats: 0 },
          include: { rides: true },
        });

    assertPoolHasCapacity({
      occupiedSeats: pool.occupiedSeats,
      requestedSeats: ride.requestedSeats,
      capacity: vehicle.capacity,
    });

    const updatedPool = await transaction.pool.update({
      where: { id: pool.id },
      data: { occupiedSeats: { increment: ride.requestedSeats } },
    });

    await transaction.poolMember.create({
      data: buildMembershipSnapshot({
        poolId: pool.id,
        rideRequestId: ride.id,
        passengerId: ride.passengerId,
        requestedSeats: ride.requestedSeats,
        // This immutable snapshot belongs to this passenger, not the whole pool.
        estimatedFarePaisa: ride.estimatedFarePaisa,
      }),
    });

    await transaction.rideRequest.update({
      where: { id: ride.id },
      data: {
        poolId: pool.id,
        status: RideStatus.MATCHED,
        statusHistory: {
          create: {
            changedById: actor.id,
            fromStatus: RideStatus.REQUESTED,
            toStatus: RideStatus.MATCHED,
            reason: `Driver accepted ride into ${openPool ? 'existing' : 'new'} pool`,
          },
        },
      },
    });

    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'RIDE_ACCEPTED_INTO_POOL',
        entityType: 'POOL',
        entityId: pool.id,
        metadata: {
          rideRequestId: ride.id,
          passengerId: ride.passengerId,
          vehicleId: vehicle.id,
          seats: ride.requestedSeats,
          farePaisa: ride.estimatedFarePaisa,
          occupiedSeats: updatedPool.occupiedSeats,
          capacity: vehicle.capacity,
          createdPool: !openPool,
        },
      },
    });

    return { poolId: pool.id, createdPool: !openPool };
  });

  const pool = await prisma.pool.findUniqueOrThrow({
    where: { id: allocation.poolId },
    include: poolDetails,
  });

  return { createdPool: allocation.createdPool, pool };
}

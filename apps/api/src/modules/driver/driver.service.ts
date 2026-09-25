import {
  PoolMemberStatus,
  PoolStatus,
  type Prisma,
} from '@prisma/client';
import { AppError } from '../../errors/app-error.js';
import type { AuthenticatedUser } from '../../lib/auth.js';
import { assertDriverOwnsVehicle } from '../../lib/authorization.js';
import { prisma } from '../../lib/prisma.js';
import {
  ACTIVE_POOL_STATUSES,
  assertDriverCanGoOffline,
  assertDriverIsOnline,
  getPoolTransition,
  isRequestRelevantToVehicle,
  type PoolCommand,
} from './driver.domain.js';

const driverPoolDetails = {
  vehicle: { select: { id: true, name: true, capacity: true, driverId: true } },
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
          statusHistory: { orderBy: { createdAt: 'asc' as const } },
        },
      },
    },
  },
} satisfies Prisma.PoolInclude;

async function findDriverVehicle(actor: AuthenticatedUser) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { driverId: actor.id, isActive: true },
    select: { id: true, name: true, capacity: true, driverId: true },
  });
  if (!vehicle) throw AppError.notFound('Active driver vehicle');
  return vehicle;
}

export async function getDriverVehicle(actor: AuthenticatedUser) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { driverId: actor.id, isActive: true },
    include: {
      driver: { select: { id: true, name: true, isOnline: true } },
      pools: {
        where: { status: { in: [...ACTIVE_POOL_STATUSES] } },
        select: { id: true, status: true, occupiedSeats: true, createdAt: true },
        take: 1,
      },
    },
  });
  if (!vehicle) throw AppError.notFound('Active driver vehicle');
  const { pools, ...vehicleDetails } = vehicle;
  return { ...vehicleDetails, activePool: pools[0] ?? null };
}

export async function updateDriverOnlineStatus(
  isOnline: boolean,
  actor: AuthenticatedUser,
) {
  const vehicle = await findDriverVehicle(actor);

  return prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`
      SELECT id FROM "Vehicle" WHERE id = ${vehicle.id} FOR UPDATE
    `;

    if (!isOnline) {
      const activePool = await transaction.pool.findFirst({
        where: { vehicleId: vehicle.id, status: { in: [...ACTIVE_POOL_STATUSES] } },
        select: { id: true, status: true },
      });
      assertDriverCanGoOffline(Boolean(activePool));
    }

    const driver = await transaction.user.update({
      where: { id: actor.id },
      data: { isOnline },
      select: { id: true, name: true, role: true, isOnline: true },
    });

    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: isOnline ? 'DRIVER_WENT_ONLINE' : 'DRIVER_WENT_OFFLINE',
        entityType: 'VEHICLE',
        entityId: vehicle.id,
      },
    });

    return { driver, vehicle };
  });
}

export async function listRelevantRideRequests(actor: AuthenticatedUser) {
  const vehicle = await findDriverVehicle(actor);
  const driver = await prisma.user.findUniqueOrThrow({
    where: { id: actor.id },
    select: { isOnline: true },
  });
  assertDriverIsOnline(driver.isOnline);

  const activePool = await prisma.pool.findFirst({
    where: { vehicleId: vehicle.id, status: { in: [...ACTIVE_POOL_STATUSES] } },
    include: {
      rides: {
        where: { member: { status: PoolMemberStatus.ACTIVE } },
        include: { destinationZone: true },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  });

  const waitingRides = await prisma.rideRequest.findMany({
    where: { status: 'REQUESTED' },
    select: {
      id: true,
      requestedSeats: true,
      status: true,
      createdAt: true,
      passenger: { select: { id: true, name: true } },
      pickupZone: true,
      destinationZone: true,
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  const referenceRide = activePool?.rides[0];
  const context = activePool
    ? {
        status: activePool.status,
        occupiedSeats: activePool.occupiedSeats,
        reference: referenceRide
          ? {
              pickupZoneId: referenceRide.pickupZoneId,
              destination: referenceRide.destinationZone,
            }
          : undefined,
      }
    : undefined;

  return waitingRides.filter((ride) =>
    isRequestRelevantToVehicle(
      {
        pickupZoneId: ride.pickupZone.id,
        destination: ride.destinationZone,
        requestedSeats: ride.requestedSeats,
      },
      vehicle.capacity,
      context,
    ),
  );
}

export async function listDriverPools(actor: AuthenticatedUser) {
  const vehicle = await findDriverVehicle(actor);
  return prisma.pool.findMany({
    where: { vehicleId: vehicle.id },
    include: driverPoolDetails,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function getDriverPool(poolId: string, actor: AuthenticatedUser) {
  const pool = await prisma.pool.findFirst({
    where: { id: poolId, vehicle: { driverId: actor.id } },
    include: driverPoolDetails,
  });
  if (!pool) throw AppError.notFound('Pool');
  return pool;
}

export async function transitionDriverPool(
  poolId: string,
  command: PoolCommand,
  actor: AuthenticatedUser,
) {
  await prisma.$transaction(async (transaction) => {
    const lockedPools = await transaction.$queryRaw<Array<{ id: string; driverId: string }>>`
      SELECT p.id, v."driverId"
      FROM "Pool" p
      JOIN "Vehicle" v ON v.id = p."vehicleId"
      WHERE p.id = ${poolId}
      FOR UPDATE OF p
    `;
    const lockedPool = lockedPools[0];
    if (!lockedPool) throw AppError.notFound('Pool');
    assertDriverOwnsVehicle(lockedPool.driverId, actor);

    const pool = await transaction.pool.findUniqueOrThrow({
      where: { id: poolId },
      include: {
        members: {
          where: { status: PoolMemberStatus.ACTIVE },
          include: { rideRequest: true },
        },
      },
    });
    const transition = getPoolTransition(command, pool.status);

    if (pool.members.length === 0) {
      throw AppError.conflict('POOL_HAS_NO_ACTIVE_MEMBERS', 'The pool has no active passengers');
    }

    const mismatchedRide = pool.members.find(
      (member) => member.rideRequest.status !== transition.expectedRideStatus,
    );
    if (mismatchedRide) {
      throw AppError.conflict(
        'POOL_RIDE_STATE_MISMATCH',
        'A passenger ride is not in the state required for this pool transition',
        {
          rideId: mismatchedRide.rideRequestId,
          currentStatus: mismatchedRide.rideRequest.status,
          requiredStatus: transition.expectedRideStatus,
        },
      );
    }

    await transaction.pool.update({
      where: { id: pool.id },
      data: { status: transition.nextPoolStatus },
    });

    for (const member of pool.members) {
      await transaction.rideRequest.update({
        where: { id: member.rideRequestId },
        data: {
          status: transition.nextRideStatus,
          statusHistory: {
            create: {
              changedById: actor.id,
              fromStatus: transition.expectedRideStatus,
              toStatus: transition.nextRideStatus,
              reason: transition.reason,
            },
          },
        },
      });
    }

    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: transition.auditAction,
        entityType: 'POOL',
        entityId: pool.id,
        metadata: {
          fromStatus: transition.expectedPoolStatus,
          toStatus: transition.nextPoolStatus,
          affectedRides: pool.members.length,
        },
      },
    });
  });

  return getDriverPool(poolId, actor);
}

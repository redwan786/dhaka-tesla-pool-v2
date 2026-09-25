import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PoolMemberStatus, RideStatus } from '@prisma/client';
import { prisma } from '../../src/lib/prisma.js';
import {
  acceptRide,
  createFixture,
  createRide,
  removeFixture,
  resetScenario,
  type Fixture,
} from './helpers.js';

let fixture: Fixture;

describe.sequential('concurrent final-seat allocation', () => {
  beforeAll(async () => {
    fixture = await createFixture();
  });

  beforeEach(async () => {
    await resetScenario(fixture);
  });

  afterAll(async () => {
    await removeFixture();
    await prisma.$disconnect();
  });

  it('serializes Rafiq and Shirin competing for Bullet’s last seat', async () => {
    const baseRide = await createRide(fixture, 'nusrat', { seats: 2 });
    const baseAcceptance = await acceptRide(fixture, baseRide.body.data.id).expect(201);
    const rafiq = await createRide(fixture, 'rafiq', { destination: 'Gulshan 1' });
    const shirin = await createRide(fixture, 'shirin');

    // Both HTTP requests are started before either result is awaited.
    const results = await Promise.all([
      acceptRide(fixture, rafiq.body.data.id),
      acceptRide(fixture, shirin.body.data.id),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    const loser = results.find((result) => result.status === 409);
    expect(loser?.body.code).toBe('POOL_CAPACITY_EXCEEDED');

    const pool = await prisma.pool.findUniqueOrThrow({
      where: { id: baseAcceptance.body.data.pool.id },
      include: { members: { where: { status: PoolMemberStatus.ACTIVE } } },
    });
    const contenders = await prisma.rideRequest.findMany({
      where: { id: { in: [rafiq.body.data.id, shirin.body.data.id] } },
      include: { member: true },
    });

    expect(pool.occupiedSeats).toBe(3);
    expect(pool.occupiedSeats).toBeLessThanOrEqual(fixture.vehicle.capacity);
    expect(pool.members).toHaveLength(2);
    expect(contenders.filter((ride) => ride.status === RideStatus.MATCHED)).toHaveLength(1);
    expect(contenders.filter((ride) => ride.status === RideStatus.REQUESTED)).toHaveLength(1);
    expect(contenders.filter((ride) => ride.member !== null)).toHaveLength(1);
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { PoolMemberStatus, RideStatus } from '@prisma/client';
import { app } from '../../src/app.js';
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

describe.sequential('ride-pooling API integration', () => {
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

  it("calculates Nusrat's and Rafiq's pooled fares through the HTTP API", async () => {
    const nusrat = await createRide(fixture, 'nusrat').then((response) => response);
    const rafiq = await createRide(fixture, 'rafiq', { destination: 'Gulshan 1' }).then(
      (response) => response,
    );

    expect(nusrat.status).toBe(201);
    expect(nusrat.body.data.estimatedFarePaisa).toBe(7650);
    expect(nusrat.body.data.fareBreakdown.perSeat.passengerFarePaisa).toBe(7650);
    expect(rafiq.status).toBe(201);
    expect(rafiq.body.data.estimatedFarePaisa).toBe(6375);
    expect(rafiq.body.data.fareBreakdown.perSeat.passengerFarePaisa).toBe(6375);
  });

  it("prevents one passenger from reading or cancelling another passenger's ride", async () => {
    const created = await createRide(fixture, 'nusrat');
    expect(created.status).toBe(201);
    const rideId = created.body.data.id as string;

    await request(app)
      .get(`/api/passenger/rides/${rideId}`)
      .set('Authorization', `Bearer ${fixture.tokens.outsider}`)
      .expect(404);

    await request(app)
      .post(`/api/passenger/rides/${rideId}/cancel`)
      .set('Authorization', `Bearer ${fixture.tokens.outsider}`)
      .expect(404);

    const ownerView = await request(app)
      .get(`/api/passenger/rides/${rideId}`)
      .set('Authorization', `Bearer ${fixture.tokens.nusrat}`)
      .expect(200);
    expect(ownerView.body.data.passengerId).toBe(fixture.users.nusrat.id);
  });

  it('enforces cancellation and explicit lifecycle transition rules', async () => {
    const cancellable = await createRide(fixture, 'outsider');
    await request(app)
      .post(`/api/passenger/rides/${cancellable.body.data.id}/cancel`)
      .set('Authorization', `Bearer ${fixture.tokens.outsider}`)
      .expect(200);
    const repeatCancellation = await request(app)
      .post(`/api/passenger/rides/${cancellable.body.data.id}/cancel`)
      .set('Authorization', `Bearer ${fixture.tokens.outsider}`)
      .expect(409);
    expect(repeatCancellation.body.code).toBe('RIDE_CANCELLATION_NOT_ALLOWED');

    const created = await createRide(fixture, 'nusrat');
    const accepted = await acceptRide(fixture, created.body.data.id).expect(201);
    const poolId = accepted.body.data.pool.id as string;

    const skippedStart = await request(app)
      .post(`/api/driver/pools/${poolId}/start`)
      .set('Authorization', `Bearer ${fixture.tokens.driver}`)
      .expect(409);
    expect(skippedStart.body.code).toBe('INVALID_POOL_TRANSITION');

    await request(app)
      .post(`/api/driver/pools/${poolId}/arrive`)
      .set('Authorization', `Bearer ${fixture.tokens.driver}`)
      .expect(200);

    const lateCancellation = await request(app)
      .post(`/api/passenger/rides/${created.body.data.id}/cancel`)
      .set('Authorization', `Bearer ${fixture.tokens.nusrat}`)
      .expect(409);
    expect(lateCancellation.body.code).toBe('RIDE_CANCELLATION_NOT_ALLOWED');

    await request(app)
      .post(`/api/driver/pools/${poolId}/start`)
      .set('Authorization', `Bearer ${fixture.tokens.driver}`)
      .expect(200);
    await request(app)
      .post(`/api/driver/pools/${poolId}/complete`)
      .set('Authorization', `Bearer ${fixture.tokens.driver}`)
      .expect(200);

    const repeatedComplete = await request(app)
      .post(`/api/driver/pools/${poolId}/complete`)
      .set('Authorization', `Bearer ${fixture.tokens.driver}`)
      .expect(409);
    expect(repeatedComplete.body.code).toBe('INVALID_POOL_TRANSITION');

    const ride = await request(app)
      .get(`/api/passenger/rides/${created.body.data.id}`)
      .set('Authorization', `Bearer ${fixture.tokens.nusrat}`)
      .expect(200);
    expect(ride.body.data.status).toBe(RideStatus.COMPLETED);
    expect(ride.body.data.statusHistory.map((entry: { toStatus: RideStatus }) => entry.toStatus)).toEqual([
      RideStatus.REQUESTED,
      RideStatus.MATCHED,
      RideStatus.DRIVER_ARRIVED,
      RideStatus.STARTED,
      RideStatus.COMPLETED,
    ]);
  });

  it("never exceeds Bullet's capacity and rolls back the rejected membership", async () => {
    const nusrat = await createRide(fixture, 'nusrat', { seats: 2 });
    const rafiq = await createRide(fixture, 'rafiq', { destination: 'Gulshan 1', seats: 2 });
    const firstAcceptance = await acceptRide(fixture, nusrat.body.data.id).expect(201);

    const rejected = await acceptRide(fixture, rafiq.body.data.id).expect(409);
    expect(rejected.body.code).toBe('POOL_CAPACITY_EXCEEDED');

    const pool = await prisma.pool.findUniqueOrThrow({
      where: { id: firstAcceptance.body.data.pool.id },
      include: { members: { where: { status: PoolMemberStatus.ACTIVE } } },
    });
    const rejectedRide = await prisma.rideRequest.findUniqueOrThrow({
      where: { id: rafiq.body.data.id },
      include: { member: true },
    });

    expect(pool.occupiedSeats).toBe(2);
    expect(pool.occupiedSeats).toBeLessThanOrEqual(fixture.vehicle.capacity);
    expect(pool.members).toHaveLength(1);
    expect(rejectedRide.status).toBe(RideStatus.REQUESTED);
    expect(rejectedRide.poolId).toBeNull();
    expect(rejectedRide.member).toBeNull();
  });

  it('enforces driver role and vehicle ownership on pool management', async () => {
    const created = await createRide(fixture, 'nusrat');

    await request(app)
      .post(`/api/driver/rides/${created.body.data.id}/accept`)
      .set('Authorization', `Bearer ${fixture.tokens.nusrat}`)
      .expect(403);

    const accepted = await acceptRide(fixture, created.body.data.id).expect(201);
    const unauthorizedDriver = await request(app)
      .post(`/api/driver/pools/${accepted.body.data.pool.id}/arrive`)
      .set('Authorization', `Bearer ${fixture.tokens.otherDriver}`)
      .expect(403);
    expect(unauthorizedDriver.body.code).toBe('FORBIDDEN');
  });
});

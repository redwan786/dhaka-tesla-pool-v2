import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import type { Response } from 'supertest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

export const TEST_PASSWORD = 'Pass123!';

export const identities = {
  driver: { name: 'Integration Jashim', email: 'itest-jashim@teslapool.local', role: UserRole.DRIVER },
  otherDriver: { name: 'Integration Other Driver', email: 'itest-other-driver@teslapool.local', role: UserRole.DRIVER },
  nusrat: { name: 'Integration Nusrat', email: 'itest-nusrat@teslapool.local', role: UserRole.PASSENGER },
  rafiq: { name: 'Integration Rafiq', email: 'itest-rafiq@teslapool.local', role: UserRole.PASSENGER },
  shirin: { name: 'Integration Shirin', email: 'itest-shirin@teslapool.local', role: UserRole.PASSENGER },
  outsider: { name: 'Integration Outsider', email: 'itest-outsider@teslapool.local', role: UserRole.PASSENGER },
} as const;

export type Fixture = Awaited<ReturnType<typeof createFixture>>;

export async function createFixture() {
  await removeFixture();
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
  const users = {} as Record<keyof typeof identities, { id: string; email: string }>;

  for (const [key, identity] of Object.entries(identities) as [keyof typeof identities, (typeof identities)[keyof typeof identities]][]) {
    users[key] = await prisma.user.create({
      data: { ...identity, passwordHash, isOnline: identity.role === UserRole.DRIVER },
      select: { id: true, email: true },
    });
  }

  const vehicle = await prisma.vehicle.create({
    data: { driverId: users.driver.id, name: 'Bullet Integration', capacity: 3 },
  });
  const otherVehicle = await prisma.vehicle.create({
    data: { driverId: users.otherDriver.id, name: 'Other Bullet Integration', capacity: 3 },
  });

  const zones = await prisma.zone.findMany({
    where: { name: { in: ['Banani', 'Mohakhali', 'Gulshan 1'] } },
  });
  const zoneByName = Object.fromEntries(zones.map((zone) => [zone.name, zone]));
  if (!zoneByName.Banani || !zoneByName.Mohakhali || !zoneByName['Gulshan 1']) {
    throw new Error('Run npm run db:seed before integration tests; demo zones are missing');
  }

  const tokens = {} as Record<keyof typeof identities, string>;
  for (const [key, identity] of Object.entries(identities) as [keyof typeof identities, (typeof identities)[keyof typeof identities]][]) {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: identity.email, password: TEST_PASSWORD })
      .expect(200);
    tokens[key] = response.body.data.token as string;
  }

  return { users, vehicle, otherVehicle, zoneByName, tokens };
}

export async function resetScenario(fixture: Fixture) {
  const passengerIds = [
    fixture.users.nusrat.id,
    fixture.users.rafiq.id,
    fixture.users.shirin.id,
    fixture.users.outsider.id,
  ];
  const actorIds = [...passengerIds, fixture.users.driver.id, fixture.users.otherDriver.id];

  await prisma.auditLog.deleteMany({ where: { actorId: { in: actorIds } } });
  await prisma.statusHistory.deleteMany({
    where: { OR: [{ changedById: { in: actorIds } }, { rideRequest: { passengerId: { in: passengerIds } } }] },
  });
  await prisma.poolMember.deleteMany({ where: { passengerId: { in: passengerIds } } });
  await prisma.payment.deleteMany({ where: { rideRequest: { passengerId: { in: passengerIds } } } });
  await prisma.rideRequest.deleteMany({ where: { passengerId: { in: passengerIds } } });
  await prisma.pool.deleteMany({
    where: { vehicleId: { in: [fixture.vehicle.id, fixture.otherVehicle.id] } },
  });
  await prisma.user.updateMany({
    where: { id: { in: [fixture.users.driver.id, fixture.users.otherDriver.id] } },
    data: { isOnline: true },
  });
}

export async function removeFixture() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'itest-' } },
    select: { id: true, role: true },
  });
  if (users.length === 0) return;

  const userIds = users.map((user) => user.id);
  const passengerIds = users.filter((user) => user.role === UserRole.PASSENGER).map((user) => user.id);
  const vehicles = await prisma.vehicle.findMany({
    where: { driverId: { in: userIds } },
    select: { id: true },
  });
  const vehicleIds = vehicles.map((vehicle) => vehicle.id);

  await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
  await prisma.statusHistory.deleteMany({
    where: { OR: [{ changedById: { in: userIds } }, { rideRequest: { passengerId: { in: passengerIds } } }] },
  });
  await prisma.poolMember.deleteMany({ where: { passengerId: { in: passengerIds } } });
  await prisma.payment.deleteMany({ where: { rideRequest: { passengerId: { in: passengerIds } } } });
  await prisma.rideRequest.deleteMany({ where: { passengerId: { in: passengerIds } } });
  if (vehicleIds.length > 0) await prisma.pool.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
  await prisma.vehicle.deleteMany({ where: { driverId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

export async function createRide(
  fixture: Fixture,
  passenger: 'nusrat' | 'rafiq' | 'shirin' | 'outsider',
  options: { destination?: 'Mohakhali' | 'Gulshan 1'; seats?: number } = {},
): Promise<Response> {
  return request(app)
    .post('/api/passenger/rides')
    .set('Authorization', `Bearer ${fixture.tokens[passenger]}`)
    .send({
      pickupZoneId: fixture.zoneByName.Banani.id,
      destinationZoneId: fixture.zoneByName[options.destination ?? 'Mohakhali'].id,
      requestedSeats: options.seats ?? 1,
    });
}

export function acceptRide(fixture: Fixture, rideId: string) {
  return request(app)
    .post(`/api/driver/rides/${rideId}/accept`)
    .set('Authorization', `Bearer ${fixture.tokens.driver}`);
}

import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const zones = [
  ['Banani', 23.7937, 90.4066],
  ['Gulshan 1', 23.7806, 90.4169],
  ['Mohakhali', 23.7772, 90.3997],
  ['Dhanmondi', 23.7461, 90.3742],
  ['Mirpur', 23.8223, 90.3654],
  ['Uttara', 23.8759, 90.3795],
  ['Farmgate', 23.7577, 90.3881],
  ['Bashundhara', 23.8212, 90.4256],
] as const;

async function main() {
  const passwordHash = await bcrypt.hash('Pass123!', 10);

  for (const [name, latitude, longitude] of zones) {
    await prisma.zone.upsert({
      where: { name },
      update: { latitude, longitude },
      create: { name, latitude, longitude },
    });
  }

  const jashim = await prisma.user.upsert({
    where: { email: 'jashim@teslapool.local' },
    update: { name: 'Jashim', role: UserRole.DRIVER, isOnline: true },
    create: {
      name: 'Jashim',
      email: 'jashim@teslapool.local',
      passwordHash,
      role: UserRole.DRIVER,
      isOnline: true,
    },
  });

  await prisma.vehicle.upsert({
    where: { driverId: jashim.id },
    update: { name: 'Bullet', capacity: 3, isActive: true },
    create: { driverId: jashim.id, name: 'Bullet', capacity: 3 },
  });

  const passengers = [
    ['Nusrat', 'nusrat@teslapool.local'],
    ['Rafiq', 'rafiq@teslapool.local'],
    ['Shirin', 'shirin@teslapool.local'],
  ] as const;

  for (const [name, email] of passengers) {
    await prisma.user.upsert({
      where: { email },
      update: { name, role: UserRole.PASSENGER },
      create: { name, email, passwordHash, role: UserRole.PASSENGER },
    });
  }

  console.log('Seeded Dhaka Tesla Pool demo data. Password for all demo users: Pass123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

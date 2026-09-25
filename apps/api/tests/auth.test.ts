import { describe, expect, it } from 'vitest';
import { UserRole } from '@prisma/client';
import { registerSchema } from '../src/modules/auth/auth.schemas.js';
import {
  hashPassword,
  signAccessToken,
  verifyAccessToken,
  verifyPassword,
  type AuthenticatedUser,
} from '../src/lib/auth.js';
import { assertDriverOwnsVehicle, assertResourceOwner } from '../src/lib/authorization.js';
import { AppError } from '../src/errors/app-error.js';

const passenger: AuthenticatedUser = {
  id: 'passenger-1',
  name: 'Nusrat',
  email: 'nusrat@teslapool.local',
  role: UserRole.PASSENGER,
};

describe('password security', () => {
  it('hashes a password and verifies the correct value', async () => {
    const hash = await hashPassword('Pass123!');
    expect(hash).not.toBe('Pass123!');
    await expect(verifyPassword('Pass123!', hash)).resolves.toBe(true);
    await expect(verifyPassword('Wrong123!', hash)).resolves.toBe(false);
  });
});

describe('JWT authentication', () => {
  it('round-trips the authenticated user', () => {
    const token = signAccessToken(passenger);
    expect(verifyAccessToken(token)).toMatchObject(passenger);
  });

  it('rejects an invalid token', () => {
    expect(() => verifyAccessToken('not-a-real-token')).toThrow(AppError);
  });
});

describe('registration boundary', () => {
  it('does not allow a caller to self-register as a driver', () => {
    const result = registerSchema.safeParse({
      name: 'Unknown Driver',
      email: 'driver@example.com',
      password: 'Pass123!',
      role: 'DRIVER',
    });
    expect(result.success).toBe(false);
  });
});

describe('ownership rules', () => {
  it('allows a user to access their own resource', () => {
    expect(() => assertResourceOwner('passenger-1', passenger)).not.toThrow();
  });

  it('rejects access to another user’s resource', () => {
    expect(() => assertResourceOwner('passenger-2', passenger)).toThrow(AppError);
  });

  it('requires both driver role and vehicle ownership', () => {
    const driver: AuthenticatedUser = {
      id: 'driver-1',
      name: 'Jashim',
      email: 'jashim@teslapool.local',
      role: UserRole.DRIVER,
    };
    expect(() => assertDriverOwnsVehicle('driver-1', driver)).not.toThrow();
    expect(() => assertDriverOwnsVehicle('driver-2', driver)).toThrow(AppError);
    expect(() => assertDriverOwnsVehicle('passenger-1', passenger)).toThrow(AppError);
  });
});

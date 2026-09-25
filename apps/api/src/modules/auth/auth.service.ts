import { UserRole, type User } from '@prisma/client';
import { AppError } from '../../errors/app-error.js';
import { hashPassword, signAccessToken, verifyPassword } from '../../lib/auth.js';
import { prisma } from '../../lib/prisma.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

export type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'isOnline' | 'createdAt'>;

export async function registerPassenger(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw AppError.conflict('EMAIL_ALREADY_REGISTERED', 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (transaction) => {
    const createdUser = await transaction.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: UserRole.PASSENGER,
      },
    });

    await transaction.auditLog.create({
      data: {
        actorId: createdUser.id,
        action: 'AUTH_REGISTERED',
        entityType: 'USER',
        entityId: createdUser.id,
        metadata: { role: createdUser.role },
      },
    });

    return createdUser;
  });

  return createAuthResult(user);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw AppError.unauthorized('Invalid email or password');
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'AUTH_LOGIN_SUCCEEDED',
      entityType: 'USER',
      entityId: user.id,
      metadata: { role: user.role },
    },
  });

  return createAuthResult(user);
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.unauthorized('Authenticated user no longer exists');
  return toPublicUser(user);
}

function createAuthResult(user: User) {
  const publicUser = toPublicUser(user);
  const token = signAccessToken({
    id: publicUser.id,
    name: publicUser.name,
    email: publicUser.email,
    role: publicUser.role,
  });
  return { user: publicUser, token };
}

function toPublicUser(user: User): PublicUser {
  const { id, name, email, role, isOnline, createdAt } = user;
  return { id, name, email, role, isOnline, createdAt };
}

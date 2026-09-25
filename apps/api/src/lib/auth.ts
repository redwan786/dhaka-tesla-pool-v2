import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(user: AuthenticatedUser) {
  return jwt.sign(
    { name: user.name, email: user.email, role: user.role },
    env.JWT_SECRET,
    { subject: user.id, expiresIn: '7d' },
  );
}

export function verifyAccessToken(token: string): AuthenticatedUser {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (
      typeof payload === 'string' ||
      !isAuthPayload(payload) ||
      typeof payload.sub !== 'string'
    ) {
      throw AppError.unauthorized('Invalid access token');
    }

    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.unauthorized('Invalid or expired access token');
  }
}

function isAuthPayload(payload: JwtPayload): payload is JwtPayload & Omit<AuthenticatedUser, 'id'> {
  return (
    typeof payload.name === 'string' &&
    typeof payload.email === 'string' &&
    Object.values(UserRole).includes(payload.role as UserRole)
  );
}

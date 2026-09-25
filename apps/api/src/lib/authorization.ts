import { UserRole } from '@prisma/client';
import { AppError } from '../errors/app-error.js';
import type { AuthenticatedUser } from './auth.js';

export function assertResourceOwner(resourceOwnerId: string, actor: AuthenticatedUser) {
  if (resourceOwnerId !== actor.id) {
    throw AppError.forbidden('You cannot access another user’s resource');
  }
}

export function assertDriverOwnsVehicle(vehicleDriverId: string, actor: AuthenticatedUser) {
  if (actor.role !== UserRole.DRIVER || vehicleDriverId !== actor.id) {
    throw AppError.forbidden('You cannot manage another driver’s vehicle');
  }
}

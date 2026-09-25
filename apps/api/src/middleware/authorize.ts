import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { AppError } from '../errors/app-error.js';

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) throw AppError.unauthorized();

    if (!allowedRoles.includes(request.user.role)) {
      throw AppError.forbidden('Your role cannot perform this action');
    }

    next();
  };
}

import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Request validation failed',
      code: 'VALIDATION_ERROR',
      details: error.flatten(),
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      ...(error.details === undefined ? {} : { details: error.details }),
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({
        message: 'A record with this unique value already exists',
        code: 'UNIQUE_CONSTRAINT_CONFLICT',
      });
      return;
    }

    if (error.code === 'P2025') {
      response.status(404).json({ message: 'Resource not found', code: 'NOT_FOUND' });
      return;
    }

    if (error.code === 'P2003') {
      response.status(409).json({
        message: 'The requested operation conflicts with a related record',
        code: 'RELATION_CONSTRAINT_CONFLICT',
      });
      return;
    }
  }

  logger.error(
    {
      error,
      requestId: request.id,
      method: request.method,
      path: request.originalUrl,
    },
    'Unhandled API error',
  );

  response.status(500).json({
    message: 'Unexpected server error',
    code: 'INTERNAL_SERVER_ERROR',
    ...(env.NODE_ENV === 'development' && error instanceof Error
      ? { details: { name: error.name, message: error.message } }
      : {}),
  });
};

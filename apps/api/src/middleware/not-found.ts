import type { Request, Response } from 'express';

export function notFoundHandler(request: Request, response: Response) {
  response.status(404).json({
    message: `Route ${request.method} ${request.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
}

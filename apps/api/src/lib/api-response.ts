import type { Response } from 'express';

export function sendSuccess<T>(
  response: Response,
  data: T,
  options: { statusCode?: number; message?: string } = {},
) {
  const { statusCode = 200, message = 'Request successful' } = options;
  return response.status(statusCode).json({ message, data });
}

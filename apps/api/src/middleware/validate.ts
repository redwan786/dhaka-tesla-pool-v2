import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export function validate(schemas: RequestSchemas) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (schemas.body) request.body = schemas.body.parse(request.body);
    if (schemas.params) request.params = schemas.params.parse(request.params);
    if (schemas.query) request.query = schemas.query.parse(request.query);
    next();
  };
}

import type { NextFunction, Request, Response } from 'express';
import type { Logger } from 'pino';

import { DomainError } from '../errors/domain.error.js';
import { ZodValidationError } from '../errors/zod-validation.error.js';
import { extractEndpointFromRequest } from '../utils/utils.js';

export function createErrorMiddleware(logger: Logger) {
  return function errorMiddleware(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    if (err instanceof ZodValidationError) {
      const endpoint = extractEndpointFromRequest(req);
      logger.warn({ endpoint }, 'Validation error');

      res.status(400).json({
        error: 'ValidationError',
        message: 'Request validation failed',
        details: err.flattenedErrors,
      });
      return;
    }

    if (err instanceof DomainError) {
      logger.warn({ err, statusCode: err.statusCode }, err.message);

      res.status(err.statusCode).json({
        error: err.name,
        message: err.message,
      });
      return;
    }

    logger.error({ err }, 'Unexpected error');

    res.status(500).json({
      error: 'InternalServerError',
      message: 'Internal Server Error',
    });
  };
}

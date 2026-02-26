import type z from 'zod';

export class ZodValidationError extends Error {
  constructor(public readonly flattenedErrors: z.core.$ZodFlattenedError<unknown>) {
    super('Validation failed');
    this.name = 'ZodValidationError';
  }
}

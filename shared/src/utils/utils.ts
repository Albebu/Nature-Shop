import type { Request } from 'express';

export const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
export const extractEndpointFromRequest = (req: Request): string => {
  return `${req.method} ${req.path}`;
};

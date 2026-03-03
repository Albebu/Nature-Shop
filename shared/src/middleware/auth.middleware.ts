import type { NextFunction, Request, Response } from 'express';

import z from 'zod';
import { UnauthorizedError } from '../errors/unauthorized.error.js';
import type { TokenPayload } from '../types/user.types.js';

type VerifyToken = (token: string) => TokenPayload;

const cookieSchema = z.object({
  accessToken: z.string().min(1),
});

export function createAuthMiddleware(verify: VerifyToken) {
  return function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const parsed = cookieSchema.safeParse(req.cookies);

    if (!parsed.success) {
      throw new UnauthorizedError();
    }

    try {
      req.user = verify(parsed.data.accessToken);
    } catch {
      // TokenExpiredError, JsonWebTokenError, etc. → always 401, never 500
      throw new UnauthorizedError();
    }

    next();
  };
}

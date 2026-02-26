import type { NextFunction, Request, Response } from 'express';

import z from 'zod';
import { UnauthorizedError } from '../errors/unauthorized.error.js';
import type { TokenPayload } from '../types/user.types.js';

type VerifyToken = (token: string) => TokenPayload;

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export function createAuthMiddleware(verify: VerifyToken) {
  return function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const parsed = refreshTokenSchema.safeParse(req.cookies);

    if (!parsed.success) {
      throw new UnauthorizedError();
    }

    const token = parsed.data.refreshToken;

    if (!token) {
      throw new UnauthorizedError();
    }

    const payload = verify(token);
    req.user = payload;
    next();
  };
}

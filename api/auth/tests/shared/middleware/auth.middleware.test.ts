import { createAuthMiddleware } from '@ecommerce/shared';
import { UnauthorizedError } from '@ecommerce/shared';
import type { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Helpers ────────────────────────────────────────────────────

function buildRequest(cookies: Record<string, string>): Request {
  return { cookies } as unknown as Request;
}

const mockResponse = {} as Response;
const mockNext: NextFunction = vi.fn();

// ─── Test Suite ─────────────────────────────────────────────────

describe('authMiddleware', () => {
  const mockVerify = vi.fn();
  let middleware: ReturnType<typeof createAuthMiddleware>;

  beforeEach(() => {
    vi.clearAllMocks();
    middleware = createAuthMiddleware(mockVerify);
  });

  // ── Missing / malformed cookie ──────────────────────────────

  describe('when accessToken cookie is missing', () => {
    it('should throw UnauthorizedError', () => {
      const req = buildRequest({});

      expect(() => {
        middleware(req, mockResponse, mockNext);
      }).toThrow(UnauthorizedError);
    });

    it('should NOT call verify', () => {
      const req = buildRequest({});

      expect(() => {
        middleware(req, mockResponse, mockNext);
      }).toThrow();

      expect(mockVerify).not.toHaveBeenCalled();
    });
  });

  // ── Expired token ───────────────────────────────────────────

  describe('when accessToken is expired', () => {
    it('should throw UnauthorizedError — NOT propagate TokenExpiredError as 500', () => {
      mockVerify.mockImplementation(() => {
        throw new TokenExpiredError('jwt expired', new Date());
      });

      const req = buildRequest({ accessToken: 'expired.jwt.token' });

      // Este test FALLA antes del fix — el middleware deja escapar TokenExpiredError
      // que el error middleware no reconoce y devuelve 500
      expect(() => {
        middleware(req, mockResponse, mockNext);
      }).toThrow(UnauthorizedError);
    });
  });

  // ── Invalid / tampered token ────────────────────────────────

  describe('when accessToken has an invalid signature', () => {
    it('should throw UnauthorizedError — NOT propagate JsonWebTokenError as 500', () => {
      mockVerify.mockImplementation(() => {
        throw new JsonWebTokenError('invalid signature');
      });

      const req = buildRequest({ accessToken: 'tampered.jwt.token' });

      expect(() => {
        middleware(req, mockResponse, mockNext);
      }).toThrow(UnauthorizedError);
    });
  });

  // ── Valid token ─────────────────────────────────────────────

  describe('when accessToken is valid', () => {
    it('should set req.user with the token payload', () => {
      const payload = { userId: 'user-123', userType: 'CUSTOMER' as const, tenantId: 'tenant-456' };
      mockVerify.mockReturnValue(payload);

      const req = buildRequest({ accessToken: 'valid.jwt.token' });

      middleware(req, mockResponse, mockNext);

      expect(req.user).toEqual(payload);
    });

    it('should call next()', () => {
      mockVerify.mockReturnValue({
        userId: 'user-123',
        userType: 'CUSTOMER' as const,
        tenantId: null,
      });

      const req = buildRequest({ accessToken: 'valid.jwt.token' });

      middleware(req, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});

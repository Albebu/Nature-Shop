import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extiende zod con .openapi() — debe ejecutarse una sola vez antes de usar los schemas
extendZodWithOpenApi(z);

// ─── Request schemas ─────────────────────────────────────────────

export const registerSchema = z
  .object({
    firstName: z.string().min(1).openapi({ example: 'Alex' }),
    lastName: z.string().min(1).openapi({ example: 'Bellosta' }),
    email: z.email().openapi({ example: 'alex@example.com' }),
    password: z.string().min(8).openapi({ example: 'SecurePass123' }),
  })
  .openapi('RegisterRequest');

export const loginSchema = z
  .object({
    email: z.email().openapi({ example: 'alex@example.com' }),
    password: z.string().min(1).openapi({ example: 'SecurePass123' }),
  })
  .openapi('LoginRequest');

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).openapi({ example: 'OldPass123' }),
    newPassword: z.string().min(8).openapi({ example: 'NewPass456' }),
  })
  .openapi('ChangePasswordRequest');

// Cookie-based schemas — no aparecen en el body, pero los usamos para validar
export const refreshTokenCookieSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .openapi('RefreshTokenCookie');

// ─── Response schemas ─────────────────────────────────────────────

export const authSuccessResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'User registered successfully' }),
  })
  .openapi('AuthSuccessResponse');

export const profileResponseSchema = z
  .object({
    user: z
      .object({
        userId: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        userType: z.enum(['CUSTOMER', 'EMPLOYEE']).openapi({ example: 'CUSTOMER' }),
        tenantId: z.uuid().nullable().openapi({ example: null }),
      })
      .openapi('TokenPayload'),
  })
  .openapi('ProfileResponse');

export const errorResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'Unauthorized' }),
  })
  .openapi('ErrorResponse');

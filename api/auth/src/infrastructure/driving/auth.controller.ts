import { UnauthorizedError, ZodValidationError } from '@ecommerce/shared';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { verifyEmailSchema } from '../../application/dtos/verify-email.dto.js';
import type { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case.js';
import type { LoginUseCase } from '../../application/use-cases/login.use-case.js';
import type { LogoutUseCase } from '../../application/use-cases/logout.use-case.js';
import type { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case.js';
import type { RegisterUseCase } from '../../application/use-cases/register.use-case.js';
import type { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case.js';
import { ENV } from '../../env.js';
import {
  changePasswordSchema,
  loginSchema,
  refreshTokenCookieSchema,
  registerSchema,
} from '../../interfaces/schemas/auth.schemas.js';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ZodValidationError(z.flattenError(parsed.error));
    }

    const result = await this.registerUseCase.execute(parsed.data);

    res.cookie('accessToken', result.token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(201).json({ message: 'User registered successfully' });
  }

  async login(req: Request, res: Response): Promise<void> {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ZodValidationError(z.flattenError(parsed.error));
    }

    const result = await this.loginUseCase.execute(parsed.data);

    res.cookie('accessToken', result.token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'User logged in successfully' });
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const parsed = refreshTokenCookieSchema.safeParse(req.cookies);

    if (!parsed.success) {
      res.status(401).json({ message: 'Refresh token is required' });
      return;
    }

    const result = await this.refreshTokenUseCase.execute(parsed.data.refreshToken);

    res.cookie('accessToken', result.token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Token refreshed successfully' });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const parsed = refreshTokenCookieSchema.safeParse(req.cookies);

    if (!parsed.success) {
      throw new ZodValidationError(z.flattenError(parsed.error));
    }

    await this.logoutUseCase.execute(parsed.data.refreshToken);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({ message: 'User logged out successfully' });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ZodValidationError(z.flattenError(parsed.error));
    }

    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { userId } = req.user;
    await this.changePasswordUseCase.execute({ ...parsed.data, userId });

    res.status(200).json({ message: 'Password changed successfully' });
  }

  getProfile(req: Request, res: Response): void {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    res.status(200).json({ user: req.user });
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const parsed = verifyEmailSchema.safeParse(req.query);

    if (!parsed.success) {
      throw new ZodValidationError(z.flattenError(parsed.error));
    }

    const result = await this.verifyEmailUseCase.execute(parsed.data);

    res.status(200).json(result);
  }
}

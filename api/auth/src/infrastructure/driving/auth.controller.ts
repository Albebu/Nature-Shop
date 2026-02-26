import { UnauthorizedError, ZodValidationError } from '@ecommerce/shared';
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case.js';
import type { LoginUseCase } from '../../application/use-cases/login.use-case.js';
import type { LogoutUseCase } from '../../application/use-cases/logout.use-case.js';
import type { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case.js';
import type { RegisterUseCase } from '../../application/use-cases/register.use-case.js';
import { ENV } from '../../env.js';

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
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
    const parsed = refreshTokenSchema.safeParse(req.cookies);

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
    const parsed = refreshTokenSchema.safeParse(req.cookies);

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

    await this.changePasswordUseCase.execute({ ...parsed.data, userId: req.user.id });

    res.status(200).json({ message: 'Password changed successfully' });
  }
}

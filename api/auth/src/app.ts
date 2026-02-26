import { createAuthMiddleware, createErrorMiddleware } from '@ecommerce/shared';
import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { LogoutUseCase } from './application/use-cases/logout.use-case.js';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case.js';
import { RegisterUseCase } from './application/use-cases/register.use-case.js';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case.js';
import { BcryptService } from './infrastructure/driven/bcrypt.service.js';
import { JwtService } from './infrastructure/driven/jwt.service.js';
import { getLogger } from './infrastructure/driven/logger.instance.js';
import { PinoLoggerAdapter } from './infrastructure/driven/pino-logger.adapter.js';
import { prisma } from './infrastructure/driven/prisma.client.js';
import { RefreshTokenRepositoryPrisma } from './infrastructure/driven/refresh-token.repository.prisma.js';
import { UserRepositoryPrisma } from './infrastructure/driven/user.repository.prisma.js';
import { AuthController } from './infrastructure/driving/auth.controller.js';
import { createAuthRouter } from './infrastructure/driving/auth.routes.js';

export function createApp(): Express {
  const app = express();

  const logger = getLogger();
  const errorMiddleware = createErrorMiddleware(logger);

  app.use(express.json());
  app.use(cookieParser());

  // Infraestructura
  const userRepository = new UserRepositoryPrisma(prisma);
  const refreshTokenRepository = new RefreshTokenRepositoryPrisma(prisma);
  const tokenService = new JwtService();

  const passwordService = new BcryptService();

  const loggerAdapter = new PinoLoggerAdapter(logger);

  // Casos de uso
  const registerUseCase = new RegisterUseCase(
    userRepository,
    refreshTokenRepository,
    passwordService,
    tokenService,
    loggerAdapter,
  );

  const loginUseCase = new LoginUseCase(
    userRepository,
    passwordService,
    tokenService,
    refreshTokenRepository,
  );

  const refreshTokenUseCase = new RefreshTokenUseCase(
    refreshTokenRepository,
    tokenService,
    userRepository,
  );

  const logoutUseCase = new LogoutUseCase(refreshTokenRepository);
  const changePasswordUseCase = new ChangePasswordUseCase(userRepository, passwordService);

  // Controllers y rutas
  const authController = new AuthController(
    registerUseCase,
    loginUseCase,
    refreshTokenUseCase,
    logoutUseCase,
    changePasswordUseCase,
  );
  const authMiddleware = createAuthMiddleware((token) => tokenService.verify(token));
  app.use('/api/auth', createAuthRouter(authController, authMiddleware));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use(errorMiddleware);

  return app;
}

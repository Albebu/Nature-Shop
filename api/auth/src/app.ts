import { apiReference } from '@scalar/express-api-reference';
import { createAuthMiddleware, createErrorMiddleware } from '@ecommerce/shared';
import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { pinoHttp } from 'pino-http';
import { generateOpenApiSpec } from './interfaces/openapi/spec.js';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { LogoutUseCase } from './application/use-cases/logout.use-case.js';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case.js';
import { RegisterUseCase } from './application/use-cases/register.use-case.js';
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

  // HTTP request logging — usa el mismo logger de pino para consistencia
  app.use(
    pinoHttp({
      logger,
      // No loguear el health check — ruido innecesario
      autoLogging: { ignore: (req: IncomingMessage) => req.url === '/health' },
      // Campos customizados en la respuesta
      customSuccessMessage: (req: IncomingMessage, res: ServerResponse) =>
        `${req.method ?? 'UNKNOWN'} ${req.url ?? '/'} completed with ${String(res.statusCode)}`,
      customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) =>
        `${req.method ?? 'UNKNOWN'} ${req.url ?? '/'} failed with ${String(res.statusCode)}: ${err.message}`,
    }),
  );

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

  // OpenAPI spec JSON — fuente de verdad para Scalar y cualquier herramienta externa
  app.get('/api/auth/openapi.json', (_req, res) => {
    res.status(200).json(generateOpenApiSpec());
  });

  // Scalar UI — documentación interactiva en http://localhost:<PORT>/api/auth/docs
  app.use('/api/auth/docs', apiReference({ url: '/api/auth/openapi.json' }));

  app.use(errorMiddleware);

  return app;
}

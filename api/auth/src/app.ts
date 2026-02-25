import express, { type Express } from 'express';
import { RegisterUseCase } from './application/use-cases/register.use-case.js';
import { BcryptService } from './infrastructure/driven/bcrypt.service.js';
import { JwtService } from './infrastructure/driven/jwt.service.js';
import { prisma } from './infrastructure/driven/prisma.client.js';
import { RefreshTokenRepositoryPrisma } from './infrastructure/driven/refresh-token.repository.prisma.js';
import { UserRepositoryPrisma } from './infrastructure/driven/user.repository.prisma.js';
import { AuthController } from './infrastructure/driving/auth.controller.js';
import { createAuthRouter } from './infrastructure/driving/auth.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  // Infraestructura
  const userRepository = new UserRepositoryPrisma(prisma);
  const refreshTokenRepository = new RefreshTokenRepositoryPrisma(prisma);
  const tokenService = new JwtService();

  const passwordService = new BcryptService();

  // Casos de uso
  const registerUseCase = new RegisterUseCase(
    userRepository,
    refreshTokenRepository,
    passwordService,
    tokenService,
  );

  // Controllers y rutas
  const authController = new AuthController(registerUseCase);
  app.use('/api/auth', createAuthRouter(authController));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return app;
}

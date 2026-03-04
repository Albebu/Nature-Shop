import type { RequestHandler } from 'express';
import { Router } from 'express';
import type { AuthController } from './auth.controller.js';

export function createAuthRouter(
  controller: AuthController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  // Public
  router.post('/register', (req, res) => controller.register(req, res));
  router.post('/login', (req, res) => controller.login(req, res));
  router.post('/refresh-token', (req, res) => controller.refreshToken(req, res));
  router.get('/verify-email', (req, res) => controller.verifyEmail(req, res));

  // Protected
  router.post('/logout', authMiddleware, (req, res) => controller.logout(req, res));
  router.post('/change-password', authMiddleware, (req, res) =>
    controller.changePassword(req, res),
  );
  router.get('/me', authMiddleware, (req, res) => {
    controller.getProfile(req, res);
  });

  return router;
}

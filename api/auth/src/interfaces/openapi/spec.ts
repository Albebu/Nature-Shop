import { OpenApiGeneratorV31, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  authSuccessResponseSchema,
  changePasswordSchema,
  errorResponseSchema,
  loginSchema,
  profileResponseSchema,
  registerSchema,
} from '../schemas/auth.schemas.js';

const registry = new OpenAPIRegistry();

// ─── Security scheme — cookie-based auth ─────────────────────────

const cookieAuth = registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'accessToken',
  description: 'HttpOnly cookie containing the JWT access token',
});

// ─── Registrar schemas como componentes reutilizables ────────────

registry.register('RegisterRequest', registerSchema);
registry.register('LoginRequest', loginSchema);
registry.register('ChangePasswordRequest', changePasswordSchema);
registry.register('AuthSuccessResponse', authSuccessResponseSchema);
registry.register('ProfileResponse', profileResponseSchema);
registry.register('ErrorResponse', errorResponseSchema);

// ─── Definir las rutas de la API ─────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  summary: 'Register a new customer account',
  tags: ['Auth'],
  request: { body: { content: { 'application/json': { schema: registerSchema } } } },
  responses: {
    201: {
      description: 'User registered successfully. Tokens are set as HttpOnly cookies.',
      content: { 'application/json': { schema: authSuccessResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    409: {
      description: 'Email already registered',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  summary: 'Authenticate with email and password',
  tags: ['Auth'],
  request: { body: { content: { 'application/json': { schema: loginSchema } } } },
  responses: {
    200: {
      description: 'Login successful. Tokens are set as HttpOnly cookies.',
      content: { 'application/json': { schema: authSuccessResponseSchema } },
    },
    401: {
      description: 'Invalid credentials or inactive account',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/refresh',
  summary: 'Rotate access and refresh tokens using the refreshToken cookie',
  tags: ['Auth'],
  responses: {
    200: {
      description: 'Tokens rotated. New tokens are set as HttpOnly cookies.',
      content: { 'application/json': { schema: authSuccessResponseSchema } },
    },
    401: {
      description: 'Missing or invalid refresh token',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  summary: 'Revoke all sessions for the authenticated user',
  tags: ['Auth'],
  security: [{ [cookieAuth.name]: [] }],
  responses: {
    200: {
      description: 'Logged out. Cookies cleared.',
      content: { 'application/json': { schema: authSuccessResponseSchema } },
    },
    401: {
      description: 'Not authenticated',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/change-password',
  summary: 'Change password for the authenticated user',
  tags: ['Auth'],
  security: [{ [cookieAuth.name]: [] }],
  request: { body: { content: { 'application/json': { schema: changePasswordSchema } } } },
  responses: {
    200: {
      description: 'Password changed successfully.',
      content: { 'application/json': { schema: authSuccessResponseSchema } },
    },
    401: {
      description: 'Not authenticated or wrong current password',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/profile',
  summary: 'Get the authenticated user profile from the access token',
  tags: ['Auth'],
  security: [{ [cookieAuth.name]: [] }],
  responses: {
    200: {
      description: 'User profile from token payload.',
      content: { 'application/json': { schema: profileResponseSchema } },
    },
    401: {
      description: 'Not authenticated',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

// ─── Generador ───────────────────────────────────────────────────

export function generateOpenApiSpec(): ReturnType<OpenApiGeneratorV31['generateDocument']> {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Nature Shop — Auth Service API',
      version: '1.0.0',
      description:
        'Authentication and authorization API for the Nature Shop ecommerce platform. ' +
        'All tokens are transmitted via HttpOnly cookies (not in the response body).',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
  });
}

export { createLogger } from './utils/logger.js';
export type { LoggerOptions } from './utils/logger.js';
export { EMAIL_REGEX } from './utils/regex-validations.js';
export { extractEndpointFromRequest, SEVEN_DAYS_IN_MS } from './utils/utils.js';

// Errors
export { ConflictError } from './errors/conflict.error.js';
export { DomainError } from './errors/domain.error.js';
export { ForbiddenError } from './errors/forbidden.error.js';
export { NotFoundError } from './errors/not-found.error.js';
export { UnauthorizedError } from './errors/unauthorized.error.js';
export { ZodValidationError } from './errors/zod-validation.error.js';

// Middleware
export { createErrorMiddleware } from './middleware/error.middleware.js';
export { createAuthMiddleware } from './middleware/auth.middleware.js';

// Types
export type { TokenPayload } from './types/user.types.js';
export type { UserType } from './types/user.types.js';

// Events
export type { DomainEvent, UserRegisteredPayload, UserRegisteredEvent } from './types/events.js';
export { USER_EVENTS_EXCHANGE, USER_REGISTERED_ROUTING_KEY } from './types/events.js';

// Express global augmentation (adds req.user)
import './types/express.types.js';

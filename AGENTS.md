# AGENTS.md — Ecommerce Platform

Guía de referencia para agentes de codificación que operan en este repositorio.

## Project Overview

Ecommerce platform with microservices architecture, built with Express + TypeScript in strict mode.
Target: Backend development first, then frontend. TDD with 90%+ coverage.

**Tech Stack:**
- Runtime: Node.js >= 22.0.0
- Package Manager: pnpm >= 10.0.0 (monorepo)
- Framework: Express 5
- ORM: Prisma 7 (PostgreSQL)
- Validation: Zod 4
- Testing: Vitest + Supertest
- Logging: Pino
- Message Broker: RabbitMQ 4 (amqplib)
- Email Provider: Resend
- API Docs: Scalar (OpenAPI)
- Container Orchestration: Docker + Kubernetes

---

## Architecture

**Monorepo Structure:**
```
/
├── api/           # Microservicios backend
│   ├── auth/      # Autenticación JWT + refresh tokens + verificación email
│   ├── email/     # Servicio de emails (consumer RabbitMQ + Resend)
│   └── orders/    # Gestión de pedidos (planned)
├── shared/        # Código compartido entre servicios (@ecommerce/shared)
├── k8s/           # Kubernetes manifests
└── docker-compose.yml  # PostgreSQL + RabbitMQ
```

**Hexagonal Architecture (Ports & Adapters) per Service:**
```
api/auth/src/
├── domain/        # Entidades, value objects, puertos (interfaces), errores
├── application/   # Casos de uso, DTOs (Zod schemas)
└── infrastructure/
    ├── driving/   # Adaptadores entrantes: controllers, routes
    └── driven/    # Adaptadores salientes: Prisma repos, JWT, RabbitMQ, Pino
```

```
api/email/src/
├── domain/        # Puertos: EmailSender, EventConsumer, Logger
├── application/   # Casos de uso: HandleUserRegisteredUseCase
└── infrastructure/
    ├── driving/   # (vacío — no tiene HTTP, solo consume eventos)
    └── driven/    # RabbitMQ consumer, Resend adapter, Console adapter, Pino
```

**Path Aliases (tsconfig.json):**
- `@domain/*` → `src/domain/*`
- `@application/*` → `src/application/*`
- `@infrastructure/*` → `src/infrastructure/*`

---

## Event-Driven Architecture

### RabbitMQ Topology
- **Exchange**: `user.events` (type: topic, durable)
- **Queue**: `email.user.registered` (durable)
- **Routing Key**: `user.registered`
- **Binding**: `user.events` → `email.user.registered` via `user.registered`

### Event Contracts (defined in `@ecommerce/shared`)
```typescript
interface DomainEvent<T> {
  type: string;
  payload: T;
  occurredAt: string;
  correlationId: string;
}

interface UserRegisteredPayload {
  userId: string;
  email: string;
  firstName: string;
  verificationToken: string;
}
```

### Event Flow Pattern
```
Use Case → EventPublisher.publish(event) → RabbitMQ → EventConsumer → Handler Use Case
```

**Critical rules:**
- Event publishing is **fire & forget** — failures must NOT break the originating operation
- Wrap `eventPublisher.publish()` in try/catch, log errors, continue
- Malformed messages are **ack'd** (not requeued) — prevents poison pill loops
- EventPublisher port is in `domain/ports/` — RabbitMQ adapter is in `infrastructure/driven/`

### Adding New Events
1. Define payload type in `shared/src/types/events.ts`
2. Export from `shared/src/index.ts`
3. Add routing key constant in shared
4. Publisher: call `eventPublisher.publish()` in use case
5. Consumer: create handler use case + subscribe in `app.ts`

---

## Services

### Auth Service (`@ecommerce/auth-service`)
- **Port**: 8080 (default)
- **API Docs**: http://localhost:8080/api/auth/docs (Scalar)
- **Database**: PostgreSQL (`nature_shop_auth`)
- **Entities**: User, RefreshToken, VerificationToken
- **Use Cases**: Register, Login, Logout, RefreshToken, ChangePassword, VerifyEmail
- **Events Published**: `user.registered` (after registration)
- **RabbitMQ**: Optional — service works without it (noop publisher logs warning)

### Email Service (`@ecommerce/email-service`)
- **No HTTP server** — only consumes RabbitMQ events
- **Database**: None (stateless)
- **Events Consumed**: `user.registered`
- **Adapters**: ResendEmailSender (production), ConsoleEmailSender (development)
- **RabbitMQ**: Required — service exits if connection fails

---

## Development Commands

### Root Level (Monorepo)
```bash
pnpm lint              # ESLint check all .ts files
pnpm lint:fix          # ESLint auto-fix
pnpm format            # Prettier format all files
pnpm format:check      # Check formatting without changes
pnpm typecheck         # TypeScript check all services
pnpm test              # Run all tests across services
pnpm test:coverage     # Run tests with coverage report
pnpm build             # Build all services
```

### Service Level
```bash
# Auth service
pnpm --filter @ecommerce/auth-service dev          # Development with hot reload
pnpm --filter @ecommerce/auth-service build        # Compile TypeScript
pnpm --filter @ecommerce/auth-service start        # Run compiled code
pnpm --filter @ecommerce/auth-service typecheck    # Type check only
pnpm --filter @ecommerce/auth-service test         # Run all tests once
pnpm --filter @ecommerce/auth-service test:watch   # Watch mode
pnpm --filter @ecommerce/auth-service test:coverage # Coverage report

# Email service
pnpm --filter @ecommerce/email-service dev          # Development with hot reload
pnpm --filter @ecommerce/email-service test         # Run all tests
pnpm --filter @ecommerce/email-service test:coverage # Coverage report
```

### Infrastructure
```bash
docker compose up -d                # Start PostgreSQL + RabbitMQ
docker compose up -d rabbitmq       # Start only RabbitMQ
docker compose ps                   # Check running containers
docker compose down                 # Stop everything
```

**Running a Single Test:**
```bash
# From service directory
pnpm test src/domain/user/user.test.ts

# Or with vitest directly
npx vitest run src/domain/user/user.test.ts

# Specific test by name pattern
npx vitest run -t "should create user"
```

**Prisma Commands:**
```bash
pnpm --filter @ecommerce/auth-service exec prisma generate   # Generate client
pnpm --filter @ecommerce/auth-service exec prisma migrate dev --name <name>
pnpm --filter @ecommerce/auth-service exec prisma studio     # GUI
```

---

## Code Style Guidelines

### TypeScript Configuration

**Strict mode enabled with extra safety:**
- `strict: true`
- `noUncheckedIndexedAccess: true` — Array/object access may be undefined
- `noImplicitOverride: true` — Must use `override` keyword
- `noPropertyAccessFromIndexSignature: true`
- `exactOptionalPropertyTypes: true`

### Import Conventions

**ALWAYS use type imports for types:**
```typescript
// ✅ Correct
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { UserRepository } from '@domain/repositories/user.repository';

// ❌ Wrong
import { Request, Response } from 'express';
```

**Path aliases over relative imports for cross-layer:**
```typescript
// ✅ Correct
import type { User } from '@domain/entities/user';
import { CreateUserUseCase } from '@application/use-cases/create-user';

// ❌ Wrong (for cross-layer)
import { User } from '../../domain/entities/user';
```

**Shared package imports:**
```typescript
// Types — use import type
import type { DomainEvent, UserRegisteredPayload } from '@ecommerce/shared';

// Values — regular import
import { USER_EVENTS_EXCHANGE, USER_REGISTERED_ROUTING_KEY } from '@ecommerce/shared';
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `UserRepository`, `CreateUserUseCase` |
| Interfaces | PascalCase, no `I` prefix | `UserRepository`, `Logger` |
| Functions/Methods | camelCase | `createUser()`, `validateToken()` |
| Variables | camelCase | `userRepository`, `accessToken` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`, `JWT_SECRET` |
| Files (classes) | kebab-case | `user.repository.ts`, `create-user.use-case.ts` |
| Files (tests) | .test.ts suffix | `user.test.ts`, `auth.service.test.ts` |
| Environment vars | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |
| Event types | dot.notation | `user.registered`, `order.created` |

### Function Return Types

**ALWAYS explicit return types:**
```typescript
// ✅ Correct
export function createUser(data: CreateUserDto): Promise<User> {
  // ...
}

export const validateEmail = (email: string): boolean => {
  return emailRegex.test(email);
};

// ❌ Wrong (implicit any or missing return type)
export function createUser(data: CreateUserDto) {
  // ...
}
```

### Error Handling

**Use custom error classes extending DomainError from shared:**
```typescript
import { DomainError } from '@ecommerce/shared';

export class VerificationTokenExpiredError extends DomainError {
  constructor() {
    super('Verification token has expired', 400);
    this.name = 'VerificationTokenExpiredError';
  }
}
```

**Never catch with `any`:**
```typescript
// ✅ Correct
try {
  await user();
} catch (error) {
  if (error instanceof UserNotFoundError) {
    // handle
  }
  throw error;
}

// ❌ Wrong
catch (error: any) {
  console.log(error.message);
}
```

### Validation with Zod

**Define schemas in dedicated files, infer types:**
```typescript
// dtos/verify-email.dto.ts
import { z } from 'zod';

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
```

**Validate at controller level:**
```typescript
import { verifyEmailSchema } from '../dtos/verify-email.dto';

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const validatedData = verifyEmailSchema.parse(req.query);
  // ... use validatedData
}
```

---

## Testing Guidelines

### TDD Approach

1. **Write failing test first**
2. **Write minimal code to pass**
3. **Refactor**
4. **Repeat**

### Test Structure

```typescript
// user.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('User', () => {
  describe('create', () => {
    it('should create user with valid data', () => {
      // Arrange
      const data = { email: 'test@example.com', name: 'Test' };

      // Act
      const user = User.create(data);

      // Assert
      expect(user.email).toBe('test@example.com');
    });

    it('should throw InvalidEmailError for invalid email', () => {
      // ...
    });
  });
});
```

### Mocking Ports

All ports are mocked with `vi.fn()` in tests:
```typescript
const mockEventPublisher: EventPublisher = {
  publish: vi.fn(),
};

const mockVerificationTokenRepo: VerificationTokenRepository = {
  save: vi.fn(),
  findByToken: vi.fn(),
};
```

### Coverage Requirement

**Minimum: 90% coverage** — PRs below this threshold will fail.
Current coverage: 100% (auth + email services).

```bash
pnpm test:coverage  # Check coverage before pushing
```

### Integration Tests with Supertest

```typescript
import request from 'supertest';
import { app } from '../app';

describe('POST /api/auth/login', () => {
  it('should return 200 with tokens', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
  });
});
```

---

## Logging with Pino

**Structured logging only:**
```typescript
import pino from 'pino';

const logger = pino({ level: process.env['LOG_LEVEL'] ?? 'info' });

// ✅ Correct — structured
logger.info({ userId: user.id, action: 'login' }, 'User logged in');

// ❌ Wrong — string interpolation
logger.info(`User ${user.id} logged in`);
```

---

## Prisma Guidelines

**Generated client location:** `src/generated/prisma`

```typescript
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Use in repositories
export class UserRepositoryPrisma implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const data = await prisma.user.findUnique({ where: { id } });
    return data ? this.toDomain(data) : null;
  }
}
```

### Current Models (Auth Service)
- **Tenant** — Empresas (multitenant)
- **User** — Employees + Customers, includes `emailVerifiedAt`
- **RefreshToken** — JWT refresh tokens with revocation
- **VerificationToken** — Email verification tokens (single use, 24h expiry)

---

## Commit Conventions

Husky + lint-staged pre-commit hooks run automatically:
- ESLint fix on `.ts` files
- Prettier on all files

**Recommended format:**
```
type(scope): description

# Examples:
feat(auth): add refresh token rotation
feat(email): create email microservice with Resend
feat(infra): add RabbitMQ broker to docker-compose
fix(orders): correct total calculation
test(auth): add login integration tests
refactor(auth): extract token validation to middleware
```

**Scopes:** `auth`, `email`, `orders`, `shared`, `infra`

---

## Environment Variables

### Auth Service (`api/auth/.env`)
- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — Server port (default: 3000)
- `JWT_SECRET` — Secret for signing access tokens
- `REFRESH_TOKEN_SECRET` — Secret for signing refresh tokens
- `RABBITMQ_URL` — RabbitMQ connection (optional — works without it)
- `LOG_LEVEL` — Pino log level (default: "info")
- `SALT` — Bcrypt rounds (default: 10)

### Email Service (`api/email/.env`)
- `RABBITMQ_URL` — RabbitMQ connection (required)
- `RESEND_API_KEY` — Resend API key for sending emails
- `FROM_EMAIL` — Sender address (default: `Nature Shop <onboarding@resend.dev>`)
- `VERIFICATION_URL_BASE` — Base URL for verification links
- `LOG_LEVEL` — Pino log level (default: "info")

### Docker Compose (`.env` at root)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`
- `RABBITMQ_USER`, `RABBITMQ_PASS`

---

## Key Principles

1. **No `any` types** — Use `unknown` and narrow with type guards
2. **Explicit return types** — Always declare function return types
3. **Type imports** — Use `import type` for type-only imports
4. **Fail fast** — Validate input early, throw meaningful errors
5. **Test first** — TDD is mandatory, not optional
6. **90% coverage minimum** — No exceptions
7. **Structured logging** — No string interpolation in logs
8. **Fire & forget events** — Event publishing never breaks the main operation
9. **Hexagonal purity** — Domain NEVER imports from infrastructure
10. **Shared contracts** — Event types live in `@ecommerce/shared`, both services import them

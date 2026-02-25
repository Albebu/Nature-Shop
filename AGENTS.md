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
- Message Broker: Kafka (planned)
- Container Orchestration: Kubernetes (planned)

---

## Architecture

**Monorepo Structure:**
```
/
├── api/           # Microservicios backend
│   ├── auth/      # Autenticación JWT + refresh tokens
│   └── orders/    # Gestión de pedidos
├── ui/            # Frontend (Next.js - planned)
├── shared/        # Código compartido entre servicios
└── k8s/           # Kubernetes manifests
```

**Hexagonal Architecture (Ports & Adapters) per Service:**
```
api/auth/src/
├── domain/        # Entidades, value objects, puertos (interfaces)
├── application/   # Casos de uso, servicios de aplicación
├── infrastructure/# Adaptadores (DB, APIs externas, repositories)
└── interfaces/    # Controladores, routes, DTOs
```

**Path Aliases (tsconfig.json):**
- `@domain/*` → `src/domain/*`
- `@application/*` → `src/application/*`
- `@infrastructure/*` → `src/infrastructure/*`

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

### Service Level (e.g., api/auth)
```bash
pnpm --filter @ecommerce/auth-service dev          # Development with hot reload
pnpm --filter @ecommerce/auth-service build        # Compile TypeScript
pnpm --filter @ecommerce/auth-service start        # Run compiled code
pnpm --filter @ecommerce/auth-service typecheck    # Type check only
pnpm --filter @ecommerce/auth-service test         # Run all tests once
pnpm --filter @ecommerce/auth-service test:watch   # Watch mode
pnpm --filter @ecommerce/auth-service test:coverage # Coverage report
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
pnpm --filter @ecommerce/auth-service exec prisma migrate dev --name init
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

**Use custom error classes for domain errors:**
```typescript
// Domain errors
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User with id ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
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
// schemas/create-user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
```

**Validate at controller level:**
```typescript
// controllers/user.controller.ts
import { createUserSchema } from '../schemas/create-user.schema';

export async function createUser(req: Request, res: Response): Promise<void> {
  const validatedData = createUserSchema.parse(req.body);
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

### Coverage Requirement

**Minimum: 90% coverage** — PRs below this threshold will fail.

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
fix(orders): correct total calculation
test(auth): add login integration tests
refactor(auth): extract token validation to middleware
```

---

## Environment Variables

Required per service (check `.env.example` when available):
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret for signing tokens
- `JWT_EXPIRES_IN` — Token expiration (e.g., "15m", "7d")
- `REFRESH_TOKEN_EXPIRES_IN` — Refresh token expiration
- `LOG_LEVEL` — Pino log level (default: "info")

---

## Key Principles

1. **No `any` types** — Use `unknown` and narrow with type guards
2. **Explicit return types** — Always declare function return types
3. **Type imports** — Use `import type` for type-only imports
4. **Fail fast** — Validate input early, throw meaningful errors
5. **Test first** — TDD is mandatory, not optional
6. **90% coverage minimum** — No exceptions
7. **Structured logging** — No string interpolation in logs

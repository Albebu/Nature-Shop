# 🌿 Nature Shop

Ecommerce multitentant especializado en productos naturales y terapéuticos.

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D22.0.0-green?logo=node.js)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-%3E%3D10.0.0-blue?logo=pnpm)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

---

## 📖 Descripción

**Nature Shop** es un ecommerce especializado en los productos naturales y en servicios de profesionales de la salud. El proyecto se centra
en ofrecer la posibilidad a pequeños y medianos negocios una forma fácil y accesible de aumentar el alcance comercial y la posibilidad de
gestionar ventas de productos y de servicios de forma totalmente online, gestionando las tareas típicas de un ecommerce y además ofreciendo
la capacidad de gestionar reservas, clientes, stock y más funcionalidades.

### ¿Por qué este proyecto?

Este proyecto nace de dos factores, la problemática que presentan pequeños negocios que no son capaces de darse a conocer de una forma fácil
y el aprendizaje personal para mejorar mi habilidad como desarrollador backend aplicando las mejores prácticas y enfrentando un gran desafío como es el desarrollar un proyecto así de grande.

---

## ✨ Características

### Actuales
- ✅ Arquitectura de microservicios con Arquitectura Hexagonal
- ✅ Autenticación JWT con refresh tokens
- ✅ Verificación de email con tokens de un solo uso
- ✅ Event-driven architecture con RabbitMQ
- ✅ Email service con Resend (envío real de emails)
- ✅ Validación estricta con Zod
- ✅ TypeScript en modo estricto
- ✅ Logging estructurado con Pino
- ✅ TDD con 100% cobertura
- ✅ Documentación interactiva con Scalar (OpenAPI)
- ✅ Docker Compose (PostgreSQL + RabbitMQ)
- ✅ Dockerfile multi-stage para auth service

### Planificadas
- 🔲 API Gateway con rate limiting
- 🔲 Servicio de pedidos (api/orders)
- 🔲 Kubernetes deployment completo
- 🔲 Frontend con Next.js
- 🔲 CI/CD pipeline

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                          │
│                    (Rate Limiting, Auth)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │  Auth   │   │  Email  │   │ Orders  │
   │ Service │   │ Service │   │ Service │
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │
        │     ┌───────┴───────┐     │
        │     │   RabbitMQ    │     │
        │     │ (msg broker)  │     │
        │     └───────────────┘     │
        │                           │
        └───────────┬───────────────┘
                    ▼
            ┌───────────────┐
            │   PostgreSQL  │
            └───────────────┘
```

### Flujo de verificación de email

```
POST /api/auth/register
  → Auth guarda usuario en PostgreSQL
  → Auth genera verification token
  → Auth publica evento "user.registered" a RabbitMQ
  → Email service consume el evento
  → Email service envía email via Resend
  → Usuario recibe email con botón "Verify Email"
  → Click → GET /api/auth/verify-email?token=UUID
  → Auth valida token y marca emailVerifiedAt ✅
```

### Estructura del Monorepo

```
/
├── api/                    # Microservicios backend
│   ├── auth/              # Autenticación JWT + refresh tokens + verificación email
│   ├── email/             # Servicio de emails (consumer RabbitMQ + Resend)
│   └── orders/            # Gestión de pedidos (planned)
├── shared/                 # Código compartido (@ecommerce/shared)
│   └── src/types/events.ts # Contratos de eventos (DomainEvent, UserRegisteredEvent)
├── k8s/                    # Kubernetes manifests
└── docker-compose.yml      # PostgreSQL + RabbitMQ
```

### Arquitectura Hexagonal (por servicio)

Cada microservicio sigue Arquitectura Hexagonal (Ports & Adapters) con 3 capas:

| Capa | Responsabilidad |
|------|-----------------|
| **Domain** | Entidades, value objects, interfaces de puertos (repositorios, servicios) |
| **Application** | Casos de uso, orquestación de la lógica de negocio |
| **Infrastructure** | Adaptadores entrantes (controllers, routes) y salientes (DB, RabbitMQ, APIs externas) |

```
api/auth/src/
├── domain/           # Núcleo — sin dependencias externas
│   ├── entities/     # User, RefreshToken, VerificationToken
│   ├── errors/       # DomainError subclasses
│   └── ports/        # Interfaces: UserRepository, EventPublisher, TokenService...
├── application/      # Casos de uso — depende solo del dominio
│   ├── use-cases/    # Register, Login, VerifyEmail, RefreshToken...
│   └── dtos/         # Zod schemas + tipos inferidos
└── infrastructure/   # Adaptadores — implementan puertos
    ├── driving/      # HTTP: controllers, routes
    └── driven/       # Prisma repos, JWT, RabbitMQ publisher, Pino logger...
```

---

## 🛠️ Tech Stack

| Categoría | Tecnología |
|-----------|------------|
| **Runtime** | Node.js 22+ |
| **Package Manager** | pnpm 10+ (monorepo) |
| **Framework** | Express 5 |
| **Language** | TypeScript 5.7 (strict mode) |
| **ORM** | Prisma 7 |
| **Database** | PostgreSQL 17 |
| **Validation** | Zod 4 |
| **Testing** | Vitest + Supertest |
| **Logging** | Pino |
| **Auth** | JWT + Refresh Tokens |
| **Message Broker** | RabbitMQ 4 |
| **Email Provider** | Resend |
| **API Docs** | Scalar (OpenAPI) |
| **Container** | Docker + Kubernetes |

---

## 📋 Prerrequisitos

- [Node.js](https://nodejs.org/) >= 22.0.0
- [pnpm](https://pnpm.io/) >= 10.0.0
- [Docker](https://www.docker.com/) (para PostgreSQL y RabbitMQ)

---

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/TU_USER/nature-shop.git
cd nature-shop

# Instalar dependencias
pnpm install

# Levantar infraestructura (PostgreSQL + RabbitMQ)
docker compose up -d

# Configurar variables de entorno
cp .env.example .env
# Editar api/auth/.env y api/email/.env con tus valores

# Configurar base de datos
pnpm --filter @ecommerce/auth-service exec prisma migrate dev

# Iniciar servicios en desarrollo
pnpm --filter @ecommerce/auth-service dev    # Terminal 1
pnpm --filter @ecommerce/email-service dev   # Terminal 2
```

### Verificar que todo funciona

- **Auth service**: http://localhost:8080/health
- **API Docs**: http://localhost:8080/api/auth/docs
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

---

## 💻 Comandos de Desarrollo

### Nivel Root (Monorepo)

```bash
pnpm lint              # ESLint check
pnpm lint:fix          # ESLint auto-fix
pnpm format            # Prettier format
pnpm typecheck         # TypeScript check
pnpm test              # Run all tests
pnpm test:coverage     # Coverage report
pnpm build             # Build all services
```

### Nivel Servicio

```bash
# Auth service
pnpm --filter @ecommerce/auth-service dev          # Development
pnpm --filter @ecommerce/auth-service test         # Run tests
pnpm --filter @ecommerce/auth-service test:coverage # Coverage

# Email service
pnpm --filter @ecommerce/email-service dev          # Development
pnpm --filter @ecommerce/email-service test         # Run tests
```

### Test Individual

```bash
# Desde el directorio del servicio
pnpm test src/domain/user/user.test.ts

# Por nombre de test
npx vitest run -t "should create user"
```

---

## 🔑 Variables de Entorno

### Auth Service (`api/auth/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/nature_shop_auth` |
| `PORT` | Puerto del servicio | `8080` |
| `JWT_SECRET` | Secret para signing tokens | `your-secret-key` |
| `REFRESH_TOKEN_SECRET` | Secret para refresh tokens | `your-refresh-secret` |
| `RABBITMQ_URL` | RabbitMQ connection (opcional) | `amqp://guest:guest@localhost:5672` |
| `LOG_LEVEL` | Nivel de logging | `info` |

### Email Service (`api/email/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `RABBITMQ_URL` | RabbitMQ connection | `amqp://guest:guest@localhost:5672` |
| `RESEND_API_KEY` | API key de Resend | `re_xxxxx` |
| `FROM_EMAIL` | Email remitente | `Nature Shop <onboarding@resend.dev>` |
| `VERIFICATION_URL_BASE` | Base URL para verificación | `http://localhost:8080/api/auth/verify-email` |
| `LOG_LEVEL` | Nivel de logging | `info` |

---

## 🗺️ Roadmap

### Fase 1: Core Backend ✅
- [x] Setup monorepo + TypeScript strict
- [x] Configuración de linting y formatting
- [x] Servicio de autenticación (register, login, refresh, logout, change-password)
- [x] Verificación de email con RabbitMQ + Resend
- [x] Email service como microservicio independiente
- [x] 100% test coverage
- [x] Documentación API con Scalar (OpenAPI)

### Fase 2: Infrastructure (En progreso)
- [x] Docker Compose (PostgreSQL + RabbitMQ)
- [x] Dockerfile multi-stage para auth service
- [x] Kubernetes manifests iniciales
- [ ] API Gateway
- [ ] CI/CD pipeline
- [ ] Kubernetes deployment completo

### Fase 3: Orders Service
- [ ] Servicio de pedidos
- [ ] Eventos de pedidos via RabbitMQ
- [ ] Integración con inventario

### Fase 4: Frontend
- [ ] Next.js setup
- [ ] UI components
- [ ] Integración con backend

### Fase 5: Production
- [ ] Monitoring & observability
- [ ] Rate limiting
- [ ] Caching

---

## 👤 Autor

**Alex Bellosta**

- GitHub: [@albebu](https://github.com/albebu)
- LinkedIn: [alex-bellosta](https://linkedin.com/in/alex-bellosta)

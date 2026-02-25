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
- ✅ Validación estricta con Zod
- ✅ TypeScript en modo estricto
- ✅ Logging estructurado con Pino
- ✅ TDD con 90%+ cobertura

### Planificadas
- 🔲 API Gateway con rate limiting
- 🔲 Event-driven architecture con Kafka
- 🔲 Kubernetes deployment
- 🔲 Frontend con Next.js
- 🔲 Documentación con Swagger

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
   │  Auth   │   │ Orders  │   │ [TBD]   │
   │ Service │   │ Service │   │ Service │
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │
        └─────────────┼─────────────┘
                      ▼
              ┌───────────────┐
              │   PostgreSQL  │
              └───────────────┘
```

### Estructura del Monorepo

```
/
├── api/                    # Microservicios backend
│   ├── auth/              # Autenticación JWT + refresh tokens
│   └── orders/            # Gestión de pedidos
├── ui/                     # Frontend (Next.js - planned)
├── shared/                 # Código compartido entre servicios
└── k8s/                    # Kubernetes manifests
```

### Arquitectura Hexagonal (por servicio)

Cada microservicio sigue Arquitectura Hexagonal (Ports & Adapters) con 3 capas:

| Capa | Responsabilidad |
|------|-----------------|
| **Domain** | Entidades, value objects, interfaces de puertos (repositorios, servicios) |
| **Application** | Casos de uso, orquestación de la lógica de negocio |
| **Infrastructure** | Adaptadores entrantes (controllers, routes, DTOs) y salientes (DB, APIs externas) |

```
api/auth/src/
├── domain/           # Núcleo — sin dependencias externas
│   ├── entities/     # User, Token...
│   ├── value-objects/
│   └── ports/        # Interfaces: UserRepository, TokenService...
├── application/      # Casos de uso — depende solo del dominio
│   └── use-cases/    # CreateUser, Login, RefreshToken...
└── infrastructure/   # Adaptadores — depende del dominio
  ├── driving/      # HTTP: controllers, routes, DTOs
  └── driven/       # Prisma repos, JWT service, Pino logger...
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
| **Database** | PostgreSQL |
| **Validation** | Zod 4 |
| **Testing** | Vitest + Supertest |
| **Logging** | Pino |
| **Auth** | JWT + Refresh Tokens |
| **Message Broker** | Kafka (planned) |
| **Container** | Kubernetes (planned) |

---

## 📋 Prerrequisitos

- [Node.js](https://nodejs.org/) >= 22.0.0
- [pnpm](https://pnpm.io/) >= 10.0.0
- [PostgreSQL](https://www.postgresql.org/) >= 15
- [Docker](https://www.docker.com/) (opcional, para desarrollo)

---

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/TU_USER/nature-shop.git
cd nature-shop

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp api/auth/.env.example api/auth/.env

# Configurar base de datos
pnpm --filter @ecommerce/auth-service exec prisma migrate dev

# Iniciar en desarrollo
pnpm --filter @ecommerce/auth-service dev
```

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

### Nivel Servicio (ej: auth)

```bash
pnpm --filter @ecommerce/auth-service dev          # Development
pnpm --filter @ecommerce/auth-service test         # Run tests
pnpm --filter @ecommerce/auth-service test:watch   # Watch mode
```

### Test Individual

```bash
# Desde el directorio del servicio
pnpm test src/domain/user/user.test.ts

# Por nombre de test
npx vitest run -t "should create user"
```

---

## 🗺️ Roadmap

### Fase 1: Core Backend ✅ (En progreso)
- [x] Setup monorepo + TypeScript strict
- [x] Configuración de linting y formatting
- [ ] Servicio de autenticación completo
- [ ] Servicio de pedidos
- [ ] 90%+ test coverage

### Fase 2: Infrastructure
- [ ] API Gateway
- [ ] Kafka integration
- [ ] Docker containers
- [ ] Kubernetes manifests

### Fase 3: Frontend
- [ ] Next.js setup
- [ ] UI components
- [ ] Integration con backend

### Fase 4: Production
- [ ] CI/CD pipeline
- [ ] Monitoring & observability
- [ ] Documentation (Swagger)

---

## 👤 Autor

**Alex Bellosta**

- GitHub: [@albebu](https://github.com/albebu)
- LinkedIn: [alex-bellosta](https://linkedin.com/in/alex-bellosta)

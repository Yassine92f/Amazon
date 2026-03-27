# E-Commerce Platform

An advanced Amazon-like e-commerce platform built with the **MERN stack + Next.js 15**. This monorepo houses a fully-featured online marketplace with real-time notifications, Stripe payment integration, role-based access control, and a clean/hexagonal backend architecture.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Running the Application](#running-the-application)
- [Available Scripts](#available-scripts)
- [Docker](#docker)
- [Team Sections](#team-sections)
- [Development Workflow](#development-workflow)
  - [Branch Strategy](#branch-strategy)
  - [Pull Request Rules](#pull-request-rules)
  - [Conventions](#conventions)
- [API Documentation](#api-documentation)
- [License](#license)

---

## Tech Stack

| Layer         | Technologies                                             |
| ------------- | -------------------------------------------------------- |
| **Frontend**  | Next.js 15 (App Router), React 19, Tailwind CSS, Zustand |
| **Backend**   | Node.js, Express.js, TypeScript                          |
| **Database**  | MongoDB (Mongoose)                                       |
| **Cache**     | Redis                                                    |
| **Payments**  | Stripe (sandbox mode)                                    |
| **Real-time** | WebSockets (Socket.IO)                                   |
| **Monorepo**  | pnpm workspaces                                          |
| **DevOps**    | Docker, Docker Compose, GitHub Actions CI/CD             |
| **Quality**   | ESLint, Prettier, Husky, lint-staged                     |

---

## Architecture

The backend follows a **Clean / Hexagonal Architecture** with strict layer separation:

```
┌──────────────────────────────────────────────────────┐
│                   INTERFACES LAYER                    │
│   HTTP Controllers, Routes, Middlewares, WebSocket    │
├──────────────────────────────────────────────────────┤
│                  APPLICATION LAYER                    │
│           Use Cases, DTOs, Orchestration              │
├──────────────────────────────────────────────────────┤
│                    DOMAIN LAYER                       │
│    Entities, Repository Interfaces, Domain Services   │
├──────────────────────────────────────────────────────┤
│                INFRASTRUCTURE LAYER                   │
│  Database Models, Redis Cache, Repository Impls,      │
│  External Services                                    │
└──────────────────────────────────────────────────────┘
```

**Key principles:**

- **Domain layer** has zero external dependencies — pure business logic
- **Application layer** orchestrates use cases via DTOs and repository interfaces
- **Infrastructure layer** implements persistence (MongoDB, Redis) behind domain-defined interfaces
- **Interfaces layer** handles HTTP/WebSocket transport and middleware concerns
- **Shared package** (`/shared`) provides TypeScript API contracts consumed by both server and client

---

## Project Structure

```
ecommerce-platform/
├── shared/                          # Shared TypeScript API contracts
│   └── src/
│       ├── types/                   # Request/response types, enums, interfaces
│       └── index.ts                 # Barrel export
│
├── server/                          # Express.js backend
│   └── src/
│       ├── domain/                  # Core business logic
│       │   ├── entities/            # Domain entities (User, Product, Order, …)
│       │   ├── repositories/        # Repository interfaces (ports)
│       │   └── services/            # Domain services
│       ├── application/             # Application logic
│       │   ├── use-cases/           # Use case implementations
│       │   └── dtos/                # Data Transfer Objects
│       ├── infrastructure/          # External concerns
│       │   ├── database/            # Mongoose models & connection
│       │   ├── cache/               # Redis cache layer
│       │   ├── repositories/        # Repository implementations (adapters)
│       │   └── services/            # External service integrations
│       ├── interfaces/              # Transport layer
│       │   ├── http/                # Controllers, routes, middlewares
│       │   └── websocket/           # WebSocket event handlers
│       ├── config/                  # App configuration
│       ├── app.ts                   # Express app setup
│       └── server.ts                # Server entry point
│
├── client/                          # Next.js 15 frontend
│   └── src/
│       ├── app/                     # App Router pages & layouts
│       ├── components/              # Reusable React components
│       ├── lib/                     # Utilities, API client, helpers
│       ├── store/                   # Zustand state management
│       └── types/                   # Client-specific types
│
├── docker-compose.yml               # Full stack (MongoDB, Redis, server, client)
├── docker-compose.dev.yml           # Dev mode (MongoDB + Redis only)
├── pnpm-workspace.yaml              # pnpm workspace configuration
├── package.json                     # Root scripts & dev dependencies
├── .env.example                     # Environment variable template
└── README.md
```

---

## Getting Started

### Prerequisites

| Tool               | Version |
| ------------------ | ------- |
| **Node.js**        | >= 20.x |
| **pnpm**           | >= 9.x  |
| **Docker**         | Latest  |
| **Docker Compose** | Latest  |

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd ecommerce-platform

# Install all dependencies (hoisted via pnpm workspaces)
pnpm install
```

### Environment Setup

Copy the example environment file and fill in the required values:

```bash
cp .env.example .env
```

The `.env` file includes configuration for:

| Variable Group          | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `MONGODB_URI`           | MongoDB connection string                       |
| `REDIS_URL`             | Redis connection string                         |
| `JWT_SECRET`            | Secret for signing JWT access tokens            |
| `JWT_REFRESH_SECRET`    | Secret for signing JWT refresh tokens           |
| `STRIPE_SECRET_KEY`     | Stripe sandbox/test secret key                  |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret                   |
| `SMTP_*`                | SMTP credentials for email notifications        |
| `CLIENT_URL`            | Frontend URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL`   | Public API URL for Next.js client               |

### Running the Application

```bash
# 1. Start MongoDB + Redis via Docker
docker compose -f docker-compose.dev.yml up -d

# 2. Start the development servers (server on :5000, client on :3000)
pnpm dev
```

Verify the server is running:

```bash
curl http://localhost:5000/api/health
```

---

## Available Scripts

All scripts are run from the **project root**.

| Command             | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `pnpm dev`          | Run server + client concurrently                        |
| `pnpm dev:server`   | Run the Express server only (port 5000)                 |
| `pnpm dev:client`   | Run the Next.js client only (port 3000)                 |
| `pnpm build`        | Build all packages in order: shared -> server -> client |
| `pnpm build:shared` | Build the shared types package                          |
| `pnpm build:server` | Build the server                                        |
| `pnpm build:client` | Build the Next.js client                                |
| `pnpm lint`         | Lint all workspaces                                     |
| `pnpm format`       | Format all files with Prettier                          |
| `pnpm format:check` | Check formatting without writing                        |
| `pnpm test`         | Run all tests across workspaces                         |

---

## Docker

### Development Mode (recommended for local development)

Runs **only MongoDB and Redis** as containers. You run the server and client locally with `pnpm dev`.

```bash
docker compose -f docker-compose.dev.yml up -d
```

| Service | Image            | Port  |
| ------- | ---------------- | ----- |
| MongoDB | `mongo:7`        | 27017 |
| Redis   | `redis:7-alpine` | 6379  |

### Full Stack Mode

Runs **the entire application** in Docker (MongoDB, Redis, server, client).

```bash
docker compose up -d
```

| Service | Image            | Port  |
| ------- | ---------------- | ----- |
| MongoDB | `mongo:7`        | 27017 |
| Redis   | `redis:7-alpine` | 6379  |
| Server  | Custom build     | 5000  |
| Client  | Custom build     | 3000  |

### Stopping Containers

```bash
# Dev mode
docker compose -f docker-compose.dev.yml down

# Full stack
docker compose down
```

---

## Team Sections

The project is divided into **4 feature sections**, each owned by a developer:

### Section 1 — Auth & Admin

> Branch: `feature/auth-admin`

- JWT authentication (access + refresh token rotation)
- Role-Based Access Control (RBAC): `admin`, `seller`, `user`
- User registration, login, logout, password reset
- Admin dashboard (user management, platform metrics)
- Auth middleware (ships first — other sections can use mocks until ready)

### Section 2 — Catalog & Search

> Branch: `feature/catalog-search`

- Product CRUD operations
- Categories and subcategories
- Product variants (size, color, etc.)
- Full-text search with filters (price range, category, rating)
- Product recommendations engine
- Seller dashboard (inventory management, analytics)

### Section 3 — Cart, Orders & Payment

> Branch: `feature/cart-orders`

- Shopping cart management
- Checkout flow
- Stripe sandbox payment processing
- Order tracking and status updates
- Product reviews and ratings
- Wishlist
- Delivery types and shipping options

### Section 4 — Infrastructure & Transversal

> Branch: `feature/infra-transverse`

- Docker containerization and orchestration
- CI/CD pipeline (GitHub Actions)
- Redis caching strategy
- WebSocket real-time features (notifications, messaging)
- Email notification service (SMTP)
- Swagger / OpenAPI documentation
- Integration tests

---

## Development Workflow

### Branch Strategy

```
main                          # Production-ready releases
  └── develop                 # Integration branch
        ├── feature/auth-admin
        ├── feature/catalog-search
        ├── feature/cart-orders
        └── feature/infra-transverse
```

- **`main`** — stable, production-ready code only
- **`develop`** — integration branch where all features merge
- **`feature/*`** — individual section branches

### Pull Request Rules

1. **All merges into `develop` require a Pull Request** with a minimum of **1 reviewer**
2. **Rebase on `develop` every 2 days minimum** to avoid large merge conflicts
3. **Any change to API contracts in `/shared`** requires a PR + team-wide notification
4. Pre-commit hooks automatically enforce linting and formatting via Husky + lint-staged

### Conventions

- **Code language:** All code, comments, variable names, and documentation are written in **English**
- **Linting:** ESLint with TypeScript rules — auto-fixed on commit
- **Formatting:** Prettier — auto-formatted on commit
- **Commit hooks:** Husky runs `lint-staged` before every commit
- **Auth dependency:** Section 1 delivers auth middleware first. Other sections can use mock auth until the middleware is available
- **Build order:** `shared` must be built before `server` and `client` (the `pnpm build` script handles this automatically)

---

## API Documentation

### Health Check

```
GET http://localhost:5000/api/health
```

Returns the server status and uptime.

### Swagger / OpenAPI

Interactive API documentation is available at:

```
http://localhost:5000/api-docs
```

> Swagger documentation is set up and maintained by **Section 4 (Infra & Transversal)**.

### Base API URL

```
http://localhost:5000/api
```

---

## License

This project is licensed under the [MIT License](LICENSE).

# UniHub Backend Architecture

## 1. Architectural Overview
This project utilizes a **Modular Monolith** architecture driven by **Domain-Driven Design (DDD)** principles. 

Instead of organizing files by their technical role (e.g., putting all controllers in one folder and all services in another), we organize files by **Business Domain** (e.g., Course, User, Registration). This keeps feature-specific code isolated, making it easier to maintain, test, and scale.

## 2. Directory Structure

```text
unihub-backend/
├── generated/              # Auto-generated Prisma client (ignored in git)
├── prisma/
│   └── schema.prisma       # Database schema and models
├── src/
│   ├── app.ts              # Express application setup & middleware injection
│   ├── server.ts           # Entry point: connects DBs, starts server, handles shutdown
│   │
│   ├── config/             # Global configurations
│   │   ├── env.ts          # Zod validation for process.env
│   │   └── prisma.ts       # Prisma Client singleton setup
│   │
│   ├── core/               # Cross-domain logic & infrastructure
│   │   ├── errors/         # Custom Error classes (AppError, NotFoundError, etc.)
│   │   ├── middlewares/    # Global middlewares (Auth, Error, Response, Zod Validation)
│   │   └── utils/          # Generic helper functions (logger, formatters)
│   │
│   ├── modules/            # 🚀 THE DOMAINS (Feature Folders)
│   │   └── _template/      # Blueprint for creating new features
│   │       ├── entity.routes.ts      # Express route definitions
│   │       ├── entity.controller.ts  # Extracts req data, formats res.ok()
│   │       ├── entity.service.ts     # Pure business logic (No DB calls, no Express req/res)
│   │       ├── entity.repository.ts  # Pure database logic (Prisma calls only)
│   │       └── entity.schema.ts      # Zod validation schemas
│   │
│   ├── workers/            # Background processes (BullMQ consumers)
│   │
│   └── types/              # Global TypeScript type definitions
│       └── express.d.ts    # Merged types for custom Request/Response properties
│
├── .env.example            # Template for environment variables
├── ARCHITECTURE.md         # This document
├── package.json
└── tsconfig.json
```

## 3. Data Flow (The Request Lifecycle)
Every incoming request must follow this strict unidirectional flow. **Layers are not allowed to skip steps.**

1. **Route (`entity.routes.ts`):** * Maps the HTTP method and path to the Controller.
   * Injects the `validate` middleware with the Zod schema.
2. **Controller (`entity.controller.ts`):** * Reads data from `req.validated`.
   * Calls the Service layer.
   * Returns data using the custom `res.ok()` or `res.created()` wrappers.
   * *Rule: Controllers never contain business logic and never talk to the database.*
3. **Service (`entity.service.ts`):** * Contains the core business rules (e.g., "Is the user eligible?", "Is the name a duplicate?").
   * Calls the Repository to fetch or save data.
   * Throws `AppError` instances if rules are violated.
   * *Rule: Services never access `req` or `res` objects. Services never write raw Prisma queries.*
4. **Repository (`entity.repository.ts`):** * Handles the actual data persistence using Prisma.
   * *Rule: Only Repositories are allowed to import the `prisma` client.*

## 4. Error Handling Strategy
* Do not use generic `try/catch` with `res.status(500)` inside Services or Repositories.
* Instead, throw a specific custom error from `src/core/errors/AppError.ts` (e.g., `throw new NotFoundError("User not found")`).
* The error will bubble up to the controller and be caught by the global `errorHandler` middleware, which guarantees a consistent JSON format for the frontend.

## 5. Security & Validation
* **Authentication:** A global middleware (`auth.middleware.ts`) checks the `api-key` header on every request before it hits the routers.
* **Input Validation:** All `req.body`, `req.query`, and `req.params` are validated by Zod schemas. Validated, type-safe data is attached to `req.validated` to prevent malicious payloads from reaching the controllers.

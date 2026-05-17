# UniHub Workshop

A full-stack monorepo platform for managing university workshops and events. Provides student registration, payment tracking, attendance check-ins, email notifications, and AI-powered workshop summaries.

## Table of Contents

- [UniHub Workshop](#unihub-workshop)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
    - [`apps/api/.env`](#appsapienv)
    - [`apps/worker/.env`](#appsworkerenv)
    - [`apps/web/.env`](#appswebenv)
    - [`packages/db/.env`](#packagesdbenv)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
  - [Building for Production](#building-for-production)
  - [Scripts Reference](#scripts-reference)

---

## Features

- **Authentication** — OTP-based login with JWT access/refresh token rotation
- **Workshop Management** — Create, publish, and manage workshops with capacity, pricing, and scheduling
- **Registration System** — Student registration with 10-minute hold window and status tracking
- **Payment Tracking** — Payment status management integrated into the registration flow
- **Check-in / Attendance** — QR code-based check-in tracking
- **Email Notifications** — Transactional emails for registration, payment, and check-in events
- **AI Summaries** — GPT-4o-mini powered PDF summarization for workshop materials
- **Bulk Import** — CSV-based student import with nightly scheduled processing
- **Role-based Access** — Student, Staff, and Admin roles
- **Background Jobs** — BullMQ worker for async processing (email, PDF, CSV import)

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | Node.js, Express 5, TypeScript |
| Frontend | React 19, Vite, React Router, Zustand |
| Database | PostgreSQL, Prisma ORM |
| Cache / Queue | Redis, BullMQ |
| AI | OpenAI API (gpt-4o-mini) |
| Email | Nodemailer (Gmail SMTP) |
| Validation | Zod |
| Security | Helmet, express-rate-limit, CORS |

---

## Project Structure

```
unihub-workshop/
├── apps/
│   ├── api/        # Express REST API
│   ├── web/        # React + Vite frontend
│   └── worker/     # BullMQ background job processor
├── packages/
│   ├── db/         # Prisma schema, migrations, seed
│   ├── shared/     # Shared types, constants, validation
│   └── config/     # Shared tooling configuration
└── docs/           # Architecture and additional documentation
```

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **PostgreSQL** v14 or later
- **Redis** v6 or later
- **Gmail account** with an [App Password](https://support.google.com/accounts/answer/185833) for SMTP
- **OpenAI API key** _(optional — required only for AI PDF summaries)_

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/IamTpG/unihub-workshop.git
cd unihub-workshop

# 2. Install all dependencies (root + all workspaces)
npm install
```

---

## Environment Variables

Each app requires its own `.env` file. Create them by copying the examples below.

### `apps/api/.env`

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/unihub_workshop

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# OTP
OTP_TTL=600
OTP_LENGTH=6
OTP_MAX_ATTEMPTS=5

# Redis
REDIS_URL=redis://localhost:6379

# Email (Gmail SMTP)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="UniHub Workshop <your-email@gmail.com>"

# Security
API_KEY=your-api-key
CORS_ORIGIN=https://localhost:5173
```

### `apps/worker/.env`

```env
NODE_ENV=development

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/unihub_workshop
REDIS_URL=redis://localhost:6379

SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="UniHub Workshop <your-email@gmail.com>"

# Path to CSV for nightly student import
NIGHTLY_CSV_PATH=./samples/students-sample.csv

# Optional — required for AI PDF summaries
OPENAI_API_KEY=sk-...
```

### `apps/web/.env`

```env
VITE_API_URL=http://localhost:3000
VITE_API_KEY=your-api-key
```

### `packages/db/.env`

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/unihub_workshop
```

---

## Database Setup

```bash
# Generate the Prisma client
npm run db:generate

# Apply migrations to your database
npm run db:migrate

# Seed initial data
npm run db:seed
```

---

## Running the Application

Start all three services in separate terminals:

```bash
# Terminal 1 — API (http://localhost:3000)
npm run dev:api

# Terminal 2 — Web (https://localhost:5173)
npm run dev:web

# Terminal 3 — Background worker
npm run dev:worker
```

---

## Building for Production

```bash
# Build all apps
npm run build:api
npm run build:web
npm run build:worker

# Start production servers
npm run start:api
npm run start:web
npm run start:worker
```

---

## Scripts Reference

| Script | Description |
|---|---|
| `npm run dev:api` | Start API in watch mode |
| `npm run dev:web` | Start Vite dev server |
| `npm run dev:worker` | Start worker in watch mode |
| `npm run build:api` | Compile API TypeScript |
| `npm run build:web` | Bundle frontend with Vite |
| `npm run build:worker` | Compile worker TypeScript |
| `npm run start:api` | Run compiled API |
| `npm run start:web` | Serve built frontend |
| `npm run start:worker` | Run compiled worker |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |
| `npm run lint:api` | Lint API source |
| `npm run format:api` | Format API source |

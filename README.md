# Medical Learning Portal

Production-minded full-stack system for medical students to share and review study resources (YouTube + document links) before exams, with separate student and admin experiences.

## Engineer Pitch

This repository demonstrates practical software engineering beyond feature delivery:

- Multi-app monorepo with shared contracts (`@medical-portal/shared`) to reduce cross-app drift.
- Security-first dual auth architecture (student OAuth flow + admin JWT/refresh flow).
- Migration-first database operations with deterministic SQL history.
- Performance and reliability hardening for zero-budget infrastructure (Supabase Free + Render Free + Vercel Hobby).

## Architecture Diagram

```mermaid
flowchart LR
  studentClient[Student Web\nNext.js + NextAuth + React Query]
  adminClient[Admin Web\nVite + Refine + Antd]
  vercel[Vercel Edge/Hosting]
  render[Render Service\nNestJS API]
  supabase[(Supabase Postgres)]
  sharedPkg[@medical-portal/shared\nTypes + Error Contracts]

  studentClient --> vercel
  adminClient --> vercel
  vercel -->|"/api/v1/*"| render
  render --> supabase

  sharedPkg -.shared contracts.-> studentClient
  sharedPkg -.shared contracts.-> adminClient
  sharedPkg -.shared contracts.-> render
```

## System Design Highlights

### 1) Monorepo and Contract Governance

- `apps/service-api`: NestJS API
- `apps/web-client`: Next.js student portal
- `apps/web-admin`: Refine-based admin panel
- `packages/shared`: unified types, DTO-aligned interfaces, error catalog
- `database/migrations`: ordered SQL migrations with `_schema_migrations` tracking

This structure lets frontend and backend evolve without breaking integration contracts silently.

### 2) Authentication and Session Security

- Student side: OAuth/NextAuth session flow + API refresh path.
- Admin side: username/password + JWT access token + rotating refresh token.
- Strict admin session policy now supports **single active session** (`ADMIN_MAX_ACTIVE_SESSIONS=1`) with DB-backed validation in guard path.
- Session cleanup + retention managed by SQL functions invoked safely from health-driven maintenance.

### 3) API Engineering

- Versioned REST (`/api/v1`) with modular domain boundaries.
- Global validation, interceptors, and standardized response envelope.
- Request tracing and centralized exception mapping to shared error codes.
- Compression + route-level auth rate-limiting on sensitive endpoints.

### 4) Database Lifecycle

- SQL-first schema evolution (indexes, constraints, RLS, utility functions).
- Scripted migration apply/status/reset/seed/admin bootstrap flows.
- Retention cleanup for security artifacts:
  - `refresh_tokens` (expired/revoked)
  - `auth_audit_logs` (old events)

## Stack Overview

| Layer | Technologies |
|---|---|
| Monorepo | pnpm workspaces, TypeScript 5, Makefile |
| API | NestJS 11, Express, Supabase JS, class-validator, cookie-parser |
| Student Web | Next.js 16 (App Router), NextAuth, React Query v5, Zustand, Tailwind, NextUI |
| Admin Web | Vite 5, React 18, Refine, React Router v6, React Query v4, Ant Design |
| Data | Supabase PostgreSQL 15, migration SQL scripts, `pg` tooling |
| Shared Contracts | `@medical-portal/shared` (types/errors/utilities) |

## Performance and Reliability Posture

- Designed for low-average traffic with bursty exam-period concurrency.
- Reduced unnecessary client request churn (session-check/cache tuning).
- Added retention cleanup to prevent unbounded token/audit table growth.
- Admin single-session enforcement prevents concurrent privileged sessions.
- Production-safe defaults while staying compatible with free-tier limits.

## Local Development

### Install

```bash
pnpm install
```

### Run

```bash
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm dev:admin
```

### Validate

```bash
pnpm build
pnpm verify:apps
pnpm lint
```

### Database

```bash
pnpm db:status
pnpm db:migrate
pnpm db:seed
pnpm db:reset
pnpm admin:create
```

## Environment Notes

Minimum runtime configuration:

- API (`apps/service-api/.env`): Supabase URL/keys, `JWT_SECRET`, cookie/CORS settings.
- Student web: `NEXT_PUBLIC_API_URL` and NextAuth settings.
- Admin web: API base URL and deployment mode values.

Session policy controls:

```env
STUDENT_MAX_ACTIVE_SESSIONS=3
ADMIN_MAX_ACTIVE_SESSIONS=1
```

## Portfolio Value

This project showcases end-to-end software engineering capability across architecture, secure auth design, schema governance, operational scripts, and free-tier performance hardening, not just UI implementation.

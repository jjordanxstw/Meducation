# Medical Learning Portal

Production-grade monorepo for a medical education platform with separate student and admin experiences, a modular API, shared domain contracts, and migration-driven database operations.

## Portfolio Snapshot

- Built as a multi-app monorepo with shared TypeScript contracts across frontend and backend.
- Uses API-first architecture with standardized responses, centralized error catalog, and request tracing.
- Supports dual authentication flows: student OAuth session flow and admin JWT + refresh-token flow.
- Designed for operational reliability: SQL migrations, seed/reset scripts, audit logging, and verification pipelines.

## Repository Layout

```text
.
|- apps/
|  |- service-api/     # NestJS REST API
|  |- web-client/      # Next.js 16 student portal
|  `- web-admin/       # React + Vite + Refine admin portal
|- packages/
|  `- shared/          # Shared types, errors, and utilities
`- database/
     |- migrations/      # Versioned SQL migrations
     `- scripts/         # Migration/seed/reset/admin CLI tools
```

## Stack Matrix

| Layer | Core Technologies | Notes |
|---|---|---|
| Monorepo | pnpm workspaces, TypeScript 5, Makefile | Single workspace for apps and shared package |
| API | NestJS 11, Express adapter, class-validator, cookie-parser, compression | URI versioning (`/api/v1`), global filters/interceptors/pipes |
| Student App | Next.js 16 App Router, React 18, NextAuth, Zustand, React Query v5, Tailwind, NextUI | SSR-ready architecture with session-aware API client |
| Admin App | Vite 5, React 18, Refine, React Router v6, Ant Design, React Query v4 | CRUD-heavy management UI with auth/data providers |
| Shared Package | tsup, dual CJS/ESM exports | Shared enums, interfaces, error catalog, helpers |
| Data Layer | PostgreSQL (Supabase), SQL migrations, `pg` scripts | Migration-first schema evolution with indexes and constraints |

## Architecture Overview

### 1) Monorepo Contract-Driven Design

`@medical-portal/shared` is consumed by API and both web apps via `workspace:*`. This keeps domain types and error contracts consistent across boundaries and reduces integration drift.

### 2) API Architecture (NestJS)

The API is organized by domain modules under `modules/v1` and shared infrastructure under `common`.

- Domain modules include auth, admin-auth, resources, lectures, sections, subjects, profiles, calendar, audit, and statistics.
- Global request lifecycle includes:
    - request ID middleware for traceability
    - validation pipe for DTO input safety
    - logging interceptor (method/status/duration/request ID)
    - response envelope interceptor for normalized payload format
    - exception filter mapping to shared error codes
- Versioning strategy: URI-based versioning (`/api/v1/*`) with global `/api` prefix.

### 3) Student Web Architecture (Next.js)

The student app uses App Router route groups (`(auth)` and `(dashboard)`), with provider composition for session, cache, theme, and loading UX.

- Auth/session strategy:
    - NextAuth session as primary user session source.
    - Axios client uses same-origin `/api/v1` in browser for first-party cookie behavior.
    - Request interceptor validates session; response interceptor applies refresh-first on 401.
- State and data:
    - Zustand for lightweight client auth/profile state.
    - React Query v5 for cache and server-state synchronization.

### 4) Admin Web Architecture (Refine + Vite)

The admin app is built around Refine resource-driven routing and Ant Design layouts.

- Auth provider encapsulates login/check/logout/getIdentity/getPermissions behavior.
- Axios-based refresh flow protects admin UX from token expiry interruptions.
- Router uses authenticated layout guards and dedicated `/login` route.
- Vercel rewrite strategy supports:
    - `/api/v1/*` proxying to API host
    - SPA fallback rewrite for deep links

### 5) Database and Data Operations

Database changes are managed through ordered SQL migrations (`0001` to `0012`) and script-based tooling.

- Migration runner stores history in `_schema_migrations` and applies each migration in a transaction.
- Includes integrity/performance hardening such as:
    - unique constraints (e.g., subject/resource-level dedup rules)
    - check constraints (e.g., calendar time range)
    - query indexes for common admin list/filter paths
    - audit schema improvements (`audit_logs.user_email` + index)
- Operational scripts cover: status, apply, reset, seed, generate-migration, and interactive admin creation.

## System Flow (Pseudo-Diagram)

```text
Student Browser / Admin Browser
                |
                v
Web Layer
- web-client (Next.js App Router)
- web-admin (Vite + Refine)
                |
                |  /api/v1/* (same-origin or rewrite/proxy)
                v
service-api (NestJS)
- Auth guards (student/admin/cookie flows)
- Validation + logging + response envelope + exception mapping
- Domain modules (resources/calendar/profiles/audit/...)
                |
                v
PostgreSQL (Supabase)
- Core domain tables
- refresh tokens / active sessions
- audit logs
- migration history
```

## Engineering Quality Signals

### Security

- httpOnly cookie-capable authentication flows for both student and admin paths.
- Environment validation for required secrets at API bootstrap.
- Sanitized error messaging in admin auth flow.
- Audit logging support with indexed query paths.

### Reliability

- Shared error contract and global exception mapping.
- Request-level tracing with request IDs.
- Centralized migration history table and idempotent SQL migration style.

### Maintainability

- Strong TypeScript baseline across workspace.
- Shared package for domain model reuse.
- Scripted operations for build, verify, and database lifecycle.

## Key Commands

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev          # run all apps in parallel
pnpm dev:api      # API only
pnpm dev:web      # student app only
pnpm dev:admin    # admin app only
```

### Build and Verification

```bash
pnpm build
pnpm verify:apps
pnpm lint
```

### Database Operations

```bash
pnpm db:status
pnpm db:migrate
pnpm db:seed
pnpm db:reset
pnpm admin:create
```

## Minimal Environment Checklist

Provide environment variables for:

- `apps/service-api`: Supabase URL/keys, JWT secret, CORS origins, cookie settings, optional APP_ENV/NODE_ENV.
- `apps/web-client`: `NEXT_PUBLIC_API_URL`, NextAuth-related values, optional APP_ENV-specific env files.
- `apps/web-admin`: API base/proxy settings and environment mode (`uat`/`prod` when needed).

## Why This Project Is Portfolio-Ready

- Clear separation of concerns across API, student app, and admin app.
- Demonstrates modern full-stack patterns (SSR-ready frontend, modular backend, migration-first DB).
- Shows practical production concerns: auth refresh strategy, CORS/proxy routing, auditability, and schema evolution.

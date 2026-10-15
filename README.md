# MedPi

MedPi is the lecture and resource library for medical students: every recorded
lecture, slide deck and important date for Years 1–6, organised by subject and
section, plus faculty news, a calendar and a curated Learning Hub. Admins manage
everything from a separate panel. It runs entirely on free tiers.

## Architecture

```mermaid
flowchart LR
  student[Student web\nNext.js 16 · NextAuth · React Query]
  admin[Admin web\nVite · Refine core · Tailwind + Radix]
  api[API\nNestJS 11 on Render]
  db[(Supabase\nPostgres + Storage)]
  shared[@medical-portal/shared\ntypes · tokens · error codes]

  student -->|/api/v1 rewrite| api
  admin -->|/api/v1| api
  api -->|service role| db
  shared -.-> student
  shared -.-> admin
  shared -.-> api
```

| Path | What it is |
|---|---|
| `apps/web-client` | Student portal (Vercel). Today, Subjects, lecture player, ⌘K search, Calendar, News, Learning Hub. |
| `apps/web-admin` | Admin panel (Vercel). Subject tree editor, YouTube importer, news, calendar, students, audit log. |
| `apps/service-api` | NestJS API (Render Free). All database access goes through it with the service-role key. |
| `apps/web-client-e2e` | Playwright: API authorization tests and UI flows against the local stack. |
| `packages/shared` | Types, design tokens (`HERO_TOKENS`, `MEDPI_TYPE`), error catalog, utilities. |
| `database/migrations` | Ordered SQL migrations, tracked in `_schema_migrations`. |
| `supabase/` | Supabase CLI config for the **local** test stack only. |

### Environments

| | Front-ends | API | Database |
|---|---|---|---|
| Local | `pnpm dev` | `pnpm dev:api` | Local Supabase stack with mock data (recommended) |
| Staging | Vercel previews from `dev` | Render | **Shared with production** |
| Production | Vercel from `main` | Render | Supabase project |

Staging and production share one database on purpose (free tier). That is why
destructive scripts refuse remote hosts and test data stays on your machine.

## Local development

```bash
pnpm install
```

### Test with mock data (recommended)

Needs Docker Desktop. Nothing here touches the shared database.

```bash
pnpm db:local:start        # first run pulls the images (~2 GB), then ~20 s
pnpm db:local:migrate      # applies database/migrations/*.sql
pnpm db:local:seed         # wipes and refills mock data (Years 1–6, news, calendar…)
cp apps/service-api/.env.local.example apps/service-api/.env.local
pnpm dev                   # API on :3000, student app on :3001, admin on :3002
```

- Admin login (local only): `admin` / `MedPi-local-1234!`
- Student sign-in uses your real Google account; the profile is created in the local database.
- Studio (browse tables): http://127.0.0.1:54323
- Start over: `pnpm db:local:reset` · stop the containers: `pnpm db:local:stop`
- Back to the shared database: delete `apps/service-api/.env.local`.

The mock data deliberately includes an inactive subject (`MDZZ999`), an inactive
section, lecture and files, and unpublished news/announcements, so you can check
that hidden content stays hidden from students.

### Tests

```bash
pnpm --filter service-api test          # unit tests
pnpm --filter web-client-e2e test       # API authz + UI flows (needs the local stack and all three apps running)
```

For the e2e suite, run the API with `JWT_SECRET=local-only-jwt-secret-change-me-at-least-32-chars`
(the value in `.env.local.example`) and the student app with
`NEXTAUTH_SECRET=local-only-nextauth-secret`, or point `E2E_JWT_SECRET` /
`E2E_NEXTAUTH_SECRET` at your own values. CI does all of this automatically in
the `integration` job.

### Database scripts

```bash
pnpm db:status              # applied vs pending migrations
pnpm db:migrate             # apply pending migrations (uses SUPABASE_DB_URL)
pnpm db:generate NAME=...   # new migration file
pnpm admin:create           # create an admin account
pnpm db:seed / db:reset     # local databases only — both refuse any remote host
```

## Release flow

1. Branch from `dev`, test on localhost with mock data.
2. Merge to `dev` → staging deploys; check it against real data.
3. Merge `dev` → `main` → production.

CI runs on every push and PR to `dev`/`main`: typecheck, lint, unit tests, builds,
the `integration` job (local Supabase + Playwright), a dependency audit and a
secret scan.

## Operations

- **Backups:** `.github/workflows/db-backup.yml` dumps the database nightly
  (02:00 Bangkok), encrypts it and keeps it 30 days as a workflow artifact. Needs the
  `SUPABASE_BACKUP_DB_URL` (session pooler, port 5432) and `BACKUP_PASSPHRASE` secrets.
- **Uptime:** point a free pinger at `GET /health/live` every 10 minutes; it also
  keeps the Render instance warm and triggers token/audit cleanup.
- **Dependencies:** Renovate (`renovate.json`) opens one grouped PR a week.

## Configuration

API (`apps/service-api/.env`, see `.env.example`):

| Variable | Notes |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Required |
| `JWT_SECRET` | Required; signs student and admin access tokens |
| `GOOGLE_CLIENT_ID` | Verifies student Google sign-in |
| `STUDENT_MAX_ACTIVE_SESSIONS` / `ADMIN_MAX_ACTIVE_SESSIONS` | Defaults 5 / 1 |
| `YOUTUBE_API_KEY` | Optional; enables whole-playlist import in the subject editor |
| `CORS_ORIGINS` | Comma-separated front-end origins |

Student web: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`NEXTAUTH_SECRET`, `NEXTAUTH_URL`. Admin web: `VITE_API_URL`, `VITE_STUDENT_SITE_URL`.

## Design

Both apps share one light theme (Tailwind + Radix, shadcn-style components):
Onest for Latin text with IBM Plex Sans Thai Looped as the Thai fallback, one
brand blue (`#2f80ed`), and a contrast-safe text ramp. `CLAUDE.md` has the full
design rules.

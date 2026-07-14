# platform

A multi-tenant admin and organization platform built as a pnpm monorepo: a typed Hono REST API, two Next.js frontends, and shared packages for UI, frontend utilities, and permissions.

## Monorepo structure

```
apps/
  admin/         Next.js 16.2.6 admin UI (dev port 3001)
  organization/  Next.js organization portal
  gateway/       Next.js app mounting the Hono API under /api
packages/
  service/       Hono REST API with Prisma 7 + PostgreSQL
  frontend/      shared hooks/stores/utils (@repo/frontend)
  ui/            shared UI component library (@repo/ui)
  shared/        shared permissions/types (@repo/shared)
```

## Prerequisites

- Node.js (current LTS)
- pnpm
- PostgreSQL (set `DATABASE_URL`)

## Getting started

```bash
pnpm install
# configure .env (DATABASE_URL, CORS_ALLOWED_ORIGINS)
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

`CORS_ALLOWED_ORIGINS` controls which origins may call the API directly. The service is consumed by Next under `/api`, so it is not run standalone in dev.

## Common scripts

| Command                    | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| `pnpm dev`                 | Run all apps (the service is mounted under `/api`).        |
| `pnpm build`               | Build all apps.                                            |
| `pnpm lint`                | Lint with Biome (`biome check .`).                        |
| `pnpm lint:fix`            | Auto-fix lint issues (`biome check --write --unsafe .`).   |
| `pnpm format`              | Format with Biome.                                        |
| `pnpm db:generate`         | Generate the Prisma client (forwards to `@repo/service`). |
| `pnpm db:push`             | Push the Prisma schema to the database.                   |
| `pnpm db:migrate`          | Run Prisma migrations (dev; interactive).                 |
| `pnpm db:migrate:deploy`   | Apply pending migrations in production (non-interactive).  |
| `pnpm db:seed`             | Seed the database.                                        |
| `pnpm db:reset:danger`     | Reset the database (destructive).                         |

## Architecture notes

Apps consume the Hono service via typed end-to-end RPC through the gateway's `/api` route (`AppType` is exported from the gateway route), with OpenAPI docs at `/api/docs` and JSON at `/api/openapi.json`. Access is RBAC-scoped through the shared permissions package. Tech stack: TypeScript, Next.js 16, React 19, Hono 4, Prisma 7, PostgreSQL, Zod 4, TanStack Query, Tailwind v4, Biome 2, next-intl, and Zustand.

## Conventions

See `AGENTS.md` (root and each app/package) for detailed conventions, workflow (GSD), and per-package rules.

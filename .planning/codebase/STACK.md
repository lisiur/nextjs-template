# Technology Stack

**Analysis Date:** 2026-05-20

## Languages

**Primary:**
- TypeScript 5.x — All source code (frontend + backend + shared)

## Runtime

**Environment:**
- Node.js (LTS, ES2017 target)

**Package Manager:**
- pnpm (workspace mode)
- Lockfile: `pnpm-lock.yaml` present
- Workspace config: `pnpm-workspace.yaml`

## Monorepo Structure

```
next101/
├── apps/
│   └── admin/          # Next.js 16 admin panel (React 19)
├── packages/
│   ├── service/        # Hono API server (OpenAPI, Prisma 7)
│   └── shared/         # Shared auth/permissions (currently empty)
└── biome.json          # Linter/formatter config
```

## Frameworks

**Frontend (apps/admin):**
- Next.js 16.2.6 — App Router, React Server Components
- React 19.2.4 + ReactDOM 19.2.4
- Tailwind CSS 4.x — Utility-first CSS via `@tailwindcss/postcss`
- shadcn/ui 4.7.0 — Component library (Radix-based)
- next-intl 4.12.0 — Internationalization (cookie-based locale)
- next-themes 0.4.6 — Dark/light mode
- zustand 5.0.13 — Client state management
- react-hook-form 7.75.0 — Form handling
- react-day-picker 10.x — Date picker component

**Backend (packages/service):**
- Hono 4.x — HTTP framework (OpenAPIHono variant)
- @hono/zod-openapi 1.4.0 — Type-safe route definitions
- @scalar/hono-api-reference 0.10.14 — API docs UI (Scalar)

**Database:**
- Prisma 7.8.0 — ORM (PostgreSQL adapter)
- PostgreSQL — Primary database

## Key Dependencies

**Critical:**
- `better-auth` ^1.6.10 — Authentication (email/password + WeChat OAuth)
  - Used in both `packages/service` (server) and `apps/admin` (client)
  - Plugins: admin, organization, openAPI

**Infrastructure:**
- `@prisma/adapter-pg` ^7.8.0 — PostgreSQL adapter for Prisma
- `pg` ^8.20.0 — PostgreSQL driver (used by Prisma adapter)
- `zod` ^4.4.3 — Schema validation (used via @hono/zod-openapi)
- `date-fns` ^4.1.0 — Date utilities (frontend)

**UI/UX:**
- `class-variance-authority` ^0.7.1 — Component variant management
- `clsx` ^2.1.1 — Conditional class names
- `tailwind-merge` ^3.6.0 — Tailwind class deduplication
- `tw-animate-css` ^1.4.0 — Tailwind animation utilities
- `lucide-react` ^1.14.0 — Icon library
- `sonner` ^2.0.7 — Toast notifications
- `@base-ui/react` ^1.4.1 — Base UI components

**Utilities:**
- `react-use` ^17.6.0 — React hooks library (useAsyncFn, etc.)

## Configuration

**Build:**
- `tsconfig.json` — TypeScript config (bundler module resolution, strict mode)
- `biome.json` — Biome linter/formatter (indent with spaces, width 2)
- `postcss.config.mjs` — PostCSS config for Tailwind
- `next.config.ts` — Next.js config (minimal, next-intl plugin)

**Path Aliases:**
- `@/*` → `./src/*` (apps/admin only)
- `@repo/service` → `packages/service`
- `@repo/shared` → `packages/shared`

## Development Scripts

**Root (package.json):**
```bash
pnpm dev              # Runs all apps (admin on 3000, service on 3001)
pnpm build            # Builds all apps
pnpm lint             # biome check .
pnpm lint:fix         # biome check --write --unsafe .
pnpm format           # biome format --write .
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to PostgreSQL
pnpm db:migrate       # Run Prisma migrations
pnpm db:reset         # Reset database
```

**Service (packages/service):**
```bash
pnpm --filter @repo/service dev       # Standalone Hono server (tsx watch)
pnpm --filter @repo/service db:seed   # Seed default configs
```

## Platform Requirements

**Development:**
- Node.js (LTS recommended)
- PostgreSQL running locally or accessible
- pnpm package manager

**Production:**
- Next.js on Vercel (via `hono/vercel` adapter)
- PostgreSQL database
- Environment variables configured (see INTEGRATIONS.md)

## Key Patterns

**Dual-Mode API:**
- The Hono service runs both as a standalone server (`packages/service/src/server.ts`) and as Next.js API routes (`apps/admin/src/app/api/[[...route]]/route.ts`)
- Uses `hono/vercel` for Vercel deployment compatibility

**Type-Safe API Client:**
- `apps/admin/src/lib/api/app-client.ts` uses `hc<AppType>("")` for Hono RPC client
- Path params use bracket notation: `[":param"]`
- All API calls go through `appClient` — never raw `fetch`

**Prisma Singleton:**
- `packages/service/src/lib/db.ts` — Global singleton pattern for dev hot-reload safety
- Import from `@repo/service`, not directly from Prisma

**Auth Configuration:**
- Email/password enabled (min 1 char)
- WeChat OAuth (conditional on env vars)
- Role-based access: admin, manager, user
- Permissions defined in `packages/shared/src/permissions.ts`

---

*Stack analysis: 2026-05-20*

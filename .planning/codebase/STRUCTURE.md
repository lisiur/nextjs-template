# Codebase Structure

**Analysis Date:** 2026-05-20

## Directory Layout

```
next101/
├── apps/
│   └── admin/                    # Next.js 16 frontend application
│       ├── src/
│       │   ├── app/              # App Router pages and layouts
│       │   ├── components/       # Reusable UI components
│       │   ├── hooks/            # Custom React hooks
│       │   ├── lib/              # Utilities and API clients
│       │   ├── stores/           # Zustand state management
│       │   ├── utils/            # Helper functions
│       │   └── i18n/             # Internationalization config
│       ├── messages/             # i18n translation files
│       └── uploads/              # Local file uploads
├── packages/
│   ├── service/                  # Hono API server
│   │   ├── src/
│   │   │   ├── routes/           # API route handlers
│   │   │   ├── repositories/     # Database access layer
│   │   │   ├── services/         # Business logic (currently empty)
│   │   │   └── lib/              # Core utilities (auth, db, etc.)
│   │   └── prisma/               # Database schema and migrations
│   └── shared/                   # Shared utilities and types
│       └── src/
│           └── permissions.ts    # RBAC permission definitions
├── docs/                         # Project documentation
└── .planning/                    # Planning artifacts
```

## Directory Purposes

**`apps/admin/src/app/`:**
- Purpose: Next.js App Router pages and layouts
- Contains: Page components, layout files, API routes
- Key files: `layout.tsx`, `(logged)/layout.tsx`, `api/[[...route]]/route.ts`

**`apps/admin/src/components/`:**
- Purpose: Reusable UI components
- Contains: shadcn/ui components, auth forms, layout components
- Key files: `ui/button.tsx`, `auth/login-form.tsx`, `layout/sidebar.tsx`

**`apps/admin/src/hooks/`:**
- Purpose: Custom React hooks for data fetching and UI logic
- Contains: Hooks for async data, mobile detection, app config
- Key files: `use-async-data.ts`, `use-app-name.ts`, `use-mobile.ts`

**`apps/admin/src/lib/`:**
- Purpose: API clients and utilities
- Contains: Hono RPC client, better-auth client
- Key files: `api/app-client.ts`, `api/auth-client.ts`

**`apps/admin/src/stores/`:**
- Purpose: Zustand state management stores
- Contains: Global state for system config
- Key files: `system-config-store.ts`

**`packages/service/src/routes/`:**
- Purpose: API route handlers organized by resource
- Contains: OpenAPI route definitions and handlers
- Key files: `index.ts`, `organization/`, `system-config/`, `upload/`

**`packages/service/src/repositories/`:**
- Purpose: Database access layer (Repository pattern)
- Contains: Prisma query abstractions
- Key files: `system-config.repository.ts`

**`packages/service/src/lib/`:**
- Purpose: Core utilities and configuration
- Contains: Database client, auth setup, permissions, caching
- Key files: `db.ts`, `auth.ts`, `permissions.ts`, `config-cache.ts`

**`packages/service/prisma/`:**
- Purpose: Database schema and migrations
- Contains: Prisma schema, migration history, generated client
- Key files: `schema.prisma`, `migrations/`, `generated/`

## Key File Locations

**Entry Points:**
- `apps/admin/src/app/layout.tsx`: Root layout (theme, i18n, providers)
- `apps/admin/src/app/api/[[...route]]/route.ts`: API catch-all route
- `packages/service/src/server.ts`: Standalone server entry
- `packages/service/src/app.ts`: Hono app configuration

**Configuration:**
- `apps/admin/next.config.ts`: Next.js configuration
- `apps/admin/tsconfig.json`: TypeScript configuration
- `biome.json`: Linter/formatter configuration (Biome)
- `pnpm-workspace.yaml`: Monorepo workspace config

**Core Logic:**
- `packages/service/src/lib/auth.ts`: Authentication setup
- `packages/service/src/lib/db.ts`: Database client singleton
- `packages/shared/src/permissions.ts`: RBAC definitions

**Testing:**
- Not currently implemented

## Naming Conventions

**Files:**
- Components: `kebab-case.tsx` (e.g., `user-table.tsx`, `login-form.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-async-data.ts`)
- Routes: `camelCase.ts` (e.g., `getOrganization.ts`, `listConfigsByGroup.ts`)
- Schemas: `schema.ts` (e.g., `organization/schema.ts`)
- Repositories: `kebab-case.repository.ts` (e.g., `system-config.repository.ts`)
- Utilities: `kebab-case.ts` (e.g., `cn.ts`, `toast.ts`)

**Directories:**
- Components: `kebab-case` (e.g., `ui/`, `auth/`, `layout/`)
- Routes: `kebab-case` (e.g., `organization/`, `system-config/`)
- Pages: `kebab-case` (e.g., `(logged)/users/`, `(logged)/settings/`)

**Exports:**
- Default exports for page components
- Named exports for components, hooks, and utilities
- Barrel exports via `index.ts` files

## Where to Add New Code

**New Feature (Frontend Page):**
- Route: `apps/admin/src/app/(logged)/[feature]/page.tsx`
- Components: `apps/admin/src/app/(logged)/[feature]/components/`
- Tests: Not currently implemented

**New Feature (API Endpoint):**
- Route handler: `packages/service/src/routes/[resource]/[action][Resource].ts`
- Schema: `packages/service/src/routes/[resource]/schema.ts`
- Index: Update `packages/service/src/routes/[resource]/index.ts`
- Mount: Update `packages/service/src/routes/index.ts`

**New Utility (Frontend):**
- Helper: `apps/admin/src/utils/[name].ts`
- Hook: `apps/admin/src/hooks/use-[name].ts`

**New Utility (Backend):**
- Library: `packages/service/src/lib/[name].ts`

**New Shared Type:**
- Permissions/types: `packages/shared/src/[name].ts`
- Update: `packages/shared/src/index.ts`

## Special Directories

**`packages/service/prisma/generated/`:**
- Purpose: Auto-generated Prisma client code
- Generated: Yes (by `pnpm db:generate`)
- Committed: Yes (for type safety)

**`apps/admin/.next/`:**
- Purpose: Next.js build output
- Generated: Yes (by `pnpm build`)
- Committed: No (in `.gitignore`)

**`apps/admin/uploads/`:**
- Purpose: Local file uploads
- Generated: Yes (runtime uploads)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-05-20*

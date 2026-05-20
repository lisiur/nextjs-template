# Monorepo Workspace

pnpm monorepo. See `apps/admin/AGENTS.md` for Next.js-specific rules.

## Structure
- `apps/admin` — Next.js 16 app (React 19, Tailwind 4, shadcn/ui)
- `packages/service` — Hono API server (OpenAPI/Zod, Scalar docs) with Prisma 7 + PostgreSQL. Can run standalone on port 3001 or be consumed as a Next.js API route via `hono/vercel`
- `packages/shared` — Shared utilities (currently empty)

## Key Commands
```bash
pnpm dev              # Runs all apps (web on 3000, service on 3001)
pnpm build            # Builds all apps
pnpm lint             # biome check . (Biome, not ESLint)
pnpm lint:fix         # biome check --write --unsafe .
pnpm format           # biome format --write .
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to SQLite
pnpm db:migrate       # Run Prisma migrations
```

## Architecture Notes
- The API layer (`@repo/service`) is wired into Next.js at `apps/admin/src/app/api/[[...route]]/route.ts` using `hono/vercel`. The service can also run independently (`pnpm --filter @repo/service dev`).
- Hono RPC client is used for type-safe API calls: `hc<AppType>("/api")` in `apps/admin/src/lib/api/index.ts`.
- Prisma client is a global singleton (dev hot-reload safe). Import from `@repo/service`, not directly.
- **每次修改 `schema.prisma` 后，必须重新运行 `pnpm db:generate` 并重启 dev server**，否则运行时 `prisma.<model>` 会是 `undefined`（500 错误）。
- Linter is **Biome** (`biome.json`), not ESLint. Uses spaces (indent width 2). Generated code in `**/prisma/generated` is excluded.
- No tests, no CI workflows configured yet.

## Zod 4 Deprecations
The project uses Zod 4 (`^4.4.3`). String format validators on `ZodString` are deprecated. Use standalone validators instead:

| Deprecated (Zod 3 style)        | Correct (Zod 4)          |
|---------------------------------|--------------------------|
| `z.string().email("msg")`       | `z.email("msg")`         |
| `z.string().url("msg")`         | `z.url("msg")`           |
| `z.string().uuid("msg")`        | `z.uuid("msg")`          |
| `z.string().cuid("msg")`        | `z.cuid("msg")`          |
| `z.string().ulid("msg")`        | `z.ulid("msg")`          |
| `z.string().nanoid("msg")`      | `z.nanoid("msg")`        |

## References
- [Hono llms.txt](https://hono.dev/llms.txt) — index of all Hono docs (middleware, helpers, getting-started, API reference). Use this to find the right guide before writing Hono code.

## Defining Routes (Zod OpenAPI Hono)

Use `defineOpenAPIRoute` + `openapiRoutes` pattern. Each API endpoint lives in its own file.

### File structure per resource

```
packages/service/src/routes/<resource>/
├── index.ts                 ← OpenAPIHono + middleware + openapiRoutes
├── schema.ts                ← Zod schemas (import z from "@hono/zod-openapi")
├── <action><Resource>.ts    ← one file per endpoint (defineOpenAPIRoute)
```

### 1. Schema file (`schema.ts`)

Import `z` from `"@hono/zod-openapi"` (not `"zod"`). Add `.openapi()` metadata to every field. Register response schemas as named components.

```ts
import { z } from "@hono/zod-openapi";

export const itemSchema = z
  .object({
    id: z.string().openapi({ example: "clx1234567890" }),
    name: z.string().openapi({ example: "foo" }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .openapi("Item"); // registers as #/components/schemas/Item

export const errorSchema = z
  .object({
    code: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: "Bad Request" }),
  })
  .openapi("Error");

// Route-specific schemas: params, query, body
export const getItemParamSchema = z.object({
  id: z.string().min(1).openapi({ example: "clx1234567890" }),
});
```

### 2. Endpoint file (`<action><Resource>.ts`)

Use `defineOpenAPIRoute` to bundle route definition + handler. Export the result.

```ts
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { itemSchema, errorSchema, getItemParamSchema } from "./schema";

export const getItem = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Item"],
    summary: "Get an item",
    request: {
      params: getItemParamSchema,
    },
    responses: {
      200: {
        content: { "application/json": { schema: itemSchema } },
        description: "The item",
      },
      401: {
        content: { "application/json": { schema: errorSchema } },
        description: "Unauthorized",
      },
    },
  }),
  handler: async (c) => {
    const { id } = c.req.valid("param");  // typed via Zod
    const item = await repository.findById(id);
    return c.json(item, 200);             // MUST pass status code
  },
});
```

**Rules:**
- Use `c.req.valid("param")`, `c.req.valid("query")`, `c.req.valid("json")` — never `c.req.param()` / `c.req.json()`
- Always pass the status code to `c.json(data, 200)`
- Define error responses (401, 400, 404) with `errorSchema`
- Keep path params in OpenAPI `{param}` syntax in `createRoute`

### 3. Index file (`index.ts`)

Create the `OpenAPIHono` instance, apply middleware, register routes via `openapiRoutes`. **Export the return value of `openapiRoutes()`** — not the original instance — to preserve type info.

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../lib/auth";
import { getItem } from "./getItem";
import { listItems } from "./listItems";

const app = new OpenAPIHono();

// Middleware (applied before all routes in this sub-app)
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});

// Register routes — export the result, not the original `app`
const routes = app.openapiRoutes([getItem, listItems] as const);

export { routes as itemRoutes };
```

**Critical:** `export { routes as itemRoutes }` — the `as const` on the array and the re-export of `routes` (not `app`) are required for Hono RPC type inference to work.

### 4. Mount in parent (`routes/index.ts`)

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { itemRoutes } from "./item";

const routes = new OpenAPIHono()
  .route("/item", itemRoutes);

export { routes };
```

## Calling API from Frontend (Hono RPC Client)

Use the typed `appClient` from `@/lib/api` for all API calls. Never use raw `fetch`.

### Client setup

```ts
// apps/admin/src/lib/api/app-client.ts
import { hc } from "hono/client";
import type { AppType } from "@/app/api/[[...route]]/route";

export const appClient = hc<AppType>("/api");
```

### GET requests

```ts
import { appClient } from "@/lib/api";

// Path params use bracket notation: [":param"]
const res = await appClient.api["system-config"][":group"].$get({
  param: { group: "general" },
});

if (!res.ok) throw new Error("Failed to load");
const data = await res.json();
```

### PUT/POST requests with JSON body

```ts
const res = await appClient.api["system-config"].batch.$put({
  json: {
    items: payload,
  },
});

if (!res.ok) throw new Error("Failed to save");
```

### Rules
- Always import `appClient` from `@/lib/api`
- Path params: use bracket notation `[":param"]` for dynamic segments
- Nested routes: use dot notation `.batch.$put()` for static segments
- Request body: use `json` key (not `body`)
- Always check `res.ok` before calling `res.json()`

<!-- GSD:project-start source:PROJECT.md -->
## Project

**应用与菜单管理系统**

为 admin 面板构建应用管理和动态菜单管理系统。每个业务系统（如 OA、CRM）作为一个「应用」，拥有独立的菜单树。菜单支持多级嵌套，基于角色控制可见性，取代当前硬编码的导航方式。

**Core Value:** 动态菜单管理取代硬编码导航，支持多应用、多级菜单、角色权限控制，让管理员无需改代码即可配置导航结构。

### Constraints

- **技术栈**: 必须使用现有 Next.js + Hono + Prisma + better-auth — 已建立的基础设施
- **权限集成**: 必须与 better-auth RBAC 系统集成 — 统一权限管理
- **向后兼容**: 迁移硬编码菜单时不能破坏现有导航 — 用户体验连续性
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.x — All source code (frontend + backend + shared)
## Runtime
- Node.js (LTS, ES2017 target)
- pnpm (workspace mode)
- Lockfile: `pnpm-lock.yaml` present
- Workspace config: `pnpm-workspace.yaml`
## Monorepo Structure
## Frameworks
- Next.js 16.2.6 — App Router, React Server Components
- React 19.2.4 + ReactDOM 19.2.4
- Tailwind CSS 4.x — Utility-first CSS via `@tailwindcss/postcss`
- shadcn/ui 4.7.0 — Component library (Radix-based)
- next-intl 4.12.0 — Internationalization (cookie-based locale)
- next-themes 0.4.6 — Dark/light mode
- zustand 5.0.13 — Client state management
- react-hook-form 7.75.0 — Form handling
- react-day-picker 10.x — Date picker component
- Hono 4.x — HTTP framework (OpenAPIHono variant)
- @hono/zod-openapi 1.4.0 — Type-safe route definitions
- @scalar/hono-api-reference 0.10.14 — API docs UI (Scalar)
- Prisma 7.8.0 — ORM (PostgreSQL adapter)
- PostgreSQL — Primary database
## Key Dependencies
- `better-auth` ^1.6.10 — Authentication (email/password + WeChat OAuth)
- `@prisma/adapter-pg` ^7.8.0 — PostgreSQL adapter for Prisma
- `pg` ^8.20.0 — PostgreSQL driver (used by Prisma adapter)
- `zod` ^4.4.3 — Schema validation (used via @hono/zod-openapi)
- `date-fns` ^4.1.0 — Date utilities (frontend)
- `class-variance-authority` ^0.7.1 — Component variant management
- `clsx` ^2.1.1 — Conditional class names
- `tailwind-merge` ^3.6.0 — Tailwind class deduplication
- `tw-animate-css` ^1.4.0 — Tailwind animation utilities
- `lucide-react` ^1.14.0 — Icon library
- `sonner` ^2.0.7 — Toast notifications
- `@base-ui/react` ^1.4.1 — Base UI components
- `react-use` ^17.6.0 — React hooks library (useAsyncFn, etc.)
## Configuration
- `tsconfig.json` — TypeScript config (bundler module resolution, strict mode)
- `biome.json` — Biome linter/formatter (indent with spaces, width 2)
- `postcss.config.mjs` — PostCSS config for Tailwind
- `next.config.ts` — Next.js config (minimal, next-intl plugin)
- `@/*` → `./src/*` (apps/admin only)
- `@repo/service` → `packages/service`
- `@repo/shared` → `packages/shared`
## Development Scripts
## Platform Requirements
- Node.js (LTS recommended)
- PostgreSQL running locally or accessible
- pnpm package manager
- Next.js on Vercel (via `hono/vercel` adapter)
- PostgreSQL database
- Environment variables configured (see INTEGRATIONS.md)
## Key Patterns
- The Hono service runs both as a standalone server (`packages/service/src/server.ts`) and as Next.js API routes (`apps/admin/src/app/api/[[...route]]/route.ts`)
- Uses `hono/vercel` for Vercel deployment compatibility
- `apps/admin/src/lib/api/app-client.ts` uses `hc<AppType>("")` for Hono RPC client
- Path params use bracket notation: `[":param"]`
- All API calls go through `appClient` — never raw `fetch`
- `packages/service/src/lib/db.ts` — Global singleton pattern for dev hot-reload safety
- Import from `@repo/service`, not directly from Prisma
- Email/password enabled (min 1 char)
- WeChat OAuth (conditional on env vars)
- Role-based access: admin, manager, user
- Permissions defined in `packages/shared/src/permissions.ts`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase (`organization-table.tsx`, `config-group.tsx`)
- Non-component files: kebab-case (`system-config-store.ts`, `app-client.ts`)
- Route files: camelCase with action prefix (`batchUpsertConfigs.ts`, `listConfigsByGroup.ts`)
- Schema files: `schema.ts` in each route directory
- Repository files: `<entity>.repository.ts` (`system-config.repository.ts`)
- React components: PascalCase (`OrganizationTable`, `ConfigGroup`)
- Handler functions: camelCase (`fetchOrganizations`, `handleSave`)
- Repository methods: camelCase (`findByGroup`, `batchUpsert`)
- Route handlers: camelCase (`listConfigsByGroup`)
- State variables: camelCase (`organizations`, `loading`, `page`)
- Interfaces: PascalCase (`Organization`, `ConfigItem`, `UpsertConfigBody`)
- Schema constants: camelCase with `Schema` suffix (`systemConfigItemSchema`, `errorSchema`)
- Store hooks: `use` prefix with camelCase (`useSystemConfigStore`)
- Interfaces: PascalCase (`Organization`, `ConfigGroupProps`)
- Type exports: `type` keyword for TypeScript types (`type AuthType`)
- Zod schema types: `z.infer<typeof schema>` pattern
## Code Style
- Tool: Biome (version 2.2.0)
- Indent: 2 spaces
- Line length: No explicit limit enforced
- Semicolons: Required
- Single quotes: Used for strings
- Trailing commas: Required (Biome default)
- Tool: Biome
- Rules: Recommended + Next.js + React domains
- Disabled: `noUnknownAtRules` (for Tailwind directives), `noLabelWithoutControl`
- Overrides: UI components in `apps/admin/src/components/ui/**` have `useSemanticElements` disabled
## Import Organization
- `@/` → `apps/admin/src/` (Next.js alias)
- Workspace packages: `@repo/service`, `@repo/shared`
## Error Handling
- Use `try/catch` blocks around async operations
- Display errors via `toast.error()` from `sonner`
- Silent catch blocks for client-side error handling (`catch { // Error handled by client }`)
- Loading states with `finally` blocks
- Use `HTTPException` from `hono/http-exception` for HTTP errors
- Define error responses in OpenAPI schemas (`errorSchema`)
- Throw errors in middleware for authentication/authorization
## Logging
- Server startup: `console.log(\`Server running on http://localhost:${info.port}\`)`
- Request logging: Automatic via `hono/logger` middleware
- Error logging: Via toast notifications on frontend
- No structured logging or log levels
## Comments
- Comment out error handling: `// Error handled by client`
- Cache TTL explanation: `// 5 minutes`
- No JSDoc or TSDoc patterns observed
- Not used in the codebase
- Types are defined via interfaces and Zod schemas
## Function Design
- Components: 50-250 lines (observed: 18-243 lines)
- Handler functions: 10-30 lines
- Repository methods: 5-15 lines
- Use interfaces for complex parameters
- Destructure parameters in function signatures
- Use Zod schemas for validation
- Return promises for async functions
- Return JSX for React components
- Use `c.json(data, statusCode)` for Hono handlers
## Module Design
- Named exports for components and utilities
- Default exports for Next.js page components
- Re-export patterns: `export * from "./api"` in barrel files
- Used for API clients (`apps/admin/src/lib/api/index.ts`)
- Not used for route files (direct imports preferred)
## State Management
- Local state: `useState` for component-specific state
- Global state: Zustand stores (`useSystemConfigStore`)
- Form state: React Hook Form with Zod resolver
- Cache: In-memory `Map` with TTL (`configCache`)
- Database: Prisma client singleton
## Component Patterns
- Mark with `"use client"` directive at top of file
- Use for interactive components with state/effects
- Default in Next.js App Router
- Used for page layouts and static content
## API Client Patterns
- Import from `@/lib/api`
- Use bracket notation for dynamic segments: `appClient.api.organizations[":id"].$put()`
- Use dot notation for static segments: `appClient.api.system-config.batch.$put()`
- Always check `res.ok` before calling `res.json()`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| Next.js App | Frontend UI, routing, SSR | `apps/admin/src/app/` |
| Hono API | Backend API, OpenAPI docs | `packages/service/src/app.ts` |
| Auth System | Authentication, authorization | `packages/service/src/lib/auth.ts` |
| Database | Data persistence, migrations | `packages/service/prisma/` |
| Shared Utils | Permissions, types | `packages/shared/src/` |
## Pattern Overview
- Type-safe API calls via Hono RPC client
- OpenAPI/Swagger documentation auto-generated
- Role-based access control (RBAC) with better-auth
- Database-first with Prisma ORM
- Server-side rendering with Next.js App Router
## Layers
- Purpose: User interface, client-side logic, SSR
- Location: `apps/admin/src/`
- Contains: React components, pages, hooks, stores, utilities
- Depends on: Hono RPC client, better-auth client
- Used by: End users via browser
- Purpose: HTTP endpoints, request/response handling, validation
- Location: `packages/service/src/`
- Contains: Routes, middleware, OpenAPI schemas
- Depends on: Database layer, Auth system
- Used by: Frontend via Hono RPC client
- Purpose: Database operations, schema management
- Location: `packages/service/prisma/`
- Contains: Schema, migrations, generated client
- Depends on: PostgreSQL database
- Used by: API layer
- Purpose: Common types, utilities, permissions
- Location: `packages/shared/src/`
- Contains: Permission definitions, shared types
- Depends on: better-auth
- Used by: Both frontend and backend
## Data Flow
### Authentication Flow
### API Request Flow
- Client-side: Zustand stores (`apps/admin/src/stores/`)
- Server-side: Database, session cookies
- Forms: React Hook Form with Zod validation
## Key Abstractions
- Purpose: Type-safe API calls between frontend and backend
- Examples: `apps/admin/src/lib/api/app-client.ts`
- Pattern: Client inferred from server routes
- Purpose: Self-documenting API endpoints
- Examples: `packages/service/src/routes/organization/getOrganization.ts`
- Pattern: Route definition + handler in single file
- Purpose: Authentication, session management, RBAC
- Examples: `packages/service/src/lib/auth.ts`, `packages/shared/src/permissions.ts`
- Pattern: Plugin-based architecture with role definitions
- Purpose: Type-safe database access
- Examples: `packages/service/src/lib/db.ts`
- Pattern: Global singleton for development hot-reload
## Entry Points
- Root layout: `apps/admin/src/app/layout.tsx`
- API catch-all: `apps/admin/src/app/api/[[...route]]/route.ts`
- Dashboard: `apps/admin/src/app/(logged)/dashboard/page.tsx`
- App entry: `packages/service/src/app.ts`
- Server start: `packages/service/src/server.ts`
- Route index: `packages/service/src/routes/index.ts`
## Architectural Constraints
- **Threading:** Single-threaded Node.js event loop
- **Global state:** Prisma client singleton (`packages/service/src/lib/db.ts`)
- **Circular imports:** None detected
- **Environment dependencies:** DATABASE_URL, better-auth secrets
## Anti-Patterns
### Direct Prisma Import in Frontend
### Manual API Fetch
### Skipping OpenAPI Schema
## Error Handling
- Throw `HTTPException` with status code and message
- Define error schemas in route responses
- Client-side error handling with toast notifications
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

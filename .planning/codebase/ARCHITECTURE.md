<!-- refreshed: 2026-05-20 -->
# Architecture

**Analysis Date:** 2026-05-20

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
├──────────────────┬──────────────────┬───────────────────────┤
│   Pages/Routes   │   Components     │   State/Utils         │
│  `apps/admin/`   │  `components/`   │  `stores/`, `hooks/`  │
│  `src/app/`      │  `src/components/`│ `src/utils/`         │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         │   Hono RPC Client (TypeSafe)          │
         │   `src/lib/api/`                      │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Hono)                          │
│         `packages/service/src/`                              │
│   ┌─────────────┬──────────────┬──────────────┐            │
│   │   Routes    │   Services   │   Repositories│            │
│   │   `routes/` │   `services/`│   `repositories/`│         │
│   └─────────────┴──────────────┴──────────────┘            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL)                      │
│         `packages/service/prisma/`                          │
│   ┌─────────────┬──────────────┬──────────────┐            │
│   │   Schema    │   Migrations │   Generated  │            │
│   │   `schema.prisma` │ `migrations/` │ `generated/`│       │
│   └─────────────┴──────────────┴──────────────┘            │
└─────────────────────────────────────────────────────────────┘
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

**Overall:** Monorepo with API-first architecture

**Key Characteristics:**
- Type-safe API calls via Hono RPC client
- OpenAPI/Swagger documentation auto-generated
- Role-based access control (RBAC) with better-auth
- Database-first with Prisma ORM
- Server-side rendering with Next.js App Router

## Layers

**Frontend Layer (Next.js):**
- Purpose: User interface, client-side logic, SSR
- Location: `apps/admin/src/`
- Contains: React components, pages, hooks, stores, utilities
- Depends on: Hono RPC client, better-auth client
- Used by: End users via browser

**API Layer (Hono):**
- Purpose: HTTP endpoints, request/response handling, validation
- Location: `packages/service/src/`
- Contains: Routes, middleware, OpenAPI schemas
- Depends on: Database layer, Auth system
- Used by: Frontend via Hono RPC client

**Data Layer (Prisma):**
- Purpose: Database operations, schema management
- Location: `packages/service/prisma/`
- Contains: Schema, migrations, generated client
- Depends on: PostgreSQL database
- Used by: API layer

**Shared Layer:**
- Purpose: Common types, utilities, permissions
- Location: `packages/shared/src/`
- Contains: Permission definitions, shared types
- Depends on: better-auth
- Used by: Both frontend and backend

## Data Flow

### Authentication Flow

1. User submits login form (`apps/admin/src/components/auth/login-form.tsx`)
2. better-auth client sends request (`apps/admin/src/lib/api/auth-client.ts`)
3. Hono auth routes handle request (`packages/service/src/routes/auth.routes.ts`)
4. better-auth validates credentials (`packages/service/src/lib/auth.ts`)
5. Session stored in database (`packages/service/prisma/schema.prisma`)
6. Response returned to client with session cookie

### API Request Flow

1. Frontend makes typed API call (`apps/admin/src/lib/api/app-client.ts`)
2. Next.js API route forwards to Hono (`apps/admin/src/app/api/[[...route]]/route.ts`)
3. Hono routes handle request (`packages/service/src/routes/`)
4. Repository layer queries database (`packages/service/src/repositories/`)
5. Response returned through Hono to frontend

**State Management:**
- Client-side: Zustand stores (`apps/admin/src/stores/`)
- Server-side: Database, session cookies
- Forms: React Hook Form with Zod validation

## Key Abstractions

**Hono RPC Client:**
- Purpose: Type-safe API calls between frontend and backend
- Examples: `apps/admin/src/lib/api/app-client.ts`
- Pattern: Client inferred from server routes

**OpenAPI Routes:**
- Purpose: Self-documenting API endpoints
- Examples: `packages/service/src/routes/organization/getOrganization.ts`
- Pattern: Route definition + handler in single file

**Better Auth:**
- Purpose: Authentication, session management, RBAC
- Examples: `packages/service/src/lib/auth.ts`, `packages/shared/src/permissions.ts`
- Pattern: Plugin-based architecture with role definitions

**Prisma Client:**
- Purpose: Type-safe database access
- Examples: `packages/service/src/lib/db.ts`
- Pattern: Global singleton for development hot-reload

## Entry Points

**Frontend:**
- Root layout: `apps/admin/src/app/layout.tsx`
- API catch-all: `apps/admin/src/app/api/[[...route]]/route.ts`
- Dashboard: `apps/admin/src/app/(logged)/dashboard/page.tsx`

**Backend:**
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

**What happens:** Frontend code imports Prisma client directly
**Why it's wrong:** Exposes database credentials, breaks client/server boundary
**Do this instead:** Use Hono RPC client (`apps/admin/src/lib/api/app-client.ts`)

### Manual API Fetch

**What happens:** Using fetch() instead of typed client
**Why it's wrong:** Loses type safety, error-prone
**Do this instead:** Use `appClient` from `@/lib/api` with type inference

### Skipping OpenAPI Schema

**What happens:** Routes defined without OpenAPI schemas
**Why it's wrong:** No auto-documentation, no validation
**Do this instead:** Use `defineOpenAPIRoute` with full schema definitions

## Error Handling

**Strategy:** HTTP exceptions with structured error responses

**Patterns:**
- Throw `HTTPException` with status code and message
- Define error schemas in route responses
- Client-side error handling with toast notifications

## Cross-Cutting Concerns

**Logging:** Hono logger middleware (`packages/service/src/app.ts`)
**Validation:** Zod schemas via `@hono/zod-openapi`
**Authentication:** better-auth with session-based auth
**Authorization:** Role-based access control (admin, manager, user)

---

*Architecture analysis: 2026-05-20*

# Walking Skeleton: 应用与菜单管理系统

**Created:** 2026-05-20
**Phase:** 1 — Foundation

## Architectural Decisions

These decisions form the foundation that all subsequent phases build on. They are recorded here to avoid renegotiating in every phase.

### Framework & Runtime

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | Next.js 16 (App Router, React 19) | Existing project — no migration needed |
| Backend API | Hono (OpenAPIHono variant) | Existing project — type-safe routes with Zod OpenAPI |
| API Client | Hono RPC (`hc<AppType>`) | Type-safe client inferred from server routes |
| Runtime | Node.js LTS | Existing project requirement |

### Database

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM | Prisma 7.8.0 | Already in project, PostgreSQL adapter |
| Database | PostgreSQL | Existing project requirement |
| ID Strategy | Cuid (`@default(cuid())`) | Matches existing User/Organization pattern |
| Table Naming | `@@map("snake_case")` | Matches existing convention (e.g., `@@map("user")`) |
| Timestamps | `createdAt @default(now())`, `updatedAt @updatedAt` | Matches existing pattern |
| Soft Delete | `deletedAt DateTime?` timestamp | Enables "deleted X ago" display; list/get/update filter `deletedAt: null` |

### Authentication & Authorization

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth Provider | better-auth | Existing project — session-based auth |
| Session Handling | Cookie-based via `auth.api.getSession()` | Existing pattern in Organization middleware |
| Admin Check | `session.user.role !== "admin"` | Existing pattern — all management routes are admin-only |
| Permission Model | better-auth RBAC with role strings | Existing pattern — `role` field on User model |

### API Pattern

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Route Definition | `defineOpenAPIRoute` + `createRoute` | Existing pattern — self-documenting OpenAPI endpoints |
| Validation | Zod schemas via `@hono/zod-openapi` | Existing pattern — type-safe request/response validation |
| Error Responses | `HTTPException` + `errorSchema` | Existing pattern — consistent error format |
| Route Mounting | `.route("/path", subRoutes)` chain in `routes/index.ts` | Existing pattern |
| Export Pattern | `export { routes as resourceRoutes }` | Critical for Hono RPC type inference — must export `openapiRoutes()` result, not the instance |

### Frontend Pattern

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component Style | `"use client"` directive | Existing pattern for interactive components |
| Forms | react-hook-form + zodResolver | Existing pattern in Organization dialog |
| State Management | Local `useState` + `useCallback`/`useEffect` | Existing pattern — no global state needed for CRUD pages |
| API Calls | `appClient` from `@/lib/api` (Hono RPC) | Type-safe, never raw `fetch` |
| Toast Notifications | `sonner` (`toast.success/error`) | Existing project dependency |
| Image Display | `next/image` with `unoptimized` for base64 | AGENTS.md requirement |
| i18n | `next-intl` (`useTranslations`) | Existing project dependency |
| Icons | `lucide-react` | Existing project dependency |
| Loading State | `<Spinner />` component | Existing pattern |
| Search Debounce | `useRef` + `setTimeout` (300ms) | Prevents excessive API calls on keystroke |

### Directory Layout

```
packages/service/prisma/
  schema.prisma                    ← All models (Application, Menu, MenuRole added here)

packages/service/src/routes/application/
  schema.ts                        ← Zod OpenAPI schemas
  index.ts                         ← OpenAPIHono + admin middleware + openapiRoutes
  createApplication.ts             ← POST /
  getApplication.ts                ← GET /{id}
  listApplications.ts              ← GET / (with search + soft delete filter)
  updateApplication.ts             ← PUT /{id}
  deleteApplication.ts             ← DELETE /{id} (soft delete)

packages/service/src/routes/index.ts  ← Mount .route("/applications", applicationRoutes)

apps/admin/src/app/(logged)/applications/
  page.tsx                         ← "use client" page with title + description
  components/
    app-table.tsx                  ← Table, search, pagination, dialog triggers
    app-dialog.tsx                 ← Create/Edit dialog with base64 logo upload
    delete-confirm-dialog.tsx      ← Delete confirmation dialog

apps/admin/messages/
  en.json                          ← "Applications" translation section
  zh.json                          ← "应用管理" translation section
```

### Key Integration Points

| Integration | Location | Mechanism |
|-------------|----------|-----------|
| API mount | `packages/service/src/routes/index.ts` | `.route("/applications", applicationRoutes)` chain |
| Next.js API catch-all | `apps/admin/src/app/api/[[...route]]/route.ts` | Already routes to Hono service — no change needed |
| i18n | `apps/admin/messages/{en,zh}.json` | Add `"Applications"` section |
| Prisma client | `packages/service/src/lib/db.ts` | Global singleton — import `prisma` from there |

### Patterns Established in This Skeleton

1. **Soft delete pattern**: `deletedAt` timestamp, filter `deletedAt: null` in all queries, `findFirst` instead of `findUnique` for existence checks
2. **Search pattern**: Server-side ILIKE with `mode: "insensitive"`, debounced client input, reset pagination on search change
3. **Code uniqueness pattern**: `findFirst({ where: { code, deletedAt: null } })` — allows reusing codes of soft-deleted records
4. **Base64 logo pattern**: `FileReader.readAsDataURL()` → `setValue("logo", dataUrl)` → store as text in DB
5. **Vertical slice delivery**: Schema → API → UI, each plan builds on the previous

### What This Skeleton Does NOT Cover (Deferred to Later Phases)

- Menu CRUD and tree management (Phase 2)
- Role-menu assignment and RBAC filtering (Phase 3)
- Dynamic sidebar rendering (Phase 4)
- App status toggle (enable/disable) — explicitly deferred from Phase 1 per D-02

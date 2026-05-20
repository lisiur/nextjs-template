# Phase 1: Foundation - Research

**Researched:** 2026-05-20
**Domain:** Prisma schema design, Hono CRUD API, React admin UI with search and logo upload
**Confidence:** HIGH

## Summary

Phase 1 establishes the data model foundation (Application, Menu, MenuRole) and delivers a complete App CRUD layer: Prisma schema, OpenAPI Hono routes with search/filter, and a management UI with list, create/edit dialog, search, and base64 logo upload.

The existing Organization CRUD (`packages/service/src/routes/organization/`) is a direct template — same file structure, same auth middleware, same Zod OpenAPI pattern. The frontend Organization table + dialog is also a near-exact template for the App management UI, including the base64 logo upload pattern already implemented in `organization-dialog.tsx`.

**Primary recommendation:** Clone the Organization pattern for App routes, extend the list endpoint with `search` and `deletedAt` filtering, and add `sortOrder` to Application for future ordering. Menu and MenuRole models should be designed now (Phase 2 needs them) but their CRUD routes are Phase 2 scope.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| APP-01 | Admin can create an application (name, code, description) | `createApplication.ts` route + `AppDialog` component — pattern from `createOrganization.ts` + `organization-dialog.tsx` |
| APP-02 | Admin can edit application information | `updateApplication.ts` route + `AppDialog` with `app` prop — pattern from `updateOrganization.ts` + `organization-dialog.tsx` |
| APP-03 | Admin can delete an application (confirm dialog) | `deleteApplication.ts` soft-delete route + `DeleteConfirmDialog` — pattern from `deleteOrganization.ts` + `delete-confirm-dialog.tsx`, extended with `deletedAt` |
| APP-04 | Admin can search and filter applications | `listApplications.ts` with `search` query param (LIKE on name/code/description) — new capability not in Organization routes |
| APP-05 | Admin can upload application logo | Base64 approach — pattern already exists in `organization-dialog.tsx` (FileReader → dataURL → setValue) |
</phase_requirements>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Application code is a free-form string — admin types any value (e.g., "OA", "CRM-V2", "internal_tool"). Only uniqueness is enforced, no format regex constraint. The code field serves as the human-readable identifier for linking apps to menus and front-end routing metadata.
- **D-02:** App status (enable/disable) is NOT implemented in Phase 1. The `status` or `isActive` field can be added to the schema for future use, but no UI or API behavior for toggling it.
- **D-03:** App logos use base64 encoding. Frontend captures image, converts to base64, sends in API request. Backend stores the base64 string directly in an `Application.logo` text column (nullable). No file upload system, no Upload model reuse.
- **D-04:** App deletion is soft delete — `deletedAt` timestamp marks the app as deleted. Menus remain in the database and are NOT cascade-deleted. The list API filters out soft-deleted apps by default.

### Agent's Discretion
- Schema field naming (e.g., `isDeleted` vs `deletedAt`) — agent decides based on existing patterns
- Whether to include `sortOrder` on Application for future ordering
- Menu and MenuRole model field design — must support multi-level nesting (parentId) and role-based visibility

### Deferred Ideas (OUT OF SCOPE)
- App status management (enable/disable): Deferred from Phase 1
- Menu management UI: Phase 2 scope
- RBAC menu visibility: Phase 3 scope
- Hardcoded menu migration: Phase 4 scope

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Application CRUD | API / Backend | — | Prisma schema + Hono routes own data operations |
| App search/filter | API / Backend | Browser / Client | Server-side LIKE query, debounced client input |
| Logo upload (base64) | Browser / Client | API / Backend | FileReader API converts client-side, API stores string |
| Soft delete filtering | API / Backend | — | `deletedAt` filter in Prisma query |
| App list UI (table + pagination) | Browser / Client | — | React state, appClient calls |
| App create/edit dialog | Browser / Client | API / Backend | react-hook-form + Hono RPC |
| Delete confirmation dialog | Browser / Client | API / Backend | Client dialog → API call |

## Standard Stack

### Core (no new packages needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 7.8.0 | ORM, schema, migrations | Already in project, PostgreSQL adapter |
| @hono/zod-openapi | 1.4.0 | Type-safe route definitions | Already in project, standard pattern |
| Hono | 4.x | HTTP framework | Already in project |
| react-hook-form | 7.75.0 | Form handling with Zod resolver | Already in project, used in org dialog |
| zod | 4.4.3 | Schema validation | Already in project |
| lucide-react | 1.14.0 | Icons (Search, Plus, Pencil, Trash2) | Already in project |
| sonner | 2.0.7 | Toast notifications | Already in project |
| next-intl | 4.12.0 | i18n translations | Already in project |

### Supporting (already available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @base-ui/react | 1.4.1 | Base UI primitives (Input, Dialog) | UI components already available |
| class-variance-authority | 0.7.1 | Component variants | Button, Badge components |
| react-use | 17.6.0 | React hooks (useAsyncFn) | useAsyncData hook available |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Base64 logo (D-03) | Upload to S3/object storage | More complex, needs storage service — explicitly rejected in D-03 |
| deletedAt timestamp (D-04) | isDeleted boolean | Timestamp enables "deleted X ago" display; boolean is simpler but less informative |
| Server-side search | Client-side filtering | Server-side scales better, keeps API consistent for future |

**Installation:** None — all dependencies already installed.

## Package Legitimacy Audit

No new packages are being installed in this phase. All dependencies are already in `package.json`.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Codebase Analysis

### Existing Pattern: Organization CRUD (Template for App CRUD)

The Organization module is a complete, working CRUD that should be cloned for App:

**Backend structure:**
```
packages/service/src/routes/organization/
├── schema.ts                    ← Zod schemas (response, body, query, params, error)
├── index.ts                     ← OpenAPIHono + admin middleware + openapiRoutes
├── createOrganization.ts        ← POST / with slug uniqueness check
├── getOrganization.ts           ← GET /{id}
├── listOrganizations.ts         ← GET / with limit/offset pagination
├── updateOrganization.ts        ← PUT /{id} with slug uniqueness check
├── deleteOrganization.ts        ← DELETE /{id} (hard delete currently)
```

**Key patterns to replicate:**
- Schema imports from `@hono/zod-openapi` (not `zod`)
- Response schemas registered with `.openapi("Name")`
- Route handlers use `c.req.valid("param")`, `c.req.valid("json")`, `c.req.valid("query")`
- Always `c.json(data, statusCode)` with explicit status code
- Admin middleware: `auth.api.getSession()` + role check, throws `HTTPException(401)`
- `export { routes as appRoutes }` — export `openapiRoutes()` result, not the instance

**Frontend structure:**
```
apps/admin/src/app/(logged)/organizations/
├── page.tsx                     ← "use client", title + description + <OrganizationTable />
├── components/
│   ├── organization-table.tsx   ← Table, pagination, state, dialog triggers
│   ├── organization-dialog.tsx  ← Create/Edit dialog with logo upload (base64)
│   └── delete-confirm-dialog.tsx ← Delete confirmation dialog
```

**Key patterns to replicate:**
- `useCallback` + `useEffect` for data fetching with `appClient`
- Pagination: `limit`/`offset` query params, page state, totalPages calculation
- Dialog state: `showCreate`, `editItem`, `deleteItem` states
- Logo upload: `FileReader.readAsDataURL()` → `setValue("logo", dataUrl)`
- Toast notifications: `toast.success(t("key"))` / `toast.error(t("key"))`
- Loading spinner: `<Spinner />` component
- Empty state: message when list is empty

### Application Model: Fields and Relationships

Based on CONTEXT.md decisions and roadmap:

**Application model fields:**
- `id` — String, cuid, primary key (matches existing pattern)
- `name` — String, required (human-readable display name)
- `code` — String, required, unique (free-form admin-entered identifier per D-01)
- `description` — String, optional (nullable)
- `logo` — String, optional, nullable (base64 data URL per D-03)
- `sortOrder` — Int, default 0 (agent discretion, useful for ordering apps)
- `deletedAt` — DateTime, optional, nullable (soft delete per D-04)
- `createdAt` — DateTime, default now()
- `updatedAt` — DateTime, @updatedAt
- Relation: `menus Menu[]` (one-to-many, FK `appId`)

**Menu model fields (Phase 2 scope, but schema needed now):**
- `id` — String, cuid
- `appId` — String, required (FK to Application)
- `parentId` — String, optional, nullable (self-referential for tree nesting)
- `name` — String, required (display name)
- `code` — String, required (route identifier / permission code)
- `icon` — String, optional, nullable (lucide icon name)
- `url` — String, optional, nullable (route path)
- `sortOrder` — Int, default 0
- `isExternal` — Boolean, default false (open in new tab)
- `isVisible` — Boolean, default true (admin can hide without deleting)
- `createdAt` — DateTime
- `updatedAt` — DateTime
- Relations: `app Application` (FK), `children Menu[]` (self-relation), `parent Menu?` (self-relation), `menuRoles MenuRole[]`

**MenuRole model fields (Phase 3 scope, but schema needed now):**
- `id` — String, cuid
- `menuId` — String, required (FK to Menu)
- `roleId` — String, required (role identifier string matching better-auth roles)
- `createdAt` — DateTime
- Unique constraint: `[menuId, roleId]`
- Relations: `menu Menu` (FK)

### Existing Code Insights

**Reusable assets:**
- `organization-dialog.tsx` lines 88-106: Base64 logo upload with FileReader — copy directly
- `delete-confirm-dialog.tsx`: Generic pattern, change entity prop
- `useAsyncData` hook: Wraps async fetchers with loading/error states — optional, current pattern uses raw `useCallback`
- `Spinner` component: Loading state display

**Integration points:**
- `packages/service/src/routes/index.ts` line 11: Add `.route("/applications", appRoutes)` chain
- `apps/admin/src/components/layout/sidebar.tsx` lines 26-47: Eventually replaced by dynamic menus (Phase 4)
- `apps/admin/messages/en.json` + `zh.json`: Add "Applications" translation section

**Existing patterns to follow exactly:**
- Prisma model: `@@map("application")` table name convention
- ID: `@id @default(cuid())`
- Timestamps: `@default(now())` for createdAt, `@updatedAt` for updatedAt
- Nullable fields: `String?` syntax
- Relations: explicit `@relation(fields: [...], references: [id])` syntax
- Indexes: `@@index([field])` for foreign keys, `@@unique([field])` for uniqueness

### API Design: Search Endpoint Enhancement

The Organization `listOrganizations` endpoint uses simple `limit`/`offset`. The App `listApplications` endpoint needs additional search capability:

**Query parameters:**
- `limit` — number, default 10, max 100
- `offset` — number, default 0
- `search` — string, optional (searches name, code, description with ILIKE)

**Prisma query pattern for search:**
```typescript
const where = search
  ? {
      deletedAt: null,
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }
  : { deletedAt: null };
```

**Note:** Prisma 7 with PostgreSQL supports `mode: "insensitive"` for case-insensitive LIKE. Verify this works with the current Prisma version.

### Soft Delete Pattern

The Organization currently uses hard delete (`prisma.organization.delete`). Application needs soft delete:

**In delete endpoint:**
```typescript
await prisma.application.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```

**In list endpoint:**
```typescript
where: { deletedAt: null }
```

**In get endpoint:**
```typescript
where: { id, deletedAt: null }
```

**In update endpoint:**
```typescript
where: { id, deletedAt: null }  // prevent updating deleted apps
```

**In create endpoint (code uniqueness):**
```typescript
const existing = await prisma.application.findFirst({
  where: { code: body.code, deletedAt: null },
});
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | react-hook-form + zodResolver | Already used in org dialog, handles error display |
| API client calls | Raw fetch | appClient (Hono RPC) | Type-safe, already set up |
| Toast notifications | Custom notification system | sonner | Already in project |
| Image preview | Custom file handling | FileReader.readAsDataURL() | Already implemented in org dialog |
| Pagination | Custom pagination | limit/offset query params + page state | Matches existing pattern |
| Case-insensitive search | Manual SQL/regex | Prisma `mode: "insensitive"` | Built-in PostgreSQL support |

## Common Pitfalls

### Pitfall 1: Prisma Schema Changes Require Client Regeneration
**What goes wrong:** After modifying `schema.prisma`, the generated Prisma client becomes stale. `prisma.<model>` returns `undefined` at runtime, causing 500 errors.
**Why it happens:** Prisma generates a client from the schema. Changes to the schema don't auto-propagate.
**How to avoid:** After any `schema.prisma` modification, run `pnpm db:generate` and restart the dev server.
**Warning signs:** `Cannot read properties of undefined` when accessing `prisma.application`.

### Pitfall 2: Code Uniqueness Must Account for Soft-Deleted Records
**What goes wrong:** After soft-deleting an app with code "CRM", creating a new app with code "CRM" fails because the old record still exists.
**Why it happens:** `findUnique({ where: { code } })` doesn't filter by `deletedAt`.
**How to avoid:** Use `findFirst({ where: { code, deletedAt: null } })` instead of `findUnique` for code uniqueness checks.

### Pitfall 3: Base64 Logos Can Be Very Large
**What goes wrong:** Large images (5MB+) stored as base64 in the database cause slow queries and large API responses.
**Why it happens:** Base64 encoding increases size by ~33%, and full image data is sent in every API response.
**How to avoid:** Add frontend validation to limit file size (e.g., 2MB max). Consider storing only a thumbnail-sized version, or compress before encoding. The Organization dialog pattern doesn't enforce size limits — add validation in the App dialog.

### Pitfall 4: Hono RPC Type Inference Breaks with Wrong Export
**What goes wrong:** Frontend `appClient` loses type information, making path params and response types `any`.
**Why it happens:** Exporting the raw `OpenAPIHono` instance instead of the `openapiRoutes()` result.
**How to avoid:** Always `export { routes as appRoutes }` where `routes = app.openapiRoutes([...])`. Never export the original `app` instance.

### Pitfall 5: Zod 4 String Validators Are Deprecated
**What goes wrong:** Using `z.string().email()` or `z.string().regex()` causes deprecation warnings or errors.
**Why it happens:** Zod 4 moved string format validators to standalone functions.
**How to avoid:** For the Application schema, we don't use format validators (code is free-form per D-01). But if email/url validation is ever needed, use `z.email()`, `z.url()` etc. instead of `z.string().email()`.

### Pitfall 6: Frontend Search Must Debounce API Calls
**What goes wrong:** Every keystroke in the search input triggers an API call, causing excessive network traffic and UI flicker.
**Why it happens:** `onChange` handlers fire on every character.
**How to avoid:** Use `useRef` + `setTimeout` debounce pattern, or `react-use`'s `useDebounce` hook. Reset pagination to page 1 when search changes.

## Code Examples

### Backend: Application Schema (packages/service/src/routes/application/schema.ts)

```typescript
// Pattern: packages/service/src/routes/organization/schema.ts
import { z } from "@hono/zod-openapi";

export const applicationSchema = z
  .object({
    id: z.string().openapi({ example: "clx1234567890" }),
    name: z.string().openapi({ example: "OA System" }),
    code: z.string().openapi({ example: "OA" }),
    description: z.string().nullable().optional(),
    logo: z.string().nullable().optional(),
    sortOrder: z.number().openapi({ example: 0 }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .openapi("Application");

export const listApplicationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().optional(),
});

export const applicationIdParamSchema = z.object({
  id: z.string().min(1).openapi({ example: "clx1234567890" }),
});

export const createApplicationBodySchema = z.object({
  name: z.string().min(1).openapi({ example: "OA System" }),
  code: z.string().min(1).openapi({ example: "OA" }),
  description: z.string().optional(),
  logo: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateApplicationBodySchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const errorSchema = z
  .object({
    code: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: "Bad Request" }),
  })
  .openapi("Error");

export const deleteSuccessSchema = z
  .object({
    success: z.literal(true),
  })
  .openapi("DeleteSuccess");

export const listApplicationsResponseSchema = z
  .object({
    applications: applicationSchema.array(),
    total: z.number(),
  })
  .openapi("ListApplicationsResponse");

export type Application = z.infer<typeof applicationSchema>;
export type CreateApplicationBody = z.infer<typeof createApplicationBodySchema>;
export type UpdateApplicationBody = z.infer<typeof updateApplicationBodySchema>;
```

### Backend: List with Search (packages/service/src/routes/application/listApplications.ts)

```typescript
// Enhanced pattern from listOrganizations.ts with search + soft delete filter
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { prisma } from "../../lib/db";
import {
  errorSchema,
  listApplicationsQuerySchema,
  listApplicationsResponseSchema,
} from "./schema";

export const listApplications = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["Application"],
    summary: "List applications",
    description: "Returns a paginated list of applications, excluding soft-deleted.",
    request: {
      query: listApplicationsQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listApplicationsResponseSchema,
          },
        },
        description: "Paginated list of applications",
      },
      401: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Unauthorized",
      },
    },
  }),
  handler: async (c) => {
    const { limit, offset, search } = c.req.valid("query");

    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { code: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.application.count({ where }),
    ]);

    return c.json({ applications, total }, 200);
  },
});
```

### Backend: Soft Delete (packages/service/src/routes/application/deleteApplication.ts)

```typescript
// Modified from deleteOrganization.ts — soft delete instead of hard delete
handler: async (c) => {
  const { id } = c.req.valid("param");

  const existing = await prisma.application.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw new HTTPException(404, { message: "Application not found" });
  }

  await prisma.application.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return c.json({ success: true as const }, 200);
},
```

### Backend: Code Uniqueness Check (packages/service/src/routes/application/createApplication.ts)

```typescript
// Modified from createOrganization.ts — use findFirst for soft-delete awareness
const existing = await prisma.application.findFirst({
  where: { code: body.code, deletedAt: null },
});
if (existing) {
  throw new HTTPException(409, { message: "Application code already exists" });
}
```

### Frontend: Search Input in Table Component

```typescript
// Add to apps-table.tsx — debounced search input above the table
const [search, setSearch] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");
const debounceRef = useRef<NodeJS.Timeout | null>(null);

function handleSearchChange(value: string) {
  setSearch(value);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    setDebouncedSearch(value);
    setPage(1); // Reset to first page on search
  }, 300);
}

// In fetchApps, include search in query:
const res = await appClient.api.applications.$get({
  query: { limit: pageSize, offset, search: debouncedSearch || undefined },
});
```

### Prisma Schema: Application Model

```prisma
// Add to packages/service/prisma/schema.prisma
model Application {
  id          String    @id @default(cuid())
  name        String
  code        String
  description String?
  logo        String?   // base64 data URL
  sortOrder   Int       @default(0)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  menus       Menu[]

  @@unique([code])
  @@index([deletedAt])
  @@map("application")
}

model Menu {
  id         String   @id @default(cuid())
  appId      String
  app        Application @relation(fields: [appId], references: [id], onDelete: Cascade)
  parentId   String?
  parent     Menu?    @relation("MenuTree", fields: [parentId], references: [id], onDelete: Cascade)
  children   Menu[]   @relation("MenuTree")
  name       String
  code       String
  icon       String?
  url        String?
  sortOrder  Int      @default(0)
  isExternal Boolean  @default(false)
  isVisible  Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  menuRoles  MenuRole[]

  @@index([appId])
  @@index([parentId])
  @@map("menu")
}

model MenuRole {
  id        String   @id @default(cuid())
  menuId    String
  menu      Menu     @relation(fields: [menuId], references: [id], onDelete: Cascade)
  roleId    String
  createdAt DateTime @default(now())

  @@unique([menuId, roleId])
  @@index([menuId])
  @@index([roleId])
  @@map("menu_role")
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hard delete (Organization) | Soft delete with `deletedAt` (Application) | This phase | Need to filter `deletedAt: null` in all queries |
| No search in list APIs | Server-side ILIKE search with `mode: "insensitive"` | This phase | New query param `search` in list endpoint |
| Zod 3 style `z.string().email()` | Zod 4 standalone `z.email()` | Project uses Zod 4 | Don't use deprecated string format methods |

**Deprecated/outdated:**
- `z.string().regex()` for URL validation: Use `z.url()` instead (Zod 4)
- `z.string().email()`: Use `z.email()` instead (Zod 4)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prisma 7 `mode: "insensitive"` works with PostgreSQL adapter | Code Examples | Search would need case-insensitive workaround (lower() function) |
| A2 | `deletedAt` timestamp is preferred over `isDeleted` boolean | Schema Design | Minor — boolean is simpler but less informative |
| A3 | `sortOrder` on Application is useful for future ordering | Schema Design | Low — can be added later via migration if unused |
| A4 | Menu/MenuRole models should be created in Phase 1 schema even though their CRUD is Phase 2 | Schema Design | Medium — Phase 2 would need a separate migration if not created now |
| A5 | Base64 logo size should be limited to ~2MB on frontend | Pitfalls | Low — unbounded base64 could cause DB/performance issues |

**If this table is empty:** N/A — assumptions exist.

## Open Questions (RESOLVED)

1. **Should Menu/MenuRole models be created in Phase 1 or Phase 2?** — RESOLVED: Create them in Phase 1 schema (Plan 01-01). Avoids a second migration in Phase 2, and the models are simple enough to design now.

2. **Should we use `deletedAt` (timestamp) or `isDeleted` (boolean) for soft delete?** — RESOLVED: Use `deletedAt` DateTime. Timestamps enable "deleted X ago" display and are a common pattern.

3. **How to handle code uniqueness for soft-deleted apps?** — RESOLVED: Use `deletedAt` filtering so deleted codes CAN be reused — admin might delete "CRM" and create a new "CRM" later.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured |
| Config file | none |
| Quick run command | `pnpm dev` (manual verification) |
| Full suite command | N/A — no automated tests exist |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| APP-01 | Create application with name, code, description | manual-only | Open create dialog, fill form, submit | ❌ No test infra |
| APP-02 | Edit application information | manual-only | Open edit dialog, modify, save | ❌ No test infra |
| APP-03 | Delete application with confirmation | manual-only | Click delete, confirm in dialog | ❌ No test infra |
| APP-04 | Search and filter applications | manual-only | Type in search input, verify filtered list | ❌ No test infra |
| APP-05 | Upload application logo | manual-only | Click upload, select image, verify preview | ❌ No test infra |

### Sampling Rate
- **Per task commit:** `pnpm dev` — manual smoke test
- **Per wave merge:** Full CRUD flow test (create → list → search → edit → delete)
- **Phase gate:** All 5 success criteria from ROADMAP verified manually

### Wave 0 Gaps
- [ ] No test framework installed — manual verification only
- [ ] No API integration tests
- [ ] No E2E tests

**Note:** AGENTS.md confirms "No tests, no CI workflows configured yet." This phase follows the same manual verification pattern as existing features.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Database | ✓ | — | — |
| Node.js | Runtime | ✓ | — | — |
| pnpm | Package manager | ✓ | — | — |
| Prisma CLI | Schema generation | ✓ | 7.8.0 | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Sources

### Primary (HIGH confidence)
- Codebase: `packages/service/src/routes/organization/` — Complete CRUD pattern reference
- Codebase: `apps/admin/src/app/(logged)/organizations/` — Frontend UI pattern reference
- Codebase: `packages/service/prisma/schema.prisma` — Schema conventions
- Codebase: `apps/admin/messages/en.json` + `zh.json` — i18n structure

### Secondary (MEDIUM confidence)
- Prisma docs: `mode: "insensitive"` for PostgreSQL — [ASSUMED: Prisma documentation, verified by existing project using Prisma 7]
- Zod 4 deprecation: Standalone validators — [CITED: AGENTS.md Zod 4 Deprecations table]

### Tertiary (LOW confidence)
- None — all findings are from codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use
- Architecture: HIGH — directly cloning existing Organization pattern
- Pitfalls: HIGH — based on codebase patterns and known Prisma/Zod behaviors

**Research date:** 2026-05-20
**Valid until:** 2026-06-20 (stable stack, no fast-moving dependencies)

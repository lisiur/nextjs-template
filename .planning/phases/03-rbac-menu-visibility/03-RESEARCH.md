# Phase 3: RBAC & Menu Visibility - Research

**Researched:** 2026-05-20
**Domain:** Role-based access control for menu visibility + dynamic sidebar rendering
**Confidence:** HIGH

## Summary

Phase 3 connects the database-driven menu system (Phase 2) to user roles (better-auth) so each user only sees authorized menus. The MenuRole join table already exists in the Prisma schema. The implementation requires three layers: (1) an admin API for assigning menus to roles, (2) a `GET /api/menus/mine` endpoint that returns the current user's authorized menus based on session role, and (3) a dynamic sidebar that replaces the hardcoded `menuItems` array with data from a Zustand store.

The codebase has well-established patterns for all three layers: OpenAPI route definitions, auth middleware with `auth.api.getSession()`, and Zustand stores with Hono RPC client calls. The key design decision is that the `GET /api/menus/mine` endpoint should NOT be admin-only — it should be accessible to any authenticated user, since it serves the sidebar for all roles.

**Primary recommendation:** Follow the existing route pattern (OpenAPIHono + defineOpenAPIRoute) for the new endpoints, create a `useMenuStore` Zustand store mirroring `system-config-store.ts`, and build a `RoleMenuAssignment` component that reuses the tree structure from `menu-tree.tsx` but adds checkboxes instead of drag-and-drop.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Role-menu assignment UI | Browser / Client | API / Backend | Admin interacts via frontend; API persists assignments |
| Server-side menu filtering | API / Backend | Database / Storage | API reads session role, queries MenuRole + Menu tables |
| Session-based role extraction | API / Backend | — | better-auth session provides `user.role` via cookie |
| Dynamic sidebar rendering | Browser / Client | — | Zustand store caches menus, sidebar reads from store |
| Menu caching after login | Browser / Client | API / Backend | Client fetches once on login, caches in Zustand |
| Auto-include children on assign | API / Backend | — | Server-side tree traversal ensures parent→child consistency |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@hono/zod-openapi` | ^1.4.0 | Type-safe route definitions with OpenAPI docs | Already used in all existing routes |
| `better-auth` | ^1.6.10 | Session management, role extraction from cookie | Already integrated, session provides `user.role` |
| `zustand` | ^5.0.13 | Client-side menu caching store | Already used for system-config, team convention |
| `prisma` | ^7.8.0 | Database queries for MenuRole joins | Already the ORM, schema has MenuRole model |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | ^1.14.0 | Dynamic icon rendering from Menu.icon field | Sidebar + assignment tree |
| `@base-ui/react` | ^1.4.1 | Checkbox component for tree nodes | Role-menu assignment checkboxes |
| `sonner` | ^2.0.7 | Toast notifications for save/error feedback | Assignment save success/error |
| `next-intl` | ^4.12.0 | i18n for new UI strings | All new user-facing text |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand store | React Context | Zustand is established pattern; Context would be inconsistent |
| `defineOpenAPIRoute` | Raw Hono handler | Would lose OpenAPI docs and Zod validation |
| Custom tree with checkboxes | shadcn tree-view library | Existing `menu-tree.tsx` pattern is sufficient, less dependency risk |

**Installation:** No new packages needed — all dependencies already installed.

## Package Legitimacy Audit

> No external packages are being installed in this phase. All dependencies are already in the project.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER TIER                              │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  AppSidebar  │◄───│ useMenuStore │◄───│ GET /menus/mine   │   │
│  │  (dynamic)   │    │  (Zustand)   │    │ (on login)        │   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
│         ▲                                                         │
│         │ reads menus                                             │
│         ▼                                                         │
│  ┌──────────────────────────────┐                                │
│  │  RoleMenuAssignment (admin)  │──── PUT /menu-role/batch       │
│  │  - Select role dropdown      │                                │
│  │  - Tree with checkboxes      │                                │
│  │  - Auto-include children     │                                │
│  └──────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API TIER                                  │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────────┐     │
│  │ GET /menus/mine         │  │ PUT /menu-role/batch        │     │
│  │ (any authenticated user)│  │ (admin only)                │     │
│  │ Reads session.role      │  │ Upserts MenuRole records    │     │
│  │ Queries MenuRole+Menu   │  │ Auto-includes children      │     │
│  └────────────────────────┘  └────────────────────────────┘     │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              PRISMA / POSTGRESQL                          │   │
│  │  Menu ←──→ MenuRole ←──→ roleId (string matching role)   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
packages/service/src/routes/menu-role/
├── index.ts                    ← OpenAPIHono + admin middleware + openapiRoutes
├── schema.ts                   ← Zod schemas for role-menu assignment
├── batchAssignMenus.ts         ← PUT /menu-role/batch (assign menus to a role)
├── getRoleMenus.ts             ← GET /menu-role/:roleId (list menus for a role)
└── getMine.ts                  ← GET /menus/mine (current user's authorized menus)

apps/admin/src/stores/
└── menu-store.ts               ← Zustand store for caching user's menus

apps/admin/src/app/(logged)/roles/
└── [roleId]/
    └── menus/
        └── page.tsx            ← Role-menu assignment page

apps/admin/src/components/layout/
└── sidebar.tsx                 ← Modified: replace hardcoded menuItems with dynamic loading
```

### Pattern 1: Admin-Only Route with Auth Middleware
**What:** OpenAPIHono instance with `auth.api.getSession()` middleware checking `role === "admin"`
**When to use:** For role-menu assignment endpoints (admin management)
**Example:**
```typescript
// Source: packages/service/src/routes/organization/index.ts (lines 12-18)
const menuRoleRoutes = new OpenAPIHono();

menuRoleRoutes.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});
```

### Pattern 2: Session-Based User Endpoint (No Admin Check)
**What:** Route that reads session but allows any authenticated user (not just admin)
**When to use:** For `GET /menus/mine` — all users need their menus for the sidebar
**Example:**
```typescript
// New pattern — NOT in codebase yet, derived from auth.ts + route patterns
export const getMine = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/mine",
    tags: ["Menu"],
    summary: "Get current user's authorized menus",
    responses: {
      200: {
        content: { "application/json": { schema: listMenusResponseSchema } },
        description: "Menus the current user can access",
      },
    },
  }),
  handler: async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const role = session.user.role;
    const menus = await prisma.menu.findMany({
      where: {
        menuRoles: { some: { roleId: role } },
        isVisible: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return c.json({ menus }, 200);
  },
});
```

### Pattern 3: Batch Upsert for Role-Menu Assignment
**What:** Replace all MenuRole records for a role in a single transaction
**When to use:** When admin saves role-menu assignments (replaces, not appends)
**Example:**
```typescript
// Derived from system-config.repository.ts batchUpsert pattern
// 1. Delete existing MenuRole records for this roleId
// 2. Insert new MenuRole records (with auto-included children)
await prisma.$transaction([
  prisma.menuRole.deleteMany({ where: { roleId } }),
  prisma.menuRole.createMany({
    data: menuIds.flatMap((id) => {
      // Auto-include: for each assigned menu, also assign all descendants
      const allIds = collectDescendantIds(id, menuTree);
      return allIds.map((menuId) => ({ menuId, roleId }));
    }),
  }),
]);
```

### Pattern 4: Zustand Store with Fetch-on-Login
**What:** Store that fetches menus once, caches them, provides to components
**When to use:** For `useMenuStore` — sidebar reads from this store
**Example:**
```typescript
// Source: apps/admin/src/stores/system-config-store.ts pattern
"use client";
import { create } from "zustand";
import { appClient } from "@/lib/api";

interface MenuState {
  menus: Menu[];
  loading: boolean;
  fetched: boolean;
  fetchMenus: () => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  menus: [],
  loading: false,
  fetched: false,
  fetchMenus: async () => {
    if (get().fetched) return;
    set({ loading: true });
    try {
      const res = await appClient.api.menu.mine.$get();
      if (res.ok) {
        const data = await res.json();
        set({ menus: data.menus, fetched: true });
      }
    } catch {
      // Keep existing values on error
    } finally {
      set({ loading: false });
    }
  },
}));
```

### Anti-Patterns to Avoid
- **Client-side role filtering:** Never filter menus on the client based on role — always use `GET /menus/mine` which filters server-side
- **Appending MenuRole records:** Always replace (deleteMany + createMany) rather than appending — prevents duplicate assignments
- **Hardcoding role strings in frontend:** Import role constants from `@repo/shared` or derive from session, never hardcode `"admin"` in frontend code

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tree traversal for auto-include children | Custom recursive function | Prisma `include: { children: true }` + recursive helper | Prisma handles the query; you just collect IDs |
| Session extraction from headers | Manual cookie parsing | `auth.api.getSession({ headers })` | better-auth handles token verification |
| Icon rendering from string names | Custom icon resolver | `lucide-react` icons record + `getIcon()` helper | Already built in `menu-tree.tsx` (line 43-49) |
| Checkbox tree state management | Manual checked state tracking | React state + tree walk | Standard React pattern, no library needed |

**Key insight:** The `getIcon()` function in `menu-tree.tsx` (lines 45-49) is the canonical pattern for resolving icon strings to Lucide components. Reuse it, don't rebuild.

## Common Pitfalls

### Pitfall 1: Admin-Only vs Any-Authenticated-User Endpoints
**What goes wrong:** Making `GET /menus/mine` admin-only, so non-admin users can't load their sidebar
**Why it happens:** Copying the admin middleware pattern without thinking about who needs the endpoint
**How to avoid:** `GET /menus/mine` uses session extraction only (no role check). Admin endpoints (`PUT /menu-role/batch`, `GET /menu-role/:roleId`) use admin middleware.
**Warning signs:** Non-admin users see empty sidebar or "Admin access required" error

### Pitfall 2: Auto-Include Children Not Working Bidirectionally
**What goes wrong:** Assigning a child menu without its parent leaves orphaned children in the UI
**Why it happens:** Thinking only top-down (parent→child) without checking if child→parent is needed
**How to avoid:** When assigning, auto-include all descendants (top-down). When checking visibility, a user sees a menu only if it OR an ancestor is assigned. OR simpler: always assign full tree paths.
**Warning signs:** Admin assigns "Settings > General" but user can't see "Settings" parent

### Pitfall 3: MenuRole.roleId Format Mismatch
**What goes wrong:** MenuRole stores `"admin"` but session.role returns `"Admin"` (case mismatch)
**Why it happens:** better-auth roles are defined as `admin`, `manager`, `user` in `permissions.ts` (line 12-29), but the string in the database might differ
**How to avoid:** Verify that `session.user.role` returns the exact same string used in `MenuRole.roleId`. The roles in `permissions.ts` are lowercase: `admin`, `manager`, `user`.
**Warning signs:** `GET /menus/mine` returns empty array for all users

### Pitfall 4: Sidebar Flash of Empty Content on Login
**What goes wrong:** Sidebar renders empty before menus are fetched, causing layout shift
**Why it happens:** Zustand store starts empty, fetch is async
**How to avoid:** Show skeleton/spinner while `loading === true`. The `SidebarMenuSkeleton` component already exists in `sidebar.tsx` (line 600-636).
**Warning signs:** Sidebar flickers from empty to populated on page load

### Pitfall 5: Stale Menu Cache After Role Change
**What goes wrong:** Admin changes a role's menu assignments, but affected users still see old menus
**Why it happens:** Zustand store caches menus with `fetched: true`, never re-fetches
**How to avoid:** Add a `refetchMenus()` method to the store. For now, a page refresh suffices. In the future, could use WebSocket or polling.
**Warning signs:** Admin reassigns menus, user refreshes and sees changes (but doesn't see changes without refresh)

## Code Examples

### Existing: Admin Auth Middleware Pattern
```typescript
// Source: packages/service/src/routes/organization/index.ts (lines 12-18)
organizationRoutes.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});
```

### Existing: Icon Resolution from String
```typescript
// Source: apps/admin/src/app/(logged)/applications/[id]/menus/components/menu-tree.tsx (lines 43-49)
const iconsRecord = icons as Record<string, LucideIcon>;

function getIcon(icon: string | null): React.ReactNode | undefined {
  if (!icon) return undefined;
  const IconComponent = iconsRecord[icon];
  if (IconComponent) return <IconComponent className="h-4 w-4" />;
  return <Folder className="h-4 w-4" />;
}
```

### Existing: Flat-to-Tree Conversion
```typescript
// Source: apps/admin/src/app/(logged)/applications/[id]/menus/components/menu-tree.tsx (lines 52-92)
function buildTree(menus: Menu[]): SortableMenuItem[] {
  const map = new Map<string, SortableMenuItem>();
  const roots: SortableMenuItem[] = [];

  for (const menu of menus) {
    map.set(menu.id, { id: menu.id, name: menu.name, children: [], ... });
  }
  for (const menu of menus) {
    const node = map.get(menu.id)!;
    if (menu.parentId) {
      const parent = map.get(menu.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
```

### Existing: Route Registration Pattern
```typescript
// Source: packages/service/src/routes/index.ts (lines 1-17)
const routes = new OpenAPIHono()
  .route("/auth", authRoutes)
  .route("/system-config", systemConfigRoutes)
  .route("/organizations", organizationRoutes)
  .route("/applications", applicationRoutes)
  .route("/menu", menuRoutes)
  .route("/upload", uploadRoutes);

export { routes };
```

### New: MenuRole Repository (for reusable DB operations)
```typescript
// Proposed pattern — based on system-config.repository.ts
import { prisma } from "../lib/db";

export const menuRoleRepository = {
  findByRole(roleId: string) {
    return prisma.menuRole.findMany({
      where: { roleId },
      include: { menu: true },
    });
  },

  batchAssign(roleId: string, menuIds: string[]) {
    return prisma.$transaction([
      prisma.menuRole.deleteMany({ where: { roleId } }),
      prisma.menuRole.createMany({
        data: menuIds.map((menuId) => ({ menuId, roleId })),
      }),
    ]);
  },

  getMenusForRole(roleId: string) {
    return prisma.menu.findMany({
      where: {
        menuRoles: { some: { roleId } },
        isVisible: true,
      },
      orderBy: { sortOrder: "asc" },
    });
  },
};
```

### New: Collect Descendant IDs (for auto-include children)
```typescript
// Proposed — tree traversal helper
function collectDescendantIds(
  parentId: string,
  menus: { id: string; parentId: string | null }[]
): string[] {
  const ids = [parentId];
  const children = menus.filter((m) => m.parentId === parentId);
  for (const child of children) {
    ids.push(...collectDescendantIds(child.id, menus));
  }
  return ids;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `menuItems` array in sidebar.tsx | Dynamic from `useMenuStore` | Phase 3 (this phase) | Sidebar.tsx lines 26-47 replaced |
| Admin-only auth middleware on all routes | Mixed: admin for management, session-only for user endpoints | Phase 3 | `GET /menus/mine` accessible to all authenticated users |

**Deprecated/outdated:**
- `menuItems` constant in `sidebar.tsx` (lines 26-47): Will be replaced by dynamic loading from Zustand store
- `bottomMenuItems` constant (lines 49-60): Keep as-is — these are system-level (profile, settings), not menu-managed

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `session.user.role` returns lowercase string matching MenuRole.roleId ("admin", "manager", "user") | Common Pitfalls | All menu queries return empty — need to verify actual session.role format |
| A2 | MenuRole model's `roleId` stores the same string format as better-auth's role names | Standard Stack | Assignments won't match sessions — need to verify data format |
| A3 | The `collectDescendantIds` helper handles circular references gracefully (Prisma schema has `onDelete: Cascade` preventing cycles) | Code Examples | Infinite recursion if cycles exist — Prisma schema prevents this |
| A4 | `bottomMenuItems` (profile, settings) should remain hardcoded and not be managed via MenuRole | Architecture | These items might need role-based visibility — currently assumed system-level |

## Open Questions

1. **Does `session.user.role` return the exact string "admin"/"manager"/"user"?**
   - What we know: `permissions.ts` defines roles as `admin`, `manager`, `user` (lowercase). `auth.ts` passes these to better-auth admin plugin.
   - What's unclear: The actual string stored in `user.role` column and returned in session
   - Recommendation: Verify by checking a real session response or better-auth docs. The schema shows `role String?` on User model — the value comes from better-auth admin plugin.

2. **Should `GET /menus/mine` return a flat list or tree structure?**
   - What we know: Existing `listMenus` returns flat list; sidebar needs tree for rendering
   - What's unclear: Whether to return flat and build tree client-side, or return pre-built tree
   - Recommendation: Return flat list (consistent with existing pattern), build tree in Zustand store or component. The `buildTree()` helper from `menu-tree.tsx` can be extracted to a shared utility.

3. **Should the role-menu assignment page live under `/roles/[roleId]/menus` or `/roles?tab=menus`?**
   - What we know: D-02 says "separate page for role-menu assignment"
   - What's unclear: Exact URL structure
   - Recommendation: `/roles/[roleId]/menus` — follows existing pattern of nested routes (see `/applications/[id]/menus`)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | MenuRole queries | ✓ | — | — |
| Node.js | Runtime | ✓ | LTS | — |
| pnpm | Package manager | ✓ | — | — |

**Missing dependencies with no fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (inferred from `application.test.ts` existing) |
| Config file | None detected — may need Wave 0 setup |
| Quick run command | `pnpm vitest run` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RBAC-01 | Different roles see different menus | integration | `pnpm vitest run --grep "menu-role"` | ❌ Wave 0 |
| RBAC-02 | Sidebar dynamically renders menus for each user | e2e/manual | Manual verification: login as different roles, check sidebar | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run --reporter=verbose`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `packages/service/src/routes/menu-role/__tests__/menu-role.test.ts` — API endpoint tests
- [ ] Vitest config setup if not present
- [ ] Test utilities for mocking `auth.api.getSession()`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | better-auth session cookies |
| V3 Session Management | yes | `auth.api.getSession()` extracts role from session |
| V4 Access Control | yes | Admin-only middleware on management routes; `GET /menus/mine` checks session existence |
| V5 Input Validation | yes | Zod schemas via @hono/zod-openapi |
| V6 Cryptography | no | No crypto operations in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Privilege escalation via forged session | Elevation of Privilege | better-auth verifies session token server-side; role from session cookie, not client input |
| MenuRole injection (assigning to arbitrary roles) | Tampering | Admin-only middleware + Zod validation on roleId parameter |
| Horizontal privilege (user A seeing user B's menus) | Information Disclosure | `GET /menus/mine` reads role from server session, not from request body |

## Sources

### Primary (HIGH confidence)
- `packages/service/prisma/schema.prisma` — MenuRole model (lines 199-210), Menu model (lines 176-197), User.role field (line 16)
- `packages/service/src/lib/auth.ts` — better-auth configuration, session type inference
- `packages/shared/src/permissions.ts` — Role definitions (admin, manager, user)
- `packages/service/src/routes/organization/index.ts` — Auth middleware pattern
- `apps/admin/src/stores/system-config-store.ts` — Zustand store pattern
- `apps/admin/src/components/layout/sidebar.tsx` — Current hardcoded menuItems

### Secondary (MEDIUM confidence)
- `apps/admin/src/app/(logged)/applications/[id]/menus/components/menu-tree.tsx` — Tree building, icon resolution, expand/collapse patterns
- `packages/service/src/repositories/system-config.repository.ts` — Repository pattern with batch operations

### Tertiary (LOW confidence)
- [ASSUMED] better-auth `session.user.role` returns lowercase string — needs verification against actual session data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries already in use, patterns well-established
- Architecture: HIGH — Clear integration points identified, existing patterns to follow
- Pitfalls: MEDIUM — Role string format mismatch is a real risk; auto-include children logic needs careful implementation

**Research date:** 2026-05-20
**Valid until:** 2026-06-20 (stable stack, low churn)

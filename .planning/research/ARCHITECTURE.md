# Architecture Research

**Domain:** Application and Menu Management System
**Researched:** 2026-05-20
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
├──────────────────┬──────────────────┬───────────────────────┤
│   App Management │   Menu Management │   Shared Components   │
│   `apps/` page   │   `menus/` page   │   Tree, DragDrop      │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         │   Hono RPC Client (TypeSafe)          │
         │   `src/lib/api/`                      │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Hono)                          │
│         `packages/service/src/`                              │
│   ┌─────────────┬──────────────┬──────────────┐            │
│   │  App Routes │  Menu Routes │  Role Routes  │            │
│   │  `routes/   │  `routes/    │  (existing)   │            │
│   │   app/`     │   menu/`     │               │            │
│   └─────────────┴──────────────┴──────────────┘            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL)                      │
│         `packages/service/prisma/`                          │
│   ┌─────────────┬──────────────┬──────────────┐            │
│   │  App Model  │  Menu Model  │  Role-Menu   │            │
│   │  (new)      │  (new)       │  (new)       │            │
│   └─────────────┴──────────────┴──────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| App Management | CRUD for applications (name, code, description, logo, status) | React page with table/dialog, Hono routes, Prisma model |
| Menu Management | Hierarchical menu tree per application, drag-and-drop sorting | Tree component with DnD, Hono routes, Prisma model with parent references |
| Role-Menu Mapping | Control menu visibility per role | Junction table, API endpoints for assignment |
| App Selector | Switch between applications in admin panel | Dropdown in sidebar, fetches user's accessible apps |
| Dynamic Sidebar | Render menus based on selected app and user roles | Fetches menu tree, filters by role permissions |

## Recommended Project Structure

```
packages/service/
├── prisma/
│   └── schema.prisma           # Add App, Menu, RoleMenu models
├── src/
│   ├── routes/
│   │   ├── app/                # Application management endpoints
│   │   │   ├── index.ts        # OpenAPIHono instance + routes
│   │   │   ├── schema.ts       # Zod schemas for App
│   │   │   ├── createApp.ts    # POST /app
│   │   │   ├── listApps.ts     # GET /app
│   │   │   ├── getApp.ts       # GET /app/:id
│   │   │   ├── updateApp.ts    # PUT /app/:id
│   │   │   └── deleteApp.ts    # DELETE /app/:id
│   │   ├── menu/               # Menu management endpoints
│   │   │   ├── index.ts        # OpenAPIHono instance + routes
│   │   │   ├── schema.ts       # Zod schemas for Menu
│   │   │   ├── createMenu.ts   # POST /menu
│   │   │   ├── listMenus.ts    # GET /menu?appId=...
│   │   │   ├── getMenu.ts      # GET /menu/:id
│   │   │   ├── updateMenu.ts   # PUT /menu/:id
│   │   │   ├── deleteMenu.ts   # DELETE /menu/:id
│   │   │   ├── reorderMenus.ts # PUT /menu/reorder
│   │   │   └── getMenuTree.ts  # GET /menu/tree/:appId
│   │   └── role-menu/          # Role-menu mapping endpoints
│   │       ├── index.ts
│   │       ├── schema.ts
│   │       ├── assignMenus.ts  # PUT /role-menu/:roleId
│   │       └── getRoleMenus.ts # GET /role-menu/:roleId
│   └── repositories/
│       ├── app.repository.ts   # App CRUD operations
│       ├── menu.repository.ts  # Menu CRUD + tree operations
│       └── role-menu.repository.ts # Role-menu mapping operations

apps/admin/
├── src/
│   ├── app/(logged)/
│   │   ├── apps/               # Application management page
│   │   │   ├── page.tsx        # App list with search
│   │   │   └── components/
│   │   │       ├── app-table.tsx
│   │   │       ├── app-dialog.tsx
│   │   │       └── app-form.tsx
│   │   └── menus/              # Menu management page
│   │       ├── page.tsx        # Left-right split: tree + form
│   │       └── components/
│   │           ├── menu-tree.tsx      # Draggable tree component
│   │           ├── menu-form.tsx      # Menu edit form
│   │           ├── icon-picker.tsx    # Icon selection component
│   │           └── app-selector.tsx   # Application dropdown
│   └── components/
│       └── ui/
│           ├── tree.tsx               # Generic tree component (shadcn)
│           └── icon-picker.tsx        # Icon picker component
```

### Structure Rationale

- **Separate `app/` and `menu/` route folders:** Follows existing pattern (see `organization/`, `system-config/`). Each domain has its own routes, schemas, and handlers.
- **`role-menu/` as separate domain:** Keeps role-menu mapping concerns isolated. Could be merged into `menu/` but separation clarifies API boundaries.
- **Frontend mirrors backend structure:** `apps/` and `menus/` pages correspond to backend routes. Makes navigation intuitive.
- **Shared UI components in `components/ui/`:** Tree and icon picker are reusable. Follows shadcn/ui pattern.

## Architectural Patterns

### Pattern 1: Hierarchical Data with Adjacency List

**What:** Each menu item stores `parentId` referencing its parent menu. Simple, intuitive for CRUD operations.

**When to use:** Menu trees with moderate depth (≤5 levels) and moderate size (≤1000 items per app).

**Trade-offs:**
- ✅ Simple queries for direct relationships
- ✅ Easy to move items (update one `parentId`)
- ✅ Prisma supports recursive queries
- ❌ Fetching full tree requires multiple queries or recursive CTE
- ❌ No built-in path/materialized path for ancestors

**Example:**
```prisma
model Menu {
  id          String   @id @default(cuid())
  appId       String
  app         App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  parentId    String?
  parent      Menu?    @relation("MenuTree", fields: [parentId], references: [id], onDelete: Cascade)
  children    Menu[]   @relation("MenuTree")
  name        String
  code        String   // Maps to frontend route meta.code
  icon        String?
  sortOrder   Int      @default(0)
  isVisible   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([appId, code])
  @@index([appId])
  @@index([parentId])
}
```

### Pattern 2: API-First with OpenAPI Schemas

**What:** Define OpenAPI schemas first, handlers implement against them. Ensures type safety and auto-documentation.

**When to use:** Always in this codebase — follows existing pattern.

**Trade-offs:**
- ✅ Type-safe API contracts
- ✅ Auto-generated documentation (Scalar UI)
- ✅ Validation at API boundary
- ❌ More boilerplate per endpoint
- ❌ Schema changes require handler updates

**Example:**
```typescript
// schema.ts
export const menuSchema = z.object({
  id: z.string().openapi({ example: "clx1234567890" }),
  appId: z.string().openapi({ example: "app_admin" }),
  parentId: z.string().nullable(),
  name: z.string().openapi({ example: "用户管理" }),
  code: z.string().openapi({ example: "user:manage" }),
  icon: z.string().nullable(),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).openapi("Menu");

// getMenu.ts
export const getMenu = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Menu"],
    request: { params: menuIdParamSchema },
    responses: {
      200: { content: { "application/json": { schema: menuSchema } }, description: "The menu" },
    },
  }),
  handler: async (c) => {
    const { id } = c.req.valid("param");
    const menu = await menuRepository.findById(id);
    return c.json(menu, 200);
  },
});
```

### Pattern 3: Tree Building with Recursive Queries

**What:** Fetch flat list of menus, build tree structure in application layer. Avoids N+1 queries.

**When to use:** When rendering menu trees in frontend or building menu hierarchy for API responses.

**Trade-offs:**
- ✅ Single database query for all menus
- ✅ Flexible tree manipulation in code
- ✅ Easy to add sorting/filtering logic
- ❌ Memory usage for large trees
- ❌ Tree building logic complexity

**Example:**
```typescript
// repository
async getMenuTree(appId: string): Promise<MenuTree[]> {
  const menus = await prisma.menu.findMany({
    where: { appId, isVisible: true },
    orderBy: { sortOrder: 'asc' },
  });
  return buildTree(menus, null);
}

// utility
function buildTree(menus: Menu[], parentId: string | null): MenuTree[] {
  return menus
    .filter(menu => menu.parentId === parentId)
    .map(menu => ({
      ...menu,
      children: buildTree(menus, menu.id),
    }));
}
```

## Data Flow

### Request Flow

```
User clicks "Menu Management"
    ↓
MenuPage.tsx loads
    ↓
AppSelector.tsx fetches user's accessible apps
    ↓
User selects application
    ↓
MenuTree.tsx fetches menu tree for selected app
    ↓
Hono RPC: appClient.api.menu.tree.$get({ param: { appId } })
    ↓
Menu route handler calls menuRepository.getMenuTree()
    ↓
Prisma queries Menu table (flat list)
    ↓
Repository builds tree structure
    ↓
Response returned to frontend
    ↓
MenuTree.tsx renders draggable tree
```

### State Management

```
Menu Store (Zustand)
    ↓ (subscribe)
MenuPage ←→ MenuTree ←→ MenuForm
    ↓              ↓           ↓
App Selection    DnD Events   Form Submit
    ↓              ↓           ↓
API Calls        API Calls    API Calls
```

### Key Data Flows

1. **Application Selection:** User selects app → AppSelector fetches apps → Stores selected appId → Triggers menu tree refresh
2. **Menu Tree Rendering:** Fetch flat menus → Build tree in memory → Render recursive component → Enable drag-and-drop
3. **Menu CRUD:** Form submit → API call → Refresh tree → Update UI
4. **Menu Reordering:** Drag event → Calculate new sortOrder → Batch API update → Refresh tree
5. **Role-Menu Assignment:** Admin selects role → Fetch role's menus → Toggle menu assignments → Save

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-10 apps, 0-100 menus | Current design works perfectly. Single database, no optimization needed. |
| 10-50 apps, 100-500 menus | Add caching for menu trees (Redis or in-memory). Consider pagination for app list. |
| 50+ apps, 500+ menus | Consider menu tree materialization (stored procedure or materialized view). Add menu search indexing. |

### Scaling Priorities

1. **First bottleneck:** Menu tree fetching (multiple apps, deep trees). Fix: Cache menu trees in Redis with 5-minute TTL.
2. **Second bottleneck:** Role-menu assignment queries (many roles × many menus). Fix: Add composite indexes, consider denormalization.

## Anti-Patterns

### Anti-Pattern 1: Storing Full Path in Database

**What people do:** Store `/parent/child/grandchild` as a string field.

**Why it's wrong:** Hard to query ancestors, path updates cascade to all descendants, no referential integrity.

**Do this instead:** Use adjacency list (parentId). Query ancestors with recursive CTE or fetch full tree and traverse in code.

### Anti-Pattern 2: N+1 Queries for Tree Rendering

**What people do:** Fetch each menu item separately with its children.

**Why it's wrong:** 100 menus = 100+ database queries. Kills performance.

**Do this instead:** Fetch all menus for app in one query, build tree in application layer.

### Anti-Pattern 3: Hardcoding Menu Structure in Frontend

**What people do:** Define menu items in TypeScript/JSON, bypass dynamic system.

**Why it's wrong:** Defeats purpose of dynamic menu management. Changes require code deployment.

**Do this instead:** Always fetch menus from API. Cache in frontend state, invalidate on changes.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| better-auth RBAC | Query user roles, filter menus by role | Use existing `ac` (access control) from `@repo/shared` |
| Lucide Icons | Icon picker component | Already installed, use `lucide-react` icons |
| shadcn/ui Tree | Reusable tree component | May need to create or use existing tree primitive |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| App ↔ Menu | Foreign key (appId) | Cascade delete: deleting app removes all its menus |
| Menu ↔ Role | Junction table (RoleMenu) | Many-to-many relationship |
| Frontend ↔ API | Hono RPC client | Type-safe, follows existing pattern |
| API ↔ Database | Prisma client | Singleton pattern, use existing `db.ts` |

## Build Order Implications

### Phase Dependencies

```
Phase 1: Database Schema (App, Menu, RoleMenu models)
    ↓
Phase 2: API Routes (App CRUD, Menu CRUD, RoleMenu mapping)
    ↓
Phase 3: Frontend Pages (App list, Menu tree with DnD)
    ↓
Phase 4: Integration (Dynamic sidebar, migrate hardcoded menus)
    ↓
Phase 5: Polish (Icon picker, drag sorting, role-based visibility)
```

### Critical Path

1. **Database schema must come first** — All other phases depend on data models
2. **App CRUD before Menu CRUD** — Menus require appId foreign key
3. **Menu tree API before frontend** — Frontend needs tree endpoint to render
4. **Dynamic sidebar last** — Depends on all other components working

### Parallel Work Opportunities

- **App routes and Menu routes** can be developed in parallel after schema
- **Frontend pages** can be developed in parallel with API routes (mock data first)
- **Icon picker** is independent, can be built anytime

## Sources

- **Existing Architecture:** `.planning/codebase/ARCHITECTURE.md` - Current system patterns and conventions
- **Existing Stack:** `.planning/codebase/STACK.md` - Technology decisions and dependencies
- **Prisma Documentation:** [Prisma Schema Reference](https://www.prisma.io/docs/orm/prisma-schema/data-model/models) - Model definition patterns
- **Hono Documentation:** [Hono OpenAPI](https://hono.dev/docs/guides/openapi) - Route definition patterns
- **better-auth Documentation:** [RBAC with better-auth](https://www.better-auth.com/docs/plugins/admin) - Role-based access control
- **Tree Data Patterns:** Adjacency list pattern for hierarchical data in relational databases
- **Admin Panel Patterns:** Common patterns for application and menu management systems

---

*Architecture research for: Application and Menu Management System*
*Researched: 2026-05-20*

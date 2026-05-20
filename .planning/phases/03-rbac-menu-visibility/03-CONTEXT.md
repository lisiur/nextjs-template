# Phase 3: RBAC & Menu Visibility - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers: Role-menu assignment UI for admins, server-side menu filtering by role, and dynamic sidebar rendering based on the user's role. This is the security layer that controls which menus each user can see, replacing the current hardcoded navigation.

</domain>

<decisions>
## Implementation Decisions

### Role-Menu Assignment UI
- **D-01:** Use a role-centric view — admin selects a role, then sees a tree of menus with checkboxes to assign/unassign. Fits the mental model of "what can this role do?"
- **D-02:** Create a separate page for role-menu assignment (not integrated into the existing menu management page). Clean separation of concerns.
- **D-03:** Auto-include children when assigning parent menus — assigning a parent menu automatically assigns all children. Prevents "orphaned" child menus and simplifies admin workflow.
- **D-04:** No preview panel — just show the tree with checkboxes. Keep the UI simple.

### Server-Side Filtering
- **D-05:** Use session-based filtering — API reads the user's role from the session cookie (already available via better-auth). Most secure approach — role cannot be spoofed by client.
- **D-06:** Create a dedicated endpoint `GET /api/menus/mine` that returns only the current user's authorized menus. Clean separation between admin management endpoints and user consumption endpoints.
- **D-07:** Middleware vs route handler decision left to agent — agent will decide based on codebase patterns and best practices.

### Default Behavior
- **D-08:** New menus are hidden until explicitly assigned to a role (most secure option). Prevents accidental exposure of new menu items to unauthorized users.
- **D-09:** No warning badge for menus with no role assignments — admin is responsible for checking assignments.

### Sidebar Rendering
- **D-10:** Load menus on login and cache in Zustand store. Fastest navigation, minimal API calls.
- **D-11:** Use collapsible tree for nested menus — standard pattern for admin sidebars.
- **D-12:** Display icons from the Menu model's icon field. Uses the icon picker feature from Phase 2.

### the agent's Discretion
- Middleware vs route handler for menu filtering — agent decides based on codebase patterns
- UI component choices (which shadcn/ui components to use for checkboxes, tree view)
- Zustand store structure for caching menus
- Error handling for failed menu fetches
- Loading states for sidebar

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 3 definition, plans, success criteria
- `.planning/REQUIREMENTS.md` — RBAC-01, RBAC-02 mapped to Phase 3
- `.planning/PROJECT.md` — Project context, constraints, key decisions

### Database Schema
- `packages/service/prisma/schema.prisma` — MenuRole model (lines 547-558), Menu model (lines 524-545), existing RBAC structure

### Auth & RBAC
- `packages/service/src/lib/auth.ts` — Auth setup, session handling
- `packages/shared/src/permissions.ts` — RBAC permission definitions (admin, manager, user roles)
- `packages/service/src/lib/db.ts` — Prisma client singleton

### Frontend Pattern Reference
- `apps/admin/src/components/layout/sidebar.tsx` — Current hardcoded menuItems (lines 26-47) that will be replaced
- `apps/admin/src/lib/api/app-client.ts` — Hono RPC client setup
- `apps/admin/src/stores/` — Zustand store patterns for state management

### API Pattern Reference
- `packages/service/src/routes/organization/` — Complete CRUD route example (schema.ts, index.ts, individual route files)
- `packages/service/src/routes/index.ts` — Route mounting pattern
- `packages/service/src/repositories/` — Repository pattern for database access

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **MenuRole model**: Already exists in schema (Phase 1) with `menuId`, `roleId`, unique constraint. Ready for use.
- **better-auth RBAC**: Already configured with admin/manager/user roles in `permissions.ts`. Session provides user role.
- **Menu tree component**: Phase 2 delivered menu tree UI with expand/collapse. Can be reused for role-menu assignment.
- **Zustand stores**: Existing pattern in `apps/admin/src/stores/` for state management.

### Established Patterns
- **Route structure**: Each resource has its own directory with `schema.ts`, `index.ts`, and per-action files
- **Auth middleware**: Admin-only routes use `auth.api.getSession()` + role check in middleware
- **Hono RPC client**: Frontend uses `appClient.api.resource[":id"].$get()` bracket notation for dynamic segments
- **Zod OpenAPI schemas**: Import `z` from `@hono/zod-openapi`, register response schemas with `.openapi("Name")`

### Integration Points
- `packages/service/src/routes/index.ts` — Mount new menu-role routes here
- `apps/admin/src/app/(logged)/` — Add new role-menu assignment page here
- `apps/admin/src/components/layout/sidebar.tsx` — Replace hardcoded menuItems with dynamic loading
- `apps/admin/src/stores/` — Add new Zustand store for menu caching

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following existing codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-RBAC & Menu Visibility*
*Context gathered: 2026-05-20*

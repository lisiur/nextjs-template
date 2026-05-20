---
phase: 03-rbac-menu-visibility
plan: 01
subsystem: api
tags: [hono, zod-openapi, prisma, rbac, menu-role]

requires:
  - phase: 02-menu-tree-management
    provides: Menu CRUD API and Prisma schema with MenuRole model
provides:
  - MenuRole repository with batchAssign, getMenusForRole, findByRole, findAllMenus
  - PUT /menu-role/batch endpoint (admin-only, auto-includes descendants)
  - GET /menu-role/:roleId endpoint (admin-only)
  - GET /menus/mine endpoint (any authenticated user, role-filtered)
  - Route mounting at /menu-role in main route index
affects: [03-02-role-menu-assignment-ui, 03-03-dynamic-sidebar]

tech-stack:
  added: []
  patterns: [admin-middleware-split, auto-include-children, session-role-extraction]

key-files:
  created:
    - packages/service/src/repositories/menu-role.repository.ts
    - packages/service/src/routes/menu-role/schema.ts
    - packages/service/src/routes/menu-role/batchAssignMenus.ts
    - packages/service/src/routes/menu-role/getRoleMenus.ts
    - packages/service/src/routes/menu-role/getMine.ts
    - packages/service/src/routes/menu-role/index.ts
  modified:
    - packages/service/src/routes/index.ts

key-decisions:
  - "Split admin and public routes into separate OpenAPIHono instances for menu-role"
  - "getMine reads role from session cookie via auth.api.getSession(), never from request body"

patterns-established:
  - "Admin/public route split: adminRoutes with middleware + publicRoutes without, combined via .route()"
  - "Auto-include children: collectDescendantIds recursively finds all descendants before batch assign"

requirements-completed: [RBAC-01, RBAC-02]

duration: 5
completed: 2026-05-20
---

# Plan 03-01: MenuRole API Endpoints Summary

**MenuRole API layer with batch assign (auto-includes children), role menu lookup, and session-based /mine endpoint**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-20T09:00:00Z
- **Completed:** 2026-05-20T09:05:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- MenuRole repository with all required database operations
- Three OpenAPI endpoints with proper admin middleware separation
- Auto-include children logic for batch menu assignment
- Session-based role extraction for /menus/mine security boundary

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MenuRole repository and route schemas** - `c8ac4a0` (feat)
2. **Task 2: Create MenuRole route handlers and index** - `c8ac4a0` (feat)

**Plan metadata:** `c8ac4a0` (feat: complete plan)

## Files Created/Modified
- `packages/service/src/repositories/menu-role.repository.ts` - Database operations for MenuRole queries
- `packages/service/src/routes/menu-role/schema.ts` - Zod schemas for request/response validation
- `packages/service/src/routes/menu-role/batchAssignMenus.ts` - PUT /batch with auto-include children
- `packages/service/src/routes/menu-role/getRoleMenus.ts` - GET /:roleId for admin role menu lookup
- `packages/service/src/routes/menu-role/getMine.ts` - GET /mine with session-based role extraction
- `packages/service/src/routes/menu-role/index.ts` - OpenAPIHono with admin/public route split
- `packages/service/src/routes/index.ts` - Mounted menuRoleRoutes at /menu-role

## Decisions Made
- Split admin and public routes into separate OpenAPIHono instances to apply middleware selectively
- getMine reads role from session cookie via auth.api.getSession(), never from request body (security boundary)
- collectDescendantIds recursively traverses menu tree to auto-include all descendants

## Deviations from Plan

None - plan executed exactly as written

## Issues Encountered
- TypeScript error in getMine.ts: session.user.role could be string | null | undefined. Fixed by adding null check before passing to getMenusForRole.

## Self-Check: PASSED

Verified:
- [x] menuRoleRepository exports findByRole, batchAssign, getMenusForRole, findAllMenus
- [x] batchAssignBodySchema, roleIdParamSchema, roleMenusResponseSchema, mineMenusResponseSchema, errorSchema exported
- [x] batchAssignMenus includes collectDescendantIds for auto-include children
- [x] getMine reads role from session, not request body
- [x] Admin middleware protects batch and getRoleMenus but not getMine
- [x] Routes mounted at /menu-role in index.ts
- [x] TypeScript compiles (no new errors in menu-role files)

---
*Phase: 03-rbac-menu-visibility*
*Completed: 2026-05-20*

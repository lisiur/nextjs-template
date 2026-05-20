# Phase 1: Foundation - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Foundation phase delivers: Prisma schema for Application, Menu, and MenuRole models + full App CRUD API (name, code, description, logo, search) + App management UI (list, create/edit dialog, search, logo upload). This is the data model and app management layer that all subsequent phases build on.

</domain>

<decisions>
## Implementation Decisions

### Application Code Format
- **D-01:** Application code is a free-form string — admin types any value (e.g., "OA", "CRM-V2", "internal_tool"). Only uniqueness is enforced, no format regex constraint. The code field serves as the human-readable identifier for linking apps to menus and front-end routing metadata.

### App Status Management
- **D-02:** App status (enable/disable) is NOT implemented in Phase 1. The `status` or `isActive` field can be added to the schema for future use, but no UI or API behavior for toggling it. REQUIREMENTS.md does not assign status to Phase 1.

### Logo Upload Approach
- **D-03:** App logos use base64 encoding. Frontend captures image, converts to base64, sends in API request. Backend stores the base64 string directly in an `Application.logo` text column (nullable). No file upload system, no Upload model reuse for this feature.

### App Deletion Behavior
- **D-04:** App deletion is soft delete — an `isDeleted` boolean flag (or `deletedAt` timestamp) marks the app as deleted. Menus remain in the database and are NOT cascade-deleted. This allows app restoration later. The list API should filter out soft-deleted apps by default.

### Agent's Discretion
- Schema field naming (e.g., `isDeleted` vs `deletedAt`) — agent decides based on existing patterns
- Whether to include `sortOrder` on Application for future ordering — agent decides
- Menu and MenuRole model field design — agent decides, must support multi-level nesting (parentId) and role-based visibility

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 1 definition, plans, success criteria
- `.planning/REQUIREMENTS.md` — APP-01 through APP-05 mapped to Phase 1
- `.planning/PROJECT.md` — Project context, constraints, key decisions

### Database Schema
- `packages/service/prisma/schema.prisma` — Existing models (User, Organization, SystemConfig, Upload) for pattern reference. New Application/Menu/MenuRole models go here.

### API Pattern Reference
- `packages/service/src/routes/organization/` — Complete CRUD route example (schema.ts, index.ts, individual route files). Follow this pattern for App routes.
- `packages/service/src/routes/index.ts` — Route mounting pattern
- `packages/service/src/repositories/` — Repository pattern for database access

### Frontend Pattern Reference
- `apps/admin/src/components/layout/sidebar.tsx` — Current hardcoded menuItems (lines 26-47) that will eventually be replaced by dynamic menus
- `apps/admin/src/lib/api/app-client.ts` — Hono RPC client setup
- `apps/admin/src/app/(logged)/` — Page layout pattern for admin pages

### Auth & RBAC
- `packages/service/src/lib/auth.ts` — Auth setup, session handling
- `packages/shared/src/permissions.ts` — RBAC permission definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Organization CRUD pattern**: `packages/service/src/routes/organization/` — complete example of OpenAPIHono routes with Zod schemas, admin auth middleware, and `openapiRoutes` export. Directly reusable as the template for App CRUD routes.
- **Upload model + routes**: `packages/service/src/routes/upload/` — existing file upload system. NOT used for logos (base64 approach chosen), but available for future needs.
- **SystemConfig repository**: `packages/service/src/repositories/system-config.repository.ts` — repository pattern example for Prisma queries.

### Established Patterns
- **Route structure**: Each resource has its own directory with `schema.ts`, `index.ts`, and per-action files (`createX.ts`, `listX.ts`, etc.)
- **Auth middleware**: Admin-only routes use `auth.api.getSession()` + role check in middleware
- **Zod OpenAPI schemas**: Import `z` from `@hono/zod-openapi`, register response schemas with `.openapi("Name")`
- **Hono RPC client**: Frontend uses `appClient.api.resource[":id"].$get()` bracket notation for dynamic segments

### Integration Points
- `packages/service/src/routes/index.ts` — Mount new app routes here
- `apps/admin/src/app/(logged)/` — Add new app management page(s) here
- `apps/admin/src/components/layout/sidebar.tsx` — Eventually replaced by dynamic menu rendering (Phase 4)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following existing codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

- **App status management (enable/disable)**: Deferred from Phase 1. Can be added in a future phase when the concept of "active vs inactive apps" is needed.
- **Menu management UI**: Phase 2 scope — left-right split, drag-and-drop, icon picker
- **RBAC menu visibility**: Phase 3 scope — role-menu assignment, server-side filtering
- **Hardcoded menu migration**: Phase 4 scope — seed data, switch sidebar to dynamic rendering

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-05-20*

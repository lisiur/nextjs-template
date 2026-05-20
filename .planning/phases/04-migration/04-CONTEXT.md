# Phase 4: Migration - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers: A seed script that populates the database with all current hardcoded admin navigation items, and cleanup of any remaining hardcoded menu data. This ensures the dynamic menu system from Phase 3 has actual data to render, completing the migration from hardcoded to database-driven navigation.

</domain>

<decisions>
## Implementation Decisions

### Seed Script
- **D-01:** Create a dedicated seed function in the existing `seed.ts` file (not a new file) — keeps all seeding logic in one place
- **D-02:** Seed an "admin" application first (required as Menu has FK to Application), then seed menu items under it
- **D-03:** Seed the following menu hierarchy based on current app routes:
  - Dashboard (`/dashboard`) — top-level, icon: LayoutDashboard
  - Applications (`/applications`) — top-level, icon: Layers
  - Organizations (`/organizations`) — top-level, icon: Building2
  - Users (`/users`) — top-level, icon: Users
  - Roles (`/roles`) — top-level, icon: Shield
  - Settings (`/settings`) — top-level, icon: Settings
  - Profile (`/profile`) — top-level, icon: User (will be rendered in footer, but stored in DB for completeness)
- **D-04:** After seeding menus, assign ALL seeded menu items to the "admin" role via MenuRole entries — admin sees everything by default
- **D-05:** Use `upsert` for idempotency — running seed multiple times won't create duplicates
- **D-06:** Keep `bottomMenuItems` in sidebar.tsx as-is (profile, settings in footer) — these are UI-level footer items that don't need to be in the main menu tree. The seed script ensures they exist in the DB for future use.

### Sidebar Cleanup
- **D-07:** No changes needed to sidebar.tsx — it already uses `useMenuStore` with dynamic menus from Phase 3. The `bottomMenuItems` footer is a separate UI concern (always-visible footer links, not role-gated navigation).

### Verification
- **D-08:** After running seed, verify the sidebar renders all seeded items for an admin user
- **D-09:** Verify the `/api/menu/mine` endpoint returns the correct menu tree

### the agent's Discretion
- Menu sort order values (agent decides based on current route ordering)
- Whether to add a `url` field to Menu model entries (agent decides based on schema)
- Error handling in seed script

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 4 definition, plans, success criteria
- `.planning/REQUIREMENTS.md` — MIGR-01 mapped to Phase 4
- `.planning/PROJECT.md` — Project context, constraints, key decisions

### Database Schema
- `packages/service/prisma/schema.prisma` — Menu model (line 176), Application model (line 159), MenuRole model (line 199)

### Existing Seed
- `packages/service/prisma/seed.ts` — Current seed script (only SystemConfig). Add Menu seeding here.

### Frontend (Current State)
- `apps/admin/src/components/layout/sidebar.tsx` — Already uses `useMenuStore` with dynamic menus. `bottomMenuItems` (lines 24-35) are hardcoded footer items.
- `apps/admin/src/stores/menu-store.ts` — Zustand store fetching from `/api/menu/mine`

### API Endpoints (Phase 3)
- `packages/service/src/routes/menu-role/getMine.ts` — GET /mine endpoint (role-filtered)
- `packages/service/src/repositories/menu-role.repository.ts` — MenuRole database operations

### App Routes (Current Navigation)
- `apps/admin/src/app/(logged)/dashboard/page.tsx` — Dashboard
- `apps/admin/src/app/(logged)/applications/page.tsx` — Applications
- `apps/admin/src/app/(logged)/organizations/page.tsx` — Organizations
- `apps/admin/src/app/(logged)/users/page.tsx` — Users
- `apps/admin/src/app/(logged)/roles/page.tsx` — Roles
- `apps/admin/src/app/(logged)/settings/page.tsx` — Settings
- `apps/admin/src/app/(logged)/profile/page.tsx` — Profile

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Menu model**: Has `id`, `appId`, `name`, `code`, `icon`, `url`, `parentId`, `sortOrder`, `createdAt`, `updatedAt`. The `code` field is used for i18n translation keys.
- **Application model**: Required FK for Menu. Need to create an "admin" application first.
- **MenuRole model**: Has `menuId`, `roleId`, unique constraint. Ready for bulk assignment.
- **seed.ts**: Already has SystemConfig seeding pattern with upsert. Can add Menu seeding in the same file.

### Established Patterns
- **Seed pattern**: Use `prisma.model.upsert()` with a unique constraint for idempotent seeding
- **Menu tree building**: `buildTree()` in menu-store.ts shows how flat Menu[] becomes TreeNode[]
- **i18n**: Menu `code` field maps to translation keys via `useTranslations("Sidebar")`

### Integration Points
- `packages/service/prisma/seed.ts` — Add Menu and MenuRole seeding here
- `apps/admin/src/components/layout/sidebar.tsx` — Verify seeded menus render correctly

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following existing codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

None — Phase 4 scope is narrow (seed + verify).

</deferred>

---

*Phase: 4-Migration*
*Context gathered: 2026-05-20*

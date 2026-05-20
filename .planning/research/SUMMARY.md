# Research Summary

**Project:** 应用与菜单管理系统 (Application & Menu Management)
**Domain:** Admin Panel CRUD + Tree UI + RBAC
**Researched:** 2026-05-20
**Confidence:** HIGH

## Executive Summary

This is a **brownfield admin panel feature** — adding dynamic application and menu management to an existing Next.js 16 + Hono + Prisma 7 stack. The core stack is already locked in; research focused only on libraries needed for the tree UI (shadcn-tree-view, copy-paste pattern) and icon picker (custom component over lucide-react). No heavy tree libraries like react-arborist are needed — menu trees are bounded datasets (<200 items) and native HTML5 drag-and-drop is sufficient.

The recommended approach follows a strict dependency chain: **schema → API → frontend → integration → migration**. The adjacency list pattern (`parentId`) for hierarchical menus is the right choice for this scale. The critical architectural decision is to build the dynamic menu system alongside the hardcoded sidebar (not a big-bang switch), seed the database with existing menu items, then switch over only after verification.

The top risks are: (1) orphaned menu items from improper cascade deletion — must get the Prisma schema right in phase 1; (2) sort order corruption after drag-and-drop — must re-index all siblings after reorder; (3) migration breaking existing navigation — must do gradual transition with feature flag, not a hard switch. All three are preventable with proper schema design and a careful migration strategy.

## Key Findings

### Recommended Stack

**Core technologies (already established — DO NOT change):** Next.js 16, React 19, Hono 4, Prisma 7, PostgreSQL, shadcn/ui 4, Tailwind 4, better-auth 1.6.10, lucide-react 1.14.

**New libraries required (minimal):**
- **shadcn-tree-view** (1.2.1, copy-paste): Tree view component for menu tree. Radix-based, fits shadcn/ui ecosystem, zero npm dependencies. Native HTML5 DnD for simple reordering.
- **@dnd-kit/react** (0.4.0, conditional): Only if native DnD proves insufficient for cross-parent menu moves. Evaluate after Phase 2.

**No new libraries needed for:** Icon picker (custom over lucide-react), App CRUD (existing shadcn/ui + react-hook-form + zod), Role-based visibility (extend better-auth RBAC), Form validation (Zod 4 + react-hook-form already installed).

### Expected Features

**Must have (P1 — table stakes):**
- Application CRUD with list, search, status toggle — foundation for everything
- Menu tree CRUD with multi-level nesting — the core feature
- Left-right split management UI — standard pattern (Ant Design Pro, Element Plus Admin)
- Role-based menu visibility — the security layer, integrates with better-auth RBAC
- Dynamic sidebar rendering — replaces hardcoded `menuItems` in sidebar.tsx
- Migration of hardcoded admin menus — proof of concept

**Should have (P2 — differentiators):**
- Drag-and-drop menu sorting — improves UX but not blocking for launch
- Icon picker with search — text input works initially, search is polish
- Menu code preview with route mapping — helps prevent misconfiguration
- Batch operations — useful when managing many items

**Defer (v3+):**
- Menu tree import/export — multi-environment workflows
- Visual menu tree preview — polish feature
- Menu search in tree — needed only when trees get large

**Explicitly avoid:** Auto-sync menu to frontend routes (too tight coupling), multi-language menus (out of scope), real-time collaborative editing (overkill), menu versioning/history (database timestamps suffice), nested permission inheritance (confusing).

### Architecture Approach

Standard three-tier: Next.js frontend → Hono API routes → Prisma/PostgreSQL. Each domain (app, menu, role-menu) gets its own route folder following the existing `defineOpenAPIRoute` + `openapiRoutes` pattern. Tree data uses adjacency list (`parentId`), fetched as flat list and built into tree in the application layer (avoids N+1 queries). Hono RPC client provides type-safe API calls from frontend. Menu tree filtering by role must happen server-side, not just in the UI.

**Major components:**
1. **App Management** — CRUD for applications (name, code, description, logo, status). Standard table + dialog pattern.
2. **Menu Management** — Hierarchical tree per app with left-right split UI. Tree component (shadcn-tree-view) on left, edit form on right.
3. **Role-Menu Mapping** — Junction table controlling which roles see which menus. Server-side filtering in API.
4. **Dynamic Sidebar** — Renders menus from API based on selected app and user roles. Replaces hardcoded navigation.
5. **App Selector** — Dropdown to switch between applications in admin panel.

### Critical Pitfalls

1. **Orphaned menu items after parent deletion** — Use `onDelete: Cascade` on `Menu.parentId` → `Menu.id`. Add confirmation dialog showing child count. Never use `onDelete: SetNull`. (Address in schema phase)
2. **Flat sort order breaks after reorder** — After any drag-and-drop, re-index ALL siblings in the parent level to contiguous integers in a single transaction. Don't just update the dragged item. (Address in menu CRUD phase)
3. **Migration breaks existing navigation** — Build dynamic system alongside hardcoded sidebar (feature flag). Seed DB with current hardcoded items. Switch over only after verification. Remove hardcoded items last. (Address in migration phase)
4. **Menu code ↔ frontend route desynchronization** — Build a route registry on frontend. Validate menu `code` against registry when saving. Show warning for unmatched codes. (Address in frontend integration phase)
5. **RBAC doesn't cover menu visibility server-side** — API must filter menus by caller's role. Don't rely on frontend hiding items. (Address in RBAC integration phase)

## Implications for Roadmap

### Phase 1: Database Schema & App CRUD
**Rationale:** Schema is foundational — all other phases depend on data models. App CRUD must come before menu CRUD (menus require `appId` foreign key).
**Delivers:** Application management (create, read, update, delete, list with search, status toggle). Prisma schema with `Application`, `Menu`, `MenuRole` models.
**Addresses:** Application CRUD (P1), Application list with search (P1), Application status toggle (P1)
**Avoids:** Pitfall 8 (app deletion doesn't clean up menus) — schema has `onDelete: Cascade` from App → Menu. Pitfall 1 (orphaned menus) — cascade is correct from the start.

### Phase 2: Menu Tree CRUD & API
**Rationale:** Core feature — everything else (sorting, icons, permissions, dynamic rendering) builds on this. Menu tree API must exist before frontend can render.
**Delivers:** Menu CRUD endpoints, tree endpoint (`GET /menu/tree/:appId`), reorder endpoint, left-right split UI with tree component.
**Addresses:** Menu tree CRUD (P1), Menu properties (P1), Left-right split UI (P1)
**Avoids:** Pitfall 2 (sort order) — re-index strategy designed upfront. Pitfall 7 (circular references) — cycle detection in move handler. Pitfall 6 (N+1 queries) — single query for full tree.

### Phase 3: RBAC Integration & Server-Side Filtering
**Rationale:** Security layer must exist before dynamic sidebar. Better-auth RBAC is already in place — just extend permission statements.
**Delivers:** Role-menu assignment UI, server-side menu filtering by role, API endpoints for role-menu mapping.
**Addresses:** Role-based menu visibility (P1)
**Avoids:** Pitfall 5 (RBAC doesn't cover menus) — server-side filtering from the start.

### Phase 4: Dynamic Sidebar & Frontend Integration
**Rationale:** Payoff phase — replaces hardcoded navigation. Depends on all prior components working. Build alongside hardcoded sidebar with feature flag.
**Delivers:** Dynamic sidebar rendering from API, app selector dropdown, route registry, cache invalidation after mutations.
**Addresses:** Dynamic sidebar rendering (P1)
**Avoids:** Pitfall 3 (migration breaks navigation) — feature flag approach. Pitfall 10 (cache not invalidated) — invalidation built into mutation handlers. Pitfall 4 (code ↔ route desync) — route registry with validation.

### Phase 5: Migration & Polish
**Rationale:** Only migrate after dynamic system is fully verified. Polish features (DnD, icon picker) come after core works.
**Delives:** Migration script for hardcoded menus, drag-and-drop sorting, icon picker with search, batch operations.
**Addresses:** Migration from hardcoded menus (P1), DnD sorting (P2), Icon picker (P2), Batch operations (P2)
**Avoids:** Pitfall 3 (migration) — gradual transition, verified before switching. Pitfall 9 (icon resolution) — fallback icon for unknowns.

### Phase Ordering Rationale
- **Schema first:** Every other phase depends on data models. Getting cascade deletes right in phase 1 prevents orphaned data.
- **App before Menu:** Menus require `appId` foreign key. Can't build menu CRUD without apps existing.
- **API before Frontend:** Frontend needs tree endpoint to render. API-first approach follows existing pattern.
- **RBAC before Sidebar:** Dynamic sidebar must filter by role from day one. Bolting on RBAC later is a security risk.
- **Migration last:** Only switch after dynamic system is verified independently. Gradual transition with feature flag.

### Research Flags

**Needs research during planning:**
- **Phase 2:** Menu tree component integration — shadcn-tree-view is copy-paste, need to verify it works with existing shadcn/ui 4 + Tailwind 4 setup. May need adaptation.
- **Phase 4:** Cache invalidation strategy — decide between React Query stale time vs manual refetch after mutations. Depends on existing state management approach.

**Standard patterns (skip research-phase):**
- **Phase 1:** CRUD for App model — standard Prisma + Hono pattern, follows existing `organization/` routes.
- **Phase 3:** better-auth RBAC extension — well-documented, existing `permissions.ts` pattern to follow.
- **Phase 5:** Migration scripting — straightforward data migration, no architectural decisions.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Brownfield project — existing stack is locked in. New libraries (shadcn-tree-view) verified via Context7 and GitHub. |
| Features | HIGH | Requirements validated against competitor analysis (Ant Design Pro, Element Plus Admin, Vue-Vben-Admin). P1/P2/P3 priorities clear. |
| Architecture | HIGH | Follows existing codebase patterns (Hono routes, Prisma, shadcn/ui). Adjacency list for trees is well-established. |
| Pitfalls | HIGH | Based on codebase analysis + domain expertise. 10 pitfalls identified with specific prevention strategies and phase mapping. |

**Overall confidence:** HIGH

### Gaps to Address

- **shadcn-tree-view compatibility:** Copy-paste component needs to be verified against shadcn/ui 4.x + Tailwind 4. May need minor adjustments. (Handle during Phase 2 planning.)
- **Icon picker scope:** Lucide has 1000+ icons — decide whether to curate a subset (~30 admin-appropriate) or show all with search. (Handle during Phase 5 planning.)
- **Route registry format:** Need to define the exact structure of the frontend route registry. Decide between const object vs JSON file vs dynamic import. (Handle during Phase 4 planning.)
- **Zustand vs React Query for menu state:** Architecture doc mentions Zustand for menu store. Need to decide if menu data uses React Query (with stale time) or Zustand (manual invalidation). (Handle during Phase 4 planning.)

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `apps/admin/src/components/layout/sidebar.tsx` — current hardcoded menu pattern
- Codebase analysis: `packages/service/prisma/schema.prisma` — existing schema patterns
- Codebase analysis: `packages/shared/src/permissions.ts` — RBAC structure
- Codebase analysis: `packages/service/src/routes/organization/` — established route patterns
- shadcn-tree-view GitHub — tree view API, copy-paste install, React 19 compatible
- PROJECT.md — validated requirements

### Secondary (MEDIUM confidence)
- Ant Design Pro menu component API — menu item structure and interaction patterns
- Ant Design Pro layout patterns — left-right split UI reference
- Context7: `/jameskerr/react-arborist` — tree component comparison (rejected as overkill)
- Context7: `/mrlightful/shadcn-tree-view` — tree view API, custom rendering patterns

### Tertiary (LOW confidence)
- Competitor analysis (Element Plus Admin, Vue-Vben-Admin) — feature comparison only, not implementation guidance

---

*Research completed: 2026-05-20*
*Ready for roadmap: yes*

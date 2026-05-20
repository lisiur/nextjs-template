---
phase: 02-menu-tree-management
plan: 04
subsystem: ui
tags: [drag-and-drop, dnd-kit, sortable, reorder, tree-view]

# Dependency graph
requires:
  - phase: 02-menu-tree-management
    plan: 01
    provides: "Menu CRUD API endpoints"
  - phase: 02-menu-tree-management
    plan: 02
    provides: "TreeView component, MenuTree wrapper"
provides:
  - "POST /api/menu/reorder endpoint with atomic transaction updates"
  - "Drag-and-drop reordering within same level and across levels"
  - "Automatic sortOrder recalculation for affected siblings"
  - "Visual drag overlay and grip handles on tree nodes"
affects: [02-05]

# Tech tracking
tech-stack:
  added: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"]
  patterns: ["DndContext + SortableContext pattern", "atomic batch reorder via Prisma transaction"]

key-files:
  created:
    - "packages/service/src/routes/menu/reorderMenus.ts"
  modified:
    - "packages/service/src/routes/menu/index.ts"
    - "apps/admin/src/app/(logged)/applications/[id]/menus/components/menu-tree.tsx"
    - "apps/admin/src/lib/api/menu.ts"
    - "apps/admin/messages/en.json"
    - "apps/admin/messages/zh.json"

key-decisions:
  - "Used @dnd-kit over react-beautiful-dnd (deprecated, no React 19 support)"
  - "Atomic reorder via Prisma transaction with sequential sibling re-indexing"
  - "Client-side drag with server-side persistence for data consistency"

patterns-established:
  - "Drag-and-drop pattern: DndContext wrapping SortableContext with per-level item arrays"
  - "Reorder API pattern: batch update with atomic sibling re-indexing"

requirements-completed: ["MENU-05"]

# Metrics
duration: 5min
completed: 2026-05-20
---

# Phase 2 Plan 04: Drag-and-Drop Sorting Summary

**Drag-and-drop menu reordering with @dnd-kit, atomic batch reorder API endpoint, and cross-level move support**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-20T08:08:37Z
- **Completed:** 2026-05-20T08:14:31Z
- **Tasks:** 3
- **Files created/modified:** 6

## Accomplishments

- POST /api/menu/reorder endpoint accepting batch position updates with Prisma transaction atomicity
- Drag-and-drop reordering within same parent level and across levels (parentId change)
- Automatic sortOrder recalculation for all affected sibling groups after each reorder
- Visual drag overlay with grip handles on tree nodes for intuitive interaction
- Typed reorderMenus client function for frontend API calls

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement reorder API endpoint** - `29e7beb` (feat)
2. **Task 2: Add drag-and-drop to MenuTree** - `bb86eca` (feat)
3. **Task 3: Update sort order after drop** - `b5bf5d7` (feat)

## Files Created/Modified

- `packages/service/src/routes/menu/reorderMenus.ts` - POST /api/menu/reorder with atomic batch update and sibling re-indexing
- `packages/service/src/routes/menu/index.ts` - Registered reorderMenus route
- `apps/admin/src/app/(logged)/applications/[id]/menus/components/menu-tree.tsx` - Drag-and-drop with DndContext, SortableContext, and visual overlay
- `apps/admin/src/lib/api/menu.ts` - Added reorderMenus client function with ReorderItem type
- `apps/admin/messages/en.json` - Added Menus translations (fetchFailed, reorderFailed)
- `apps/admin/messages/zh.json` - Added Menus translations in Chinese

## Decisions Made

- Used @dnd-kit over react-beautiful-dnd (deprecated, no React 19 support)
- Atomic reorder via Prisma transaction with sequential sibling re-indexing ensures consistency
- Client-side optimistic update with server persistence and error rollback via full fetch

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Drag-and-drop sorting complete for menu management
- Ready for menu-role assignment (02-05) and hardcoded menu migration
- Reorder API handles concurrent reorders atomically via Prisma transaction

---
*Phase: 02-menu-tree-management*
*Completed: 2026-05-20*

## Self-Check: PASSED

- reorderMenus.ts exists on disk
- All 3 task commits present in git log
- TypeScript compilation passes with no errors in plan files
- Pre-existing TS errors in auth.ts, db.ts, and application tests are out of scope

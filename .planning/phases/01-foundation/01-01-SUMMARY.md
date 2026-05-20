---
phase: 01-foundation
plan: 01
subsystem: database
tags: [prisma, postgresql, schema, application, menu, role]

# Dependency graph
requires: []
provides:
  - "Application model with code uniqueness, soft delete, base64 logo storage"
  - "Menu model with multi-level tree nesting (parentId self-relation)"
  - "MenuRole model for role-menu assignment with composite unique constraint"
  - "Database schema pushed to PostgreSQL with all three new tables"
  - "Prisma client regenerated with Application/Menu/MenuRole types available"
affects: [01-02, 01-03, 02-*]

# Tech tracking
tech-stack:
  added: []
  patterns: [prisma-schema-first, soft-delete, self-referential-tree]

key-files:
  created: []
  modified:
    - "packages/service/prisma/schema.prisma"

key-decisions:
  - "Application code is free-form string (not enum) — per D-01"
  - "Logo stored as nullable String (base64 data URL) — per D-03"
  - "Soft delete via deletedAt DateTime? — per D-04"
  - "Menu uses named relation \"MenuTree\" for self-referential parent/children"
  - "MenuRole uses composite unique [menuId, roleId] for deduplication"

patterns-established:
  - "Prisma schema-first: models defined before CRUD implementation"
  - "Self-referential tree pattern: named relation for parent/children"

requirements-completed: [APP-01, APP-02, APP-03, APP-04, APP-05]

# Metrics
duration: 2min
completed: 2026-05-20
---

# Phase 1 Plan 01: Prisma Schema Foundation Summary

**Application, Menu, and MenuRole Prisma models with soft delete, tree nesting, and role-menu assignment — schema pushed to PostgreSQL**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-20T07:08:20Z
- **Completed:** 2026-05-20T07:10:40Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishes
- Added Application model with code uniqueness, soft delete (deletedAt), and nullable base64 logo
- Added Menu model with self-referential tree nesting via named "MenuTree" relation
- Added MenuRole model with composite unique constraint for role-menu assignment
- Pushed schema to PostgreSQL database (3 new tables created)
- Regenerated Prisma client with all new model types available

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Application, Menu, and MenuRole models** - `21bd45c` (feat)
2. **Task 2: Push schema and regenerate client** - (no commit needed — runtime operations only, generated files gitignored)

## Files Created/Modified
- `packages/service/prisma/schema.prisma` - Added Application, Menu, MenuRole models (53 lines appended)

## Decisions Made
- Application `code` is free-form String (not enum) — allows admin-defined identifiers per D-03
- Logo stored as nullable String (base64 data URL) — no file upload complexity per D-03
- Soft delete via `deletedAt DateTime?` — filtered at API layer per D-04
- Menu self-relation uses named relation `"MenuTree"` — Prisma requirement for self-referential FKs
- MenuRole uses `@@unique([menuId, roleId])` — prevents duplicate role assignments

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema foundation complete, ready for Application CRUD (Plan 01-02)
- Menu and MenuRole models available for Phase 2 (menu management) and Phase 3 (role assignment)
- Prisma client regenerated — `prisma.application`, `prisma.menu`, `prisma.menuRole` are now available

---
*Phase: 01-foundation*
*Completed: 2026-05-20*

## Self-Check: PASSED

- All key files exist on disk
- Both task commits verified in git log
- Schema contains all required models with correct fields and constraints

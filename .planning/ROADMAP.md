# Roadmap: 应用与菜单管理系统

## Overview

从数据库模型出发，依次构建应用管理、菜单树管理、角色权限控制，最后将现有硬编码导航迁移为动态菜单系统。每个阶段交付一个完整、可验证的能力。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Prisma schema + App CRUD (name, code, description, logo, search, status) (completed 2026-05-20)
- [ ] **Phase 2: Menu Tree Management** - Menu CRUD + left-right split UI + drag-and-drop sorting + icon picker
- [ ] **Phase 3: RBAC & Menu Visibility** - Role-menu assignment + server-side filtering + dynamic sidebar
- [ ] **Phase 4: Migration** - Migrate hardcoded admin navigation to database-driven dynamic menus

## Phase Details

### Phase 1: Foundation
**Goal**: Admin can manage applications through a complete CRUD interface with search and logo upload
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Requirements**: APP-01, APP-02, APP-03, APP-04, APP-05
**Success Criteria** (what must be TRUE):
  1. Admin can create an application with name, code, and description
  2. Admin can edit application information (name, description, logo)
  3. Admin can delete an application after confirming in a dialog
  4. Admin can search and filter applications in the list view
  5. Admin can upload and change application logo
**Plans:** 3/3 plans complete

Plans:
- [x] 01-01-PLAN.md — Prisma schema (Application, Menu, MenuRole models with cascade deletes)
- [x] 01-02-PLAN.md — App CRUD API endpoints (Hono routes with OpenAPI, search, soft delete)
- [x] 01-03-PLAN.md — App management UI (list, create/edit dialog, search, logo upload)

### Phase 2: Menu Tree Management
**Goal**: Admin can manage multi-level menu trees per application with drag-and-drop sorting and icon selection
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: MENU-01, MENU-02, MENU-03, MENU-04, MENU-05, MENU-06
**Success Criteria** (what must be TRUE):
  1. Admin can create a menu tree with multi-level nesting under an application
  2. Admin can edit menu properties (name, icon, sort order, code)
  3. Admin can delete a menu item, with all child menus cascading to deletion
  4. Admin uses a left-right split interface: tree navigation on left, edit form on right
  5. Admin can drag and drop menu items to reorder within the same level or move across levels
  6. Admin can pick icons for menus via a searchable icon picker
**Plans**: TBD

Plans:
- [ ] 02-01: Menu CRUD API endpoints (tree structure, parentId, sort order)
- [ ] 02-02: Menu tree component integration (shadcn-tree-view)
- [ ] 02-03: Left-right split UI with tree on left, edit form on right
- [ ] 02-04: Drag-and-drop sorting (re-index siblings after reorder)
- [ ] 02-05: Icon picker component (searchable, over lucide-react)

### Phase 3: RBAC & Menu Visibility
**Goal**: Different user roles see different menus, with server-side filtering and dynamic sidebar rendering
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: RBAC-01, RBAC-02
**Success Criteria** (what must be TRUE):
  1. Admin can assign menu visibility to specific roles via an assignment UI
  2. Users see only the menus they are authorized to access based on their role
  3. The sidebar dynamically renders the correct menus for each logged-in user
**Plans**: TBD

Plans:
- [ ] 03-01: Role-menu assignment API endpoints
- [ ] 03-02: Server-side menu filtering by role (API + better-auth integration)
- [ ] 03-03: Dynamic sidebar rendering (replace hardcoded menuItems)

### Phase 4: Migration
**Goal**: Current hardcoded admin navigation is replaced with database-driven dynamic menus without breaking existing navigation
**Mode**: mvp
**Depends on**: Phase 3
**Requirements**: MIGR-01
**Success Criteria** (what must be TRUE):
  1. All existing hardcoded admin navigation items are represented in the database
  2. The admin sidebar loads menus from the database instead of hardcoded data
  3. Existing navigation functionality is preserved (no broken links or missing items)
**Plans**: TBD

Plans:
- [ ] 04-01: Seed script to populate database with current hardcoded menu items
- [ ] 04-02: Switch sidebar from hardcoded to dynamic rendering
- [ ] 04-03: Remove hardcoded menu data and verify full functionality

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete   | 2026-05-20 |
| 2. Menu Tree Management | 0/5 | Not started | - |
| 3. RBAC & Menu Visibility | 0/3 | Not started | - |
| 4. Migration | 0/3 | Not started | - |

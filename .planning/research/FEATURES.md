# Feature Research

**Domain:** Application & Menu Management System for Admin Panels
**Researched:** 2026-05-20
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Application CRUD | Core capability — must create/edit/delete apps | LOW | Standard form + table pattern. Name, code, description, logo fields |
| Application list with search | Every admin needs to find things | LOW | Text search + optional status filter |
| Application status toggle (enable/disable) | Common pattern for soft-disable without deletion | LOW | Boolean field, instant toggle |
| Menu tree CRUD | Core feature — create/edit/delete menu items | MEDIUM | Multi-level nesting with parent-child relationships |
| Menu properties (name, icon, code) | Each menu item needs identity and metadata | LOW | Fields: label, icon, code (maps to frontend route), sortOrder |
| Menu-application association | Each app has its own menu tree | LOW | Foreign key relationship, filtered views |
| Left-right split UI (tree + form) | Standard pattern for tree editing — Ant Design Pro, Element Plus Admin all use this | MEDIUM | Left panel: tree list, Right panel: edit form. Must handle empty state |
| Role-based menu visibility | RBAC integration is the whole point | MEDIUM | Checkboxes/toggles per role on each menu item. Integrates with better-auth RBAC |
| Delete confirmation | Prevent accidental data loss | LOW | Modal or popover confirmation before delete |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Drag-and-drop menu sorting | Reordering menus is intuitive vs typing sort numbers | MEDIUM | Use @dnd-kit or similar. Works within level and across levels |
| Icon picker with search | Finding the right icon from 100+ options is painful without search | MEDIUM | Filterable grid of lucide-react icons. Current project already uses lucide-react |
| Menu code preview with route mapping | Shows how the code maps to frontend route — reduces misconfiguration | LOW | Display the frontend route pattern when editing menu code |
| Batch operations | Enable/disable/delete multiple items at once | MEDIUM | Checkbox selection in tree + batch action toolbar |
| Menu tree import/export | Copy menu structure between environments or apps | MEDIUM | JSON export/import with validation |
| Visual menu tree preview | See the final navigation before saving | LOW | Live preview panel showing how the sidebar will look |
| Menu search in tree | Find menu items in large trees without expanding every node | LOW | Filter input that highlights matching nodes |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-sync menu to frontend routes | "It should just work" — auto-generate routes from menu | Tight coupling between backend config and frontend code. Breaks when routes need custom logic, lazy loading, or layout nesting | Manual code mapping via the "code" field. Document the convention clearly |
| Multi-language menu management | "We might expand internationally" | 10x complexity for i18n of every menu field. Current scope explicitly says Chinese only | Use next-intl's existing locale system if needed later. Don't build a translation management UI |
| Real-time collaborative editing | "Multiple admins might edit simultaneously" | WebSocket complexity, conflict resolution, minimal value for admin config that changes rarely | Simple optimistic locking or last-write-wins is sufficient |
| Menu versioning/history | "What if someone makes a mistake?" | Full audit trail for menu config is overkill. Database already has createdAt/updatedAt | Use database backups + manual re-export as the recovery mechanism |
| Nested permission inheritance | "Child menus should inherit parent's role access" | Counter-intuitive — a child menu might need different access than its parent. Creates confusion when debugging access issues | Explicit per-item permission assignment. Clearer, easier to debug |
| Custom themes per app | "Each app should look different" | Duplicates theme logic, increases CSS complexity, minimal value for admin panels | Use the global theme system (next-themes) already in place |
| Menu analytics (click tracking, popularity) | "Would be nice to know what users click" | Requires tracking infrastructure, privacy concerns, low value for internal admin tools | Build a separate analytics feature if needed, don't conflate with menu management |

## Feature Dependencies

```
[Application CRUD]
    └──requires──> [Database Schema (Application model)]

[Menu Tree CRUD]
    └──requires──> [Database Schema (Menu model)]
    └──requires──> [Application CRUD] (menus belong to an app)

[Role-Based Visibility]
    └──requires──> [Menu Tree CRUD]
    └──requires──> [Better-Auth RBAC] (existing system)

[Left-Right Split UI]
    └──requires──> [Application CRUD]
    └──requires──> [Menu Tree CRUD]

[Drag-and-Drop Sorting]
    └──requires──> [Menu Tree CRUD]

[Icon Picker]
    └──requires──> [Menu Tree CRUD]

[Dynamic Sidebar Rendering]
    └──requires──> [Menu Tree CRUD]
    └──requires──> [Role-Based Visibility]
    └──requires──> [API to fetch menus for current user]

[Migration from Hardcoded Menus]
    └──requires──> [Dynamic Sidebar Rendering]
    └──requires──> [Application CRUD] (admin panel = first app)
```

### Dependency Notes

- **Application CRUD is foundational:** Menu items must belong to an application. Build apps first.
- **Menu Tree CRUD is the core:** Everything else (sorting, icons, permissions, dynamic rendering) builds on this.
- **Role-Based Visibility requires Menu CRUD + better-auth:** Use the existing `ac` (access control) system from `packages/shared/src/permissions.ts`. Add new permission statements for menu management.
- **Dynamic Sidebar Rendering is the payoff:** This replaces the hardcoded `menuItems` array in `sidebar.tsx`. It requires both the API and the frontend integration.
- **Migration is last:** Only migrate after the dynamic system is fully working and tested.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Application CRUD with list/search/status — the container for everything else
- [ ] Menu tree CRUD with multi-level nesting — the core feature
- [ ] Menu properties (name, icon, code, sort order) — essential metadata
- [ ] Left-right split management UI — the interaction model
- [ ] Role-based menu visibility — the security layer
- [ ] Dynamic sidebar rendering — replaces hardcoded navigation
- [ ] Migration of admin panel menus — the proof of concept

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Drag-and-drop sorting — improves UX but not blocking
- [ ] Icon picker with search — nice to have, text input works initially
- [ ] Menu code preview with route mapping — helps prevent misconfiguration
- [ ] Batch operations — useful when managing many items

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Menu tree import/export — useful for multi-environment workflows
- [ ] Visual menu tree preview — polish feature
- [ ] Menu search in tree — needed only when trees get large

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Application CRUD | HIGH | LOW | P1 |
| Menu Tree CRUD | HIGH | MEDIUM | P1 |
| Left-Right Split UI | HIGH | MEDIUM | P1 |
| Role-Based Visibility | HIGH | MEDIUM | P1 |
| Dynamic Sidebar Rendering | HIGH | MEDIUM | P1 |
| Menu Properties (name, icon, code) | HIGH | LOW | P1 |
| Migration from Hardcoded | HIGH | LOW | P1 |
| Drag-and-Drop Sorting | MEDIUM | MEDIUM | P2 |
| Icon Picker with Search | MEDIUM | MEDIUM | P2 |
| Menu Code Preview | MEDIUM | LOW | P2 |
| Batch Operations | MEDIUM | MEDIUM | P2 |
| Menu Tree Import/Export | LOW | MEDIUM | P3 |
| Visual Menu Preview | LOW | LOW | P3 |
| Menu Search in Tree | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Ant Design Pro | Element Plus Admin | Vue-Vben-Admin | Our Approach |
|---------|----------------|-------------------|----------------|--------------|
| Application concept | Multi-system via routes | Single system | Multi-system | Explicit "App" entity with independent menu trees |
| Menu tree editing | Left-right split | Drag-and-drop tree | Left-right split | Left-right split with drag-and-drop support |
| Role-based visibility | Per-route meta | Per-menu item | Per-route meta | Per-menu item via better-auth RBAC integration |
| Icon library | Ant Design icons | Element Plus icons | Custom icons | lucide-react (already in project) |
| Drag sorting | ❌ Manual sort | ✅ | ✅ | ✅ @dnd-kit based |
| Menu code mapping | Convention-based | Manual | Manual | Explicit code field + documentation |
| Dynamic sidebar | ✅ | ✅ | ✅ | ✅ Replace hardcoded array |

## Sources

- Ant Design Menu component API (ant-design.antgroup.com) — MEDIUM confidence, referenced for menu item structure and interaction patterns
- Ant Design Pro layout patterns — MEDIUM confidence, standard left-right split UI reference
- Existing codebase analysis (sidebar.tsx, permissions.ts, schema.prisma) — HIGH confidence, current state
- PROJECT.md requirements — HIGH confidence, validated requirements

---

*Feature research for: Application & Menu Management System*
*Researched: 2026-05-20*

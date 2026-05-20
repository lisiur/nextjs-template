# Pitfalls Research

**Domain:** Application and Menu Management System (Admin Panel)
**Researched:** 2026-05-20
**Confidence:** HIGH (based on codebase analysis + domain expertise)

## Critical Pitfalls

### Pitfall 1: Orphaned Menu Items After Parent Deletion

**What goes wrong:**
When a parent menu item is deleted, child items become orphans — they still reference a non-existent parentId. The menu tree breaks silently: children disappear from the UI but remain in the database, accumulating as dead data. Queries that traverse the tree (e.g., "get all visible menus for role X") skip orphans, so users see an incomplete menu without realizing anything is wrong.

**Why it happens:**
Developers use `onDelete: Cascade` on the foreign key without thinking about whether they want cascading deletion or re-parenting. Alternatively, they forget to handle children at all (no cascade, no re-parent, no guard), and deletion throws a foreign key constraint error.

**How to avoid:**
- Prisma schema: Use `onDelete: Cascade` on `Menu.parentId` → `Menu.id` so children are deleted with parent. This is the simplest correct default.
- Add a guard in the delete handler: if the menu has children, either refuse deletion (show confirmation dialog: "This menu has X children, they will be deleted") or re-parent children to the deleted item's parent.
- Never allow `onDelete: SetNull` on menu parent references — it creates orphans by design.

**Warning signs:**
- Menu items that don't appear in the tree but exist in the database
- "Where did my menu go?" complaints after deleting a parent
- Database queries returning menu items with `parentId` pointing to non-existent rows

**Phase to address:**
Schema design phase (first phase) — must get the Prisma relation right from the start.

---

### Pitfall 2: Flat Sort Order Breaks After Reorder

**What goes wrong:**
Menu items use a simple `sortOrder: Int` field for ordering. When a menu is dragged to a new position, the developer updates only the two affected items' sort orders. But other items in the same level now have duplicate or non-contiguous sort values. After several reorders, the ordering becomes inconsistent, and items jump to unexpected positions.

**Why it happens:**
Naive approach: "just update sortOrder of the dragged item." But sibling order depends on ALL siblings' sort values, not just the one being moved. A drag from position 3 to position 1 requires re-indexing positions 1 and 2, not just setting position 1 to 3.

**How to avoid:**
- Use `sortOrder: Float` with gap values (e.g., 1.0, 1.5, 2.0) so reordering only touches two records.
- Or: after any reorder, re-index all siblings in the same parent level to contiguous integers (1, 2, 3...).
- For drag-and-drop, batch-update all affected siblings in a single transaction.
- Store `sortOrder` as `Int` but always re-index after reorder (simplest correct approach).

**Warning signs:**
- Menu items appearing in wrong order after drag-and-drop
- Duplicate sort values in the same parent level
- "My menu was in the right order but now it's scrambled" after a single drag operation

**Phase to address:**
Menu tree CRUD implementation — must design sort order strategy before building the reorder feature.

---

### Pitfall 3: Hardcoded Menu → Dynamic Menu Migration Breaks Existing Navigation

**What goes wrong:**
The current sidebar (`sidebar.tsx`) has hardcoded menu items with static URLs and imported Lucide icons. When switching to dynamic menus, the migration either:
1. Creates menu items but the sidebar still reads the hardcoded array (dual sources of truth)
2. Deletes hardcoded items but the dynamic menu doesn't include all existing routes (missing navigation)
3. Maps icons incorrectly (string icon names don't resolve to Lucide components)

**Why it happens:**
Migration is treated as a "big bang" switch instead of a gradual transition. The developer focuses on the new system and forgets that the old system has implicit dependencies (URLs, icons, i18n keys, layout structure).

**How to avoid:**
- **Phase 1:** Build the dynamic menu system alongside the hardcoded one (feature flag or env var)
- **Phase 2:** Seed the database with the current hardcoded menu items as the first "app" (admin panel)
- **Phase 3:** Switch sidebar to read from API when dynamic menu is enabled
- **Phase 4:** Remove hardcoded menu items only after verification
- Create a migration script that maps each hardcoded item to a database record with correct `code`, `icon`, `sortOrder`, and `parentId`

**Warning signs:**
- Sidebar shows different items before and after migration
- Icon doesn't render (string "HomeIcon" vs actual `<HomeIcon />` component)
- URL paths don't match between old and new menu

**Phase to address:**
Migration phase (should be last, after dynamic menu system is verified independently).

---

### Pitfall 4: Menu Code ↔ Frontend Route Desynchronization

**What goes wrong:**
Menu items have a `code` field (e.g., `"users"`, `"organizations"`) that should map to frontend routes. But the code is manually entered, and there's no validation that it matches an actual route. Someone creates a menu item with code `"user"` (typo) or `"users-list"` (renamed route), and the sidebar link goes to a 404 or wrong page.

**Why it happens:**
The system explicitly decided "manual code-to-route mapping" (see PROJECT.md), but there's no validation loop. Without tests or a registry, drift is inevitable as routes change during development.

**How to avoid:**
- Define a route registry on the frontend: a const object mapping codes to URL paths (e.g., `{ users: "/users", roles: "/roles" }`)
- Validate menu `code` against this registry when saving (API-side or form-side)
- Add a "route not found" warning in the sidebar (render a warning icon next to menu items whose code doesn't match any registered route)
- Periodic audit: script that checks all menu codes against registered routes

**Warning signs:**
- 404 errors after clicking sidebar items
- "I created a menu but it goes to the wrong page"
- Menu items that work in dev but break in production (different route structure)

**Phase to address:**
Menu CRUD + frontend integration phase — build the route registry as part of the menu system, not as an afterthought.

---

### Pitfall 5: RBAC Permission Check Doesn't Cover Menu Visibility

**What goes wrong:**
Menu visibility is controlled by role, but the permission check only happens in the UI (sidebar hides items the user can't see). The API still returns all menus regardless of role. An admin can inspect network requests and see menu items for roles they don't have. Worse, if someone builds a "direct link" feature using menu codes, the link works even without role permission.

**Why it happens:**
Developers treat menu visibility as a UI concern ("just hide it in the sidebar") rather than a security concern. The API returns all data, and the frontend filters. This is the same pattern that caused the existing `role-table.tsx` bug (CONCERNS.md: hardcoded permissions instead of deriving from shared module).

**How to avoid:**
- API endpoint `GET /api/apps/:appId/menus` must filter by the caller's role — return only menus the user has permission to see
- Store role-permission mapping in the database (a join table: `menu_role` or JSON field on menu), not hardcoded
- Add server-side middleware that checks menu access before returning the tree
- Frontend sidebar should trust the API response (no client-side filtering of the tree)

**Warning signs:**
- Network tab shows menu items the user shouldn't see
- Users can navigate to pages by directly typing the URL
- Role changes don't immediately affect menu visibility (cache or no re-fetch)

**Phase to address:**
RBAC integration phase — must be designed alongside the menu schema, not bolted on later.

---

### Pitfall 6: N+1 Query Problem When Rendering Menu Tree

**What goes wrong:**
Each menu item is fetched individually when rendering the sidebar. For a tree with 50 items across 3 apps, the sidebar triggers 50 API calls (or one call that does 50 DB queries via lazy loading). The page loads slowly, and the network tab is full of requests.

**Why it happens:**
Tree structures are naturally recursive. Developers use recursive fetching (fetch children of each node individually) or lazy-load children on expand. For a sidebar that should show the full tree immediately, this is wasteful.

**How to avoid:**
- Fetch the entire menu tree for an app in a single query: `SELECT * FROM menu WHERE appId = ? ORDER BY parentId, sortOrder`
- Flatten the result in the API layer and return as a tree (nested JSON)
- Cache the menu tree in the frontend (Zustand store or React context) — menus don't change frequently
- Use Prisma's `include` with recursive relations or raw SQL with CTE for deep trees

**Warning signs:**
- Sidebar takes >500ms to render
- Network tab shows multiple sequential API calls on page load
- "Menu is slow" complaints from users

**Phase to address:**
Performance optimization phase (after basic functionality works) — but design the API to return the full tree from the start.

---

### Pitfall 7: Circular Reference in Menu Parent Chain

**What goes wrong:**
A menu item is set as its own descendant's parent, creating a circular reference (A → B → C → A). This causes infinite recursion when building the tree, crashing the server or hanging the frontend rendering.

**Why it happens:**
The "move menu" or "change parent" API doesn't validate that the new parent isn't a descendant of the current item. With drag-and-drop, it's easy to accidentally drop a parent onto its own child.

**How to avoid:**
- When updating `parentId`, validate that the new parent is not a descendant:
  ```
  WITH RECURSIVE ancestors AS (
    SELECT id, parentId FROM menu WHERE id = :newParentId
    UNION ALL
    SELECT m.id, m.parentId FROM menu m JOIN ancestors a ON m.parentId = a.id
  )
  SELECT COUNT(*) FROM ancestors WHERE id = :currentMenuId
  ```
  If count > 0, reject the move.
- Alternatively, when building the tree, detect cycles and log an error (defensive, but doesn't prevent the root cause).
- Frontend drag-and-drop should disable dropping a node onto its own descendant (gray out valid drop targets).

**Warning signs:**
- API returns 500 or hangs when fetching menus
- Frontend renders indefinitely or crashes (React stack overflow)
- "Circular reference detected" in server logs

**Phase to address:**
Menu tree CRUD implementation — must add cycle detection in the move/re-parent handler.

---

### Pitfall 8: App Deletion Doesn't Clean Up Menu Tree

**What goes wrong:**
An app is deleted, but its menu items remain in the database (no cascade). Over time, orphaned menu items accumulate. Queries for "all menus across all apps" return stale data. Worse, if menu IDs are referenced elsewhere (bookmarks, permissions), those references break.

**Why it happens:**
The developer focuses on the app CRUD and forgets that apps own menu trees. The Prisma schema might not have `onDelete: Cascade` from App → Menu.

**How to avoid:**
- Prisma schema: `App` model must have `menus Menu[]` with `@relation(fields: [appId], references: [id], onDelete: Cascade)`
- Add a confirmation dialog: "Deleting this app will permanently delete all X menu items"
- After deletion, invalidate any cached menu trees

**Warning signs:**
- Menu items with `appId` pointing to deleted apps
- "Ghost menus" appearing in cross-app queries
- Database size growing without corresponding app count

**Phase to address:**
Schema design phase — cascade from App → Menu must be in the initial Prisma schema.

---

### Pitfall 9: Icon Resolution Fails Silently

**What goes wrong:**
Menu items store icon names as strings (e.g., `"HomeIcon"`, `"UsersIcon"`). The frontend maps these to actual Lucide components. But the mapping is incomplete — someone adds a new menu with icon `"ChartBar"` which isn't in the mapping. The sidebar renders a blank space or throws a runtime error.

**Why it happens:**
The icon name → component mapping is a hardcoded object. There's no validation when saving the menu item, and no fallback when the icon isn't found.

**How to avoid:**
- Maintain a whitelist of allowed icon names (derived from Lucide's exported icons)
- Validate icon name against the whitelist when saving (API-side)
- Render a fallback icon (e.g., `<CircleIcon />`) when the icon name isn't found, with a console warning
- Consider using Lucide's dynamic import or a JSON icon registry instead of a manual mapping

**Warning signs:**
- Blank spaces in the sidebar where icons should be
- React errors in the console about unknown icon components
- "I set an icon but it doesn't show up"

**Phase to address:**
Menu attribute management phase — build icon validation as part of the menu form.

---

### Pitfall 10: Menu Changes Don't Invalidate Frontend Cache

**What goes wrong:**
Admin updates the menu structure (adds, removes, reorders items). The sidebar still shows the old structure until the user hard-refreshes the page. This creates confusion: "I just added a menu item but it's not there."

**Why it happens:**
The sidebar fetches menus on mount and caches them in state (Zustand, React Query, or local state). There's no invalidation mechanism when menus change.

**How to avoid:**
- Use React Query or SWR with a stale time for menu data (e.g., 30 seconds)
- After any menu mutation (create/update/delete/reorder), invalidate the menu query cache
- Or: use a WebSocket/SSE to push menu updates to connected clients (overkill for admin panels, but effective)
- Simplest approach: after mutation, refetch the menu tree and update the store

**Warning signs:**
- Menu changes require page refresh to appear
- Multiple admin tabs showing different menu structures
- "I updated the menu but my colleague still sees the old one"

**Phase to address:**
Frontend integration phase — build cache invalidation as part of the menu mutation handlers.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store menu tree as JSON blob instead of relational rows | Simpler CRUD, no tree queries | Impossible to query individual items, no RBAC per-item, no partial updates | Never for this use case |
| Hardcode icon mapping as a switch statement | Quick to implement | Adding icons requires code changes, no admin self-service | Only in MVP with <10 icons |
| Skip `sortOrder` and use `createdAt` for ordering | No reorder logic needed | Can't reorder without updating timestamps, breaks natural ordering | Never |
| Store permissions as JSON array on menu item | Simple read, no join tables | Permissions can't be audited, no bulk updates, no role-based queries | Never |
| Fetch menu tree on every page navigation | No cache invalidation needed | Slow sidebar, unnecessary network traffic | Never — always cache |

## Integration Gotchas

Common mistakes when connecting to external systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| better-auth RBAC | Defining menu permissions outside the `statement` object in `permissions.ts` | Add `menu: ["read", "write"]` to the statement and create role-specific menu permissions |
| better-auth session | Checking `session.user.role` directly in route handlers | Use `auth.api.getSession()` consistently (already done in org routes — follow same pattern) |
| Hono OpenAPI routes | Forgetting to add menu routes to `routes/index.ts` | Every new route module must be imported and mounted in the parent `OpenAPIHono` |
| Prisma client | Importing Prisma directly in frontend components | Always use Hono RPC client; Prisma is server-only |
| Lucide icons | Using `dynamic()` import for icon resolution | Build a static map of allowed icons; dynamic import adds complexity without benefit here |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching full menu tree without app filtering | Slow response as apps grow | Always filter by `appId` in the query | >5 apps with >100 menus each |
| Loading all menu trees for all apps on page load | Slow initial render, wasted bandwidth | Load only the current app's menu; lazy-load others on app switch | >3 apps loaded simultaneously |
| Sorting in JavaScript instead of SQL | Slow with >100 items | Use `ORDER BY parentId, sortOrder` in the query | >50 menus in a single app |
| No index on `menu.appId` and `menu.parentId` | Slow queries as data grows | Add composite index: `@@index([appId, parentId])` | >1000 menu records total |
| Re-fetching menu tree on every component mount | Excessive API calls | Cache in Zustand/React Query with stale time | Any scale — always cache |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Menu visibility check only in frontend | Users can discover hidden menus via network tab or direct URL | Server-side filtering: API returns only menus the user's role can access |
| No authorization check on menu CRUD endpoints | Any authenticated user could create/modify menus | All menu endpoints require `admin` role (follow organization route pattern) |
| Menu `code` field accepts arbitrary strings | XSS via menu code rendered in unsafe context | Validate `code` against route registry; sanitize before rendering |
| Deleting an app doesn't check for active references | Breaking bookmarks, permissions, or integrations | Soft-delete apps first; hard-delete only after reference cleanup |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No confirmation before deleting a menu with children | Accidental data loss — "I didn't mean to delete the whole section" | Show child count and require explicit confirmation |
| Sort order not visible to admin | "Why is my menu in this order?" confusion | Display sort order numbers or let admin see drag handles |
| No undo for menu changes | Mistakes require manual re-creation | Implement soft-delete with 24h undo window, or at minimum show "last changed" timestamp |
| Icon picker shows all Lucide icons | Overwhelming choice, hard to find the right one | Curate a subset of ~30 admin-appropriate icons; group by category |
| No preview of menu structure | Admin can't see how the tree looks before saving | Show a live preview tree in the edit form |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Menu CRUD:** Often missing parent-child validation — verify cycle detection is implemented
- [ ] **Menu ordering:** Often missing batch reorder — verify drag-and-drop updates ALL affected siblings, not just the dragged item
- [ ] **Role visibility:** Often missing server-side filtering — verify API returns only role-appropriate menus
- [ ] **App deletion:** Often missing cascade cleanup — verify menus are deleted when app is deleted
- [ ] **Icon rendering:** Often missing fallback — verify unknown icons show a placeholder, not a blank space
- [ ] **Cache invalidation:** Often missing after mutations — verify sidebar updates without page refresh
- [ ] **Migration:** Often missing icon mapping — verify all hardcoded icons are correctly migrated to database records

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Orphaned menu items | LOW | Query for menus with invalid parentId; re-parent or delete |
| Broken sort order | LOW | Re-index all siblings in each parent level to contiguous integers |
| Migration breaks navigation | HIGH | Restore hardcoded sidebar, fix migration script, re-run |
| Circular reference | MEDIUM | Query with cycle detection; break the cycle by setting parentId to null |
| App deletion orphans menus | LOW | Query for menus with invalid appId; delete or reassign |
| Cache stale after mutation | LOW | Add cache invalidation to mutation handlers; no data loss |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Orphaned menu items | Schema Design | Unit test: delete parent → children are also deleted |
| Flat sort order breaks | Menu CRUD Implementation | Manual test: drag menu 5 times, verify order is correct |
| Migration breaks navigation | Migration Phase | UAT: sidebar shows identical items before/after migration |
| Code ↔ route desync | Frontend Integration | Build route registry; validate codes on save |
| RBAC doesn't cover menus | RBAC Integration | Test: non-admin user sees only permitted menus in API response |
| N+1 query | Performance Phase | Check network tab: single API call for full tree |
| Circular reference | Menu CRUD Implementation | Unit test: attempt to set parent to own descendant → rejected |
| App deletion orphans menus | Schema Design | Unit test: delete app → menus are cascade-deleted |
| Icon resolution fails | Menu Attribute Management | Manual test: save menu with invalid icon → fallback icon shown |
| Cache not invalidated | Frontend Integration | Manual test: add menu in tab A → tab B shows it without refresh |

## Sources

- Codebase analysis: `apps/admin/src/components/layout/sidebar.tsx` (hardcoded menu pattern)
- Codebase analysis: `packages/service/prisma/schema.prisma` (existing schema patterns)
- Codebase analysis: `packages/shared/src/permissions.ts` (RBAC structure)
- Codebase analysis: `packages/service/src/routes/organization/` (established route patterns)
- Codebase concerns: `.planning/codebase/CONCERNS.md` (known issues with permissions, caching, RBAC)
- Domain expertise: Common pitfalls in tree-structured data management systems
- Domain expertise: Admin panel dynamic menu management patterns

---
*Pitfalls research for: Application and Menu Management System*
*Researched: 2026-05-20*

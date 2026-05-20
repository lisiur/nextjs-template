# Phase 3: RBAC & Menu Visibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 03-rbac-menu-visibility
**Areas discussed:** Role-menu assignment UI, Server-side filtering, Default behavior, Sidebar rendering

---

## Role-menu assignment UI

| Option | Description | Selected |
|--------|-------------|----------|
| Role-centric (Recommended) | Select a role, then see a tree of menus with checkboxes. Assign/unassign menus to that role. Fits the mental model of 'what can this role do?' | ✓ |
| Menu-centric | Select a menu item, then see a list of roles with checkboxes. Assign/unassign roles to that menu. Fits the mental model of 'who can see this menu?' | |
| Matrix view | A table with roles as columns and menus as rows. Each cell is a checkbox. Good for overview but complex for large menu trees. | |

**User's choice:** Role-centric (Recommended)
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Integrated into menu page | Add a 'Roles' tab or column to the existing Menu management page. Keeps everything in one place. | |
| Separate page | New '/roles' page with role list + menu assignment panel. Cleaner separation of concerns. | ✓ |
| You decide | Let the agent choose based on codebase patterns. | |

**User's choice:** Separate page
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-include children (Recommended) | Assigning a parent menu automatically assigns all children. Simpler for admin, prevents 'orphaned' child menus. | ✓ |
| Independent assignment | Each menu item is independently assignable. More granular control but more complex for admin. | |
| You decide | Let the agent choose based on codebase patterns. | |

**User's choice:** Auto-include children (Recommended)
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, show preview | Right panel shows a mock sidebar for the selected role. Helps admin visualize the result. | |
| No, keep it simple | Just show the tree with checkboxes. No preview. Simpler implementation. | ✓ |
| You decide | Let the agent choose based on codebase patterns. | |

**User's choice:** No, keep it simple
**Notes:** None

---

## Server-side filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Session-based (Recommended) | API reads the user's role from the session cookie (already available via better-auth). No query params needed. Most secure - role can't be spoofed. | ✓ |
| Query param | GET /api/menus?roleId=admin. More flexible but less secure - client could request any role. | |
| You decide | Let the agent choose based on codebase patterns. | |

**User's choice:** Session-based (Recommended)
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Middleware (Recommended) | A middleware intercepts menu queries and injects the role filter. Single point of logic, less duplication. | |
| Route handler | Each route handler queries MenuRole manually. More explicit but more duplication. | |
| You decide | Let the agent choose based on codebase patterns. | ✓ |

**User's choice:** You decide
**Notes:** Agent will decide based on codebase patterns

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, dedicated endpoint (Recommended) | GET /api/menus/mine returns only the current user's authorized menus. Clean separation between admin management and user consumption. | ✓ |
| Reuse admin endpoint | Use the existing list menus endpoint with role filtering. Simpler but mixes concerns. | |
| You decide | Let the agent choose based on codebase patterns. | |

**User's choice:** Yes, dedicated endpoint (Recommended)
**Notes:** None

---

## Default behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Admin-only (Recommended) | New menus are only visible to admin role by default. Other roles must be explicitly granted access. Most secure - prevents accidental exposure. | |
| Visible to all roles | New menus are visible to all roles by default. Admin must explicitly hide from roles. More convenient but less secure. | |
| Hidden until assigned | New menus have no role assignments and are invisible to everyone (including admin until explicitly assigned). Most secure but more work for admin. | ✓ |
| You decide | Let the agent choose based on codebase patterns. | |

**User's choice:** Hidden until assigned
**Notes:** Most secure option

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, show warning | Display a badge or alert on menus with no role assignments. Helps admin catch mistakes. | |
| No warning | Just show the tree. Admin is responsible for checking assignments. | ✓ |
| You decide | Let the agent choose based on codebase patterns. | |

**User's choice:** No warning
**Notes:** None

---

## Sidebar rendering

| Option | Description | Selected |
|--------|-------------|----------|
| On login (Recommended) | Fetch menus once when the user logs in, cache in Zustand store. Fastest navigation, minimal API calls. | ✓ |
| On page load | Fetch menus on each page load. Always fresh but more API calls. | |
| On role change | Fetch menus when the user's role changes. Good middle ground but role changes are rare. | |
| You decide | Let the agent choose based on codebase patterns. | |

**User's choice:** On login (Recommended)
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Collapsible tree (Recommended) | Parent menus expand/collapse to show children. Standard pattern for admin sidebars. | ✓ |
| Flat list with indentation | All menus in a flat list with visual indentation for nesting. Simpler but less common. | |
| You decide | Let the agent choose based on codebase patterns. | |

**User's choice:** Collapsible tree (Recommended)
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, use icons (Recommended) | Display icons from the Menu model's icon field. Uses the icon picker feature from Phase 2. | ✓ |
| No, text only | Show menu names only, no icons. Simpler but less visual. | |
| You decide | Let the agent choose based on codebase patterns. | |

**User's choice:** Yes, use icons (Recommended)
**Notes:** None

---

## the agent's Discretion

- Middleware vs route handler for menu filtering — agent decides based on codebase patterns
- UI component choices (which shadcn/ui components to use for checkboxes, tree view)
- Zustand store structure for caching menus
- Error handling for failed menu fetches
- Loading states for sidebar

## Deferred Ideas

None — discussion stayed within phase scope.

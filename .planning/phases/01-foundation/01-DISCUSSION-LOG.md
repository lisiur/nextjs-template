# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 1-Foundation
**Areas discussed:** Application code format, App status behavior, Logo upload approach, App deletion cascade

---

## Application Code Format

| Option | Description | Selected |
|--------|-------------|----------|
| User-provided slug | Admin types a code like 'oa-system' or 'crm'. Validated for uniqueness. | |
| Auto-generated from name | Code is auto-derived from the app name (e.g., 'OA System' → 'oa-system'). Admin can override. | |
| Free-form string | Any string the admin wants (e.g., 'OA', 'CRM-V2', 'internal_tool'). Only uniqueness enforced. | ✓ |

**User's choice:** Free-form string
**Notes:** No format constraint, only uniqueness enforced.

---

## App Status Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Hide from users only | Disabled apps hidden from sidebar for non-admin users. | |
| Mark inactive in list | Just a visual badge in admin list, no functional impact. | |
| Both: hide + visual | Hidden from non-admin navigation AND shown as inactive in admin list. | |
| Don't implement | Status management deferred, not part of Phase 1. | ✓ |

**User's choice:** Don't implement this
**Notes:** Status management is not needed in Phase 1. REQUIREMENTS.md doesn't assign it to Phase 1.

---

## Logo Upload Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing Upload system | Use existing Upload model + routes. App stores upload ID/path reference. | |
| Simple URL field | Admin pastes an image URL, no file upload. | |
| Direct file upload to app | Upload endpoint specific to apps, stores file locally. | |
| Base64 encode | Frontend converts image to base64, backend stores in DB. | ✓ |

**User's choice:** Use base64 encode
**Notes:** Base64 string stored directly in database text column. No file system involvement.

### Follow-up: Logo Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Database column (text) | Store base64 string directly in Application.logo column. | ✓ |
| Decode to file, store path | Backend decodes base64, saves file, stores path. | |

**User's choice:** Database column (text)
**Notes:** Simpler approach, no file I/O needed.

---

## App Deletion Cascade

| Option | Description | Selected |
|--------|-------------|----------|
| Cascade delete | All menus under app auto-deleted (Prisma onDelete: Cascade). | |
| Soft delete app only | App marked deleted (isDeleted flag) but menus remain in DB. | ✓ |
| Hard delete, no cascade | Prevent deletion if app has menus. Admin must delete menus first. | |

**User's choice:** Soft delete app only
**Notes:** Allows app restoration later. Menus remain in database.

---

## Agent's Discretion

- Schema field naming (isDeleted vs deletedAt)
- Whether to include sortOrder on Application
- Menu and MenuRole model field design (must support multi-level nesting and role-based visibility)

## Deferred Ideas

- App status management (enable/disable) — future phase
- Menu management UI (left-right split, drag-and-drop, icon picker) — Phase 2
- RBAC menu visibility — Phase 3
- Hardcoded menu migration — Phase 4

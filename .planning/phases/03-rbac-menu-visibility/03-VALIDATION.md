---
phase: 3
slug: rbac-menu-visibility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-20
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (inferred from `application.test.ts` existing) |
| **Config file** | None detected — may need Wave 0 setup |
| **Quick run command** | `pnpm vitest run` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | RBAC-01 | T-3-01 | Admin-only middleware on management routes | unit | `pnpm vitest run --grep "menu-role"` | ❌ Wave 0 | ⬜ pending |
| 03-01-02 | 01 | 1 | RBAC-01 | T-3-02 | Session-based role extraction for /menus/mine | unit | `pnpm vitest run --grep "menus-mine"` | ❌ Wave 0 | ⬜ pending |
| 03-02-01 | 02 | 2 | RBAC-01 | T-3-03 | Server-side menu filtering by role | integration | `pnpm vitest run --grep "menu-filtering"` | ❌ Wave 0 | ⬜ pending |
| 03-02-02 | 02 | 2 | RBAC-02 | T-3-04 | Zustand store fetches menus on login | unit | `pnpm vitest run --grep "menu-store"` | ❌ Wave 0 | ⬜ pending |
| 03-03-01 | 03 | 3 | RBAC-02 | — | Dynamic sidebar rendering | manual | Manual verification: login as different roles, check sidebar | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/service/src/routes/menu-role/__tests__/menu-role.test.ts` — API endpoint tests
- [ ] `packages/service/src/routes/menu-role/__tests__/menus-mine.test.ts` — GET /menus/mine tests
- [ ] Vitest config setup if not present
- [ ] Test utilities for mocking `auth.api.getSession()`

*Existing infrastructure covers most phase requirements — Wave 0 adds route-level tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar dynamically renders menus for each user | RBAC-02 | Requires browser interaction with auth flow | 1. Login as admin → verify full menu tree visible. 2. Login as user → verify only assigned menus visible. 3. Login as manager → verify manager-level menus visible. |
| Role-menu assignment UI works correctly | RBAC-01 | Requires admin interaction with tree checkboxes | 1. Navigate to role-menu assignment page. 2. Select a role. 3. Check/uncheck menu items. 4. Save and verify persistence. |

*All phase behaviors have automated verification except sidebar rendering and assignment UI interaction.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured |
| **Config file** | none |
| **Quick run command** | `pnpm dev` (manual verification) |
| **Full suite command** | N/A — no automated tests exist |
| **Estimated runtime** | N/A |

---

## Sampling Rate

- **After every task commit:** `pnpm dev` — manual smoke test
- **After every plan wave:** Full CRUD flow test (create → list → search → edit → delete)
- **Before `/gsd-verify-work`:** All 5 success criteria from ROADMAP verified manually
- **Max feedback latency:** N/A (manual verification)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01-01 | 1 | APP-01 | — | N/A | manual-only | Open create dialog, fill form, submit | ❌ No test infra | ⬜ pending |
| 01-02-01 | 01-02 | 2 | APP-01 | — | N/A | manual-only | POST /api/applications returns 200 | ❌ No test infra | ⬜ pending |
| 01-02-02 | 01-02 | 2 | APP-02 | — | N/A | manual-only | PUT /api/applications/:id returns 200 | ❌ No test infra | ⬜ pending |
| 01-02-03 | 01-02 | 2 | APP-03 | — | N/A | manual-only | DELETE /api/applications/:id returns 200 | ❌ No test infra | ⬜ pending |
| 01-02-04 | 01-02 | 2 | APP-04 | — | N/A | manual-only | GET /api/applications?search=oa returns filtered results | ❌ No test infra | ⬜ pending |
| 01-03-01 | 01-03 | 3 | APP-01 | — | N/A | manual-only | Create dialog opens, form submits | ❌ No test infra | ⬜ pending |
| 01-03-02 | 01-03 | 3 | APP-02 | — | N/A | manual-only | Edit dialog opens, saves changes | ❌ No test infra | ⬜ pending |
| 01-03-03 | 01-03 | 3 | APP-03 | — | N/A | manual-only | Delete confirmation works | ❌ No test infra | ⬜ pending |
| 01-03-04 | 01-03 | 3 | APP-04 | — | N/A | manual-only | Search input filters list | ❌ No test infra | ⬜ pending |
| 01-03-05 | 01-03 | 3 | APP-05 | — | N/A | manual-only | Logo upload shows preview | ❌ No test infra | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `pnpm db:generate` — regenerate Prisma client after schema changes
- [ ] `pnpm dev` — verify dev server starts without errors
- [ ] Manual CRUD flow test — create → list → search → edit → delete

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Create application | APP-01 | No test framework | Open create dialog, fill name/code/description, submit |
| Edit application | APP-02 | No test framework | Open edit dialog, modify fields, save |
| Delete application | APP-03 | No test framework | Click delete, confirm in dialog, verify removed from list |
| Search applications | APP-04 | No test framework | Type in search input, verify filtered results |
| Upload logo | APP-05 | No test framework | Click upload, select image, verify preview displays |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < Ns
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

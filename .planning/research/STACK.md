# Stack Research

**Domain:** Application & Menu Management (CRUD + Tree UI)
**Researched:** 2026-05-20
**Confidence:** HIGH

## Context

This is a **brownfield** project. The core stack (Next.js 16, Hono, Prisma 7, shadcn/ui, Tailwind 4, better-auth) is already established and must NOT be changed. Research focuses only on libraries needed to add application/menu management features.

## Recommended Stack

### Core Technologies (Already Established — Do NOT Change)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Next.js | 16.2.6 | Frontend framework | Already installed |
| React | 19.2.4 | UI runtime | Already installed |
| Hono | 4.x | API framework | Already installed |
| Prisma | 7.8.0 | ORM | Already installed |
| PostgreSQL | — | Database | Already installed |
| shadcn/ui | 4.7.0 | Component library | Already installed |
| Tailwind CSS | 4.x | Styling | Already installed |
| better-auth | 1.6.10 | Auth + RBAC | Already installed |
| lucide-react | 1.14.0 | Icons | Already installed |

### New Libraries Required

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `shadcn-tree-view` | 1.2.1 (copy-paste) | Tree view component for menu tree | Radix-based, fits shadcn/ui ecosystem, native HTML5 DnD for simple reordering |
| `@dnd-kit/react` | 0.4.0 | Advanced drag-and-drop | Only if native DnD proves insufficient for cross-parent menu moves; React 19 native |

### No New Libraries Needed For

| Feature | Approach | Why No Extra Lib |
|---------|----------|-------------------|
| Icon picker | Custom component using `lucide-react` | Project already has 1000+ icons via lucide-react; build a searchable grid popover |
| App CRUD | Standard shadcn/ui forms + tables | Existing react-hook-form + zod + shadcn/ui covers this |
| Role-based visibility | better-auth RBAC | Already integrated, just extend permission checks |
| Form validation | Zod 4 + react-hook-form | Already installed |

## Installation

```bash
# Copy shadcn-tree-view component (copy-paste pattern, not npm)
npx shadcn add "https://mrlightful.com/registry/tree-view"

# ONLY if native HTML5 DnD proves insufficient for tree reordering:
# pnpm --filter @repo/service add @dnd-kit/react
# pnpm --filter @repo/admin add @dnd-kit/react
```

## Tree Component: Decision Analysis

### Option A (Recommended): shadcn-tree-view

**What:** Copy-paste tree component based on `@radix-ui/react-accordion`. Uses native HTML5 drag/drop API.

**Pros:**
- Fits the existing shadcn/ui copy-paste pattern
- Zero additional npm dependencies (uses Radix + Tailwind already in project)
- Simple API: `TreeView`, `TreeDataItem`, `onSelectChange`, `onDocumentDrag`
- Supports expand/collapse, selection, custom icons, action buttons, drag & drop
- Custom `renderItem` prop for full control over node rendering

**Cons:**
- No virtualized rendering (fine for menu trees < 500 nodes)
- Native HTML5 DnD is limited (no smooth animations, no drop indicators between nodes)
- Drag only supports parent-to-parent moves, not reordering within same level

**When to use:** Menu trees with < 200 items. Simple drag-drop requirements. Admin panels where UX polish on DnD is secondary.

### Option B: react-arborist 3.7.0

**What:** Full-featured tree component with built-in DnD, inline rename, virtualization. Uses `react-dnd` + `react-window` internally.

**Pros:**
- Complete tree management solution
- Virtualized rendering for large datasets
- Built-in DnD with drop indicators
- Inline rename, multi-select, keyboard nav

**Cons:**
- Heavy: pulls in `react-dnd`, `redux`, `react-window` as transitive dependencies
- `react-dnd` uses class component patterns — potential React 19 friction
- Overkill for admin menu management (menus are < 200 items)
- Styling requires more effort to match shadcn/ui

**When to use:** File explorers, large hierarchical datasets (> 1000 items), when inline editing is critical.

### Option C: Custom with @dnd-kit/react 0.4.0

**What:** Build tree DnD from scratch using the modern React 19-native DnD toolkit.

**Pros:**
- Best React 19 support (built for React 18/19)
- Lightweight, modular, no bloat
- Full control over UX

**Cons:**
- Significant implementation effort for tree DnD (drop zones, indentation, animations)
- No built-in tree component — must build tree structure yourself
- Overkill for admin panel use case

**When to use:** Custom design tools, drag-and-drop builders, when existing solutions don't fit.

### Recommendation

**Use shadcn-tree-view (Option A).** The menu tree is a bounded dataset (< 200 items per app). The existing shadcn/ui ecosystem means zero dependency conflicts. If DnD UX needs improvement later, enhance the native HTML5 DnD with custom drag overlays — no need to pull in a full DnD library.

## Icon Picker: Approach

Since `lucide-react` (1.16.0) is already installed with 1000+ icons, build a custom icon picker:

```tsx
// Pattern: Popover with searchable grid of lucide icons
import { Popover, PopoverContent, PopoverTrigger } from "@repo/admin/components/ui/popover";
import { Input } from "@repo/admin/components/ui/input";
import * as LucideIcons from "lucide-react";

// Component: IconPicker
// - Renders a button showing current icon
// - On click, opens popover with search input + icon grid
// - User types to filter (e.g., "home" → Home icon)
// - Grid shows matching icons as clickable buttons
// - Returns icon name string (e.g., "Home") for storage
```

**No npm library needed.** This is ~100 lines of code and leverages the existing icon set.

## Application Management: Approach

Standard CRUD with shadcn/ui components:

| UI Component | shadcn/ui Component | Purpose |
|--------------|---------------------|---------|
| App list | `DataTable` (TanStack Table wrapper) | Table with search, pagination |
| App form | `Form` (react-hook-form + zod) | Create/edit app (name, code, description, logo) |
| Status toggle | `Switch` | Enable/disable app |
| Confirm dialog | `AlertDialog` | Delete confirmation |

**No additional libraries needed.** The existing shadcn/ui + react-hook-form + zod stack covers all CRUD needs.

## Menu Management: Approach

| UI Pattern | Implementation | Purpose |
|------------|----------------|---------|
| Left panel | `shadcn-tree-view` TreeView | Hierarchical menu tree per app |
| Right panel | shadcn/ui Form | Edit selected menu item |
| DnD reorder | Native HTML5 drag/drop | Reorder siblings and move between parents |
| Icon picker | Custom component | Select lucide icon per menu item |
| Sort order | Hidden `order` field | Persist sort order to database |

## Database Schema: New Tables

```prisma
// Packages: Application management
model Application {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique  // e.g., "admin", "crm", "oa"
  description String?
  logo        String?  // icon name or URL
  enabled     Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  menus       Menu[]
}

model Menu {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  parentId      String?
  parent        Menu?    @relation("MenuTree", fields: [parentId], references: [id], onDelete: Cascade)
  children      Menu[]   @relation("MenuTree")
  name          String
  icon          String?  // lucide icon name
  code          String?  // maps to frontend route meta.code
  sortOrder     Int      @default(0)
  enabled       Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  roles         MenuRole[]
}

model MenuRole {
  id       String @id @default(cuid())
  menuId   String
  menu     Menu   @relation(fields: [menuId], references: [id], onDelete: Cascade)
  roleId   String // better-auth role ID
  @@unique([menuId, roleId])
}
```

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-arborist` | Heavy transitive deps (react-dnd, redux, react-window), overkill for < 200 items | `shadcn-tree-view` (copy-paste) |
| `@dnd-kit/core` (v6) | Old API, not React 19 native | `@dnd-kit/react` (v0.4) if needed, but likely not needed |
| `react-dnd` | Class component patterns, heavy, potential React 19 issues | Native HTML5 DnD or `@dnd-kit/react` |
| `react-beautiful-dnd` | Deprecated (Atlassian stopped maintenance) | `@dnd-kit/react` |
| `react-icons` | Adds 50K+ icons when lucide-react already has 1000+ | `lucide-react` (already installed) |
| `@heroicons/react` | Extra dependency when lucide-react exists | `lucide-react` |
| Full tree DnD library | Menu tree is bounded (< 200 items), native DnD is sufficient | Native HTML5 drag/drop events |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `shadcn-tree-view` (copy-paste) | shadcn/ui 4.x, Radix UI, Tailwind 4 | No npm install needed — copy source directly |
| `@dnd-kit/react` 0.4.0 | React ^18 \|\| ^19 | Only needed if native DnD is insufficient |
| `lucide-react` 1.16.0 | React 18/19 | Already installed, no changes needed |
| `react-hook-form` 7.75 | React 18/19 | Already installed, covers all form needs |
| `zod` 4.4.3 | — | Already installed, use for schema validation |

## Implementation Priority

1. **shadcn-tree-view** — Install first (copy-paste), enables menu tree UI immediately
2. **Icon picker** — Build after tree view works (custom component, ~100 lines)
3. **@dnd-kit/react** — Only install if native DnD proves insufficient (evaluate after Phase 2)

## Sources

- [shadcn-tree-view GitHub](https://github.com/mrlightful/shadcn-tree-view) — Radix-based tree with DnD, copy-paste install
- [react-arborist npm](https://www.npmjs.com/package/react-arborist) — Full tree component, v3.7.0, peer deps React >= 16.14
- [@dnd-kit/react npm](https://www.npmjs.com/package/@dnd-kit/react) — React 19-native DnD, v0.4.0
- [lucide-react](https://lucide.dev) — 1000+ icons, already in project
- Context7: `/jameskerr/react-arborist` — Tree component API, DnD features
- Context7: `/websites/dndkit` — Sortable patterns, React 19 support
- Context7: `/mrlightful/shadcn-tree-view` — Tree view API, custom rendering
- Context7: `/lucide-icons/lucide` — Installation, React 19 compatible

---

*Stack research for: Application & Menu Management*
*Researched: 2026-05-20*

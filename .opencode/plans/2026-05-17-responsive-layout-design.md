# Responsive Layout Design

## Overview

Add responsive design to the admin layout framework. The sidebar already has built-in mobile support via shadcn/ui (Sheet drawer on mobile, fixed sidebar on desktop), but lacks a trigger button. The header needs mobile adaptation.

## Current State

- `Frame` (`components/layout/frame.tsx`): flex column, fixed header height `3.5rem`, flexible main
- `Header` (`components/layout/header.tsx`): Always visible, `px-6`, no mobile adaptation
- `Sidebar` (`components/layout/sidebar.tsx`): shadcn `Sidebar` with `collapsible="none"`, built-in mobile Sheet support but no visible trigger
- `(logged)/layout.tsx`: `SidebarProvider` + `AppSidebar` + `SidebarInset`

## Design

### Breakpoint Strategy

- `< 768px` (below `md`): Mobile layout — hamburger menu + drawer sidebar
- `>= 768px` (`md` and above): Desktop layout — fixed sidebar

### Changes

#### 1. Header (`components/layout/header.tsx`)

- Mobile (`<md`): Add hamburger button (`SidebarTrigger`) on the left side to open the sidebar drawer
- Desktop (`md+`): Hide hamburger button, keep current layout
- Reduce mobile padding from `px-6` to `px-4`

Implementation:
```tsx
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

// In the header:
// - Mobile: show SidebarTrigger before app name
// - Desktop: hide SidebarTrigger
// - Adjust padding responsively
```

#### 2. Frame (`components/layout/frame.tsx`)

- No structural changes needed. The existing flex column layout works at all breakpoints.
- The header and main content area already handle their own responsive behavior.

#### 3. Sidebar (`components/layout/sidebar.tsx`)

- No changes needed. shadcn's `Sidebar` component automatically:
  - Renders as a fixed sidebar on desktop (`md+`)
  - Renders inside a `Sheet` (slide-out drawer) on mobile (`<md`)
  - Uses the `useIsMobile()` hook internally

#### 4. (logged)/layout.tsx

- No changes needed. `SidebarProvider` already passes mobile context to children.

### Files to Modify

| File | Change |
|------|--------|
| `apps/admin/src/components/layout/header.tsx` | Add `SidebarTrigger` for mobile, responsive padding |

### Files Unchanged

| File | Reason |
|------|--------|
| `apps/admin/src/components/layout/frame.tsx` | Structure already works at all breakpoints |
| `apps/admin/src/components/layout/sidebar.tsx` | shadcn handles mobile/desktop switching |
| `apps/admin/src/app/(logged)/layout.tsx` | SidebarProvider already provides mobile context |
| `apps/admin/src/components/ui/sidebar.tsx` | shadcn primitive, already responsive |

## Testing

- Resize browser window below and above 768px
- Verify hamburger button appears on mobile, hidden on desktop
- Verify clicking hamburger opens sidebar as a Sheet drawer on mobile
- Verify sidebar renders as fixed panel on desktop
- Verify all existing pages (Dashboard, Users, Organizations, Settings) work correctly at both breakpoints

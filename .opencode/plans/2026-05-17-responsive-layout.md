# Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add responsive design to the admin layout framework with a hamburger menu for mobile sidebar access.

**Architecture:** The sidebar already has built-in mobile support via shadcn/ui (Sheet drawer on mobile, fixed sidebar on desktop). The only change needed is adding a `SidebarTrigger` hamburger button to the Header component that is visible only on mobile (< 768px).

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui v4, lucide-react

---

### Task 1: Add mobile hamburger button to Header

**Files:**
- Modify: `apps/admin/src/components/layout/header.tsx`

- [ ] **Step 1: Read current header implementation**

Read `apps/admin/src/components/layout/header.tsx` to understand current structure:
- Client component with `useAppName` hook
- Renders header with app name on left, locale/theme on right
- Uses `px-6` padding, `flex items-center` layout

- [ ] **Step 2: Update header with SidebarTrigger**

Replace the content of `apps/admin/src/components/layout/header.tsx`:

```tsx
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAppName } from "@/hooks/use-app-name";

export function Header({ className }: { className?: string }) {
  const { appName } = useAppName();

  return (
    <header
      className={`${className} flex items-center border-b bg-background px-4 md:px-6`}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <span className="text-lg font-semibold">{appName}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
```

Key changes:
1. Import `SidebarTrigger` from `@/components/ui/sidebar`
2. Add `SidebarTrigger` with `className="md:hidden"` — visible only below 768px
3. Wrap app name and trigger in a `div` with `flex items-center gap-2` for proper alignment
4. Change `px-6` to `px-4 md:px-6` — smaller padding on mobile, standard on desktop

- [ ] **Step 3: Verify SidebarTrigger is properly exported**

Check that `SidebarTrigger` is exported from `apps/admin/src/components/ui/sidebar.tsx` (line 721).

- [ ] **Step 4: Test responsive behavior**

1. Run `pnpm dev` to start the development server
2. Open browser and navigate to a logged-in page (e.g., `/dashboard`)
3. Resize browser window below 768px — verify:
   - Hamburger button (PanelLeftIcon) appears on the left
   - Clicking it opens the sidebar as a Sheet drawer
   - Closing the drawer works
4. Resize browser window above 768px — verify:
   - Hamburger button is hidden
   - Sidebar renders as fixed panel on the left
   - All existing functionality works

- [ ] **Step 5: Commit changes**

```bash
git add apps/admin/src/components/layout/header.tsx
git commit -m "feat: add responsive hamburger menu for mobile sidebar"
```

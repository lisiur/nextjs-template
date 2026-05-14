# Dark/Light Theme Switcher

## Context
The app has CSS variables for dark mode already defined in `globals.css` (`.dark` class) but no mechanism to switch themes or persist user preference.

## Goal
Add a dark/light theme toggle in the layout header that follows system preference by default and allows manual override.

## Approach
Use `next-themes` library — battle-tested, handles FOUC, SSR, and localStorage persistence.

## Changes

1. **Install `next-themes`** via pnpm
2. **`app/layout.tsx`** — Wrap in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`
3. **`components/layout/header.tsx`** (new) — Header bar with site title + theme toggle
4. **`components/ui/theme-toggle.tsx`** (new) — Toggle button using `useTheme()` from next-themes, Sun/Moon icons from lucide-react

## Key decisions
- `attribute="class"` matches existing `.dark` CSS variable setup
- `defaultTheme="system"` respects OS preference
- Header is sticky, minimal flex layout with border

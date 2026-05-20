# Coding Conventions

**Analysis Date:** 2026-05-20

## Naming Patterns

**Files:**
- React components: PascalCase (`organization-table.tsx`, `config-group.tsx`)
- Non-component files: kebab-case (`system-config-store.ts`, `app-client.ts`)
- Route files: camelCase with action prefix (`batchUpsertConfigs.ts`, `listConfigsByGroup.ts`)
- Schema files: `schema.ts` in each route directory
- Repository files: `<entity>.repository.ts` (`system-config.repository.ts`)

**Functions:**
- React components: PascalCase (`OrganizationTable`, `ConfigGroup`)
- Handler functions: camelCase (`fetchOrganizations`, `handleSave`)
- Repository methods: camelCase (`findByGroup`, `batchUpsert`)
- Route handlers: camelCase (`listConfigsByGroup`)

**Variables:**
- State variables: camelCase (`organizations`, `loading`, `page`)
- Interfaces: PascalCase (`Organization`, `ConfigItem`, `UpsertConfigBody`)
- Schema constants: camelCase with `Schema` suffix (`systemConfigItemSchema`, `errorSchema`)
- Store hooks: `use` prefix with camelCase (`useSystemConfigStore`)

**Types:**
- Interfaces: PascalCase (`Organization`, `ConfigGroupProps`)
- Type exports: `type` keyword for TypeScript types (`type AuthType`)
- Zod schema types: `z.infer<typeof schema>` pattern

## Code Style

**Formatting:**
- Tool: Biome (version 2.2.0)
- Indent: 2 spaces
- Line length: No explicit limit enforced
- Semicolons: Required
- Single quotes: Used for strings
- Trailing commas: Required (Biome default)

**Linting:**
- Tool: Biome
- Rules: Recommended + Next.js + React domains
- Disabled: `noUnknownAtRules` (for Tailwind directives), `noLabelWithoutControl`
- Overrides: UI components in `apps/admin/src/components/ui/**` have `useSemanticElements` disabled

## Import Organization

**Order:**
1. External packages (`react`, `next`, `hono`, `zod`, etc.)
2. Internal packages (`@repo/service`, `@repo/shared`)
3. Relative imports (`./`, `../`)

**Path Aliases:**
- `@/` → `apps/admin/src/` (Next.js alias)
- Workspace packages: `@repo/service`, `@repo/shared`

**Patterns:**
```typescript
// External
import { useTranslations } from "next-intl";
import { toast } from "sonner";

// Internal
import { Button } from "@/components/ui/button";
import { appClient } from "@/lib/api";

// Relative
import { OrganizationDialog } from "./organization-dialog";
```

## Error Handling

**Frontend (React):**
- Use `try/catch` blocks around async operations
- Display errors via `toast.error()` from `sonner`
- Silent catch blocks for client-side error handling (`catch { // Error handled by client }`)
- Loading states with `finally` blocks

**Backend (Hono):**
- Use `HTTPException` from `hono/http-exception` for HTTP errors
- Define error responses in OpenAPI schemas (`errorSchema`)
- Throw errors in middleware for authentication/authorization

**Pattern:**
```typescript
// Frontend
try {
  const res = await appClient.api.organizations.$get({ query: { limit: 10 } });
  if (res.ok) {
    const data = await res.json();
    setOrganizations(data.organizations);
  }
} catch {
  toast.error(t("fetchFailed"));
} finally {
  setLoading(false);
}

// Backend
if (!session?.user || session.user.role !== "admin") {
  throw new HTTPException(401, { message: "Admin access required" });
}
```

## Logging

**Framework:** `hono/logger` middleware + `console.log`

**Patterns:**
- Server startup: `console.log(\`Server running on http://localhost:${info.port}\`)`
- Request logging: Automatic via `hono/logger` middleware
- Error logging: Via toast notifications on frontend
- No structured logging or log levels

## Comments

**When to Comment:**
- Comment out error handling: `// Error handled by client`
- Cache TTL explanation: `// 5 minutes`
- No JSDoc or TSDoc patterns observed

**JSDoc/TSDoc:**
- Not used in the codebase
- Types are defined via interfaces and Zod schemas

## Function Design

**Size:**
- Components: 50-250 lines (observed: 18-243 lines)
- Handler functions: 10-30 lines
- Repository methods: 5-15 lines

**Parameters:**
- Use interfaces for complex parameters
- Destructure parameters in function signatures
- Use Zod schemas for validation

**Return Values:**
- Return promises for async functions
- Return JSX for React components
- Use `c.json(data, statusCode)` for Hono handlers

## Module Design

**Exports:**
- Named exports for components and utilities
- Default exports for Next.js page components
- Re-export patterns: `export * from "./api"` in barrel files

**Barrel Files:**
- Used for API clients (`apps/admin/src/lib/api/index.ts`)
- Not used for route files (direct imports preferred)

## State Management

**Frontend:**
- Local state: `useState` for component-specific state
- Global state: Zustand stores (`useSystemConfigStore`)
- Form state: React Hook Form with Zod resolver

**Backend:**
- Cache: In-memory `Map` with TTL (`configCache`)
- Database: Prisma client singleton

## Component Patterns

**Client Components:**
- Mark with `"use client"` directive at top of file
- Use for interactive components with state/effects

**Server Components:**
- Default in Next.js App Router
- Used for page layouts and static content

**Component Structure:**
```typescript
"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ComponentProps {
  // Props definition
}

export function Component({ prop }: ComponentProps) {
  const t = useTranslations("Namespace");
  // State, effects, handlers
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

## API Client Patterns

**Hono RPC Client:**
- Import from `@/lib/api`
- Use bracket notation for dynamic segments: `appClient.api.organizations[":id"].$put()`
- Use dot notation for static segments: `appClient.api.system-config.batch.$put()`
- Always check `res.ok` before calling `res.json()`

**Pattern:**
```typescript
import { appClient } from "@/lib/api";

const res = await appClient.api.organizations.$get({
  query: { limit: 10, offset: 0 },
});

if (res.ok) {
  const data = await res.json();
  // Process data
}
```

---

*Convention analysis: 2026-05-20*

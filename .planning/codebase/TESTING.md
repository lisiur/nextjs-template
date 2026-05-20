# Testing Patterns

**Analysis Date:** 2026-05-20

## Test Framework

**Runner:**
- Not detected (no test framework configured)
- Config: None

**Assertion Library:**
- Not detected

**Run Commands:**
```bash
# No test commands configured
# Current scripts in package.json:
pnpm dev              # Development server
pnpm build            # Build all apps
pnpm lint             # Biome linting
pnpm format           # Biome formatting
```

## Test File Organization

**Location:**
- No test files found in project source code
- Only test files in `node_modules/` (zod library tests)

**Naming:**
- Not applicable (no tests exist)

**Structure:**
```
Not applicable - no test infrastructure exists
```

## Test Structure

**Suite Organization:**
```typescript
// No test patterns to show - project has no tests
```

**Patterns:**
- Not applicable

## Mocking

**Framework:** None

**Patterns:**
```typescript
// No mocking patterns - project has no tests
```

**What to Mock:**
- Database calls (Prisma client)
- External API calls (Hono RPC client)
- Authentication sessions
- File system operations

**What NOT to Mock:**
- Pure utility functions
- Zod schema validation
- Simple React components

## Fixtures and Factories

**Test Data:**
```typescript
// No test fixtures - project has no tests
```

**Location:**
- Not applicable

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# No coverage tool configured
```

## Test Types

**Unit Tests:**
- Scope: Not implemented
- Approach: Not applicable

**Integration Tests:**
- Scope: Not implemented
- Approach: Not applicable

**E2E Tests:**
- Framework: Not used

## Common Patterns

**Async Testing:**
```typescript
// No async test patterns - project has no tests
```

**Error Testing:**
```typescript
// No error test patterns - project has no tests
```

## Recommended Testing Setup

**For Frontend (apps/admin):**
```bash
# Add to apps/admin/package.json
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**For Backend (packages/service):**
```bash
# Add to packages/service/package.json
pnpm add -D vitest @types/node
```

**Vitest Configuration:**
```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

**Test File Placement:**
- Co-located with source files: `*.test.ts` or `*.test.tsx`
- Example: `apps/admin/src/app/(logged)/organizations/components/organization-table.test.tsx`

**Sample Test Pattern:**
```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { OrganizationTable } from "./organization-table";

// Mock the API client
vi.mock("@/lib/api", () => ({
  appClient: {
    api: {
      organizations: {
        $get: vi.fn(),
      },
    },
  },
}));

describe("OrganizationTable", () => {
  it("renders loading state initially", () => {
    render(<OrganizationTable />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders organizations after fetch", async () => {
    const mockOrgs = [
      { id: "1", name: "Test Org", slug: "test-org", createdAt: "2024-01-01" },
    ];
    
    vi.mocked(appClient.api.organizations.$get).mockResolvedValue({
      ok: true,
      json: async () => ({ organizations: mockOrgs, total: 1 }),
    } as Response);

    render(<OrganizationTable />);
    
    await waitFor(() => {
      expect(screen.getByText("Test Org")).toBeInTheDocument();
    });
  });
});
```

## Missing Test Coverage

**Critical Areas Needing Tests:**
1. API route handlers (`packages/service/src/routes/`)
2. Repository methods (`packages/service/src/repositories/`)
3. React components (`apps/admin/src/app/`)
4. Zustand stores (`apps/admin/src/stores/`)
5. Utility functions (`apps/admin/src/utils/`)

**Priority Order:**
1. Authentication middleware
2. CRUD operations for organizations
3. System configuration management
4. Form validation logic
5. UI component interactions

---

*Testing analysis: 2026-05-20*

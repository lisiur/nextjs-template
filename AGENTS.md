# Monorepo Workspace

pnpm monorepo. See `apps/admin/AGENTS.md` for Next.js-specific rules.

## Structure
- `apps/admin` — Next.js 16 app (React 19, Tailwind 4, shadcn/ui)
- `packages/service` — Hono API server (OpenAPI/Zod, Scalar docs) with Prisma 7 + PostgreSQL. Can run standalone on port 3001 or be consumed as a Next.js API route via `hono/vercel`
- `packages/shared` — Shared utilities (currently empty)

## Key Commands
```bash
pnpm dev              # Runs all apps (web on 3000, service on 3001)
pnpm build            # Builds all apps
pnpm lint             # biome check . (Biome, not ESLint)
pnpm lint:fix         # biome check --write --unsafe .
pnpm format           # biome format --write .
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to SQLite
pnpm db:migrate       # Run Prisma migrations
```

## Architecture Notes
- The API layer (`@repo/service`) is wired into Next.js at `apps/admin/src/app/api/[[...route]]/route.ts` using `hono/vercel`. The service can also run independently (`pnpm --filter @repo/service dev`).
- Hono RPC client is used for type-safe API calls: `hc<AppType>("/api")` in `apps/admin/src/lib/api/index.ts`.
- Prisma client is a global singleton (dev hot-reload safe). Import from `@repo/service`, not directly.
- Linter is **Biome** (`biome.json`), not ESLint. Uses spaces (indent width 2). Generated code in `**/prisma/generated` is excluded.
- No tests, no CI workflows configured yet.

## Zod 4 Deprecations
The project uses Zod 4 (`^4.4.3`). String format validators on `ZodString` are deprecated. Use standalone validators instead:

| Deprecated (Zod 3 style)        | Correct (Zod 4)          |
|---------------------------------|--------------------------|
| `z.string().email("msg")`       | `z.email("msg")`         |
| `z.string().url("msg")`         | `z.url("msg")`           |
| `z.string().uuid("msg")`        | `z.uuid("msg")`          |
| `z.string().cuid("msg")`        | `z.cuid("msg")`          |
| `z.string().ulid("msg")`        | `z.ulid("msg")`          |
| `z.string().nanoid("msg")`      | `z.nanoid("msg")`        |

## References
- [Hono llms.txt](https://hono.dev/llms.txt) — index of all Hono docs (middleware, helpers, getting-started, API reference). Use this to find the right guide before writing Hono code.

## Defining Routes (Zod OpenAPI Hono)

Use `defineOpenAPIRoute` + `openapiRoutes` pattern. Each API endpoint lives in its own file.

### File structure per resource

```
packages/service/src/routes/<resource>/
├── index.ts                 ← OpenAPIHono + middleware + openapiRoutes
├── schema.ts                ← Zod schemas (import z from "@hono/zod-openapi")
├── <action><Resource>.ts    ← one file per endpoint (defineOpenAPIRoute)
```

### 1. Schema file (`schema.ts`)

Import `z` from `"@hono/zod-openapi"` (not `"zod"`). Add `.openapi()` metadata to every field. Register response schemas as named components.

```ts
import { z } from "@hono/zod-openapi";

export const itemSchema = z
  .object({
    id: z.string().openapi({ example: "clx1234567890" }),
    name: z.string().openapi({ example: "foo" }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .openapi("Item"); // registers as #/components/schemas/Item

export const errorSchema = z
  .object({
    code: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: "Bad Request" }),
  })
  .openapi("Error");

// Route-specific schemas: params, query, body
export const getItemParamSchema = z.object({
  id: z.string().min(1).openapi({ example: "clx1234567890" }),
});
```

### 2. Endpoint file (`<action><Resource>.ts`)

Use `defineOpenAPIRoute` to bundle route definition + handler. Export the result.

```ts
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { itemSchema, errorSchema, getItemParamSchema } from "./schema";

export const getItem = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Item"],
    summary: "Get an item",
    request: {
      params: getItemParamSchema,
    },
    responses: {
      200: {
        content: { "application/json": { schema: itemSchema } },
        description: "The item",
      },
      401: {
        content: { "application/json": { schema: errorSchema } },
        description: "Unauthorized",
      },
    },
  }),
  handler: async (c) => {
    const { id } = c.req.valid("param");  // typed via Zod
    const item = await repository.findById(id);
    return c.json(item, 200);             // MUST pass status code
  },
});
```

**Rules:**
- Use `c.req.valid("param")`, `c.req.valid("query")`, `c.req.valid("json")` — never `c.req.param()` / `c.req.json()`
- Always pass the status code to `c.json(data, 200)`
- Define error responses (401, 400, 404) with `errorSchema`
- Keep path params in OpenAPI `{param}` syntax in `createRoute`

### 3. Index file (`index.ts`)

Create the `OpenAPIHono` instance, apply middleware, register routes via `openapiRoutes`. **Export the return value of `openapiRoutes()`** — not the original instance — to preserve type info.

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../lib/auth";
import { getItem } from "./getItem";
import { listItems } from "./listItems";

const app = new OpenAPIHono();

// Middleware (applied before all routes in this sub-app)
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});

// Register routes — export the result, not the original `app`
const routes = app.openapiRoutes([getItem, listItems] as const);

export { routes as itemRoutes };
```

**Critical:** `export { routes as itemRoutes }` — the `as const` on the array and the re-export of `routes` (not `app`) are required for Hono RPC type inference to work.

### 4. Mount in parent (`routes/index.ts`)

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { itemRoutes } from "./item";

const routes = new OpenAPIHono()
  .route("/item", itemRoutes);

export { routes };
```
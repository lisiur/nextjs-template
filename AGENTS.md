# Monorepo Workspace

pnpm monorepo. See `apps/web/AGENTS.md` for Next.js-specific rules.

## Structure
- `apps/web` — Next.js 16 app (React 19, Tailwind 4, shadcn/ui)
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
- The API layer (`@repo/service`) is wired into Next.js at `apps/web/src/app/api/[[...route]]/route.ts` using `hono/vercel`. The service can also run independently (`pnpm --filter @repo/service dev`).
- Hono RPC client is used for type-safe API calls: `hc<AppType>("/api")` in `apps/web/src/lib/api/index.ts`.
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
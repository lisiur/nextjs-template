# Monorepo Instructions

## Workspace
- pnpm workspace: `apps/*` and `packages/*` from `pnpm-workspace.yaml`.
- `apps/admin`: Next.js 16.2.6 admin UI. Rules in `apps/admin/AGENTS.md`.
- `apps/organization`: Organization portal. Rules in `apps/organization/AGENTS.md`.
- `packages/service`: Hono API with Prisma 7, PostgreSQL. Rules in `packages/service/AGENTS.md`.
- `packages/shared`: shared permissions/types consumed by app and service.

## Commands
- Install/run with pnpm. Root `pnpm dev` runs only apps (`pnpm --filter './apps/*' dev`) with `NODE_OPTIONS='--max-old-space-size=8192'`; the service is consumed by Next under `/api`.
- Build apps: `pnpm build`.
- Lint/format: `pnpm lint` (`biome check .`), `pnpm lint:fix` (`biome check --write --unsafe .`), `pnpm format`.
- Prisma: `pnpm db:generate`, `pnpm db:push`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:reset` all forward to `@repo/service`.

## Tooling
- Biome is the linter/formatter, not ESLint. 2-space indentation, recommended Next/React domains.
- Zod 4 is installed. Prefer `z.email()` / `z.url()` over `z.string().email()`.

## Workflow
- Before repo edits, start through the GSD workflow unless the user explicitly bypasses it: `/gsd-quick` for small tasks, `/gsd-debug` for bugs, `/gsd-execute-phase` for planned phase work.

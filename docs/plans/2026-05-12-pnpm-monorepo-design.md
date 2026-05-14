# PNPM Monorepo Transformation Design

## Overview

Transform the existing Next.js application into a pnpm monorepo to support multiple applications (Next.js web app + Hono REST API) with shared code.

## Goals

1. Support multiple applications (web + API)
2. Share database layer (Prisma, repositories, services)
3. Maintain clear separation of concerns
4. Enable independent deployment of apps

## Proposed Structure

```
next101/
├── apps/
│   ├── web/                    # Next.js application
│   │   ├── app/
│   │   ├── components/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   └── api/                    # Hono REST API
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── database/               # Shared database layer
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── repositories/
│   │   │   └── services/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/                 # Shared utilities and types
│       ├── src/
│       │   ├── types/
│       │   └── utils/
│       ├── package.json
│       └── tsconfig.json
├── pnpm-workspace.yaml
├── package.json                # Root package.json
└── tsconfig.json               # Root tsconfig.json
```

## Package Configuration

### Root package.json

```json
{
  "name": "next101",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter './apps/*' dev",
    "build": "pnpm --filter './apps/*' build",
    "lint": "pnpm --filter './apps/*' lint",
    "db:generate": "pnpm --filter @next101/database generate",
    "db:push": "pnpm --filter @next101/database push",
    "db:migrate": "pnpm --filter @next101/database migrate"
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver
```

### apps/web/package.json

```json
{
  "name": "@next101/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check"
  },
  "dependencies": {
    "@next101/database": "workspace:*",
    "@next101/shared": "workspace:*",
    "next": "16.2.6",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  }
}
```

### apps/api/package.json

```json
{
  "name": "@next101/api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "biome check"
  },
  "dependencies": {
    "@next101/database": "workspace:*",
    "@next101/shared": "workspace:*",
    "hono": "^4.0.0",
    "@hono/node-server": "^1.0.0"
  }
}
```

### packages/database/package.json

```json
{
  "name": "@next101/database",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "generate": "prisma generate",
    "push": "prisma db push",
    "migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "^7.8.0",
    "@libsql/client": "^0.17.3",
    "@prisma/adapter-libsql": "^7.8.0"
  },
  "devDependencies": {
    "prisma": "^7.8.0"
  }
}
```

### packages/shared/package.json

```json
{
  "name": "@next101/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.6.0"
  }
}
```

## File Movements

### To packages/database/

- `prisma/schema.prisma` → `packages/database/prisma/schema.prisma`
- `prisma/migrations/` → `packages/database/prisma/migrations/`
- `prisma/generated/` → `packages/database/prisma/generated/`
- `lib/prisma.ts` → `packages/database/src/client.ts`
- `repositories/` → `packages/database/src/repositories/`
- `services/` → `packages/database/src/services/`
- `prisma.config.ts` → `packages/database/prisma.config.ts`

### To packages/shared/

- `lib/utils.ts` → `packages/shared/src/utils.ts`
- `lib/errors.ts` → `packages/shared/src/errors.ts`

### To apps/web/

- `app/` → `apps/web/app/`
- `components/` → `apps/web/components/`
- `public/` → `apps/web/public/`
- `next.config.ts` → `apps/web/next.config.ts`
- `postcss.config.mjs` → `apps/web/postcss.config.mjs`
- `components.json` → `apps/web/components.json`
- `biome.json` → `apps/web/biome.json`

## Import Path Updates

### In apps/web/

```typescript
// Before
import { prisma } from '@/lib/prisma'
import { cn } from '@/lib/utils'

// After
import { prisma } from '@next101/database'
import { cn } from '@next101/shared'
```

### In apps/api/

```typescript
import { prisma } from '@next101/database'
import { UserService } from '@next101/database'
```

## Environment Variables

### apps/web/.env

```env
DATABASE_URL="file:../dev.db"
```

### apps/api/.env

```env
DATABASE_URL="file:../../dev.db"
```

## Development Workflow

1. Install dependencies: `pnpm install`
2. Generate Prisma client: `pnpm db:generate`
3. Start web app: `cd apps/web && pnpm dev`
4. Start API server: `cd apps/api && pnpm dev`

## Benefits

1. **Independent deployment** - Deploy web and API separately
2. **Shared database** - Single source of truth for data layer
3. **Code reuse** - Share utilities and types
4. **Better organization** - Clear boundaries between apps
5. **Scalability** - Easy to add new apps or packages

## Next Steps

1. Create directory structure
2. Move files to appropriate locations
3. Update package.json files
4. Update import paths
5. Test both applications
6. Update CI/CD pipelines if needed
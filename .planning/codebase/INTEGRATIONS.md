# External Integrations

**Analysis Date:** 2026-05-20

## APIs & External Services

**WeChat OAuth (Social Login):**
- WeChat OAuth 2.0 for social authentication
  - SDK/Client: `better-auth` social provider
  - Auth: `WECHAT_CLIENT_ID`, `WECHAT_CLIENT_SECRET` env vars
  - Config: `packages/service/src/lib/auth.ts` (conditional on env var presence)
  - Language: Chinese (`lang: "cn"`)

## Data Storage

**Databases:**
- PostgreSQL
  - Connection: `DATABASE_URL` env var
  - Client: Prisma 7 with `@prisma/adapter-pg`
  - Schema: `packages/service/prisma/schema.prisma`
  - Generated client: `packages/service/prisma/generated/prisma/`
  - Singleton: `packages/service/src/lib/db.ts`

**Models:**
- `User` — User accounts with roles, bans
- `Session` — Active sessions (token-based)
- `Account` — OAuth/password accounts
- `Verification` — Email verification tokens
- `Organization` — Multi-tenant organizations
- `Member` — Organization membership
- `Invitation` — Pending invitations
- `SystemConfig` — Key-value configuration store
- `Upload` — File upload metadata

**File Storage:**
- Local filesystem only (no cloud storage)
  - Path: `uploads/` directory (relative to service working root)
  - Structure: `uploads/{public|private}/{shard1}/{shard2}/{hash}.{ext}`
  - Shard path: First two characters of SHA-256 hash
  - Max file size: 5MB
  - Allowed types: JPEG, PNG, GIF, WebP, PDF

**Caching:**
- In-memory cache for SystemConfig (5-minute TTL)
  - Implementation: `packages/service/src/lib/config-cache.ts`
  - Store: `Map<string, { data, expiresAt }>`
  - Manual invalidation required after writes

## Authentication & Identity

**Auth Provider:**
- `better-auth` ^1.6.10 — Self-hosted auth solution
  - Server config: `packages/service/src/lib/auth.ts`
  - Client config: `apps/admin/src/lib/api/auth-client.ts`

**Auth Methods:**
- Email/password login (enabled, min 1 char)
- WeChat OAuth (conditional on env vars)

**Session Management:**
- Token-based sessions (stored in database)
- Session model: `packages/service/prisma/schema.prisma`

**Role-Based Access Control (RBAC):**
- Roles defined: `admin`, `manager`, `user`
- Permissions: `user`, `session`, `project`, `config`
- Access control: `packages/shared/src/permissions.ts`
- Role assignments:
  - `admin`: Full access (CRUD on all resources)
  - `manager`: User list/set-role, session list, project CRUD (no delete), config read
  - `user`: Project read only, config read only

**Organization Support:**
- Multi-tenant organizations via `better-auth` organization plugin
- Members and invitations managed

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Hono logger middleware (`packages/service/src/app.ts`)
- Console.log for server startup

## CI/CD & Deployment

**Hosting:**
- Vercel (Next.js app)
- Service can run standalone on port 3001 (`packages/service/src/server.ts`)

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` — PostgreSQL connection string (Prisma)
- `BETTER_AUTH_SECRET` — Auth secret key
- `WECHAT_CLIENT_ID` — WeChat OAuth client ID (optional)
- `WECHAT_CLIENT_SECRET` — WeChat OAuth client secret (optional)
- `PORT` — Server port for standalone mode (default: 3001)
- `UPLOAD_SIGN_SECRET` — File upload signing secret (optional, falls back to `BETTER_AUTH_SECRET`)

**Optional env vars:**
- `NODE_ENV` — Controls Prisma singleton behavior

**Secrets location:**
- `.env` file at project root (not committed to git)

## Webhooks & Callbacks

**Incoming:**
- WeChat OAuth callback: Handled by `better-auth` at `/api/auth/callback/wechat`

**Outgoing:**
- None detected

## File Upload Security

**Signing Mechanism:**
- HMAC-SHA256 signed URLs for private file access
- Expiry: 1 hour (3,600,000 ms)
- Signature: `HMAC-SHA256({UPLOAD_SIGN_SECRET}, "{id}:{expires}")`
- Implementation: `packages/service/src/routes/upload/signFile.ts`
- Verification: `packages/service/src/routes/upload/getFile.ts`

**Access Control:**
- Public files: Direct access, `Cache-Control: public, max-age=31536000`
- Private files: Signed URL required, `Cache-Control: private, no-store`
- Signers: File owner or admin role only

## System Configuration

**Key-Value Store:**
- `SystemConfig` model in database
- Groups: `general`, `auth`, `smtp` (seeded)
- Secrets: `isSecret` flag prevents values from being exposed in API responses
- Cache: In-memory with 5-minute TTL (`packages/service/src/lib/config-cache.ts`)
- Frontend: Zustand store (`apps/admin/src/stores/system-config-store.ts`)

**Seeded Configs:**
- `general`: site.name, site.url, site.description
- `auth`: registration.enabled, session.maxAge
- `smtp`: host, port, user, password, from

## Internationalization

**i18n Setup:**
- Library: `next-intl` ^4.12.0
- Locale detection: Cookie-based (`locale` cookie)
- Messages: `apps/admin/messages/{locale}.json` (en, zh)
- Config: `apps/admin/src/i18n/request.ts`

---

*Integration audit: 2026-05-20*

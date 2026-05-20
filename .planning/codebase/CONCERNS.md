# Codebase Concerns

**Analysis Date:** 2026-05-20

## Tech Debt

**Weak Password Policy:**
- Issue: `minPasswordLength` is set to `1` in `betterAuth` configuration, allowing single-character passwords
- Files: `packages/service/src/lib/auth.ts:13`
- Impact: Extremely weak security posture; users can set trivially guessable passwords
- Fix approach: Increase `minPasswordLength` to at least 8 characters. Consider adding password complexity requirements (uppercase, number, special character) via better-auth's password configuration options

**Base64 Logo Storage:**
- Issue: Organization logos are stored as base64 data URLs directly in the database `logo` column, not using the existing upload system
- Files: `apps/admin/src/app/(logged)/organizations/components/organization-dialog.tsx:93-95`, `packages/service/src/routes/organization/schema.ts:30`
- Impact: Bloats database with large base64 strings; no image optimization; inconsistent with how other file uploads work (upload system exists but isn't used here)
- Fix approach: Migrate logo uploads to use the existing upload system (`/api/upload`). The organization `logo` field should store the upload ID or URL returned by the upload endpoint, not the raw data URL

**Hardcoded Permissions in Frontend:**
- Issue: `role-table.tsx` hardcodes role permissions on the frontend instead of deriving them from the shared `@repo/shared` permissions module
- Files: `apps/admin/src/app/(logged)/roles/components/role-table.tsx:26-71`, `packages/shared/src/permissions.ts:4-30`
- Impact: Permissions can drift between backend definitions and frontend display; any permission change requires editing two places
- Fix approach: Import `admin`, `manager`, `user` roles from `@repo/shared` and derive the permission display from those objects, or expose them via an API endpoint

**No Frontend Route Protection:**
- Issue: No Next.js middleware exists to protect authenticated routes; the `(logged)` route group has no auth guard
- Files: No middleware file exists in `apps/admin/` directory
- Impact: Unauthenticated users can access admin pages (dashboard, users, organizations, settings) — the UI renders but API calls fail. This creates a poor UX and exposes the admin UI structure
- Fix approach: Add `apps/admin/src/middleware.ts` that checks for the auth session cookie and redirects unauthenticated users to `/login`

**In-Memory Config Cache:**
- Issue: `configCache` uses a simple `Map` with TTL-based expiration, which is per-process and lost on restart
- Files: `packages/service/src/lib/config-cache.ts:3-26`
- Impact: Cache is useless in multi-instance deployments; data loss on restart causes cold-start database hammering; no cache warming strategy
- Fix approach: For single-instance: acceptable short-term. For production: replace with Redis-backed cache or use Prisma's built-in caching. At minimum, add a startup cache warm-up call

## Known Bugs

**Swagger Docs Endpoint Mismatch:**
- Symptoms: The Scalar API docs page (`/api/docs`) references two schema sources, but the auth OpenAPI schema endpoint may not be properly registered
- Files: `packages/service/src/app.ts:16-22`
- Trigger: Navigate to `/api/docs` and notice the "Authentication" source may fail to load
- Workaround: None; verify the auth openapi endpoint works in production

**Organization Table Empty State Inconsistency:**
- Symptoms: When organizations list is empty, the "Add Org" button appears but the table layout differs from the populated state (no table headers rendered)
- Files: `apps/admin/src/app/(logged)/organizations/components/organization-table.tsx:93-113`
- Trigger: Create a fresh database with no organizations
- Workaround: None — cosmetic issue only

## Security Considerations

**Open Registration Without Restrictions:**
- Risk: Anyone can create an account via `/register` with no email verification, CAPTCHA, or invite-only restriction
- Files: `apps/admin/src/app/register/page.tsx`, `packages/service/src/lib/auth.ts`
- Current mitigation: None — registration is fully open
- Recommendations: Add email verification via better-auth's `emailAndPassword.emailVerification` option. For admin panels, consider disabling self-registration entirely and requiring admin-invite flow

**Unrestricted CORS:**
- Risk: CORS middleware is enabled with no origin restrictions, allowing any domain to make authenticated requests
- Files: `packages/service/src/app.ts:10`
- Current mitigation: `cors()` is called without options — defaults to `*` origin
- Recommendations: Configure CORS with explicit allowed origins: `cors({ origin: ['https://your-domain.com'] })`. In development, use environment variable for the origin list

**Hardcoded Signing Secret Fallback:**
- Risk: File signing uses `"upload-sign-default"` as fallback when `UPLOAD_SIGN_SECRET` and `BETTER_AUTH_SECRET` are not set
- Files: `packages/service/src/routes/upload/getFile.ts:11-14`, `packages/service/src/routes/upload/signFile.ts:12-15`
- Current mitigation: In production, `BETTER_AUTH_SECRET` should be set, making the fallback unreachable. In dev, this is a security gap
- Recommendations: Throw an error at startup if no signing secret is available, rather than falling back to a hardcoded default. Add a startup validation check

**No Rate Limiting:**
- Risk: No rate limiting on any API endpoint, making brute-force attacks and abuse trivial
- Files: All route files in `packages/service/src/routes/`
- Current mitigation: None
- Recommendations: Add rate limiting middleware (e.g., `hono/rate-limiter`) especially on auth endpoints (`/api/auth/*`), file upload, and any public-facing endpoints

**File Upload Path Traversal Risk:**
- Risk: File extension is extracted from user-provided filename (`file.name`) and used to construct the file path
- Files: `packages/service/src/routes/upload/uploadFile.ts:100`
- Current mitigation: The upload system validates MIME types against an allowlist, and path is constructed with sharding. However, the extension extraction uses `extname(file.name)` which could be manipulated
- Recommendations: Validate that the extension matches the MIME type (e.g., `.jpg` for `image/jpeg`). Consider using a mapping from MIME type to expected extension rather than trusting user input

## Performance Bottlenecks

**Organization List Count Query:**
- Problem: Every paginated organization list request runs a `COUNT(*)` query in parallel with the data query
- Files: `packages/service/src/routes/organization/listOrganizations.ts:39-46`
- Cause: `Promise.all` executes both `findMany` and `count` on every request. With large datasets, the count query can be slow
- Improvement path: Cache the total count with a short TTL, or use cursor-based pagination instead of offset-based

**Batch Config Upsert Creates Individual Queries:**
- Problem: `batchUpsert` creates individual Prisma upsert operations in a transaction instead of using a single bulk query
- Files: `packages/service/src/repositories/system-config.repository.ts:31-41`
- Cause: Prisma doesn't support native bulk upsert, so each item is an individual query
- Improvement path: For small batches (<50 items), this is acceptable. For larger batches, consider using raw SQL for bulk upsert, or implement a queue-based approach

**Base64 Data URLs in API Responses:**
- Problem: Organization logos stored as base64 data URLs are returned in list API responses, causing large payload sizes
- Files: `packages/service/src/routes/organization/listOrganizations.ts:48`, `packages/service/prisma/schema.prisma:86`
- Cause: Each logo data URL can be 100KB+ of base64 text
- Improvement path: Migrate to upload system (see Tech Debt section). Return only the URL reference, not the full data

## Fragile Areas

**Hono RPC Client Base URL:**
- Files: `apps/admin/src/lib/api/app-client.ts:4`
- Why fragile: `hc<AppType>("")` uses an empty string as base URL. This works when the API is served from the same origin (Next.js catch-all route), but will break if the service is deployed separately or behind a reverse proxy
- Safe modification: When deploying separately, update the base URL to point to the service endpoint. Consider making this configurable via environment variable
- Test coverage: No tests exist for API client configuration

**Organization Dialog Data URL Handling:**
- Files: `apps/admin/src/app/(logged)/organizations/components/organization-dialog.tsx:88-98`
- Why fragile: File reader converts image to data URL and stores it in form state. For large images, this can cause memory issues and slow form rendering. Also, data URLs are never cleaned up from memory
- Safe modification: Limit file size on the client side before conversion. Consider uploading to the server immediately on file selection rather than storing in state
- Test coverage: No tests for file upload handling in the dialog

**Logo Preview Uses `unoptimized` Prop:**
- Files: `apps/admin/src/app/(logged)/organizations/components/organization-dialog.tsx:186-193`, `apps/admin/src/app/(logged)/profile/components/avatar-upload.tsx:104-110`
- Why fragile: The `unoptimized` prop is used because logos are data URLs or relative upload paths, but this bypasses Next.js image optimization. For data URLs, this is necessary, but for upload URLs it should use optimization
- Safe modification: Differentiate between data URLs (use `unoptimized`) and upload URLs (let Next.js optimize)
- Test coverage: No tests for image rendering behavior

## Scaling Limits

**Database Connection Pool:**
- Current capacity: Single Prisma client with default connection pool
- Limit: Default pool size is 10 connections; will bottleneck under concurrent load
- Scaling path: Configure Prisma connection pool size via `datasource db { url = env("DATABASE_URL") }` with `?connection_limit=` parameter. For production, use PgBouncer for connection pooling

**File Storage on Local Disk:**
- Current capacity: Limited by filesystem; no cleanup mechanism for orphaned files
- Limit: Storage fills up; no garbage collection for deleted upload records
- Scaling path: Migrate to object storage (S3, GCS, R2). Add a cleanup job for orphaned files. Consider CDN for public file serving

## Dependencies at Risk

**Zod 4 (Beta):**
- Risk: The project uses `zod@^4.4.3` which is a major version upgrade with breaking changes (deprecated string format validators, standalone validators)
- Impact: New contributors may use Zod 3 patterns that compile but behave differently. Some Zod plugins may not be compatible yet
- Migration plan: Document Zod 4 patterns in AGENTS.md (already done). Monitor for plugin compatibility issues. Consider pinning exact version instead of using `^` range

**better-auth (Pre-1.x):**
- Risk: `better-auth@^1.6.10` is a relatively new auth library; API surface may change between minor versions
- Impact: Upgrades could break auth flows silently. Limited community knowledge for debugging
- Migration plan: Pin exact version in package.json. Review changelog before upgrading. Add integration tests for auth flows before they're needed

## Missing Critical Features

**No Test Suite:**
- Problem: Zero test files exist in the entire codebase — no unit, integration, or E2E tests
- Blocks: Safe refactoring, confident deployments, regression detection, CI/CD pipeline setup

**No Error Boundaries:**
- Problem: No React error boundaries exist to catch and recover from render errors
- Files: No error boundary files found
- Blocks: Graceful degradation when components crash; users see raw error or blank screen

**No CI/CD Pipeline:**
- Problem: No GitHub Actions, no lint checks in CI, no test execution in CI
- Blocks: Automated quality gates, deployment automation, branch protection enforcement

**No Database Migrations in Production:**
- Problem: Development uses `prisma db push` which is not suitable for production deployments
- Files: `packages/service/package.json:12` (`db:push` script)
- Blocks: Safe schema changes in production; rollbacks; schema version tracking

## Test Coverage Gaps

**All Routes — No Tests:**
- What's not tested: Every API endpoint (upload, organization CRUD, system-config, auth) has zero test coverage
- Files: All files in `packages/service/src/routes/`
- Risk: Any code change could break API contracts without detection; security regressions go unnoticed
- Priority: High

**Auth Flow — No Tests:**
- What's not tested: Registration, login, session management, role-based access control
- Files: `packages/service/src/lib/auth.ts`, `apps/admin/src/components/auth/login-form.tsx`, `apps/admin/src/components/auth/register-form.tsx`
- Risk: Auth is the most security-sensitive code; bugs here are critical vulnerabilities
- Priority: High

**File Upload — No Tests:**
- What's not tested: File type validation, size limits, path construction, signed URL generation/verification
- Files: `packages/service/src/routes/upload/uploadFile.ts`, `packages/service/src/routes/upload/getFile.ts`, `packages/service/src/routes/upload/signFile.ts`
- Risk: Path traversal attacks, signature bypass, storage exhaustion
- Priority: High

**Zustand Store — No Tests:**
- What's not tested: `useSystemConfigStore` fetch caching, update logic, error handling
- Files: `apps/admin/src/stores/system-config-store.ts`
- Risk: Config caching bugs cause stale data or memory leaks
- Priority: Medium

---

*Concerns audit: 2026-05-20*

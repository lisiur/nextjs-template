# Deployment (PM2 + nginx, own Linux server)

This app is a pnpm monorepo of three Next.js apps. In production each app runs
under PM2 on a localhost port, and nginx reverse-proxies one domain to them.

| App           | Port | Serves                                                |
| ------------- | ---- | ----------------------------------------------------- |
| `gateway`     | 3000 | `/api` (Hono service) + root page                     |
| `admin`       | 3001 | `/admin` (basePath), `/admin-static` (assetPrefix)    |
| `organization`| 3002 | `/organization`, `/organization-static`               |

> The Hono service is mounted inside the gateway at `/api` — there is no
> standalone service process to run.

## Requirements on the server

- Node.js (current LTS), pnpm
- PM2 (`npm i -g pm2`)
- nginx (you already have it)
- PostgreSQL (reachable via `DATABASE_URL`)

## Why the source lives on the server

There is no standalone "dist" to ship. `next start` loads runtime code from
`node_modules` and `.next/`, and the native modules (`argon2`, Prisma engines,
`sharp`) are compiled for the server's OS/arch during `pnpm install`. A build
from macOS/Windows will not run on Linux, so **install + build must happen on
the server**. The repo is already in git, so keeping a clone on your own server
adds no extra exposure — just keep `.env.production` (secrets) out of git.

## First-time deploy

```bash
git clone <repo-url> next101 && cd next101
pnpm install                              # builds native deps for this OS

cp .env.production.example .env.production
nano .env.production                      # fill in DATABASE_URL, secrets, CORS

pnpm db:generate                          # generate Prisma client (before build!)
pnpm db:migrate:deploy                    # apply schema (or `pnpm db:push`)
pnpm db:seed                              # first deploy only

NODE_OPTIONS='--max-old-space-size=8192' pnpm build

pm2 start ecosystem.config.cjs
pm2 save                                  # persist the process list
pm2 startup                               # follow the printed command to enable boot
```

Then point nginx at it (see below) and reload.

## Update an existing deploy

```bash
git pull
pnpm install
pnpm db:generate
pnpm db:migrate:deploy                    # only if there are new migrations
NODE_OPTIONS='--max-old-space-size=8192' pnpm build
pm2 reload ecosystem.config.cjs
```

`pm2 reload` does a zero-downtime rolling restart. Use `pm2 restart` instead
only if a native module was recompiled.

## nginx

Merge the `location` blocks from [`deploy/nginx.conf`](deploy/nginx.conf) into
the existing `server { }` block that terminates TLS for your domain, changing
`server_name` to match. Then:

```bash
sudo nginx -t && sudo nginx -s reload
```

Routing summary (nginx longest-prefix match):

- `/admin*`, `/admin-static/*` -> admin :3001
- `/organization*`, `/organization-static/*` -> organization :3002
- everything else (`/api`, `/`) -> gateway :3000

## Environment variables

See [`.env.production.example`](.env.production.example) for the full list.
Required:

- `DATABASE_URL` — PostgreSQL connection string.
- `CORS_ALLOWED_ORIGINS` — allowed origins; the service **fails closed** (no
  cross-origin) in production when unset.
- `UPLOAD_SIGN_SECRET` — required for private file operations.

Sessions are DB-backed (opaque token in the `session` table), so there is no
separate auth secret to manage.

## Important notes

- **HTTPS is required.** The session cookie is `secure` in production, so it is
  only sent over HTTPS. Plain HTTP will break login.
- **One domain, path-based routing.** All apps + `/api` must share a single
  origin so the session cookie (`path: "/"`) is shared across admin and
  organization. Don't split them onto subdomains.
- **Firewall 3000–3002.** Block external access to the app ports (e.g.
  `ufw deny 3000:3002`) so only nginx can reach them.
- **Build memory.** Building three apps can need ~8 GB; the `NODE_OPTIONS` flag
  in the commands above covers it. Add swap on smaller servers.

## Useful PM2 commands

```bash
pm2 status                  # process status
pm2 logs                    # live logs (all apps)
pm2 logs admin              # one app
pm2 reload ecosystem.config.cjs   # zero-downtime restart after rebuild
pm2 stop all / pm2 delete all
```

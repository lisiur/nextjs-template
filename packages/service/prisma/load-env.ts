import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

// Local dev keeps secrets in packages/service/.env (cwd). The deploy box keeps
// them in .env.production at the repo root (loaded by PM2 for the running apps,
// and loaded here for the Prisma CLI and seed). These scripts run from
// packages/service, so walk up the tree to locate the production file.
if (existsSync(".env")) {
  config({ path: ".env" });
} else {
  let dir = process.cwd();
  for (;;) {
    const candidate = resolve(dir, ".env.production");
    if (existsSync(candidate)) {
      config({ path: candidate });
      break;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
}

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceRoot = resolve(__dirname, "..");
const migrationsDir = resolve(serviceRoot, "prisma/migrations");
const initMigrationName = "00000000000000_init";
const initMigrationDir = resolve(migrationsDir, initMigrationName);
const initMigrationFile = resolve(initMigrationDir, "migration.sql");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: serviceRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function getOutput(command, args) {
  const result = spawnSync(command, args, {
    cwd: serviceRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  return result.stdout;
}

console.log("[db:reset:danger] Removing Prisma migrations...");
if (existsSync(migrationsDir)) {
  rmSync(migrationsDir, { recursive: true, force: true });
}
mkdirSync(migrationsDir, { recursive: true });

console.log("[db:reset:danger] Recreating init migration...");
mkdirSync(initMigrationDir, { recursive: true });
const initSql = getOutput("pnpm", [
  "exec",
  "prisma",
  "migrate",
  "diff",
  "--from-empty",
  "--to-schema",
  "prisma/schema.prisma",
  "--script",
]);
writeFileSync(initMigrationFile, initSql);
writeFileSync(
  resolve(migrationsDir, "migration_lock.toml"),
  'provider = "postgresql"\n',
);

console.log("[db:reset:danger] Pushing schema to database...");
run("pnpm", ["exec", "prisma", "db", "push"]);

console.log("[db:reset:danger] Marking init migration as applied...");
run("pnpm", [
  "exec",
  "prisma",
  "migrate",
  "resolve",
  "--applied",
  initMigrationName,
  "--schema",
  "prisma/schema.prisma",
]);

console.log("[db:reset:danger] Resetting database from migration history...");
run("pnpm", ["exec", "prisma", "migrate", "reset", "--force"]);

console.log("[db:reset:danger] Seeding database...");
run("pnpm", ["exec", "tsx", "prisma/seed.ts"]);

console.log("[db:reset:danger] Done.");

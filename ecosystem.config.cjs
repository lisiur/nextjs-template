// PM2 process manager config for production.
//
// Loads variables from .env.production at the repo root (next to this file)
// before starting the apps, so secrets stay out of version control.
//
//   pm2 start ecosystem.config.cjs
//   pm2 save && pm2 startup      # auto-restart on reboot
//   pm2 reload ecosystem.config.cjs  # zero-downtime reload after a rebuild

const fs = require("node:fs");

const envPath = "./.env.production";
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!m) continue;
    const [, key, raw] = m;
    if (process.env[key] === undefined) {
      process.env[key] = (raw ?? "").replace(/^["']|["']$/g, "");
    }
  }
}

const apps = [
  { name: "gateway", port: 3000 },
  { name: "admin", port: 3001 },
  { name: "organization", port: 3002 },
];

module.exports = {
  apps: apps.map(({ name, port }) => ({
    name,
    cwd: `./apps/${name}`,
    script: "pnpm",
    args: "start",
    exec_mode: "fork",
    instances: 1,
    autorestart: true,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      PORT: String(port),
    },
  })),
};

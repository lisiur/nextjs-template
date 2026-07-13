#!/usr/bin/env sh
# Assembles Next.js standalone deploy artifacts under $OUT and packs them into
# a deployable tarball next101-deploy-<sha>.tar.gz. Run after `pnpm build`.
# Used by .github/workflows/build.yml, but works standalone locally too.
set -eu

APPS="gateway admin organization"
# Default to the repo root (one level above this script) so `sh scripts/assemble.sh`
# works locally; CI overrides SRC_ROOT/OUT explicitly.
SRC_ROOT="${SRC_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
OUT="${OUT:-$SRC_ROOT/deploy}"

rm -rf "$OUT"
mkdir -p "$OUT"

for app in $APPS; do
  app_dir="$SRC_ROOT/apps/$app"
  standalone="$app_dir/.next/standalone"

  if [ ! -d "$standalone" ]; then
    echo "ERROR: standalone output missing for $app ($standalone)" >&2
    exit 1
  fi

  echo "==> Assembling $app"
  mkdir -p "$OUT/$app"
  cp -a "$standalone/." "$OUT/$app/"

  # Standalone omits static assets and public/ — copy them back in.
  rel="apps/$app"
  if [ -d "$app_dir/.next/static" ]; then
    mkdir -p "$OUT/$app/$rel/.next"
    cp -a "$app_dir/.next/static" "$OUT/$app/$rel/.next/static"
  fi
  if [ -d "$app_dir/public" ]; then
    cp -a "$app_dir/public" "$OUT/$app/$rel/public"
  fi

  # Sanity: native addons (.node) or the Prisma query engine must be present.
  if ! find "$OUT/$app" \( -name '*.node' -o -name 'libquery_engine*' \) -print -quit | grep -q .; then
    echo "ERROR: no native binaries (.node / prisma engine) found in $app" >&2
    exit 1
  fi
done

# Belt-and-suspenders: ensure the Prisma generated client is on disk for any app
# whose standalone kept packages/service/ (skip apps where it was bundled).
gen_src="$SRC_ROOT/packages/service/prisma/generated"
for app in $APPS; do
  svc_dir="$OUT/$app/packages/service"
  [ -d "$svc_dir" ] || continue
  dest="$svc_dir/prisma/generated"
  if [ ! -d "$dest" ] && [ -d "$gen_src" ]; then
    mkdir -p "$(dirname "$dest")"
    cp -a "$gen_src" "$dest"
  fi
done

# Ship the PM2 config and the env template alongside the app bundles so the
# tarball is self-contained. The real .env.production (with secrets) is never
# baked in — it stays on the server; the deployer fills it from the template.
cp "$SRC_ROOT/ecosystem.standalone.cjs" "$OUT/"
if [ -f "$SRC_ROOT/.env.production.example" ]; then
  cp "$SRC_ROOT/.env.production.example" "$OUT/"
fi

echo "==> Artifact tree (depth 3):"
find "$OUT" -maxdepth 3 -type d | sort | head -80

# Pack the staged dir into a deployable tarball named by the git short SHA,
# written next to the deploy dir. Produces the same artifact locally that the
# GitHub Actions workflow ships.
sha=$(git -C "$SRC_ROOT" rev-parse --short HEAD 2>/dev/null || echo local)
tarball="$SRC_ROOT/next101-deploy-${sha}.tar.gz"
tar -czf "$tarball" -C "$OUT" .
echo "==> Packed $tarball"

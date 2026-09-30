#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# One-time env setup: copy .env.example -> .env for each app if missing.
for app in backend site admin; do
  if [ ! -f "apps/$app/.env" ]; then
    cp "apps/$app/.env.example" "apps/$app/.env"
    echo "Created apps/$app/.env from .env.example"
  fi
done

docker compose -f docker-compose.dev.yml up -d

exec pnpm exec concurrently \
  --names "backend,site,admin" \
  --prefix-colors "blue,green,magenta" \
  --kill-others \
  "pnpm dev:backend" "pnpm dev:site" "pnpm dev:admin"

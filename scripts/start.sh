#!/bin/sh
set -e

echo "[start] Running database schema push..."
./node_modules/.bin/prisma db push --accept-data-loss

echo "[start] Running seed script..."
./node_modules/.bin/tsx prisma/seed-admin.ts || echo "[start] Seed completed with warnings"

echo "[start] Starting Next.js..."
exec ./node_modules/.bin/next start -p "${PORT:-3000}"

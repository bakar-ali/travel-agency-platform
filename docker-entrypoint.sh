#!/bin/sh
set -e

echo "=== Travel Agency Platform Startup ==="

if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL environment variable is not set."
  exit 1
fi

echo "Running database setup..."
node scripts/docker-start.mjs

echo "Starting Next.js..."
exec su-exec nextjs "$@"

#!/bin/sh

echo "=== Travel Agency Platform Startup ==="

if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL environment variable is not set in Dokploy."
  exit 1
fi

echo "Running database setup..."
node scripts/docker-start.mjs || echo "WARNING: Database setup had errors."

echo "Starting Next.js..."
exec su-exec nextjs "$@"

#!/bin/sh

echo "=== Travel Agency Platform Startup ==="

if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL environment variable is not set in Dokploy."
  exit 1
fi

# Ensure sslmode for all processes (startup + Next.js)
case "$DATABASE_URL" in
  *sslmode=*) ;;
  *\?*) export DATABASE_URL="${DATABASE_URL}&sslmode=disable" ;;
  *) export DATABASE_URL="${DATABASE_URL}?sslmode=disable" ;;
esac
echo "DATABASE_URL configured with sslmode=disable"

echo "Running database setup..."
node scripts/docker-start.mjs || echo "WARNING: Database setup had errors."

echo "Starting Next.js..."
exec su-exec nextjs "$@"

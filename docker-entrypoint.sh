#!/bin/sh

echo "Running database migrations..."
node node_modules/prisma/build/index.js db push --skip-generate || echo "WARNING: Database migration failed, starting app anyway..."

echo "Ingesting tour PDFs..."
node node_modules/tsx/dist/cli.mjs scripts/ingest-pdfs.ts || echo "PDF ingest skipped"

echo "Starting application..."
exec su-exec nextjs "$@"

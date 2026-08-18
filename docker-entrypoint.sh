#!/bin/sh

echo "Running database migrations..."
node node_modules/prisma/build/index.js db push --skip-generate || echo "WARNING: Database migration failed, starting app anyway..."

echo "Seeding tours from data/tours.json..."
node scripts/seed-tours.mjs || echo "Tour seed skipped"

echo "Starting application..."
exec su-exec nextjs "$@"

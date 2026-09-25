#!/bin/sh
set -eu

cd /app/apps/api

echo "Applying PostgreSQL migrations..."
npx prisma migrate deploy --schema prisma/schema.prisma

echo "Upserting Dhaka Tesla Pool demo seed data..."
npm run db:seed

echo "Starting the API..."
exec npm run start

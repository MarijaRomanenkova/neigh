#!/bin/sh

# Wait for the database to be ready
echo "Waiting for database to be ready..."
while ! npx prisma db push; do
  echo "Database not ready yet... waiting"
  sleep 2
done

echo "Database is ready!"

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Check if database is empty by trying to push schema
if npx prisma db push --accept-data-loss; then
  echo "Database is empty. Seeding..."
  cd /app && node db/seed.mjs
else
  echo "Database already has data. Skipping seeding..."
fi

echo "Database initialization completed!" 
 
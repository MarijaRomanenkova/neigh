#!/bin/sh

# Wait for the database to be ready
echo "Waiting for database to be ready..."
while ! npx prisma db push; do
  echo "Database not ready yet... waiting"
  sleep 2
done

echo "Database is ready!"

# Check if database is empty by counting users using Prisma
USER_COUNT=$(npx prisma db execute --stdin << EOF
SELECT COUNT(*) FROM "User";
EOF
)

# Remove any whitespace from the count
USER_COUNT=$(echo $USER_COUNT | tr -d '[:space:]')

if [ "$USER_COUNT" = "0" ]; then
  echo "Database is empty. Running migrations and seeding..."
  
  # Run migrations
  echo "Running database migrations..."
  npx prisma migrate deploy

  # Seed the database
  echo "Seeding the database..."
  cd /app && node db/seed.mjs
else
  echo "Database already has data. Skipping seeding..."
fi

echo "Database initialization completed!" 
 
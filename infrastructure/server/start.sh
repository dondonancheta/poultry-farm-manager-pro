#!/bin/sh
set -e

echo "======================================"
echo "  PoultryFarm Pro API — Starting Up"
echo "======================================"

echo "[1/4] Caching config & routes..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "[2/4] Running migrations..."
php artisan migrate --force

echo "[3/4] Checking seed status..."
# Use a simpler check — query the DB directly
USER_COUNT=$(php artisan tinker --no-interaction --execute="echo \App\Models\User::count();" 2>/dev/null | tr -d '\n\r ' | grep -o '[0-9]*' | tail -1)

echo "      Found $USER_COUNT existing users"

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
  echo "      Seeding demo data..."
  php artisan db:seed --force --class=Database\\Seeders\\DatabaseSeeder
  echo "      ✓ Seeded"
else
  echo "      ✓ Skipping seed — data already exists"
fi

echo "[4/4] Starting Nginx + PHP-FPM..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

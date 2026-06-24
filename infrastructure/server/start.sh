#!/bin/sh
set -e

echo "======================================"
echo "  PoultryFarm Pro API — Starting Up"
echo "======================================"

# Cache config and routes
echo "[1/5] Caching config & routes..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations fresh if needed, or standard migrate
echo "[2/5] Running migrations..."
php artisan migrate --force

# Seed only if users table is empty
echo "[3/5] Checking seed status..."
USER_COUNT=$(php artisan tinker --execute="echo \App\Models\User::count();" 2>/dev/null | grep -E '^[0-9]+$' | tail -1)
if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" = "0" ]; then
  echo "      Seeding demo data..."
  php artisan db:seed --force
  echo "      ✓ Database seeded"
else
  echo "      ✓ Database already has $USER_COUNT users — skipping seed"
fi

# Storage link
echo "[4/5] Setting up storage..."
php artisan storage:link 2>/dev/null || true

echo "[5/5] Starting Nginx + PHP-FPM..."
echo ""
echo "======================================"
echo "  API ready on port 80"
echo "======================================"
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

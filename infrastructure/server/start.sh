#!/bin/sh
set -e
echo "=== PoultryFarm Pro API Starting ==="

php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Running migrations..."
php artisan migrate --force

USER_COUNT=$(php artisan tinker --execute="echo \App\Models\User::count();" 2>/dev/null | grep -E '^[0-9]+$' | tail -1)
if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" = "0" ]; then
  echo "Seeding database..."
  php artisan db:seed --force
else
  echo "Database already seeded ($USER_COUNT users)"
fi

php artisan storage:link 2>/dev/null || true

echo "=== Starting Nginx + PHP-FPM ==="
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

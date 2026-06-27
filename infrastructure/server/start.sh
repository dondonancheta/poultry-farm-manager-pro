#!/bin/sh
set -e

echo "======================================"
echo "  PoultryFarm Pro API — Starting Up"
echo "======================================"

echo "[1/4] Clearing and rebuilding cache..."
php artisan cache:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true

php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "[2/4] Running migrations..."
php artisan migrate --force

echo "[3/4] Checking seed status..."
USER_COUNT=$(php -r "
require '/var/www/html/vendor/autoload.php';
\$app = require '/var/www/html/bootstrap/app.php';
\$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
try {
    echo \Illuminate\Support\Facades\DB::table('users')->count();
} catch (Exception \$e) {
    echo '0';
}
" 2>/dev/null)

echo "      User count: $USER_COUNT"

if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" = "0" ]; then
    echo "      Seeding demo data..."
    php artisan db:seed --force
    echo "      ✓ Seeded"
else
    echo "      ✓ Skipping — $USER_COUNT users already exist"
fi

echo "[4/4] Starting Nginx + PHP-FPM..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

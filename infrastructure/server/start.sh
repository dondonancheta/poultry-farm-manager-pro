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
# Use php directly to query DB - more reliable than tinker
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
    echo "      ✓ Seeded successfully"
else
    echo "      ✓ Skipping — $USER_COUNT users already exist"
fi

echo "[4/4] Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

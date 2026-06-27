#!/bin/sh
set -e

echo "======================================"
echo "  PoultryFarm Pro API"
echo "======================================"

echo "=== File check ==="
ls -la /var/www/html/public/
echo "==================="

echo "[1/3] Running migrations..."
php artisan migrate --force

echo "[2/3] Checking seed..."
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

if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" = "0" ]; then
    php artisan db:seed --force
fi

echo "[3/3] Starting server on port 8000..."
php artisan serve --host=0.0.0.0 --port=8000

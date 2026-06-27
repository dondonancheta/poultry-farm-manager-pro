FROM php:8.3-cli-alpine

RUN apk add --no-cache \
    postgresql-dev libzip-dev \
    zip unzip git curl bash \
    freetype-dev libjpeg-turbo-dev libpng-dev

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install pdo pdo_pgsql pgsql zip opcache pcntl bcmath gd

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY server/ .

RUN test -f /var/www/html/public/index.php \
    && echo "✓ public/index.php exists" \
    || (echo "✗ MISSING public/index.php" && ls -la && exit 1)

RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --ignore-platform-reqs

RUN composer dump-autoload --optimize --no-scripts \
 && php -r "file_put_contents('/var/www/html/vendor/composer/platform_check.php', '<?php // disabled');"

RUN mkdir -p storage/logs \
             storage/framework/cache \
             storage/framework/sessions \
             storage/framework/views \
             bootstrap/cache \
 && chmod -R 777 storage bootstrap/cache \
 && chmod +x artisan

COPY infrastructure/server/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8000
CMD ["/start.sh"]

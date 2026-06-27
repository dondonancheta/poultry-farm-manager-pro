# PoultryFarm Pro — Laravel API
# Build context: repo root

FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    nginx postgresql-dev libzip-dev \
    zip unzip git curl supervisor bash \
    freetype-dev libjpeg-turbo-dev libpng-dev

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install pdo pdo_pgsql pgsql zip opcache pcntl bcmath gd

RUN { \
    echo "opcache.enable=1"; \
    echo "opcache.memory_consumption=128"; \
    echo "opcache.max_accelerated_files=10000"; \
    echo "opcache.validate_timestamps=0"; \
} >> /usr/local/etc/php/conf.d/opcache.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy server folder
COPY server/ .

# Verify structure
RUN echo "=== Directory structure ===" \
 && ls -la /var/www/html/ \
 && echo "=== public/ ===" \
 && ls -la /var/www/html/public/ \
 && echo "=== artisan ===" \
 && ls -la /var/www/html/artisan

# Install dependencies
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
 && chown -R www-data:www-data /var/www/html \
 && chmod -R 755 storage bootstrap/cache \
 && chmod +x artisan

COPY infrastructure/server/nginx.conf       /etc/nginx/nginx.conf
COPY infrastructure/server/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY infrastructure/server/start.sh         /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]

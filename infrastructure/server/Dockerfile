# PoultryFarm Pro — Laravel API
# Build context: repo root (so we can COPY server/ and infrastructure/)

FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    nginx postgresql-dev libzip-dev \
    zip unzip git curl supervisor bash

RUN docker-php-ext-install pdo pdo_pgsql pgsql zip opcache pcntl bcmath

RUN echo "opcache.enable=1\nopcache.memory_consumption=128\nopcache.max_accelerated_files=10000\nopcache.validate_timestamps=0" \
    >> /usr/local/etc/php/conf.d/opcache.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Composer install (layer cache)
COPY server/composer.json server/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy app code
COPY server/ .
RUN composer run-script post-autoload-dump --no-interaction 2>/dev/null || true

# Permissions
RUN chown -R www-data:www-data /var/www/html \
 && chmod -R 755 storage bootstrap/cache

# Infrastructure configs
COPY infrastructure/server/nginx.conf       /etc/nginx/nginx.conf
COPY infrastructure/server/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY infrastructure/server/start.sh         /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]

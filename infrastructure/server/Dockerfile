# PoultryFarm Pro — Laravel API
# Build context: repo root (set in render.yaml as dockerContext: .)

FROM php:8.3-fpm-alpine

# System packages
RUN apk add --no-cache \
    nginx postgresql-dev libzip-dev \
    zip unzip git curl supervisor bash

# PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql pgsql zip opcache pcntl bcmath

# OPcache settings
RUN { \
    echo "opcache.enable=1"; \
    echo "opcache.memory_consumption=128"; \
    echo "opcache.max_accelerated_files=10000"; \
    echo "opcache.validate_timestamps=0"; \
} >> /usr/local/etc/php/conf.d/opcache.ini

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy entire server folder
COPY server/ .

# Install PHP dependencies (no lock file required)
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --no-scripts \
    --prefer-dist

# Dump autoload after scripts
RUN composer dump-autoload --optimize

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
 && chmod -R 755 storage bootstrap/cache \
 && mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views

# Infrastructure configs
COPY infrastructure/server/nginx.conf       /etc/nginx/nginx.conf
COPY infrastructure/server/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY infrastructure/server/start.sh         /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]

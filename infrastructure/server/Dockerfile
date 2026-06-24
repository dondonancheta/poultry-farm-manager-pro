# PoultryFarm Pro — Laravel API
# Build context: repo root

FROM php:8.3-fpm-alpine

# System packages
RUN apk add --no-cache \
    nginx postgresql-dev libzip-dev \
    zip unzip git curl supervisor bash \
    freetype-dev libjpeg-turbo-dev libpng-dev

# PHP extensions
RUN docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
 && docker-php-ext-install \
        pdo pdo_pgsql pgsql zip opcache pcntl bcmath gd

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

# Copy full server folder (includes artisan, public/, storage/)
COPY server/ .

# Install PHP dependencies
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --ignore-platform-reqs

# Dump autoload and disable platform check (vendor was built on PHP 8.4, Docker runs 8.3)
RUN composer dump-autoload --optimize --no-scripts \
 && composer config --no-plugins allow-plugins.composer/package-versions-deprecated true 2>/dev/null || true \
 && php -r "file_put_contents('/var/www/html/vendor/composer/platform_check.php', '<?php // platform check disabled');"

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
 && chmod -R 755 storage bootstrap/cache \
 && chmod +x artisan

# Infrastructure configs
COPY infrastructure/server/nginx.conf       /etc/nginx/nginx.conf
COPY infrastructure/server/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY infrastructure/server/start.sh         /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]

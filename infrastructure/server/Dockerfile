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

# Force PHP-FPM to listen on TCP 9000
RUN echo '[www]' > /usr/local/etc/php-fpm.d/www.conf \
 && echo 'user = www-data' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'group = www-data' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'listen = 127.0.0.1:9000' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'pm = dynamic' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'pm.max_children = 5' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'pm.start_servers = 2' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'pm.min_spare_servers = 1' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'pm.max_spare_servers = 3' >> /usr/local/etc/php-fpm.d/www.conf

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY server/ .

# Verify public/index.php exists
RUN test -f /var/www/html/public/index.php \
    && echo "✓ public/index.php found" \
    || (echo "✗ public/index.php MISSING!" && exit 1)

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

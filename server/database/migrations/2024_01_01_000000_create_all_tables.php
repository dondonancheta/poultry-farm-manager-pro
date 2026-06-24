<?php

// ============================================================
// Run: php artisan migrate --seed
// ============================================================

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// ── 001: Users ───────────────────────────────────────────────────────────────
return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('worker'); // admin|manager|supervisor|worker
            $table->string('status')->default('active'); // active|inactive|suspended
            $table->string('building')->nullable();
            $table->string('phone')->nullable();
            $table->string('avatar')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // ── Buildings ──────────────────────────────────────────────────────────
        Schema::create('buildings', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->enum('type', ['broiler', 'layer', 'breeder']);
            $table->unsignedInteger('capacity');
            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // ── Breeds ────────────────────────────────────────────────────────────
        Schema::create('breeds', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->enum('type', ['broiler', 'layer', 'dual']);
            $table->string('origin')->nullable();
            $table->decimal('avg_fcr', 4, 2)->nullable();
            $table->unsignedInteger('peak_prod_age')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // ── Flock batches ─────────────────────────────────────────────────────
        Schema::create('flock_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_code')->unique();
            $table->foreignId('breed_id')->constrained()->restrictOnDelete();
            $table->foreignId('building_id')->constrained()->restrictOnDelete();
            $table->date('arrival_date');
            $table->string('source_farm')->nullable();
            $table->unsignedInteger('initial_count');
            $table->unsignedInteger('current_count');
            $table->decimal('purchase_cost_per_hen', 10, 2)->nullable();
            $table->enum('status', ['Active', 'Harvested', 'Quarantined'])->default('Active');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── Egg collections ───────────────────────────────────────────────────
        Schema::create('egg_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flock_batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('building_id')->constrained()->restrictOnDelete();
            $table->foreignId('collector_id')->constrained('users')->restrictOnDelete();
            $table->date('collection_date');
            $table->string('collection_time');
            $table->json('sizes'); // {small,medium,large,extra_large,jumbo}
            $table->unsignedInteger('total_collected')->default(0);
            $table->unsignedInteger('good_eggs')->default(0);
            $table->unsignedInteger('cracked')->default(0);
            $table->unsignedInteger('dirty')->default(0);
            $table->unsignedInteger('spoiled')->default(0);
            $table->unsignedInteger('rejected')->default(0);
            $table->text('notes')->nullable();
            $table->enum('verified_status', ['pending', 'verified', 'flagged', 'rejected'])->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['collection_date', 'building_id']);
            $table->index(['flock_batch_id', 'collection_date']);
        });

        // ── Feed types ────────────────────────────────────────────────────────
        Schema::create('feed_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->enum('category', ['starter', 'grower', 'finisher', 'layer']);
            $table->unsignedInteger('age_from')->default(0);
            $table->unsignedInteger('age_to')->default(999);
            $table->decimal('price_per_kg', 8, 2);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // ── Suppliers ─────────────────────────────────────────────────────────
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category'); // Feed|Medicine|Supplies|Equipment
            $table->string('contact')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->unsignedTinyInteger('rating')->default(3); // 1–5
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // ── Feed stock ────────────────────────────────────────────────────────
        Schema::create('feed_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feed_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('batch_number')->nullable();
            $table->decimal('quantity_kg', 10, 2);
            $table->decimal('price_per_kg', 8, 2);
            $table->date('received_date');
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── Feed issuance ─────────────────────────────────────────────────────
        Schema::create('feed_issuances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feed_stock_id')->constrained()->restrictOnDelete();
            $table->foreignId('flock_batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('building_id')->constrained()->restrictOnDelete();
            $table->foreignId('issued_by')->constrained('users')->restrictOnDelete();
            $table->decimal('quantity_kg', 10, 2);
            $table->string('session'); // Morning|Noon|Afternoon
            $table->timestamp('issued_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['flock_batch_id', 'issued_at']);
        });

        // ── Mortality logs ────────────────────────────────────────────────────
        Schema::create('mortality_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flock_batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('building_id')->constrained()->restrictOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->unsignedInteger('count');
            $table->string('cause');
            $table->string('location')->nullable();
            $table->text('symptoms')->nullable();
            $table->string('disposal_method')->nullable();
            $table->enum('severity', ['normal', 'elevated', 'critical'])->default('normal');
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index(['flock_batch_id', 'recorded_at']);
        });

        // ── Medicines ─────────────────────────────────────────────────────────
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // Vaccine|Antibiotic|Vitamin|etc.
            $table->string('active_ingredient')->nullable();
            $table->unsignedInteger('withdrawal_days')->default(0);
            $table->string('storage_temp')->nullable();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // ── Medicine stock ────────────────────────────────────────────────────
        Schema::create('medicine_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->constrained()->cascadeOnDelete();
            $table->string('batch_number')->nullable();
            $table->decimal('quantity', 10, 2);
            $table->string('unit'); // doses|ml|packs
            $table->date('expiry_date')->nullable();
            $table->date('received_date');
            $table->decimal('unit_cost', 8, 2)->nullable();
            $table->timestamps();
        });

        // ── Treatments ────────────────────────────────────────────────────────
        Schema::create('treatments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flock_batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained()->restrictOnDelete();
            $table->foreignId('administered_by')->constrained('users')->restrictOnDelete();
            $table->decimal('dosage_ml', 8, 2)->nullable();
            $table->unsignedInteger('duration_days')->nullable();
            $table->unsignedInteger('birds_treated')->nullable();
            $table->timestamp('administered_at');
            $table->unsignedInteger('withdrawal_days')->default(0);
            $table->date('withdrawal_end')->nullable();
            $table->string('symptoms')->nullable();
            $table->string('diagnosis')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── Vaccinations ──────────────────────────────────────────────────────
        Schema::create('vaccinations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flock_batch_id')->constrained()->cascadeOnDelete();
            $table->string('vaccine_name');
            $table->date('scheduled_date');
            $table->date('completed_date')->nullable();
            $table->enum('status', ['scheduled', 'completed', 'overdue', 'skipped'])->default('scheduled');
            $table->string('administered_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['flock_batch_id', 'scheduled_date']);
            $table->index('status');
        });

        // ── Damaged egg reports ───────────────────────────────────────────────
        Schema::create('damaged_egg_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flock_batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('building_id')->constrained()->restrictOnDelete();
            $table->foreignId('reported_by')->constrained('users')->restrictOnDelete();
            $table->unsignedInteger('count');
            $table->string('damage_type');
            $table->string('severity')->default('Low — Isolated incident');
            $table->string('cause')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── Customers ─────────────────────────────────────────────────────────
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['wholesale', 'retail', 'restaurant']);
            $table->string('contact')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->decimal('credit_limit', 12, 2)->default(0);
            $table->decimal('balance', 12, 2)->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // ── Sales ─────────────────────────────────────────────────────────────
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->date('sale_date');
            $table->json('line_items'); // [{egg_size, qty, unit_price, subtotal}]
            $table->decimal('total_amount', 12, 2);
            $table->enum('payment_method', ['cash', 'credit', 'bank-transfer']);
            $table->enum('status', ['pending', 'paid', 'overdue'])->default('paid');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['sale_date', 'customer_id']);
        });

        // ── System settings ───────────────────────────────────────────────────
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string|boolean|integer|json
            $table->string('group')->default('general');
            $table->timestamps();
        });

        // ── Notifications ─────────────────────────────────────────────────────
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info');
            $table->string('category')->nullable();
            $table->json('for_roles')->default('[]');
            $table->string('link')->nullable();
            $table->timestamps();
        });

        Schema::create('notification_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->unique(['notification_id', 'user_id']);
        });

        // ── Sale Items ────────────────────────────────────────────────────────
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->string('egg_size');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });

        // ── Password Reset Tokens ─────────────────────────────────────────────
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // ── Cache & Sessions (for database driver) ────────────────────────────
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('damaged_egg_reports');
        Schema::dropIfExists('vaccinations');
        Schema::dropIfExists('treatments');
        Schema::dropIfExists('medicine_stocks');
        Schema::dropIfExists('medicines');
        Schema::dropIfExists('mortality_logs');
        Schema::dropIfExists('feed_issuances');
        Schema::dropIfExists('feed_stocks');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('feed_types');
        Schema::dropIfExists('egg_collections');
        Schema::dropIfExists('flock_batches');
        Schema::dropIfExists('breeds');
        Schema::dropIfExists('buildings');
        Schema::dropIfExists('users');
    }
};

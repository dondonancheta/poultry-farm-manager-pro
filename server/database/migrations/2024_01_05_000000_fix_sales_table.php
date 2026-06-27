<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Add missing columns that SalesController uses
            if (!Schema::hasColumn('sales', 'invoice_no')) {
                $table->string('invoice_no')->nullable()->after('customer_id');
            }
            if (!Schema::hasColumn('sales', 'subtotal')) {
                $table->decimal('subtotal', 12, 2)->default(0)->after('notes');
            }
            if (!Schema::hasColumn('sales', 'discount')) {
                $table->decimal('discount', 12, 2)->default(0)->after('subtotal');
            }
            if (!Schema::hasColumn('sales', 'total')) {
                $table->decimal('total', 12, 2)->default(0)->after('discount');
            }
            // Fix payment_method to accept more values
            if (Schema::hasColumn('sales', 'payment_method')) {
                // Drop and re-add with broader values via string
                $table->string('payment_method')->default('cash')->change();
            }
        });

        // Remove created_by constraint if it exists (SalesController doesn't set it)
        // and make it nullable
        if (Schema::hasColumn('sales', 'created_by')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->foreignId('created_by')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['invoice_no', 'subtotal', 'discount', 'total']);
        });
    }
};

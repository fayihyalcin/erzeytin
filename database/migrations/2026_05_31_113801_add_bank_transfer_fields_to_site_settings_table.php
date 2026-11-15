<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('site_settings')) {
            return;
        }

        Schema::table('site_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('site_settings', 'bank_name')) {
                $table->string('bank_name')->nullable()->after('map_embed');
            }

            if (! Schema::hasColumn('site_settings', 'bank_branch')) {
                $table->string('bank_branch')->nullable()->after('bank_name');
            }

            if (! Schema::hasColumn('site_settings', 'bank_account_holder')) {
                $table->string('bank_account_holder')->nullable()->after('bank_branch');
            }

            if (! Schema::hasColumn('site_settings', 'bank_iban')) {
                $table->string('bank_iban')->nullable()->after('bank_account_holder');
            }

            if (! Schema::hasColumn('site_settings', 'bank_description')) {
                $table->text('bank_description')->nullable()->after('bank_iban');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('site_settings')) {
            return;
        }

        Schema::table('site_settings', function (Blueprint $table) {
            foreach (['bank_name', 'bank_branch', 'bank_account_holder', 'bank_iban', 'bank_description'] as $column) {
                if (Schema::hasColumn('site_settings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

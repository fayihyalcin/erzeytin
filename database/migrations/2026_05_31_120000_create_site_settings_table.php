<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('site_title')->default('Er Zeytinyağı');
            $table->string('logo_path')->nullable();
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('meta_keywords')->nullable();
            $table->string('company_name')->nullable();
            $table->string('tax_office')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('gsm')->nullable();
            $table->string('whatsapp')->nullable();
            $table->text('address')->nullable();
            $table->text('map_embed')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_branch')->nullable();
            $table->string('bank_account_holder')->nullable();
            $table->string('bank_iban')->nullable();
            $table->text('bank_description')->nullable();
            $table->boolean('paytr_enabled')->default(false);
            $table->boolean('paytr_test_mode')->default(true);
            $table->string('paytr_merchant_id')->nullable();
            $table->string('paytr_merchant_key')->nullable();
            $table->string('paytr_merchant_salt')->nullable();
            $table->string('card_provider')->default('PayTR');
            $table->string('api_base_url')->nullable();
            $table->string('api_key')->nullable();
            $table->string('api_secret')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};

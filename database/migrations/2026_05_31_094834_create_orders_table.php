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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('customer_name');
            $table->string('phone')->nullable();
            $table->string('city')->nullable();
            $table->string('address')->nullable();
            $table->unsignedInteger('item_count')->default(0);
            $table->text('products_summary')->nullable();
            $table->decimal('total', 12, 2)->default(0);
            $table->string('payment_status')->default('Bekliyor');
            $table->string('payment_method')->default('Kredi Kartı');
            $table->string('status')->default('Yeni');
            $table->string('cargo_status')->default('Beklemede');
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

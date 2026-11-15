<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('home_sections', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('section_key')->unique();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subtitle')->nullable();
            $table->string('badge_label')->nullable();
            $table->unsignedTinyInteger('product_limit')->default(6);
            $table->string('style')->default('default');
            $table->string('status')->default('Aktif');
            $table->unsignedInteger('sort_order')->default(10);
            $table->boolean('show_compare_price')->default(false);
            $table->timestamps();
        });

        DB::table('home_sections')->insert([
            [
                'title' => 'Yeni Gelenler',
                'section_key' => 'new-products',
                'badge_label' => 'Yeni',
                'product_limit' => 6,
                'style' => 'default',
                'status' => 'Aktif',
                'sort_order' => 10,
                'show_compare_price' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'En Çok Satanlar',
                'section_key' => 'best-sellers',
                'badge_label' => 'Çok Satan',
                'product_limit' => 6,
                'style' => 'best',
                'status' => 'Aktif',
                'sort_order' => 20,
                'show_compare_price' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Öne Çıkan Ürünler',
                'section_key' => 'featured-products',
                'badge_label' => 'Öne Çıkan',
                'product_limit' => 6,
                'style' => 'featured',
                'status' => 'Aktif',
                'sort_order' => 30,
                'show_compare_price' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('home_sections');
    }
};

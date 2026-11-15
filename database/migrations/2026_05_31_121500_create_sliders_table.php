<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sliders', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->string('product_image_path')->nullable();
            $table->string('button_text')->nullable();
            $table->string('button_url')->nullable();
            $table->string('badge')->nullable();
            $table->string('tin_brand')->default('ER');
            $table->string('tin_title')->default('NATÜREL SIZMA ZEYTİNYAĞI');
            $table->string('tin_size')->default('5L');
            $table->string('status')->default('Aktif');
            $table->unsignedInteger('sort_order')->default(10);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sliders');
    }
};

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Slider extends Model
{
    protected $fillable = [
        'title',
        'description',
        'image_path',
        'product_image_path',
        'button_text',
        'button_url',
        'badge',
        'tin_brand',
        'tin_title',
        'tin_size',
        'status',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];
}

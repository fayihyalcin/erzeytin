<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HomeSection extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'badge_label',
        'section_key',
        'category_id',
        'product_limit',
        'style',
        'status',
        'sort_order',
        'show_compare_price',
    ];

    protected $casts = [
        'product_limit' => 'integer',
        'sort_order' => 'integer',
        'show_compare_price' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}

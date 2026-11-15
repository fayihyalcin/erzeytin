<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'code',
        'user_id',
        'customer_name',
        'email',
        'phone',
        'city',
        'address',
        'item_count',
        'products_summary',
        'total',
        'payment_status',
        'payment_method',
        'payment_provider',
        'payment_reference',
        'paytr_token',
        'paid_at',
        'receipt_path',
        'status',
        'cargo_status',
        'note',
    ];

    protected $casts = [
        'item_count' => 'integer',
        'total' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}

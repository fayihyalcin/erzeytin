<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class SiteSetting extends Model
{
    protected $fillable = [
        'site_title',
        'logo_path',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'company_name',
        'tax_office',
        'tax_number',
        'email',
        'phone',
        'gsm',
        'whatsapp',
        'address',
        'map_embed',
        'bank_name',
        'bank_branch',
        'bank_account_holder',
        'bank_iban',
        'bank_description',
        'paytr_enabled',
        'paytr_test_mode',
        'paytr_merchant_id',
        'paytr_merchant_key',
        'paytr_merchant_salt',
        'card_provider',
        'api_base_url',
        'api_key',
        'api_secret',
    ];

    protected $casts = [
        'paytr_enabled' => 'boolean',
        'paytr_test_mode' => 'boolean',
    ];

    public static function current(): self
    {
        $defaults = [
            'site_title' => 'Er Zeytin Yağı',
            'company_name' => 'Er Zeytin Yağı',
            'meta_title' => 'Er Zeytin Yağı',
            'meta_description' => 'Doğal zeytin ve zeytinyağı ürünleri.',
            'email' => 'celalergida@gmail.com',
            'phone' => '0530 516 54 98',
            'gsm' => '0530 516 54 98',
            'whatsapp' => '905305165498',
            'address' => 'Çepni mahallesi Çepni 25. sokak no:3 Mudanya/Bursa',
            'bank_description' => 'Havale/EFT açıklamasına sipariş numaranızı yazmanız yeterlidir.',
            'card_provider' => 'PayTR',
            'paytr_test_mode' => true,
        ];

        if (! Schema::hasTable('site_settings')) {
            return new self($defaults);
        }

        return self::query()->firstOrCreate([], $defaults);
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // Hesap kayıt formundan önceden açıldı; burada yalnız yönetici işareti verilir.
    // Parola kodda tutulmaz. Hesap yoksa hiçbir şey olmaz (e-postayı sonradan
    // kaydeden biri yönetici olmaz); o durumda `php artisan admin:grant` kullanılır.
    private const OWNER_EMAIL = 'info@erzeytinyagi.com';

    public function up(): void
    {
        DB::table('users')->where('email', self::OWNER_EMAIL)->update(['is_admin' => true]);
    }

    public function down(): void
    {
        DB::table('users')->where('email', self::OWNER_EMAIL)->update(['is_admin' => false]);
    }
};

<?php

use App\Console\Commands\ImportCatalog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

return new class extends Migration
{
    public function up(): void
    {
        // bootstrap/app.php komutlari otomatik kesfetmiyor; goc kendi basina calissin diye kaydet.
        Artisan::registerCommand(app(ImportCatalog::class));

        $code = Artisan::call('catalog:import');

        if ($code !== 0) {
            throw new RuntimeException('catalog:import basarisiz: '.Artisan::output());
        }
    }

    public function down(): void
    {
        // Veri iceri aktarimi geri alinmaz; canli veri silinmemeli.
    }
};

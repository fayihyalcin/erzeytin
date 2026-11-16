<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CatalogImportTest extends TestCase
{
    use RefreshDatabase;

    // Göç sırasında kopyalanan medya gerçek diske yazılmasın diye fake erken kurulur.
    protected function beforeRefreshingDatabase(): void
    {
        Storage::fake('public');
    }

    private function counts(): array
    {
        return collect(['categories', 'products', 'sliders', 'home_sections', 'site_settings'])
            ->mapWithKeys(fn ($t) => [$t => DB::table($t)->count()])
            ->all();
    }

    public function test_migration_imports_catalog_and_media(): void
    {
        $this->assertSame(
            ['categories' => 3, 'products' => 25, 'sliders' => 1, 'home_sections' => 3, 'site_settings' => 1],
            $this->counts()
        );

        // Göç süreç başına bir kez çalışır; bu testin taze fake diski için medyayı yeniden kopyala.
        $this->artisan('catalog:import')->assertExitCode(0);

        $image = DB::table('products')->whereNotNull('image_path')->value('image_path');
        $this->assertNotNull($image);
        Storage::disk('public')->assertExists($image);
    }

    public function test_import_is_idempotent(): void
    {
        $before = $this->counts();

        $this->artisan('catalog:import')->assertExitCode(0);

        $this->assertSame($before, $this->counts());
    }

    public function test_rerun_keeps_paytr_credentials(): void
    {
        DB::table('site_settings')->update(['paytr_merchant_key' => 'gizli-anahtar', 'api_key' => 'abc']);

        $this->artisan('catalog:import')->assertExitCode(0);

        $row = DB::table('site_settings')->first();
        $this->assertSame('gizli-anahtar', $row->paytr_merchant_key);
        $this->assertSame('abc', $row->api_key);
    }
}

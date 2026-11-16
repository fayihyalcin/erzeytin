<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ImportCatalog extends Command
{
    protected $signature = 'catalog:import';

    protected $description = 'Ilk katalog verisini (kategori, urun, slider, ana sayfa bolumleri, ayarlar) ve gorselleri iceri aktarir';

    private const SEED_TABLES = ['categories', 'products', 'sliders', 'home_sections'];

    private const SETTINGS_PROTECTED = ['id', 'created_at', 'api_key', 'api_secret'];

    public function handle(): int
    {
        $dir = database_path('seeders/catalog');
        $file = $dir.'/katalog.json';

        if (! is_file($file)) {
            $this->error('katalog.json bulunamadi: '.$file);

            return self::FAILURE;
        }

        $data = json_decode(file_get_contents($file), true);

        if (! is_array($data)) {
            $this->error('katalog.json okunamadi.');

            return self::FAILURE;
        }

        try {
            DB::transaction(function () use ($data) {
                foreach (self::SEED_TABLES as $table) {
                    $this->seedTable($table, $data[$table] ?? []);
                }

                $this->importSettings($data['site_settings'] ?? []);
            });

            $this->copyMedia($dir.'/media');
        } catch (Throwable $e) {
            $this->error('Ice aktarma basarisiz: '.$e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    private function seedTable(string $table, array $rows): void
    {
        if (DB::table($table)->exists()) {
            $this->line("$table: atlandi (tabloda veri var)");

            return;
        }

        foreach ($rows as $row) {
            DB::table($table)->insert($this->prepare($table, $row));
        }

        $this->syncSequence($table);
        $this->line("$table: ".count($rows).' satir eklendi');
    }

    private function importSettings(array $rows): void
    {
        $table = 'site_settings';

        if (! $rows) {
            return;
        }

        $existing = DB::table($table)->orderBy('id')->first();

        if (! $existing) {
            DB::table($table)->insert($this->prepare($table, $rows[0]));
            $this->syncSequence($table);
            $this->line("$table: 1 satir eklendi");

            return;
        }

        $values = collect($this->prepare($table, $rows[0]))
            ->reject(fn ($v, $col) => in_array($col, self::SETTINGS_PROTECTED, true) || str_starts_with($col, 'paytr_'))
            ->all();

        DB::table($table)->where('id', $existing->id)->update($values);
        $this->line("$table: mevcut satir guncellendi (paytr_*, api_key, api_secret korundu)");
    }

    private function prepare(string $table, array $row): array
    {
        $columns = Schema::getColumnListing($table);
        $booleans = $this->booleanColumns($table);
        $row = array_intersect_key($row, array_flip($columns));

        foreach ($booleans as $col) {
            if (array_key_exists($col, $row) && $row[$col] !== null) {
                $row[$col] = (bool) $row[$col];
            }
        }

        return $row;
    }

    private function booleanColumns(string $table): array
    {
        return collect(Schema::getColumns($table))
            ->filter(fn ($c) => in_array($c['type_name'], ['bool', 'boolean'], true) || $c['type'] === 'tinyint(1)')
            ->pluck('name')
            ->all();
    }

    private function syncSequence(string $table): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(
            "SELECT setval(pg_get_serial_sequence('{$table}', 'id'), COALESCE((SELECT MAX(id) FROM \"{$table}\"), 1), (SELECT COUNT(*) > 0 FROM \"{$table}\"))"
        );
    }

    private function copyMedia(string $base): void
    {
        $disk = Storage::disk('public');
        $copied = 0;
        $skipped = 0;

        foreach (File::allFiles($base) as $file) {
            $path = str_replace('\\', '/', $file->getRelativePathname());

            if ($disk->exists($path)) {
                $skipped++;

                continue;
            }

            $stream = fopen($file->getPathname(), 'r');
            $disk->put($path, $stream);
            is_resource($stream) && fclose($stream);
            $copied++;
        }

        $this->line("medya: $copied kopyalandi, $skipped atlandi");
    }
}

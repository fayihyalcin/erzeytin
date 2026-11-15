<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Category::query()->delete();

        collect([
            ['name' => 'Zeytin Yağı', 'slug' => 'zeytin-yagi', 'sort_order' => 10],
            ['name' => 'Siyah Zeytin', 'slug' => 'siyah-zeytin', 'sort_order' => 20],
            ['name' => 'Yeşil Zeytin', 'slug' => 'yesil-zeytin', 'sort_order' => 30],
        ])->each(fn (array $category) => Category::create($category + [
            'status' => 'Aktif',
            'visibility' => 'Vitrinde',
        ]));
    }
}

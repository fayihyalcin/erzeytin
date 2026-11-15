<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminImageUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_image_is_compressed_and_stored(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $image = $this->largeJpegUpload();
        $originalSize = $image->getSize();

        $response = $this
            ->actingAs($user)
            ->postJson(route('admin.images.store'), [
                'type' => 'product',
                'image' => $image,
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('compressed_size', fn (int $size) => $size <= 512000 && $size < $originalSize)
            ->assertJsonPath('path', fn (string $path) => str_starts_with($path, 'products/'));

        Storage::disk('public')->assertExists($response->json('path'));
    }

    public function test_category_image_is_compressed_and_stored(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $image = $this->largeJpegUpload();

        $response = $this
            ->actingAs($user)
            ->postJson(route('admin.images.store'), [
                'type' => 'category',
                'image' => $image,
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('compressed_size', fn (int $size) => $size <= 512000)
            ->assertJsonPath('path', fn (string $path) => str_starts_with($path, 'categories/'));

        Storage::disk('public')->assertExists($response->json('path'));
    }

    private function largeJpegUpload(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'large-product-image').'.jpg';
        $image = imagecreatetruecolor(1800, 1800);

        for ($y = 0; $y < 1800; $y += 4) {
            for ($x = 0; $x < 1800; $x += 4) {
                $color = imagecolorallocate($image, ($x * 7 + $y * 3) % 255, ($x * 5 + $y * 11) % 255, ($x * 13 + $y * 17) % 255);
                imagefilledrectangle($image, $x, $y, $x + 3, $y + 3, $color);
            }
        }

        imagejpeg($image, $path, 100);
        imagedestroy($image);

        return new UploadedFile($path, 'large-product-image.jpg', 'image/jpeg', null, true);
    }
}

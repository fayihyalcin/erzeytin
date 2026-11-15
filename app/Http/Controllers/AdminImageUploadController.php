<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminImageUploadController extends Controller
{
    private const TARGET_BYTES = 512000;
    private const MAX_WIDTH = 1600;
    private const MAX_HEIGHT = 1600;

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'type' => ['required', 'in:product,category,setting,slider'],
        ]);

        /** @var UploadedFile $image */
        $image = $validated['image'];
        $folder = match ($validated['type']) {
            'category' => 'categories',
            'setting' => 'settings',
            'slider' => 'sliders',
            default => 'products',
        };
        $originalSize = $image->getSize() ?: 0;
        $encoded = $this->compressImage($image);
        $filename = $folder.'/'.Str::uuid().'.jpg';

        Storage::disk('public')->put($filename, $encoded);

        return response()->json([
            'path' => $filename,
            'url' => Storage::url($filename),
            'original_size' => $originalSize,
            'compressed_size' => strlen($encoded),
            'saved_percent' => $originalSize > 0
                ? max(0, round((1 - (strlen($encoded) / $originalSize)) * 100))
                : 0,
        ]);
    }

    private function compressImage(UploadedFile $image): string
    {
        [$width, $height, $type] = getimagesize($image->getRealPath());
        $source = match ($type) {
            IMAGETYPE_JPEG => imagecreatefromjpeg($image->getRealPath()),
            IMAGETYPE_PNG => imagecreatefrompng($image->getRealPath()),
            IMAGETYPE_WEBP => imagecreatefromwebp($image->getRealPath()),
            default => null,
        };

        abort_if(! $source, 422, 'Görsel işlenemedi.');

        $baseRatio = min(self::MAX_WIDTH / $width, self::MAX_HEIGHT / $height, 1);
        $lastEncoded = '';

        foreach ([1, 0.88, 0.76, 0.64, 0.52] as $scale) {
            $targetWidth = max(1, (int) floor($width * $baseRatio * $scale));
            $targetHeight = max(1, (int) floor($height * $baseRatio * $scale));
            $canvas = imagecreatetruecolor($targetWidth, $targetHeight);

            imagefill($canvas, 0, 0, imagecolorallocate($canvas, 255, 255, 255));
            imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

            foreach ([82, 76, 70, 64, 58, 52, 46, 40] as $quality) {
                ob_start();
                imagejpeg($canvas, null, $quality);
                $encoded = ob_get_clean();
                $lastEncoded = $encoded;

                if (strlen($encoded) <= self::TARGET_BYTES) {
                    imagedestroy($source);
                    imagedestroy($canvas);

                    return $encoded;
                }
            }

            imagedestroy($canvas);
        }

        if ($lastEncoded !== '') {
            imagedestroy($source);

            return $lastEncoded;
        }

        imagedestroy($source);

        abort(422, 'Görsel sıkıştırılamadı.');
    }
}

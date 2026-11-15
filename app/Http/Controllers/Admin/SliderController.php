<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Slider;
use Illuminate\Http\Request;

class SliderController extends Controller
{
    public function index()
    {
        return view('admin.sliders', [
            'sliders' => Slider::query()->orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request)
    {
        Slider::create($this->validatedData($request));

        return to_route('admin.sliders.index')->with('status', 'Slider eklendi.');
    }

    public function update(Request $request, Slider $slider)
    {
        $slider->update($this->validatedData($request));

        return to_route('admin.sliders.index')->with('status', 'Slider güncellendi.');
    }

    public function destroy(Slider $slider)
    {
        $slider->delete();

        return to_route('admin.sliders.index')->with('status', 'Slider silindi.');
    }

    private function validatedData(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:191'],
            'description' => ['nullable', 'string', 'max:700'],
            'image_path' => ['nullable', 'string', 'max:255'],
            'product_image_path' => ['nullable', 'string', 'max:255'],
            'button_text' => ['nullable', 'string', 'max:80'],
            'button_url' => ['nullable', 'string', 'max:255'],
            'badge' => ['nullable', 'string', 'max:80'],
            'tin_brand' => ['required', 'string', 'max:30'],
            'tin_title' => ['required', 'string', 'max:120'],
            'tin_size' => ['required', 'string', 'max:30'],
            'status' => ['required', 'in:Aktif,Pasif'],
            'sort_order' => ['required', 'integer', 'min:1'],
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\HomeSection;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class HomeSectionController extends Controller
{
    public function index()
    {
        return view('admin.home-sections', [
            'sections' => HomeSection::with('category')->orderBy('sort_order')->get(),
            'categories' => Category::query()->where('status', 'Aktif')->orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request)
    {
        HomeSection::create($this->validatedData($request));

        return to_route('admin.home-sections.index')->with('status', 'Vitrin bölümü eklendi.');
    }

    public function update(Request $request, HomeSection $homeSection)
    {
        $homeSection->update($this->validatedData($request, $homeSection));

        return to_route('admin.home-sections.index')->with('status', 'Vitrin bölümü güncellendi.');
    }

    public function destroy(HomeSection $homeSection)
    {
        $homeSection->delete();

        return to_route('admin.home-sections.index')->with('status', 'Vitrin bölümü silindi.');
    }

    private function validatedData(Request $request, ?HomeSection $homeSection = null): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:191'],
            'section_key' => [
                'nullable',
                'string',
                'max:191',
                Rule::unique('home_sections', 'section_key')->ignore($homeSection?->id),
            ],
            'category_id' => ['nullable', 'exists:categories,id'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'badge_label' => ['nullable', 'string', 'max:80'],
            'product_limit' => ['required', 'integer', 'min:1', 'max:12'],
            'style' => ['required', 'in:default,best,featured,sale'],
            'status' => ['required', 'in:Aktif,Pasif'],
            'sort_order' => ['required', 'integer', 'min:1'],
            'show_compare_price' => ['nullable', 'boolean'],
        ]);

        $data['section_key'] = filled($data['section_key'] ?? null)
            ? Str::slug($data['section_key'])
            : Str::slug($data['title']).'-'.now()->format('His');
        $data['show_compare_price'] = $request->boolean('show_compare_price');
        $data['category_id'] = $data['category_id'] ?: null;

        return $data;
    }
}

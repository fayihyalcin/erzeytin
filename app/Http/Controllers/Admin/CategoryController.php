<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::withCount('products')
            ->with('parent')
            ->orderBy('sort_order')
            ->get();

        return view('admin.categories', [
            'categories' => $categories,
            'parents' => Category::orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request)
    {
        Category::create($this->validatedData($request));

        return to_route('admin.categories.index')->with('status', 'Kategori eklendi.');
    }

    public function update(Request $request, Category $category)
    {
        $category->update($this->validatedData($request, $category));

        return to_route('admin.categories.index')->with('status', 'Kategori güncellendi.');
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return to_route('admin.categories.index')->with('status', 'Kategori silindi.');
    }

    private function validatedData(Request $request, ?Category $category = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:191'],
            'slug' => ['nullable', 'string', 'max:191', 'unique:categories,slug,'.($category?->id ?? 'NULL')],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'status' => ['required', 'in:Aktif,Pasif'],
            'visibility' => ['required', 'in:Vitrinde,Menüde,Gizli'],
            'sort_order' => ['required', 'integer', 'min:1'],
            'image_path' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        if ($category && (int) ($data['parent_id'] ?? 0) === $category->id) {
            $data['parent_id'] = null;
        }

        $data['slug'] = filled($data['slug'] ?? null)
            ? $data['slug']
            : Str::slug($data['name']);

        return $data;
    }
}

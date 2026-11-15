<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index()
    {
        return view('admin.products', [
            'products' => Product::with('category')->latest()->get(),
            'categories' => Category::orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request)
    {
        Product::create($this->validatedData($request));

        return to_route('admin.products.index')->with('status', 'Ürün eklendi.');
    }

    public function update(Request $request, Product $product)
    {
        $product->update($this->validatedData($request, $product));

        return to_route('admin.products.index')->with('status', 'Ürün güncellendi.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return to_route('admin.products.index')->with('status', 'Ürün silindi.');
    }

    private function validatedData(Request $request, ?Product $product = null): array
    {
        $data = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:191'],
            'slug' => ['nullable', 'string', 'max:191', 'unique:products,slug,'.($product?->id ?? 'NULL')],
            'sku' => ['required', 'string', 'max:191', 'unique:products,sku,'.($product?->id ?? 'NULL')],
            'price' => ['required', 'numeric', 'min:0'],
            'compare_price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'in:Aktif,Pasif,Taslak'],
            'visibility' => ['required', 'in:Vitrinde,Menüde,Gizli'],
            'image_path' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $data['slug'] = filled($data['slug'] ?? null)
            ? $data['slug']
            : Str::slug($data['name']);

        return $data;
    }
}

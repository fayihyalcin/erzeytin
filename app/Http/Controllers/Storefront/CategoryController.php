<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;

class CategoryController extends Controller
{
    public function show(Category $category)
    {
        abort_unless($category->status === 'Aktif' && $category->visibility !== 'Gizli', 404);

        $products = Product::with('category')
            ->where('category_id', $category->id)
            ->where('status', 'Aktif')
            ->where('visibility', '!=', 'Gizli')
            ->latest()
            ->paginate(12);

        return view('categories.show', [
            'category' => $category,
            'products' => $products,
        ]);
    }
}

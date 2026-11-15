<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\CartService;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(CartService $cartService)
    {
        $cart = $cartService->summary();

        return view('cart.index', [
            'cartItems' => $cart['items'],
            'subtotal' => $cart['subtotal'],
            'totalQuantity' => $cart['totalQuantity'],
        ]);
    }

    public function store(Request $request, Product $product)
    {
        abort_unless($this->isPurchasable($product), 404);

        $data = $request->validate([
            'quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
        ]);

        $cart = session('cart', []);
        $quantity = (int) ($data['quantity'] ?? 1);
        $current = (int) ($cart[$product->id] ?? 0);
        $cart[$product->id] = min($product->stock, $current + $quantity);

        session(['cart' => $cart]);

        return to_route('cart.index')->with('status', 'Ürün sepete eklendi.');
    }

    public function update(Request $request, Product $product)
    {
        abort_unless($this->isPurchasable($product), 404);

        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $cart = session('cart', []);
        $cart[$product->id] = min($product->stock, (int) $data['quantity']);

        session(['cart' => $cart]);

        return to_route('cart.index')->with('status', 'Sepet güncellendi.');
    }

    public function destroy(Product $product)
    {
        $cart = session('cart', []);
        unset($cart[$product->id]);
        session(['cart' => $cart]);

        return to_route('cart.index')->with('status', 'Ürün sepetten çıkarıldı.');
    }

    public function clear()
    {
        session()->forget('cart');

        return to_route('cart.index')->with('status', 'Sepet temizlendi.');
    }

    private function isPurchasable(Product $product): bool
    {
        return $product->status === 'Aktif' && $product->visibility !== 'Gizli' && $product->stock > 0;
    }
}

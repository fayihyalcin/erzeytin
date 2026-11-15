<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Collection;

class CartService
{
    public function summary(): array
    {
        $cart = collect(session('cart', []))
            ->mapWithKeys(fn ($quantity, $id) => [(int) $id => max(1, (int) $quantity)])
            ->filter();

        if ($cart->isEmpty()) {
            return ['items' => collect(), 'subtotal' => 0.0, 'totalQuantity' => 0];
        }

        $products = Product::with('category')
            ->whereIn('id', $cart->keys())
            ->where('status', 'Aktif')
            ->where('visibility', '!=', 'Gizli')
            ->get()
            ->keyBy('id');

        $items = $cart->map(function (int $quantity, int $id) use ($products) {
            $product = $products->get($id);

            if (! $product) {
                return null;
            }

            $quantity = min($quantity, max(1, (int) $product->stock));
            $lineTotal = (float) $product->price * $quantity;

            return [
                'product' => $product,
                'quantity' => $quantity,
                'line_total' => $lineTotal,
            ];
        })->filter()->values();

        return [
            'items' => $items,
            'subtotal' => (float) $items->sum('line_total'),
            'totalQuantity' => (int) $items->sum('quantity'),
        ];
    }

    public function clear(): void
    {
        session()->forget('cart');
    }
}

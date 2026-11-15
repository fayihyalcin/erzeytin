<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index()
    {
        return view('admin.orders', [
            'orders' => Order::latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        Order::create($this->validatedData($request));

        return to_route('admin.orders.index')->with('status', 'Sipariş eklendi.');
    }

    public function update(Request $request, Order $order)
    {
        $order->update($this->validatedData($request, $order));

        return to_route('admin.orders.index')->with('status', 'Sipariş güncellendi.');
    }

    public function destroy(Order $order)
    {
        $order->delete();

        return to_route('admin.orders.index')->with('status', 'Sipariş silindi.');
    }

    private function validatedData(Request $request, ?Order $order = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:191', 'unique:orders,code,'.($order?->id ?? 'NULL')],
            'customer_name' => ['required', 'string', 'max:191'],
            'phone' => ['nullable', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'item_count' => ['required', 'integer', 'min:0'],
            'products_summary' => ['nullable', 'string'],
            'total' => ['required', 'numeric', 'min:0'],
            'payment_status' => ['required', 'in:Ödendi,Bekliyor,İade edildi'],
            'payment_method' => ['required', 'in:Kredi Kartı,Havale,Kapıda Ödeme'],
            'status' => ['required', 'in:Yeni,Ödeme Bekliyor,Hazırlanıyor,Kargoda,Tamamlandı,İptal'],
            'cargo_status' => ['required', 'string', 'max:191'],
            'note' => ['nullable', 'string'],
        ]);
    }
}

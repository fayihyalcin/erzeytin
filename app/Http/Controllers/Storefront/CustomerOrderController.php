<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CustomerOrderController extends Controller
{
    public function index()
    {
        return view('customer.orders.index', [
            'orders' => Order::with('items')
                ->where('user_id', Auth::id())
                ->latest()
                ->get(),
        ]);
    }

    public function show(Order $order)
    {
        abort_unless($order->user_id === Auth::id(), 403);

        return view('customer.orders.show', [
            'order' => $order->load('items.product'),
        ]);
    }

    public function uploadReceipt(Request $request, Order $order)
    {
        abort_unless($order->user_id === Auth::id(), 403);

        $data = $request->validate([
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf,webp', 'max:4096'],
        ]);

        $path = $data['receipt']->store('receipts', 'public');

        $order->update([
            'receipt_path' => $path,
            'payment_status' => 'Bekliyor',
            'status' => 'Ödeme Bekliyor',
            'note' => trim(($order->note ? $order->note."\n" : '').'Dekont müşteri tarafından yüklendi.'),
        ]);

        return back()->with('status', 'Dekont yüklendi. Admin kontrolünden sonra sipariş durumunuz güncellenecek.');
    }
}

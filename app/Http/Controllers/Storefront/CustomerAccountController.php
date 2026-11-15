<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class CustomerAccountController extends Controller
{
    public function dashboard()
    {
        $orders = $this->customerOrders()->latest()->get();

        return view('customer.dashboard', [
            'orders' => $orders,
            'latestOrders' => $orders->take(4),
            'totalOrders' => $orders->count(),
            'pendingPayments' => $orders->where('payment_status', 'Bekliyor')->count(),
            'paidOrders' => $orders->where('payment_status', 'Ödendi')->count(),
            'totalSpent' => $orders->where('payment_status', 'Ödendi')->sum(fn (Order $order) => (float) $order->total),
        ]);
    }

    public function payments()
    {
        return view('customer.payments', [
            'orders' => $this->customerOrders()->latest()->get(),
        ]);
    }

    public function settings()
    {
        return view('customer.settings', [
            'user' => Auth::user(),
        ]);
    }

    public function updateSettings(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique(User::class)->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'current_password' => ['nullable', 'required_with:password', 'current_password'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
        ]);

        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return to_route('customer.settings')->with('status', 'Hesap bilgileriniz güncellendi.');
    }

    private function customerOrders()
    {
        return Order::with('items')->where('user_id', Auth::id());
    }
}

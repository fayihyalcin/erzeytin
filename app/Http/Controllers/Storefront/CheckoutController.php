<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\SiteSetting;
use App\Models\User;
use App\Services\CartService;
use App\Services\PaytrService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class CheckoutController extends Controller
{
    public function show(CartService $cartService)
    {
        $cart = $cartService->summary();

        if ($cart['items']->isEmpty()) {
            return to_route('cart.index')->with('status', 'Ödeme için sepetinize ürün ekleyin.');
        }

        return view('checkout.show', [
            'cartItems' => $cart['items'],
            'subtotal' => $cart['subtotal'],
            'totalQuantity' => $cart['totalQuantity'],
            'settings' => SiteSetting::current(),
        ]);
    }

    public function store(Request $request, CartService $cartService)
    {
        $cart = $cartService->summary();

        if ($cart['items']->isEmpty()) {
            return to_route('cart.index')->with('status', 'Ödeme için sepetinize ürün ekleyin.');
        }

        $rules = [
            'name' => ['required', 'string', 'max:191'],
            'email' => ['required', 'email', 'max:191'],
            'phone' => ['required', 'string', 'max:50'],
            'city' => ['required', 'string', 'max:100'],
            'address' => ['required', 'string', 'max:500'],
            'payment_method' => ['required', Rule::in(['transfer', 'card'])],
            'note' => ['nullable', 'string', 'max:1000'],
        ];

        if (! Auth::check()) {
            $rules['password'] = ['required', 'confirmed', Password::defaults()];
        }

        $data = $request->validate($rules);

        $user = $this->findOrCreateCustomer($data);

        $order = DB::transaction(function () use ($cart, $data, $user) {
            $paymentMethod = $data['payment_method'] === 'card' ? 'Kredi Kartı' : 'Havale';

            $order = Order::create([
                'code' => $this->newOrderCode(),
                'user_id' => $user->id,
                'customer_name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'city' => $data['city'],
                'address' => $data['address'],
                'item_count' => $cart['totalQuantity'],
                'products_summary' => $cart['items']->map(fn ($item) => $item['product']->name.' x '.$item['quantity'])->implode(', '),
                'total' => $cart['subtotal'],
                'payment_status' => 'Bekliyor',
                'payment_method' => $paymentMethod,
                'payment_provider' => $data['payment_method'] === 'card' ? 'PayTR' : 'Havale/EFT',
                'status' => 'Ödeme Bekliyor',
                'cargo_status' => 'Ödeme bekleniyor',
                'note' => $data['note'] ?? null,
            ]);

            foreach ($cart['items'] as $item) {
                $product = $item['product'];
                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'total' => $item['line_total'],
                ]);
            }

            return $order;
        });

        Auth::login($user);

        if ($data['payment_method'] === 'transfer') {
            $cartService->clear();

            return to_route('checkout.transfer', $order)->with('status', 'Siparişiniz alındı. Havale dekontunu yükleyerek süreci takip edebilirsiniz.');
        }

        $cartService->clear();

        return to_route('checkout.paytr', $order);
    }

    public function paytr(Request $request, Order $order, PaytrService $paytrService)
    {
        abort_unless(Auth::id() === $order->user_id, 403);

        try {
            $token = $paytrService->createIframeToken($order->load('items'), $this->paytrBasket($order), SiteSetting::current(), $request->ip());
        } catch (\RuntimeException $exception) {
            $order->update(['note' => trim(($order->note ? $order->note."\n" : '').'PayTR hata: '.$exception->getMessage())]);

            return to_route('customer.orders.show', $order)->withErrors(['payment' => $exception->getMessage()]);
        }

        $order->update(['paytr_token' => $token]);

        return view('checkout.paytr', [
            'order' => $order->load('items'),
            'iframeUrl' => $paytrService->iframeUrl($token),
        ]);
    }

    public function result(Request $request, Order $order, string $result)
    {
        $order->load('items');

        return view('checkout.result', [
            'order' => $order,
            'result' => $result,
            'message' => $result === 'success'
                ? 'Ödeme işleminiz PayTR tarafından alındı. Kesin ödeme durumu bildirim geldiğinde siparişinize işlenecek.'
                : 'Ödeme tamamlanamadı. Kart bilgilerini kontrol ederek yeniden deneyebilirsiniz.',
        ]);
    }

    public function transfer(Order $order)
    {
        abort_unless(Auth::id() === $order->user_id, 403);

        return view('checkout.transfer', [
            'order' => $order->load('items'),
            'settings' => SiteSetting::current(),
        ]);
    }

    private function findOrCreateCustomer(array $data): User
    {
        if (Auth::check()) {
            $user = Auth::user();

            if ($user->email !== $data['email'] && User::where('email', $data['email'])->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'email' => 'Bu e-posta adresi başka bir hesaba kayıtlı. Lütfen giriş yaparak devam edin.',
                ]);
            }

            $user->fill([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
            ])->save();

            return $user;
        }

        $existingUser = User::where('email', $data['email'])->first();

        if ($existingUser) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => 'Bu e-posta adresi kayıtlı. Sipariş vermek için lütfen önce giriş yapın.',
            ]);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            // User modelinde 'password' => 'hashed' cast'i olduğundan düz metin verilir; model bir kez hash'ler.
            'password' => $data['password'],
        ]);

        $user->fill([
            'name' => $user->name ?: $data['name'],
            'phone' => $user->phone ?: $data['phone'],
        ])->save();

        return $user;
    }

    private function newOrderCode(): string
    {
        do {
            $code = 'ERZ-'.now()->format('YmdHis').'-'.Str::upper(Str::random(4));
        } while (Order::where('code', $code)->exists());

        return $code;
    }

    private function paytrBasket(Order $order): array
    {
        return $order->items->map(fn ($item) => [
            $item->product_name,
            number_format((float) $item->unit_price, 2, '.', ''),
            (int) $item->quantity,
        ])->values()->all();
    }
}

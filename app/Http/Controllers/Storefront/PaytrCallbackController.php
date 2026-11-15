<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\SiteSetting;
use App\Services\PaytrService;
use Illuminate\Http\Request;

class PaytrCallbackController extends Controller
{
    public function __invoke(Request $request, PaytrService $paytrService)
    {
        $settings = SiteSetting::current();

        if (! $paytrService->verifyCallback($request->all(), $settings)) {
            abort(403);
        }

        $order = Order::where('code', $request->input('merchant_oid'))->first();

        if ($order) {
            if ($order->payment_status === 'Ödendi') {
                return response('OK');
            }

            if ($request->input('status') === 'success') {
                $order->update([
                    'payment_status' => 'Ödendi',
                    'payment_reference' => $request->input('total_amount'),
                    'paid_at' => now(),
                    'status' => 'Hazırlanıyor',
                    'cargo_status' => 'Hazırlanıyor',
                ]);
            } else {
                $order->update([
                    'payment_status' => 'Bekliyor',
                    'status' => 'İptal',
                    'cargo_status' => 'Ödeme bekleniyor',
                    'note' => trim(($order->note ? $order->note."\n" : '').'PayTR başarısız ödeme bildirimi: '.$request->input('failed_reason_msg')),
                ]);
            }
        }

        return response('OK');
    }
}

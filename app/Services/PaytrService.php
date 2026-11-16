<?php

namespace App\Services;

use App\Models\Order;
use App\Models\SiteSetting;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\URL;

class PaytrService
{
    public const TOKEN_ENDPOINT = 'https://www.paytr.com/odeme/api/get-token';
    public const IFRAME_BASE_URL = 'https://www.paytr.com/odeme/guvenli/';
    public function createIframeToken(Order $order, array $items, SiteSetting $settings, string $userIp): string
    {
        $this->ensureConfigured($settings);

        $merchantId = (string) $settings->paytr_merchant_id;
        $merchantKey = (string) $settings->paytr_merchant_key;
        $merchantSalt = (string) $settings->paytr_merchant_salt;
        $email = (string) $order->email;
        $amount = (int) round((float) $order->total * 100);
        $basket = base64_encode(json_encode($items, JSON_UNESCAPED_UNICODE));
        $testMode = $settings->paytr_test_mode ? '1' : '0';
        $noInstallment = '0';
        $maxInstallment = '0';
        $currency = 'TL';

        $merchantOid = self::merchantOid($order->code);

        $hashStr = $merchantId.$userIp.$merchantOid.$email.$amount.$basket.$noInstallment.$maxInstallment.$currency.$testMode;
        $token = base64_encode(hash_hmac('sha256', $hashStr.$merchantSalt, $merchantKey, true));

        $payload = [
            'merchant_id' => $merchantId,
            'user_ip' => $userIp,
            'merchant_oid' => $merchantOid,
            'email' => $email,
            'payment_amount' => $amount,
            'paytr_token' => $token,
            'user_basket' => $basket,
            'debug_on' => config('app.debug') ? '1' : '0',
            'no_installment' => $noInstallment,
            'max_installment' => $maxInstallment,
            'user_name' => $order->customer_name,
            'user_address' => $order->address ?: 'Adres belirtilmedi',
            'user_phone' => $order->phone ?: '0000000000',
            'merchant_ok_url' => URL::temporarySignedRoute('checkout.result', now()->addHours(2), ['order' => $order, 'result' => 'success']),
            'merchant_fail_url' => URL::temporarySignedRoute('checkout.result', now()->addHours(2), ['order' => $order, 'result' => 'failed']),
            'timeout_limit' => '30',
            'currency' => $currency,
            'test_mode' => $testMode,
            'lang' => 'tr',
        ];

        try {
            $response = Http::asForm()
                ->timeout(20)
                ->post(self::TOKEN_ENDPOINT, $payload)
                ->throw()
                ->json();
        } catch (RequestException $exception) {
            throw new \RuntimeException('PayTR bağlantısı kurulamadı. Lütfen entegrasyon bilgilerini kontrol edin.', previous: $exception);
        }

        if (($response['status'] ?? null) !== 'success' || empty($response['token'])) {
            $reason = $response['reason'] ?? 'PayTR ödeme oturumu oluşturulamadı.';

            throw new \RuntimeException($reason);
        }

        return (string) $response['token'];
    }

    public function verifyCallback(array $payload, SiteSetting $settings): bool
    {
        $hash = $payload['hash'] ?? '';
        $hashStr = ($payload['merchant_oid'] ?? '').$settings->paytr_merchant_salt.($payload['status'] ?? '').($payload['total_amount'] ?? '');
        $expected = base64_encode(hash_hmac('sha256', $hashStr, (string) $settings->paytr_merchant_key, true));

        return hash_equals($expected, (string) $hash);
    }

    public function iframeUrl(string $token): string
    {
        return self::IFRAME_BASE_URL.$token;
    }

    private function ensureConfigured(SiteSetting $settings): void
    {
        if (! $settings->paytr_enabled || ! $settings->paytr_merchant_id || ! $settings->paytr_merchant_key || ! $settings->paytr_merchant_salt) {
            throw new \RuntimeException('PayTR ayarları eksik. Admin panelinden Merchant ID, Key ve Salt bilgilerini girin.');
        }
    }

    /**
     * PayTR merchant_oid yalnız harf ve rakam kabul eder; sipariş kodundaki
     * tire gibi karakterler ayıklanır. Geri çağrıda sipariş aynı kuralla eşlenir.
     */
    public static function merchantOid(string $orderCode): string
    {
        return preg_replace('/[^A-Za-z0-9]/', '', $orderCode);
    }
}

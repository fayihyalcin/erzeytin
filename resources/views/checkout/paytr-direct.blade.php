@extends('layouts.storefront')

@section('title', 'PayTR Kredi Kartı Ödeme - '.($settings->site_title ?: 'Er Zeytin Yağı'))

@section('content')
    <section class="checkout-page checkout-frame-page container-wide">
        <nav class="breadcrumb-line product-breadcrumb" aria-label="Sayfa yolu">
            <a href="{{ route('home') }}">Anasayfa</a>
            <span>/</span>
            <a href="{{ route('customer.orders.show', $order) }}">{{ $order->code }}</a>
            <span>/</span>
            <strong>Kredi Kartı Ödeme</strong>
        </nav>

        <div class="checkout-frame-head">
            <div>
                <span>PAYTR DİREKT API</span>
                <h1>Güvenli Kart Ödemesi</h1>
                <p>Kart bilgileriniz Er Zeytinyağı sunucusuna kaydedilmez; form doğrudan PayTR güvenli ödeme sistemine gönderilir.</p>
            </div>
            <strong>₺{{ number_format((float) $order->total, 2, ',', '.') }}</strong>
        </div>

        <form class="checkout-form-panel paytr-card-form" method="POST" action="{{ $paytrEndpoint }}">
            @foreach ($payload as $name => $value)
                <input type="hidden" name="{{ $name }}" value="{{ $value }}">
            @endforeach

            <div class="checkout-panel-head">
                <span>KART BİLGİLERİ</span>
                <h2>Sipariş {{ $order->code }}</h2>
            </div>

            <label>
                <span>Kart Üzerindeki İsim</span>
                <input type="text" name="cc_owner" autocomplete="cc-name" required>
            </label>

            <label>
                <span>Kart Numarası</span>
                <input type="text" name="card_number" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" required>
            </label>

            <div class="checkout-fields-three">
                <label>
                    <span>Ay</span>
                    <input type="text" name="expiry_month" inputmode="numeric" autocomplete="cc-exp-month" placeholder="12" required>
                </label>
                <label>
                    <span>Yıl</span>
                    <input type="text" name="expiry_year" inputmode="numeric" autocomplete="cc-exp-year" placeholder="30" required>
                </label>
                <label>
                    <span>CVV</span>
                    <input type="password" name="cvv" inputmode="numeric" autocomplete="cc-csc" placeholder="000" required>
                </label>
            </div>

            <button class="cart-checkout customer-settings-submit" type="submit">PayTR ile Öde</button>
        </form>
    </section>
@endsection

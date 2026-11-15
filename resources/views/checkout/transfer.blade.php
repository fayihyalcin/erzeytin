@extends('layouts.storefront')

@section('title', 'Havale Bilgileri - '.($settings->site_title ?: 'Er Zeytin Yağı'))

@section('content')
    <section class="checkout-page container-wide">
        <div class="checkout-done-layout">
            <div class="checkout-form-panel">
                @if (session('status'))
                    <div class="cart-alert">{{ session('status') }}</div>
                @endif

                <div class="checkout-panel-head">
                    <span>HAVALE / EFT</span>
                    <h1>Siparişiniz oluşturuldu</h1>
                </div>
                <p class="checkout-lead">Sipariş numaranız <strong>{{ $order->code }}</strong>. Havale açıklamasına bu numarayı yazıp dekontunuzu müşteri panelinden yükleyebilirsiniz.</p>

                <div class="bank-preview bank-preview-large">
                    <strong>{{ $settings->bank_name ?: 'Banka bilgisi admin panelinden eklenecek' }}</strong>
                    <span>{{ $settings->bank_branch }}</span>
                    <span>{{ $settings->bank_account_holder ?: $settings->company_name }}</span>
                    <code>{{ $settings->bank_iban ?: 'IBAN girilmedi' }}</code>
                    @if ($settings->bank_description)
                        <p>{{ $settings->bank_description }}</p>
                    @endif
                </div>

                <a class="cart-checkout checkout-link-button" href="{{ route('customer.orders.show', $order) }}">Dekont Yükle ve Siparişi Takip Et</a>
            </div>

            <aside class="cart-summary">
                <span>SİPARİŞ</span>
                <h2>{{ $order->code }}</h2>
                <div>
                    <small>Durum</small>
                    <strong>{{ $order->status }}</strong>
                </div>
                <div>
                    <small>Ödeme</small>
                    <strong>{{ $order->payment_status }}</strong>
                </div>
                <div class="cart-summary-total">
                    <small>Toplam</small>
                    <strong>₺{{ number_format((float) $order->total, 2, ',', '.') }}</strong>
                </div>
            </aside>
        </div>
    </section>
@endsection

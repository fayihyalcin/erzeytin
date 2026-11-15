@extends('layouts.storefront')

@section('title', 'Ödeme Sonucu - '.($settings->site_title ?: 'Er Zeytin Yağı'))

@section('content')
    <section class="checkout-page container-wide">
        <div class="checkout-done-layout">
            <div class="checkout-form-panel">
                <div class="checkout-panel-head">
                    <span>ÖDEME SONUCU</span>
                    <h1>{{ $result === 'success' ? 'Ödeme İşlemi Alındı' : 'Ödeme Tamamlanamadı' }}</h1>
                </div>

                <p class="checkout-lead">{{ $message }}</p>

                <div class="order-status-grid">
                    <span><strong>Sipariş</strong><small>{{ $order->code }}</small></span>
                    <span><strong>Ödeme</strong><small>{{ $order->payment_status }}</small></span>
                    <span><strong>Durum</strong><small>{{ $order->status }}</small></span>
                </div>

                <div class="checkout-result-actions">
                    <a class="cart-checkout checkout-link-button" href="{{ route('customer.orders.show', $order) }}">Sipariş Detayına Git</a>
                    @if ($result !== 'success')
                        <a class="receipt-link" href="{{ route('checkout.paytr', $order) }}">Tekrar Dene</a>
                    @endif
                </div>
            </div>

            <aside class="cart-summary">
                <span>TOPLAM</span>
                <h2>Özet</h2>
                <div>
                    <small>Ödeme Tipi</small>
                    <strong>{{ $order->payment_method }}</strong>
                </div>
                <div>
                    <small>Ürün Adedi</small>
                    <strong>{{ $order->item_count }}</strong>
                </div>
                <div class="cart-summary-total">
                    <small>Genel Toplam</small>
                    <strong>₺{{ number_format((float) $order->total, 2, ',', '.') }}</strong>
                </div>
            </aside>
        </div>
    </section>
@endsection

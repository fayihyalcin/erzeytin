@extends('layouts.storefront')

@section('title', $order->code.' - Sipariş Detayı')

@section('content')
    <section class="customer-account-page container-wide">
        @include('customer.partials.sidebar')

        <div class="customer-account-content">
            @if (session('status'))
                <div class="cart-alert">{{ session('status') }}</div>
            @endif

            @if ($errors->any())
                <div class="cart-alert is-error">{{ $errors->first() }}</div>
            @endif

            <div class="checkout-done-layout">
                <div class="checkout-form-panel">
                    <div class="checkout-panel-head">
                        <span>SİPARİŞ DETAYI</span>
                        <h1>{{ $order->code }}</h1>
                    </div>

                    <div class="order-status-grid">
                        <span><strong>Ödeme</strong><small>{{ $order->payment_status }}</small></span>
                        <span><strong>Sipariş</strong><small>{{ $order->status }}</small></span>
                        <span><strong>Kargo</strong><small>{{ $order->cargo_status }}</small></span>
                    </div>

                    <div class="customer-order-items">
                        @foreach ($order->items as $item)
                            <div>
                                <span>{{ $item->product_name }} x {{ $item->quantity }}</span>
                                <strong>₺{{ number_format((float) $item->total, 2, ',', '.') }}</strong>
                            </div>
                        @endforeach
                    </div>

                    @if ($order->payment_method === 'Havale')
                        <form class="receipt-upload" method="POST" action="{{ route('customer.orders.receipt', $order) }}" enctype="multipart/form-data">
                            @csrf
                            <label>
                                <span>Dekont Yükle</span>
                                <input type="file" name="receipt" accept="image/jpeg,image/png,image/webp,application/pdf" required>
                            </label>
                            <button type="submit" class="cart-checkout">Dekontu Gönder</button>
                        </form>
                        @if ($order->receipt_path)
                            <a class="receipt-link" href="{{ Storage::url($order->receipt_path) }}" target="_blank" rel="noreferrer">Yüklenen dekontu görüntüle</a>
                        @endif
                    @endif
                </div>

                <aside class="cart-summary">
                    <span>TOPLAM</span>
                    <h2>Özet</h2>
                    <div>
                        <small>Ad Soyad</small>
                        <strong>{{ $order->customer_name }}</strong>
                    </div>
                    <div>
                        <small>Telefon</small>
                        <strong>{{ $order->phone }}</strong>
                    </div>
                    <div>
                        <small>Ödeme Tipi</small>
                        <strong>{{ $order->payment_method }}</strong>
                    </div>
                    <div class="cart-summary-total">
                        <small>Genel Toplam</small>
                        <strong>₺{{ number_format((float) $order->total, 2, ',', '.') }}</strong>
                    </div>
                </aside>
            </div>
        </div>
    </section>
@endsection

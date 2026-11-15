@extends('layouts.storefront')

@section('title', 'Siparişlerim - '.($settings->site_title ?: 'Er Zeytin Yağı'))

@section('content')
    <section class="customer-account-page container-wide">
        @include('customer.partials.sidebar')

        <div class="customer-account-content">
            <div class="customer-orders-head">
                <div>
                    <span>HESABIM</span>
                    <h1>Siparişlerim</h1>
                </div>
                <a href="{{ route('home') }}#products-results">Alışverişe Devam Et</a>
            </div>

            <div class="customer-order-list">
                @forelse ($orders as $order)
                    <article class="customer-order-card">
                        <div>
                            <span>{{ $order->created_at->format('d.m.Y H:i') }}</span>
                            <h2>{{ $order->code }}</h2>
                            <p>{{ $order->products_summary }}</p>
                        </div>
                        <strong>₺{{ number_format((float) $order->total, 2, ',', '.') }}</strong>
                        <small>{{ $order->payment_status }} · {{ $order->status }}</small>
                        <a href="{{ route('customer.orders.show', $order) }}">Detay</a>
                    </article>
                @empty
                    <div class="cart-empty">
                        <strong>Henüz siparişiniz yok.</strong>
                        <span>Sepetinizi oluşturduğunuzda siparişleriniz burada listelenir.</span>
                        <a href="{{ route('home') }}#products-results">Ürünleri İncele</a>
                    </div>
                @endforelse
            </div>
        </div>
    </section>
@endsection

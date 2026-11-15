@extends('layouts.storefront')

@section('title', 'Hesabım - '.($settings->site_title ?: 'Er Zeytin Yağı'))

@section('content')
    <section class="customer-account-page container-wide">
        @include('customer.partials.sidebar')

        <div class="customer-account-content">
            <div class="customer-orders-head">
                <div>
                    <span>MÜŞTERİ PANELİ</span>
                    <h1>Hoş geldiniz, {{ auth()->user()->name }}</h1>
                </div>
                <a href="{{ route('home') }}#products-results">Alışverişe Devam Et</a>
            </div>

            <div class="customer-stat-grid">
                <article>
                    <span>Toplam Sipariş</span>
                    <strong>{{ $totalOrders }}</strong>
                </article>
                <article>
                    <span>Bekleyen Ödeme</span>
                    <strong>{{ $pendingPayments }}</strong>
                </article>
                <article>
                    <span>Ödenen Sipariş</span>
                    <strong>{{ $paidOrders }}</strong>
                </article>
                <article>
                    <span>Toplam Harcama</span>
                    <strong>₺{{ number_format((float) $totalSpent, 2, ',', '.') }}</strong>
                </article>
            </div>

            <section class="customer-panel-card">
                <div class="customer-panel-card-head">
                    <div>
                        <span>SON HAREKETLER</span>
                        <h2>Son Siparişler</h2>
                    </div>
                    <a href="{{ route('customer.orders.index') }}">Tümünü Gör</a>
                </div>

                <div class="customer-order-list is-compact">
                    @forelse ($latestOrders as $order)
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
                            <span>İlk siparişiniz oluştuğunda burada görünecek.</span>
                            <a href="{{ route('home') }}#products-results">Ürünleri İncele</a>
                        </div>
                    @endforelse
                </div>
            </section>
        </div>
    </section>
@endsection

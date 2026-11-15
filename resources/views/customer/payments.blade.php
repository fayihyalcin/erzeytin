@extends('layouts.storefront')

@section('title', 'Ödemelerim - '.($settings->site_title ?: 'Er Zeytin Yağı'))

@section('content')
    <section class="customer-account-page container-wide">
        @include('customer.partials.sidebar')

        <div class="customer-account-content">
            <div class="customer-orders-head">
                <div>
                    <span>ÖDEME TAKİBİ</span>
                    <h1>Ödemelerim</h1>
                </div>
            </div>

            <div class="customer-payment-table">
                <div class="customer-payment-row customer-payment-head">
                    <span>Sipariş</span>
                    <span>Yöntem</span>
                    <span>Durum</span>
                    <span>Tutar</span>
                    <span>İşlem</span>
                </div>
                @forelse ($orders as $order)
                    <div class="customer-payment-row">
                        <span data-label="Sipariş">{{ $order->code }}</span>
                        <span data-label="Yöntem">{{ $order->payment_method }}</span>
                        <span data-label="Durum">{{ $order->payment_status }}</span>
                        <strong data-label="Tutar">₺{{ number_format((float) $order->total, 2, ',', '.') }}</strong>
                        <a href="{{ route('customer.orders.show', $order) }}">{{ $order->payment_method === 'Havale' && ! $order->receipt_path ? 'Dekont Yükle' : 'Detay' }}</a>
                    </div>
                @empty
                    <div class="cart-empty">
                        <strong>Ödeme kaydı yok.</strong>
                        <span>Sipariş verdiğinizde ödeme durumları burada listelenir.</span>
                    </div>
                @endforelse
            </div>
        </div>
    </section>
@endsection

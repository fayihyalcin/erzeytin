@extends('layouts.storefront')

@section('title', 'PayTR Ödeme - '.($settings->site_title ?: 'Er Zeytin Yağı'))

@section('content')
    <section class="checkout-page checkout-frame-page container-wide">
        <nav class="breadcrumb-line product-breadcrumb" aria-label="Sayfa yolu">
            <a href="{{ route('home') }}">Anasayfa</a>
            <span>/</span>
            <strong>PayTR Ödeme</strong>
        </nav>

        <div class="checkout-frame-head">
            <div>
                <span>GÜVENLİ ÖDEME</span>
                <h1>Sipariş {{ $order->code }}</h1>
                <p>PayTR güvenli ödeme formu aşağıda açılır. Ödeme tamamlandığında sipariş durumunuz otomatik güncellenecek.</p>
            </div>
            <strong>₺{{ number_format((float) $order->total, 2, ',', '.') }}</strong>
        </div>

        <iframe id="paytriframe" class="paytr-iframe" src="{{ $iframeUrl }}" title="PayTR Güvenli Ödeme" frameborder="0" scrolling="no"></iframe>
    </section>

    <script src="https://www.paytr.com/js/iframeResizer.min.js"></script>
    <script>
        window.addEventListener('load', function () {
            if (typeof iFrameResize === 'function') {
                iFrameResize({}, '#paytriframe');
            }
        });
    </script>
@endsection

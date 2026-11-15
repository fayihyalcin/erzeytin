@extends('layouts.storefront')

@section('title', 'Sepetim - '.($settings->site_title ?: 'Er Zeytin Yağı'))
@section('meta_description', 'Sepetinizdeki ürünleri görüntüleyin, adetleri güncelleyin ve siparişe hazır hale getirin.')

@section('content')
    <section class="category-hero cart-hero">
        <img src="{{ asset('images/hero-olive-grove.jpg') }}" alt="">
        <div class="category-hero-wash"></div>
        <div class="container-wide category-hero-inner">
            <nav class="breadcrumb-line" aria-label="Sayfa yolu">
                <a href="{{ route('home') }}">Anasayfa</a>
                <span>/</span>
                <strong>Sepetim</strong>
            </nav>
            <span class="page-kicker">Alışveriş</span>
            <h1>Sepetim</h1>
            <p>Ürünlerinizi kontrol edin, adetleri düzenleyin ve güncel sepet toplamınızı görün.</p>
        </div>
    </section>

    <section class="cart-page container-wide">
        @if (session('status'))
            <div class="cart-alert">{{ session('status') }}</div>
        @endif

        @if ($cartItems->isEmpty())
            <div class="cart-empty">
                <strong>Sepetiniz boş.</strong>
                <span>Er Zeytinyağı ürünlerini inceleyerek sepetinize ekleyebilirsiniz.</span>
                <a href="{{ route('home') }}#products-results">Alışverişe Başla</a>
            </div>
        @else
            <div class="cart-layout">
                <div class="cart-list">
                    @foreach ($cartItems as $item)
                        @php
                            $product = $item['product'];
                            $imageUrl = $product->image_path ? Storage::url($product->image_path) : asset('images/hero-olive-oil.jpg');
                        @endphp
                        <article class="cart-row">
                            <a href="{{ route('products.show', ['product' => $product->slug]) }}" class="cart-row-image">
                                <img src="{{ $imageUrl }}" alt="{{ $product->name }}">
                            </a>
                            <div class="cart-row-info">
                                <span>{{ $product->category?->name ?? 'Ürün' }}</span>
                                <h2><a href="{{ route('products.show', ['product' => $product->slug]) }}">{{ $product->name }}</a></h2>
                                <small>Stok: {{ $product->stock }} adet</small>
                            </div>
                            <strong class="cart-row-price">₺{{ number_format((float) $product->price, 2, ',', '.') }}</strong>
                            <form class="cart-quantity-form" method="POST" action="{{ route('cart.update', $product) }}">
                                @csrf
                                @method('PATCH')
                                <button type="submit" name="quantity" value="{{ max(1, $item['quantity'] - 1) }}" @disabled($item['quantity'] <= 1) aria-label="Adedi azalt">−</button>
                                <output>{{ $item['quantity'] }}</output>
                                <button type="submit" name="quantity" value="{{ min($product->stock, $item['quantity'] + 1) }}" @disabled($item['quantity'] >= $product->stock) aria-label="Adedi artır">+</button>
                            </form>
                            <strong class="cart-row-total">₺{{ number_format((float) $item['line_total'], 2, ',', '.') }}</strong>
                            <form method="POST" action="{{ route('cart.destroy', $product) }}">
                                @csrf
                                @method('DELETE')
                                <button class="cart-remove" type="submit">Çıkar</button>
                            </form>
                        </article>
                    @endforeach
                </div>

                <aside class="cart-summary">
                    <span>SİPARİŞ ÖZETİ</span>
                    <h2>Sepet Durumu</h2>
                    <div>
                        <small>Ürün Adedi</small>
                        <strong>{{ $totalQuantity }}</strong>
                    </div>
                    <div>
                        <small>Ara Toplam</small>
                        <strong>₺{{ number_format((float) $subtotal, 2, ',', '.') }}</strong>
                    </div>
                    <div>
                        <small>Kargo</small>
                        <strong>Ücretsiz</strong>
                    </div>
                    <div class="cart-summary-total">
                        <small>Genel Toplam</small>
                        <strong>₺{{ number_format((float) $subtotal, 2, ',', '.') }}</strong>
                    </div>
                    <a href="{{ route('checkout.show') }}" class="cart-checkout">Siparişi Tamamla</a>
                    <form method="POST" action="{{ route('cart.clear') }}">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="cart-clear">Sepeti Temizle</button>
                    </form>
                </aside>
            </div>
        @endif
    </section>
@endsection

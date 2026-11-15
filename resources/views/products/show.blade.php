@extends('layouts.storefront')

@section('title', $product->name.' - '.($settings->site_title ?: 'Er Zeytin Yağı'))
@section('meta_description', $product->description ?: $settings->meta_description)

@php
    $imageUrl = $product->image_path ? Storage::url($product->image_path) : asset('images/hero-olive-oil.jpg');
    $price = number_format((float) $product->price, 2, ',', '.');
    $comparePrice = $product->compare_price && (float) $product->compare_price > (float) $product->price
        ? number_format((float) $product->compare_price, 2, ',', '.')
        : null;
    $section = (object) [
        'title' => 'Benzer Ürünler',
        'badge_label' => 'Benzer',
        'style' => 'default',
        'show_compare_price' => true,
    ];
@endphp

@section('content')
    <section
        class="product-detail-page container-wide"
        x-data="{
            quantity: 1,
            quickViewOpen: false,
            selectedProduct: null,
            openQuickView(product) {
                this.selectedProduct = product;
                this.quantity = 1;
                this.quickViewOpen = true;
                document.body.classList.add('modal-open');
            },
            closeQuickView() {
                this.quickViewOpen = false;
                document.body.classList.remove('modal-open');
            }
        }"
        x-on:keydown.escape.window="quickViewOpen && closeQuickView()"
    >
        <nav class="breadcrumb-line product-breadcrumb" aria-label="Sayfa yolu">
            <a href="{{ route('home') }}">Anasayfa</a>
            <span>/</span>
            @if ($product->category)
                <a href="{{ route('categories.show', ['category' => $product->category->slug]) }}">{{ $product->category->name }}</a>
                <span>/</span>
            @endif
            <strong>{{ $product->name }}</strong>
        </nav>

        <div class="product-detail-layout">
            <div class="product-detail-gallery">
                <span class="product-badge">{{ $product->category?->name ?? 'Ürün' }}</span>
                <img src="{{ $imageUrl }}" alt="{{ $product->name }}">
            </div>

            <div class="product-detail-info">
                <p class="product-detail-kicker">{{ $product->category?->name ?? 'Er Zeytinyağı' }}</p>
                <h1>{{ $product->name }}</h1>
                <p class="product-detail-description">{{ $product->description ?: 'Doğal ve özenle seçilmiş Er Zeytinyağı ürünü.' }}</p>

                <div class="product-detail-meta">
                    <span><strong>Stok</strong><small>{{ $product->stock > 0 ? 'Stokta var' : 'Tükendi' }}</small></span>
                    <span><strong>SKU</strong><small>{{ $product->sku }}</small></span>
                    <span><strong>Teslimat</strong><small>24 saat içinde kargo</small></span>
                </div>

                <div class="product-detail-price">
                    @if ($comparePrice)
                        <span class="old-price">₺{{ $comparePrice }}</span>
                    @endif
                    <strong>₺{{ $price }}</strong>
                </div>

                <form class="product-detail-actions" method="POST" action="{{ route('cart.store', $product) }}">
                    @csrf
                    <input type="hidden" name="quantity" x-bind:value="quantity">
                    <div class="quantity-control" aria-label="Adet seçimi">
                        <button type="button" x-on:click="quantity = Math.max(1, quantity - 1)" aria-label="Adedi azalt">−</button>
                        <output x-text="quantity"></output>
                        <button type="button" x-on:click="quantity++" aria-label="Adedi artır">+</button>
                    </div>
                    <button class="product-detail-cart" type="submit" @disabled($product->stock <= 0)>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 6h15l-2 8H8L6 3H3"></path>
                            <circle cx="9" cy="20" r="1.7"></circle>
                            <circle cx="18" cy="20" r="1.7"></circle>
                        </svg>
                        <span>Sepete Ekle</span>
                    </button>
                </form>

                <div class="product-detail-note">
                    <strong>Güvenli ödeme ve ücretsiz kargo</strong>
                    <span>Tüm ürünlerde hızlı teslimat, güvenli ödeme ve doğal ürün güvencesi.</span>
                </div>
            </div>
        </div>

        <section class="product-detail-text">
            <h2>Ürün Açıklaması</h2>
            <p>{{ $product->description ?: 'Bu ürün Er Zeytinyağı kalitesiyle sofralarınıza doğal lezzet taşımak için hazırlanmıştır.' }}</p>
        </section>

        <section class="related-products" aria-labelledby="related-products-title">
            <div class="section-heading">
                <div class="section-title-wrap">
                    <svg viewBox="0 0 42 42" aria-hidden="true">
                        <path d="M21 38C21 22 25 11 36 4"></path>
                        <path d="M21 19C11 12 5 14 2 22c8 4 15 3 19-3Z"></path>
                        <path d="M23 28c10-1 16-6 17-14-9 0-15 5-17 14Z"></path>
                        <circle cx="16" cy="29" r="2.4"></circle>
                        <circle cx="27" cy="17" r="2.4"></circle>
                    </svg>
                    <h2 id="related-products-title">Benzer Ürünler</h2>
                </div>
            </div>

            <div class="product-grid">
                @forelse ($relatedProducts as $relatedProduct)
                    @include('storefront.partials.product-card', ['product' => $relatedProduct, 'section' => $section])
                @empty
                    <div class="product-empty-state">
                        <strong>Benzer ürün bulunamadı.</strong>
                        <span>Bu kategoriye yeni ürünler eklendiğinde burada görünür.</span>
                    </div>
                @endforelse
            </div>
        </section>

        @include('storefront.partials.quick-view-modal')
    </section>
@endsection

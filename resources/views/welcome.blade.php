@extends('layouts.storefront')

@section('title', $settings->meta_title ?: $settings->site_title)
@section('meta_description', $settings->meta_description ?? '')
@section('meta_keywords', $settings->meta_keywords ?? '')

@php
    $activeSlider = $sliders->first();
    $sliderImage = $activeSlider?->image_path ? Storage::url($activeSlider->image_path) : asset('images/hero-olive-grove.jpg');
    $sliderProductImage = $activeSlider?->product_image_path ? Storage::url($activeSlider->product_image_path) : asset('images/hero-olive-oil.jpg');
@endphp

@section('content')
    <section class="hero-section" aria-label="{{ $activeSlider?->title ?? 'Premium zeytin ürünleri' }}">
        <img class="hero-bg" src="{{ $sliderImage }}" alt="">
        <div class="hero-wash"></div>

        <button class="hero-arrow hero-arrow-left" type="button" aria-label="Önceki kampanya">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
        </button>
        <button class="hero-arrow hero-arrow-right" type="button" aria-label="Sonraki kampanya">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
        </button>

        <div class="container-wide hero-inner">
            <div class="hero-copy">
                <h1>{!! nl2br(e($activeSlider?->title ?? 'Doğal. Saf. Eşsiz. En Premium Zeytin Ürünleri')) !!}</h1>
                <p>{{ $activeSlider?->description ?? 'Er Zeytinyağı ile Mudanya’nın bereketli topraklarından sofralarınıza sağlık ve lezzet taşıyoruz.' }}</p>

                <div class="hero-features">
                    <div>
                        <span class="feature-icon">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-4.8 7-12a7 7 0 0 0-14 0c0 7.2 7 12 7 12Z"></path><path d="M9 13c4-1 6-4 6-8"></path></svg>
                        </span>
                        <span><strong>%100 Doğal</strong><small>Katkısız & Koruyucusuz</small></span>
                    </div>
                    <div>
                        <span class="feature-icon">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18"></path><path d="M12 9c-5-4-9-2-10 2 4 2 8 2 10-2Z"></path><path d="M12 15c5-4 9-2 10 2-4 2-8 2-10-2Z"></path></svg>
                        </span>
                        <span><strong>Erken Hasat</strong><small>Yüksek Kalite</small></span>
                    </div>
                    <div>
                        <span class="feature-icon">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c4 4 6 8 6 12a6 6 0 0 1-12 0c0-4 2-8 6-12Z"></path><path d="M8.5 16.5h7"></path></svg>
                        </span>
                        <span><strong>Soğuk Sıkım</strong><small>Doğal Lezzet</small></span>
                    </div>
                </div>
            </div>

            <div class="hero-product">
                <div class="product-photo-card">
                    <img src="{{ $sliderProductImage }}" alt="{{ $activeSlider?->title ?? 'Premium zeytinyağı şişesi' }}">
                </div>
                <div class="hero-tin">
                    <span class="tin-leaf">✦</span>
                    <span class="tin-brand">{{ $activeSlider?->tin_brand ?? 'ER' }}</span>
                    <span class="tin-title">{!! nl2br(e($activeSlider?->tin_title ?? 'NATÜREL SIZMA ZEYTİNYAĞI')) !!}</span>
                    <span class="tin-line"></span>
                    <span class="tin-size">{{ $activeSlider?->tin_size ?? '5L' }}</span>
                </div>
                <div class="olive-bowl" aria-hidden="true">
                    <span></span><span></span><span></span><span></span><span></span><span></span>
                </div>
            </div>

            <div class="quality-badge">
                <span>{{ $activeSlider?->badge ?? 'Er Zeytinyağı' }}</span>
                <strong>Kalite</strong>
            </div>
        </div>
    </section>

    <section class="service-strip container-wide" aria-label="Mağaza avantajları">
        <div class="service-item">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v10H3z"></path><path d="M14 10h4l3 3v4h-7z"></path><circle cx="7" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle></svg>
            <span><strong>Ücretsiz Kargo</strong><small>Tüm ürünlerde ücretsiz kargo fırsatı.</small></span>
        </div>
        <div class="service-item">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18M8 15h4"></path></svg>
            <span><strong>Güvenli Ödeme</strong><small>256 Bit SSL ile güvenli ödeme deneyimi.</small></span>
        </div>
        <div class="service-item">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 14.4 5l3.8-.4.8 3.7 3 2.2-2 3.2.7 3.8-3.7 1.2L14.8 22 12 19.5 9.2 22 7 18.7l-3.7-1.2.7-3.8-2-3.2 3-2.2.8-3.7 3.8.4Z"></path><path d="m8.5 12 2.3 2.3 4.7-4.7"></path></svg>
            <span><strong>Müşteri Memnuniyeti</strong><small>%100 müşteri memnuniyeti ve kaliteli hizmet.</small></span>
        </div>
    </section>

    <section
        id="products-results"
        class="product-section container-wide"
        x-data="{
            quickViewOpen: false,
            selectedProduct: null,
            quantity: 1,
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
        @forelse ($homeSections as $sectionIndex => $section)
            @php
                $sectionId = $section->section_key ?: 'home-section-'.$section->id;
                $sectionClass = $sectionIndex === 0 ? '' : 'product-subsection product-section--'.$section->style;
            @endphp

            @if ($sectionIndex > 0)
                <section class="{{ $sectionClass }}" aria-labelledby="{{ $sectionId }}-title">
            @endif

            <div class="section-heading">
                <div class="section-title-wrap">
                    <svg viewBox="0 0 42 42" aria-hidden="true">
                        <path d="M21 38C21 22 25 11 36 4"></path>
                        <path d="M21 19C11 12 5 14 2 22c8 4 15 3 19-3Z"></path>
                        <path d="M23 28c10-1 16-6 17-14-9 0-15 5-17 14Z"></path>
                        <circle cx="16" cy="29" r="2.4"></circle>
                        <circle cx="27" cy="17" r="2.4"></circle>
                    </svg>
                    <h2 id="{{ $sectionId }}-title">{{ $section->title }}</h2>
                </div>
                <a href="#products-results" class="view-all-link">
                    <span>Tümünü Gör</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path></svg>
                </a>
            </div>

            @if ($section->subtitle)
                <p class="product-section-note">{{ $section->subtitle }}</p>
            @endif

            <div class="product-grid">
                @forelse ($section->products as $product)
                    @include('storefront.partials.product-card', ['product' => $product, 'section' => $section])
                @empty
                    <div class="product-empty-state">
                        <strong>Bu vitrinde ürün yok.</strong>
                        <span>Admin panelinden aktif ürün eklediğinizde burada görünür.</span>
                    </div>
                @endforelse
            </div>

            @if ($sectionIndex > 0)
                </section>
            @endif
        @empty
            <div class="product-empty-state">
                <strong>Vitrin bölümü bulunamadı.</strong>
                <span>Admin panelinden ana sayfa ürün bölümlerini ekleyebilirsiniz.</span>
            </div>
        @endforelse

        @include('storefront.partials.quick-view-modal')
    </section>
@endsection

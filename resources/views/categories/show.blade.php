@extends('layouts.storefront')

@section('title', $category->name.' - '.($settings->site_title ?: 'Er Zeytin Yağı'))
@section('meta_description', $category->description ?: $settings->meta_description)

@php
    $section = (object) [
        'title' => $category->name,
        'badge_label' => $category->name,
        'style' => 'default',
        'show_compare_price' => true,
    ];
    $categoryImage = $category->image_path ? Storage::url($category->image_path) : asset('images/hero-olive-grove.jpg');
@endphp

@section('content')
    <section class="category-hero">
        <img src="{{ $categoryImage }}" alt="">
        <div class="category-hero-wash"></div>
        <div class="container-wide category-hero-inner">
            <nav class="breadcrumb-line" aria-label="Sayfa yolu">
                <a href="{{ route('home') }}">Anasayfa</a>
                <span>/</span>
                <strong>{{ $category->name }}</strong>
            </nav>
            <h1>{{ $category->name }}</h1>
            <p>{{ $category->description ?: 'Er Zeytinyağı kalitesiyle seçilmiş doğal ürünleri keşfedin.' }}</p>
        </div>
    </section>

    <section
        class="category-products container-wide"
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
        <div class="category-page-toolbar">
            <div>
                <span>ÜRÜN LİSTESİ</span>
                <h2>{{ $category->name }} Ürünleri</h2>
            </div>
            <small>{{ $products->total() }} ürün</small>
        </div>

        <div class="product-grid">
            @forelse ($products as $product)
                @include('storefront.partials.product-card', ['product' => $product, 'section' => $section])
            @empty
                <div class="product-empty-state">
                    <strong>Bu kategoride ürün yok.</strong>
                    <span>Admin panelinden aktif ürün eklediğinizde burada görünür.</span>
                </div>
            @endforelse
        </div>

        @if ($products->hasPages())
            <div class="store-pagination">
                {{ $products->links() }}
            </div>
        @endif

        @include('storefront.partials.quick-view-modal')
    </section>
@endsection

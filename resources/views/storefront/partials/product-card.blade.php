@php
    $badgeClass = match ($section->style) {
        'best' => 'product-badge-hot',
        'featured', 'sale' => 'product-badge-sale',
        default => '',
    };
    $imageUrl = $product->image_path ? Storage::url($product->image_path) : asset('images/hero-olive-oil.jpg');
    $price = number_format((float) $product->price, 2, ',', '.');
    $comparePrice = $section->show_compare_price && $product->compare_price && (float) $product->compare_price > (float) $product->price
        ? number_format((float) $product->compare_price, 2, ',', '.')
        : null;
    $badge = $section->badge_label ?: $section->title;
    $category = $product->category?->name ?: 'Ürün';
    $stock = $product->stock > 0 ? 'Stokta var' : 'Tükendi';
    $description = $product->description ?: $product->name;
    $productUrl = route('products.show', ['product' => $product->slug]);
@endphp

<article class="product-card">
    <div class="product-card-top">
        <span @class(['product-badge', $badgeClass])>{{ $badge }}</span>
        <button class="favorite-button" type="button" aria-label="{{ $product->name }} favorilere ekle">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 1 1 7.5-6.5 5 5 0 1 1 7.5 6.5Z"></path>
            </svg>
        </button>
    </div>
    <a href="{{ $productUrl }}" class="product-image-link" aria-label="{{ $product->name }}">
        <img src="{{ $imageUrl }}" alt="{{ $product->name }}">
    </a>
    <div class="product-card-body">
        <h3><a href="{{ $productUrl }}">{{ $product->name }}</a></h3>
        <p class="product-price">
            @if ($comparePrice)
                <span class="old-price">₺{{ $comparePrice }}</span>
            @endif
            <span>₺{{ $price }}</span>
        </p>
        <form class="product-card-cart-form" method="POST" action="{{ route('cart.store', $product) }}">
            @csrf
            <input type="hidden" name="quantity" value="1">
            <button class="add-cart-button" type="submit" @disabled($product->stock <= 0)>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6h15l-2 8H8L6 3H3"></path>
                    <circle cx="9" cy="20" r="1.7"></circle>
                    <circle cx="18" cy="20" r="1.7"></circle>
                </svg>
                <span>Sepete Ekle</span>
            </button>
        </form>
        <button
            class="quick-view-button"
            type="button"
            x-on:click="openQuickView({
                title: @js($product->name),
                image: @js($imageUrl),
                price: @js($price),
                badge: @js($badge),
                category: @js($category),
                stock: @js($stock),
                description: @js($description),
                cartUrl: @js(route('cart.store', $product)),
                detailUrl: @js($productUrl)
            })"
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Hızlı İncele</span>
        </button>
        <a href="{{ $productUrl }}" class="detail-link">
            <span>Detay</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14"></path>
                <path d="m13 6 6 6-6 6"></path>
            </svg>
        </a>
    </div>
</article>

@php
    $logoUrl = $settings->logo_path ? Storage::url($settings->logo_path) : null;
    $brandName = $settings->site_title ?: 'Er Zeytin Yağı';
    $trUpper = fn (string $value): string => mb_strtoupper($value, 'UTF-8');
@endphp

<header class="store-header" x-data="{ categoryMenuOpen: false, mobileNavOpen: false }">
    <div class="utility-bar">
        <div class="container-wide utility-inner">
            <div class="utility-left">
                <span>%100 Doğal</span>
                <span class="mini-arrow">→</span>
                <span>Katkısız</span>
                <span class="mini-arrow">→</span>
                <span>Soğuk Sıkım</span>
                <span class="utility-dot"></span>
                <span>Erken Hasat</span>
            </div>
            <a href="{{ auth()->check() ? route('customer.orders.index') : route('customer.dashboard') }}" class="tracking-link">Sipariş Takibi</a>
        </div>
    </div>

    <div class="main-header">
        <div class="container-wide main-header-inner">
            <a href="{{ route('home') }}" class="brand-mark" aria-label="{{ $brandName }}">
                @if ($logoUrl)
                    <img class="brand-logo-image" src="{{ $logoUrl }}" alt="{{ $brandName }}">
                @endif
                <span class="brand-copy">
                    <span class="brand-title">ER</span>
                    <span class="brand-subtitle">ZEYTİN YAĞI</span>
                    <span class="brand-note">{{ $settings->company_name ?: 'Doğadan Sofranıza' }}</span>
                </span>
            </a>

            <form class="search-box" action="#" method="GET">
                <label class="sr-only" for="store-search">Ürün ara</label>
                <input id="store-search" name="q" type="search" placeholder="Ürün, kategori veya marka ara..." autocomplete="off">
                <button type="submit" aria-label="Ara">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="11" cy="11" r="7"></circle>
                        <path d="m16.5 16.5 4 4"></path>
                    </svg>
                </button>
            </form>

            <nav class="account-actions" aria-label="Kullanıcı menüsü">
                <a href="{{ route('customer.dashboard') }}" class="action-link">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 21a8 8 0 0 0-16 0"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span><strong>Hesabım</strong><small>{{ auth()->check() ? 'Panelim' : 'Giriş Yap' }}</small></span>
                </a>
                <a href="#" class="action-link">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 1 1 7.5-6.5 5 5 0 1 1 7.5 6.5Z"></path>
                    </svg>
                    <span><strong>Favorilerim</strong></span>
                </a>
                <a href="{{ route('cart.index') }}" class="action-link cart-link">
                    <span class="cart-badge">{{ $cartQuantity ?? 0 }}</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 6h15l-2 8H8L6 3H3"></path>
                        <circle cx="9" cy="20" r="1.7"></circle>
                        <circle cx="18" cy="20" r="1.7"></circle>
                    </svg>
                    <span><strong>Sepetim</strong></span>
                </a>
            </nav>
        </div>
    </div>

    <div class="category-nav">
        <div class="container-wide category-inner">
            <div class="category-menu-wrap">
                <button class="category-toggle" type="button" x-on:click="categoryMenuOpen = ! categoryMenuOpen" :aria-expanded="categoryMenuOpen.toString()">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 7h16M4 12h16M4 17h16"></path>
                    </svg>
                    <span>TÜM KATEGORİLER</span>
                </button>
                <div class="category-dropdown" x-cloak x-show="categoryMenuOpen" x-transition x-on:click.outside="categoryMenuOpen = false">
                    @forelse ($storefrontCategories as $category)
                        <a href="{{ route('categories.show', ['category' => $category->slug]) }}">{{ $category->name }}</a>
                    @empty
                        <span>Kategori bulunamadı</span>
                    @endforelse
                </div>
            </div>
            <span class="nav-separator"></span>
            <button class="mobile-nav-toggle" type="button" x-on:click="mobileNavOpen = ! mobileNavOpen" aria-label="Menüyü aç">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
            </button>
            <nav class="primary-nav" :class="{ 'is-open': mobileNavOpen }" aria-label="Ana menü">
                <a href="{{ route('home') }}" @class(['active' => request()->routeIs('home')])>ANASAYFA</a>
                @foreach ($storefrontCategories as $category)
                    <a href="{{ route('categories.show', ['category' => $category->slug]) }}" @class(['active' => request()->routeIs('categories.show') && request()->route('category')?->is($category)])>{{ $trUpper($category->name) }}</a>
                @endforeach
                <a href="{{ route('contact.show') }}" @class(['active' => request()->routeIs('contact.*')])>İLETİŞİM</a>
            </nav>
        </div>
    </div>
</header>

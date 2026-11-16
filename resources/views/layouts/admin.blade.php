<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Yönetim Paneli - Er Zeytinyağı')</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700|playfair-display:600,700,800" rel="stylesheet" />

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="admin-body">
    <div
        class="admin-shell"
        @yield('admin_shell_attributes')
        :class="{ 'sidebar-collapsed': sidebarCollapsed }"
    >
        <aside class="admin-sidebar" :class="{ 'is-open': sidebarOpen }">
            <button
                class="sidebar-collapse-button"
                type="button"
                x-on:click="sidebarCollapsed = ! sidebarCollapsed"
                :aria-label="sidebarCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path x-show="! sidebarCollapsed" d="m15 18-6-6 6-6"></path>
                    <path x-show="sidebarCollapsed" d="m9 18 6-6-6-6"></path>
                </svg>
            </button>

            <div class="admin-brand">
                <svg viewBox="0 0 52 72" aria-hidden="true">
                    <path d="M27 4C20 17 14 29 10 45"></path>
                    <path d="M27 21c-9-8-18-7-22-1 7 6 16 8 22 1Z"></path>
                    <path d="M21 36C12 30 5 34 3 41c8 3 15 2 18-5Z"></path>
                    <path d="M30 30c12-4 17-12 15-20-11 1-17 8-15 20Z"></path>
                    <path d="M26 50c13-2 21-9 21-18-11-1-19 6-21 18Z"></path>
                </svg>
                <span>
                    <strong>ER</strong>
                    <small>ZEYTİNYAĞI</small>
                    <em>DOĞAL LEZZET</em>
                </span>
            </div>

            <nav class="admin-nav" aria-label="Yönetim menüsü">
                @php
                    $adminLinks = [
                        ['label' => 'Anasayfa', 'icon' => 'home', 'url' => route('dashboard'), 'active' => request()->routeIs('dashboard')],
                        ['label' => 'Kategoriler', 'icon' => 'grid', 'url' => route('admin.categories.index'), 'active' => request()->routeIs('admin.categories.*')],
                        ['label' => 'Ürünler', 'icon' => 'bottle', 'url' => route('admin.products.index'), 'active' => request()->routeIs('admin.products.*')],
                        ['label' => 'Siparişler', 'icon' => 'cart', 'url' => route('admin.orders.index'), 'active' => request()->routeIs('admin.orders.*')],
                        ['label' => 'Slider', 'icon' => 'image', 'url' => route('admin.sliders.index'), 'active' => request()->routeIs('admin.sliders.*')],
                        ['label' => 'Vitrin', 'icon' => 'layout', 'url' => route('admin.home-sections.index'), 'active' => request()->routeIs('admin.home-sections.*')],
                        ['label' => 'Kullanıcılar', 'icon' => 'user', 'url' => route('admin.users.index'), 'active' => request()->routeIs('admin.users.*')],
                        ['label' => 'Müşteriler', 'icon' => 'users', 'url' => route('admin.customers.index'), 'active' => request()->routeIs('admin.customers.*')],
                        ['label' => 'İletişim Talepleri', 'icon' => 'mail', 'url' => route('admin.contact-messages.index'), 'active' => request()->routeIs('admin.contact-messages.*')],
                        ['label' => 'Bayiler', 'icon' => 'store', 'url' => '#', 'active' => false],
                        ['label' => 'Stok', 'icon' => 'box', 'url' => '#', 'active' => false],
                        ['label' => 'Muhasebe', 'icon' => 'file', 'url' => '#', 'active' => false],
                        ['label' => 'Raporlar', 'icon' => 'chart', 'url' => '#', 'active' => false],
                        ['label' => 'Kampanyalar', 'icon' => 'megaphone', 'url' => '#', 'active' => false],
                        ['label' => 'Ayarlar', 'icon' => 'settings', 'url' => route('admin.settings.edit'), 'active' => request()->routeIs('admin.settings.*')],
                    ];
                @endphp

                @foreach ($adminLinks as $link)
                    <a href="{{ $link['url'] }}" @class(['active' => $link['active']])>
                        <span class="admin-nav-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                                @switch($link['icon'])
                                    @case('home')
                                        <path d="m3 11 9-8 9 8"></path>
                                        <path d="M5 10v10h14V10"></path>
                                        <path d="M10 20v-6h4v6"></path>
                                        @break
                                    @case('grid')
                                        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                                        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                                        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                                        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                                        @break
                                    @case('bottle')
                                        <path d="M10 2h4v5l2 2v10a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3V9l2-2V2Z"></path>
                                        <path d="M10 7h4"></path>
                                        <path d="M9 13h6"></path>
                                        @break
                                    @case('cart')
                                        <path d="M4 5h2l2 11h10l2-8H7"></path>
                                        <circle cx="10" cy="20" r="1.5"></circle>
                                        <circle cx="17" cy="20" r="1.5"></circle>
                                        @break
                                    @case('image')
                                        <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                                        <circle cx="8" cy="10" r="2"></circle>
                                        <path d="m21 16-5-5L5 19"></path>
                                        @break
                                    @case('layout')
                                        <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                                        <path d="M3 9h18"></path>
                                        <path d="M9 9v11"></path>
                                        <path d="M13 13h5"></path>
                                        <path d="M13 16h4"></path>
                                        @break
                                    @case('user')
                                        <circle cx="12" cy="8" r="4"></circle>
                                        <path d="M4 21a8 8 0 0 1 16 0"></path>
                                        @break
                                    @case('users')
                                        <circle cx="9" cy="8" r="3"></circle>
                                        <circle cx="17" cy="9" r="2.5"></circle>
                                        <path d="M3 21a6 6 0 0 1 12 0"></path>
                                        <path d="M14 19a5 5 0 0 1 7 2"></path>
                                        @break
                                    @case('mail')
                                        <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                                        <path d="m3 7 9 6 9-6"></path>
                                        @break
                                    @case('store')
                                        <path d="M4 10h16"></path>
                                        <path d="M5 10l1-6h12l1 6"></path>
                                        <path d="M6 10v10h12V10"></path>
                                        <path d="M9 20v-5h6v5"></path>
                                        @break
                                    @case('box')
                                        <path d="M12 3 4 7l8 4 8-4-8-4Z"></path>
                                        <path d="M4 7v10l8 4 8-4V7"></path>
                                        <path d="M12 11v10"></path>
                                        @break
                                    @case('file')
                                        <path d="M6 3h8l4 4v14H6V3Z"></path>
                                        <path d="M14 3v5h5"></path>
                                        <path d="M9 13h6"></path>
                                        <path d="M9 17h6"></path>
                                        @break
                                    @case('chart')
                                        <path d="M4 19h16"></path>
                                        <path d="M7 16V9"></path>
                                        <path d="M12 16V5"></path>
                                        <path d="M17 16v-4"></path>
                                        @break
                                    @case('megaphone')
                                        <path d="M4 13h3l9 5V6l-9 5H4v2Z"></path>
                                        <path d="M7 13v5"></path>
                                        <path d="M19 9a4 4 0 0 1 0 6"></path>
                                        @break
                                    @case('settings')
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M12 2v3"></path>
                                        <path d="M12 19v3"></path>
                                        <path d="m4.9 4.9 2.1 2.1"></path>
                                        <path d="m17 17 2.1 2.1"></path>
                                        <path d="M2 12h3"></path>
                                        <path d="M19 12h3"></path>
                                        <path d="m4.9 19.1 2.1-2.1"></path>
                                        <path d="m17 7 2.1-2.1"></path>
                                        @break
                                @endswitch
                            </svg>
                        </span>
                        <span>{{ $link['label'] }}</span>
                    </a>
                @endforeach
            </nav>

            <form method="POST" action="{{ route('logout') }}" class="sidebar-logout-form">
                @csrf
                <button type="submit" class="sidebar-logout-button">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M10 17l5-5-5-5"></path>
                        <path d="M15 12H3"></path>
                        <path d="M21 3v18"></path>
                    </svg>
                    <span>Çıkış Yap</span>
                </button>
            </form>

            <div class="admin-sidebar-footer">
                <span class="footer-mark"></span>
                <span>
                    <strong>Er Zeytinyağı</strong>
                    <small>© 2024 Tüm hakları saklıdır.</small>
                </span>
            </div>
        </aside>

        <div class="sidebar-scrim" x-show="sidebarOpen" x-cloak x-transition.opacity x-on:click="sidebarOpen = false"></div>

        <div class="admin-main">
            <header class="admin-topbar">
                <button class="admin-menu-button" type="button" x-on:click="sidebarOpen = true" aria-label="Menüyü aç">
                    <span></span><span></span><span></span>
                </button>

                <form class="admin-search" action="#" method="GET">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="11" cy="11" r="7"></circle>
                        <path d="m16.5 16.5 4 4"></path>
                    </svg>
                    <input type="search" placeholder="@yield('admin_search_placeholder', 'Ara...')">
                    <kbd>Ctrl K</kbd>
                </form>

                <div class="topbar-actions">
                    @yield('admin_topbar_actions')
                </div>

                <div class="topbar-status">
                    <button class="icon-badge" type="button" aria-label="Bildirimler">
                        <span>5</span>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
                            <path d="M10 21h4"></path>
                        </svg>
                    </button>
                    <button class="icon-badge" type="button" aria-label="Mesajlar">
                        <span>3</span>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                            <path d="m3 7 9 6 9-6"></path>
                        </svg>
                    </button>
                    <div class="admin-user-dropdown" x-data="{ open: false }" x-on:keydown.escape.window="open = false">
                        <button class="admin-user" type="button" x-on:click="open = ! open" :aria-expanded="open.toString()" aria-haspopup="menu">
                            <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80" alt="Yönetici">
                            <span>
                                <strong>{{ auth()->user()?->name ?? 'Yönetici' }}</strong>
                                <small>{{ auth()->user()?->email ?? 'admin@erzeytinyagi.com' }}</small>
                            </span>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                        </button>
                        <div class="admin-user-menu" x-cloak x-show="open" x-transition.origin.top.right x-on:click.outside="open = false" role="menu">
                            <div class="admin-user-menu-head">
                                <strong>{{ auth()->user()?->name ?? 'Yönetici' }}</strong>
                                <small>{{ auth()->user()?->email ?? 'admin@erzeytinyagi.com' }}</small>
                            </div>
                            <a href="{{ route('profile.edit') }}" role="menuitem">Profilim</a>
                            <a href="#" role="menuitem">Hesap Ayarları</a>
                            <a href="/" role="menuitem">Mağazaya Dön</a>
                            <form method="POST" action="{{ route('logout') }}">
                                @csrf
                                <button type="submit" role="menuitem">Çıkış Yap</button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            <main class="admin-content @yield('admin_content_class')">
                @yield('content')
            </main>
        </div>
    </div>
</body>
</html>

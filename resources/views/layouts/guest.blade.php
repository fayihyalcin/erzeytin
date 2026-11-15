<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700|playfair-display:600,700,800" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="auth-body">
        <div class="auth-shell">
            <a href="/" class="auth-logo" aria-label="Er Zeytinyağı ana sayfa">
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
                    <em>Doğal Lezzet</em>
                </span>
            </a>

            <div class="auth-card">
                <aside class="auth-visual">
                    <div>
                        <span class="auth-kicker">Premium Yönetim</span>
                        <h1>Doğal lezzetin yönetim merkezine hoş geldiniz.</h1>
                        <p>Siparişleri, ürünleri ve stok akışını tek panelden takip edin.</p>
                    </div>
                    <div class="auth-benefits">
                        <span>Soğuk Sıkım</span>
                        <span>Katkısız</span>
                        <span>Erken Hasat</span>
                    </div>
                </aside>

                <section class="auth-panel">
                    {{ $slot }}
                </section>
            </div>
        </div>
    </body>
</html>

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', $settings->meta_title ?? $settings->site_title ?? config('app.name'))</title>
    <meta name="description" content="@yield('meta_description', $settings->meta_description ?? '')">
    <meta name="keywords" content="@yield('meta_keywords', $settings->meta_keywords ?? '')">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700|playfair-display:600,700,800" rel="stylesheet" />

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="storefront-body">
    <div class="site-shell">
        @include('storefront.partials.header')

        <main>
            @yield('content')
        </main>

        @include('storefront.partials.footer')
    </div>
</body>
</html>

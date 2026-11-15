@extends('layouts.storefront')

@php
    $phone = $settings->phone ?: $settings->gsm ?: '0530 516 54 98';
    $phoneHref = preg_replace('/\D+/', '', $phone);
    $whatsapp = $settings->whatsapp ?: $settings->gsm ?: $settings->phone;
    $whatsappHref = $whatsapp ? preg_replace('/\D+/', '', $whatsapp) : null;
    $email = $settings->email ?: 'celalergida@gmail.com';
    $address = $settings->address ?: 'Çepni mahallesi Çepni 25. sokak no:3 Mudanya/Bursa';
    $mapQuery = urlencode(strip_tags(str_replace(["\r", "\n"], ' ', $address)));
@endphp

@section('title', 'İletişim - '.($settings->site_title ?: 'Er Zeytin Yağı'))
@section('meta_description', 'Er Zeytinyağı telefon, WhatsApp, adres ve iletişim formu.')

@section('content')
    <section class="category-hero page-hero">
        <img src="{{ asset('images/hero-olive-grove.jpg') }}" alt="">
        <div class="category-hero-wash"></div>
        <div class="container-wide category-hero-inner">
            <nav class="breadcrumb-line" aria-label="Sayfa yolu">
                <a href="{{ route('home') }}">Anasayfa</a>
                <span>/</span>
                <strong>İletişim</strong>
            </nav>
            <span class="page-kicker">Bize Ulaşın</span>
            <h1>İletişim</h1>
            <p>Sipariş, ürün, kargo ve iş birliği talepleriniz için bize yazabilir veya doğrudan arayabilirsiniz.</p>
        </div>
    </section>

    <section class="contact-page container-wide">
        @if (session('status'))
            <div class="cart-alert">{{ session('status') }}</div>
        @endif

        @if ($errors->any())
            <div class="cart-alert is-error">{{ $errors->first() }}</div>
        @endif

        <div class="contact-info-grid">
            <a href="tel:+{{ $phoneHref }}" class="contact-info-card">
                <span>Telefon</span>
                <strong>{{ $phone }}</strong>
                <small>Hafta içi mesai saatlerinde arayabilirsiniz.</small>
            </a>
            <a href="https://wa.me/{{ $whatsappHref }}" target="_blank" rel="noreferrer" class="contact-info-card">
                <span>WhatsApp</span>
                <strong>{{ $whatsapp ?: $phone }}</strong>
                <small>Ürün ve sipariş sorularınız için hızlı iletişim.</small>
            </a>
            <a href="mailto:{{ $email }}" class="contact-info-card">
                <span>E-posta</span>
                <strong>{{ $email }}</strong>
                <small>Kurumsal taleplerinizi e-posta ile iletebilirsiniz.</small>
            </a>
            <div class="contact-info-card">
                <span>Adres</span>
                <strong>{!! nl2br(e($address)) !!}</strong>
                <small>Mudanya / Bursa</small>
            </div>
        </div>

        <div class="contact-layout">
            <form class="contact-form-panel" method="POST" action="{{ route('contact.store') }}">
                @csrf
                <div class="checkout-panel-head">
                    <span>İLETİŞİM FORMU</span>
                    <h2>Talebinizi Bize Gönderin</h2>
                </div>

                <div class="checkout-fields-two">
                    <label>
                        <span>Ad Soyad</span>
                        <input type="text" name="name" value="{{ old('name') }}" required>
                    </label>
                    <label>
                        <span>E-posta</span>
                        <input type="email" name="email" value="{{ old('email') }}" required>
                    </label>
                </div>

                <div class="checkout-fields-two">
                    <label>
                        <span>Telefon</span>
                        <input type="text" name="phone" value="{{ old('phone') }}">
                    </label>
                    <label>
                        <span>Konu</span>
                        <input type="text" name="subject" value="{{ old('subject') }}" placeholder="Sipariş, ürün, kargo...">
                    </label>
                </div>

                <label>
                    <span>Mesajınız</span>
                    <textarea name="message" rows="6" required>{{ old('message') }}</textarea>
                </label>

                <button type="submit" class="cart-checkout contact-submit">Gönder</button>
            </form>

            <aside class="contact-map-panel">
                <div class="checkout-panel-head">
                    <span>KONUM</span>
                    <h2>Google Harita</h2>
                </div>
                <div class="contact-map-frame">
                    @if ($settings->map_embed)
                        {!! $settings->map_embed !!}
                    @else
                        <iframe
                            src="https://www.google.com/maps?q={{ $mapQuery }}&output=embed"
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade"
                            title="Er Zeytinyağı harita"
                        ></iframe>
                    @endif
                </div>
            </aside>
        </div>
    </section>
@endsection

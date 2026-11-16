@extends('layouts.storefront')

@section('title', 'Ödeme - '.($settings->site_title ?: 'Er Zeytin Yağı'))
@section('meta_description', 'Sipariş teslimat ve ödeme bilgilerinizi güvenli şekilde tamamlayın.')

@section('content')
    <section class="category-hero cart-hero">
        <img src="{{ asset('images/hero-olive-grove.jpg') }}" alt="">
        <div class="category-hero-wash"></div>
        <div class="container-wide category-hero-inner">
            <nav class="breadcrumb-line" aria-label="Sayfa yolu">
                <a href="{{ route('home') }}">Anasayfa</a>
                <span>/</span>
                <a href="{{ route('cart.index') }}">Sepetim</a>
                <span>/</span>
                <strong>Ödeme</strong>
            </nav>
            <span class="page-kicker">Güvenli Ödeme</span>
            <h1>Ödeme Bilgileri</h1>
            <p>Kredi kartı için PayTR güvenli ödeme ekranına geçebilir veya havale/EFT ile siparişinizi oluşturabilirsiniz.</p>
        </div>
    </section>

    <section class="checkout-page container-wide">
        @if ($errors->any())
            <div class="cart-alert is-error">{{ $errors->first() }}</div>
        @endif

        <form class="checkout-layout" method="POST" action="{{ route('checkout.store') }}">
            @csrf
            <div class="checkout-form-panel">
                <div class="checkout-panel-head">
                    <span>TESLİMAT</span>
                    <h2>İletişim ve Adres</h2>
                </div>

                <div class="checkout-fields-two">
                    <label>
                        <span>Ad Soyad</span>
                        <input type="text" name="name" value="{{ old('name', auth()->user()?->name) }}" required>
                    </label>
                    <label>
                        <span>E-posta</span>
                        <input type="email" name="email" value="{{ old('email', auth()->user()?->email) }}" required>
                    </label>
                </div>

                <div class="checkout-fields-two">
                    <label>
                        <span>Telefon</span>
                        <input type="text" name="phone" value="{{ old('phone', auth()->user()?->phone) }}" required>
                    </label>
                    <label>
                        <span>Şehir</span>
                        <input type="text" name="city" value="{{ old('city') }}" required>
                    </label>
                </div>

                <label>
                    <span>Adres</span>
                    <textarea name="address" rows="4" required>{{ old('address') }}</textarea>
                </label>

                @guest
                    <div class="cart-alert">Siparişinizi takip edebilmeniz için bu e-posta ile bir hesap oluşturulacak. Daha sonra bu şifreyle giriş yapabilirsiniz.</div>

                    <div class="checkout-fields-two">
                        <label>
                            <span>Şifre</span>
                            <input type="password" name="password" autocomplete="new-password" required>
                        </label>
                        <label>
                            <span>Şifre (tekrar)</span>
                            <input type="password" name="password_confirmation" autocomplete="new-password" required>
                        </label>
                    </div>
                @endguest

                <label>
                    <span>Sipariş Notu</span>
                    <textarea name="note" rows="3">{{ old('note') }}</textarea>
                </label>

                <div class="checkout-panel-head checkout-payment-head">
                    <span>ÖDEME</span>
                    <h2>Ödeme Seçimi</h2>
                </div>

                <div class="payment-options">
                    <label class="payment-option">
                        <input class="payment-option-input" type="radio" name="payment_method" value="transfer" @checked(old('payment_method', 'transfer') === 'transfer')>
                        <span class="payment-option-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 20h18"/></svg></span>
                        <span class="payment-option-body">
                            <strong>Havale / EFT</strong>
                            <small>IBAN bilgileri admin ayarlarından gelir. Dekontu müşteri panelinden yükleyebilirsiniz.</small>
                        </span>
                        <span class="payment-option-check" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.5l2.5 2.5 4.5-5.5"/></svg></span>
                    </label>
                    <label class="payment-option">
                        <input class="payment-option-input" type="radio" name="payment_method" value="card" @checked(old('payment_method') === 'card')>
                        <span class="payment-option-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/></svg></span>
                        <span class="payment-option-body">
                            <strong>Kredi Kartı - PayTR</strong>
                            <small>PayTR güvenli ödeme ekranı ile kart işlemini tamamlayın.</small>
                            <em class="payment-option-badge">Güvenli ödeme</em>
                        </span>
                        <span class="payment-option-check" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.5l2.5 2.5 4.5-5.5"/></svg></span>
                    </label>
                </div>

                <div class="bank-preview">
                    <strong>Havale Bilgileri</strong>
                    <span>{{ $settings->bank_name ?: 'Banka bilgisi admin panelinden eklenecek' }}</span>
                    <span>{{ $settings->bank_account_holder ?: $settings->company_name }}</span>
                    <code>{{ $settings->bank_iban ?: 'IBAN girilmedi' }}</code>
                    @if ($settings->bank_description)
                        <p>{{ $settings->bank_description }}</p>
                    @endif
                </div>
            </div>

            <aside class="cart-summary checkout-summary">
                <span>SİPARİŞ ÖZETİ</span>
                <h2>Toplam</h2>
                <div>
                    <small>Ürün Adedi</small>
                    <strong>{{ $totalQuantity }}</strong>
                </div>
                @foreach ($cartItems as $item)
                    <div class="checkout-summary-item">
                        <small>{{ $item['product']->name }} x {{ $item['quantity'] }}</small>
                        <strong>₺{{ number_format((float) $item['line_total'], 2, ',', '.') }}</strong>
                    </div>
                @endforeach
                <div>
                    <small>Kargo</small>
                    <strong>Ücretsiz</strong>
                </div>
                <div class="cart-summary-total">
                    <small>Genel Toplam</small>
                    <strong>₺{{ number_format((float) $subtotal, 2, ',', '.') }}</strong>
                </div>
                <button type="submit" class="cart-checkout">Ödemeye Geç</button>
            </aside>
        </form>
    </section>
@endsection

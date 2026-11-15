@extends('layouts.storefront')

@section('title', 'Hesap Ayarları - '.($settings->site_title ?: 'Er Zeytin Yağı'))

@section('content')
    <section class="customer-account-page container-wide">
        @include('customer.partials.sidebar')

        <div class="customer-account-content">
            @if (session('status'))
                <div class="cart-alert">{{ session('status') }}</div>
            @endif

            @if ($errors->any())
                <div class="cart-alert is-error">{{ $errors->first() }}</div>
            @endif

            <form class="checkout-form-panel customer-settings-form" method="POST" action="{{ route('customer.settings.update') }}">
                @csrf
                @method('PATCH')

                <div class="checkout-panel-head">
                    <span>HESAP AYARLARI</span>
                    <h1>Bilgilerim</h1>
                </div>

                <div class="checkout-fields-two">
                    <label>
                        <span>Ad Soyad</span>
                        <input type="text" name="name" value="{{ old('name', $user->name) }}" required>
                    </label>
                    <label>
                        <span>E-posta</span>
                        <input type="email" name="email" value="{{ old('email', $user->email) }}" required>
                    </label>
                </div>

                <label>
                    <span>Telefon</span>
                    <input type="text" name="phone" value="{{ old('phone', $user->phone) }}">
                </label>

                <div class="checkout-panel-head checkout-payment-head">
                    <span>ŞİFRE</span>
                    <h2>Şifre Değiştir</h2>
                </div>

                <div class="checkout-fields-two">
                    <label>
                        <span>Mevcut Şifre</span>
                        <input type="password" name="current_password" autocomplete="current-password">
                    </label>
                    <label>
                        <span>Yeni Şifre</span>
                        <input type="password" name="password" autocomplete="new-password">
                    </label>
                </div>

                <label>
                    <span>Yeni Şifre Tekrar</span>
                    <input type="password" name="password_confirmation" autocomplete="new-password">
                </label>

                <button type="submit" class="cart-checkout customer-settings-submit">Bilgileri Kaydet</button>
            </form>
        </div>
    </section>
@endsection

<x-guest-layout>
    <div class="auth-form-heading">
        <span>Müşteri Girişi</span>
        <h2>Hesabınıza giriş yapın</h2>
        <p>Siparişlerinizi ve ödeme durumlarınızı takip etmek için bilgilerinizi girin.</p>
    </div>

    <!-- Session Status -->
    <x-auth-session-status class="mb-4" :status="session('status')" />

    <form method="POST" action="{{ route('login') }}" class="auth-form">
        @csrf

        <!-- Email Address -->
        <div class="auth-field">
            <x-input-label for="email" :value="__('E-posta')" />
            <x-text-input id="email" class="auth-input" type="email" name="email" :value="old('email')" required autofocus autocomplete="username" placeholder="eposta@ornek.com" />
            <x-input-error :messages="$errors->get('email')" class="mt-2" />
        </div>

        <!-- Password -->
        <div class="auth-field">
            <x-input-label for="password" :value="__('Şifre')" />

            <x-text-input id="password" class="auth-input"
                            type="password"
                            name="password"
                            required autocomplete="current-password"
                            placeholder="Şifreniz" />

            <x-input-error :messages="$errors->get('password')" class="mt-2" />
        </div>

        <!-- Remember Me -->
        <div class="auth-options">
            <label for="remember_me">
                <input id="remember_me" type="checkbox" name="remember">
                <span>{{ __('Beni hatırla') }}</span>
            </label>

            @if (Route::has('password.request'))
                <a href="{{ route('password.request') }}">
                    {{ __('Şifremi unuttum') }}
                </a>
            @endif
        </div>

        <div class="auth-submit-row">
            <x-primary-button class="auth-submit">
                {{ __('Giriş Yap') }}
            </x-primary-button>
        </div>

        <p class="auth-register-link">
            Hesabınız yok mu?
            <a href="{{ route('register') }}">Yeni hesap oluşturun</a>
        </p>
    </form>
</x-guest-layout>

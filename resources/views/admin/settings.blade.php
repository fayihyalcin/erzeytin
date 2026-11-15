@extends('layouts.admin')

@section('title', 'Ayarlar - Er Zeytinyağı')
@section('admin_search_placeholder', 'Ayar ara... (logo, seo, paytr, telefon)')
@section('admin_content_class', 'settings-admin')

@section('admin_shell_attributes')
    x-data="{
        sidebarOpen: false,
        sidebarCollapsed: false,
        uploadStatus: '',
        uploadMeta: null,
        logoPath: @js($settings->logo_path),
        logoUrl: @js($settings->logo_path ? Storage::url($settings->logo_path) : ''),
        async uploadLogo(event) {
            const file = event.target.files[0];
            if (! file) return;
            this.uploadStatus = 'Logo yükleniyor ve sıkıştırılıyor...';
            this.uploadMeta = null;

            const formData = new FormData();
            formData.append('image', file);
            formData.append('type', 'setting');

            try {
                const response = await fetch(@js(route('admin.images.store')), {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content,
                        'Accept': 'application/json'
                    },
                    body: formData
                });
                const data = await response.json();

                if (! response.ok) {
                    throw new Error(data.message || 'Logo yüklenemedi.');
                }

                this.logoPath = data.path;
                this.logoUrl = data.url;
                this.uploadMeta = data;
                this.uploadStatus = 'Logo sıkıştırıldı ve yüklendi.';
            } catch (error) {
                this.uploadStatus = error.message || 'Logo yüklenirken hata oluştu.';
            } finally {
                event.target.value = '';
            }
        }
    }"
@endsection

@section('admin_topbar_actions')
<button class="admin-action-button" type="submit" form="settings-form">
    <span>✓</span>
    Ayarları Kaydet
</button>
<a class="admin-action-button" href="/" target="_blank" rel="noreferrer">
    <span class="admin-icon-store"></span>
    Mağazayı Aç
</a>
@endsection

@section('content')
<div class="admin-heading-row">
    <div>
        <h1>Genel Ayarlar</h1>
        <p>Logo, SEO, iletişim, harita, ödeme ve API bilgilerini yönetin.</p>
    </div>
    <div class="date-filter">
        <span>Son güncelleme: {{ $settings->updated_at?->format('d.m.Y H:i') ?? 'Henüz yok' }}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v3"></path>
            <path d="M12 18v3"></path>
            <path d="M4.9 4.9 7 7"></path>
            <path d="M17 17l2.1 2.1"></path>
            <circle cx="12" cy="12" r="4"></circle>
        </svg>
    </div>
</div>

@if (session('status'))
    <div class="settings-alert">{{ session('status') }}</div>
@endif

@if ($errors->any())
    <div class="settings-alert is-error">
        <strong>Kaydedilemedi.</strong>
        <span>{{ $errors->first() }}</span>
    </div>
@endif

<form id="settings-form" class="settings-grid" method="POST" action="{{ route('admin.settings.update') }}">
    @csrf
    @method('PATCH')

    <section class="settings-panel settings-panel-wide">
        <div class="settings-panel-head">
            <span>Marka</span>
            <h2>Logo ve Site Kimliği</h2>
        </div>

        <div class="settings-brand-row">
            <div class="settings-logo-uploader">
                <div class="settings-logo-preview">
                    <template x-if="logoUrl">
                        <img :src="logoUrl" alt="Site logosu">
                    </template>
                    <template x-if="! logoUrl">
                        <span>ER</span>
                    </template>
                </div>
                <input type="hidden" name="logo_path" x-model="logoPath">
                <button type="button" x-on:click="$refs.logoInput.click()">Logo Seç</button>
                <input type="file" x-ref="logoInput" accept="image/jpeg,image/png,image/webp" x-on:change="uploadLogo($event)" hidden>
                <small x-text="uploadStatus"></small>
                <small x-show="uploadMeta" x-cloak>
                    <span x-text="`${Math.round(uploadMeta.original_size / 1024)} KB -> ${Math.round(uploadMeta.compressed_size / 1024)} KB`"></span>
                </small>
            </div>

            <div class="settings-fields-two">
                <label>
                    <span>Site Başlığı</span>
                    <input type="text" name="site_title" value="{{ old('site_title', $settings->site_title) }}" required>
                </label>
                <label>
                    <span>Firma Ünvanı</span>
                    <input type="text" name="company_name" value="{{ old('company_name', $settings->company_name) }}">
                </label>
                <label>
                    <span>Vergi Dairesi</span>
                    <input type="text" name="tax_office" value="{{ old('tax_office', $settings->tax_office) }}">
                </label>
                <label>
                    <span>Vergi No</span>
                    <input type="text" name="tax_number" value="{{ old('tax_number', $settings->tax_number) }}">
                </label>
            </div>
        </div>
    </section>

    <section class="settings-panel">
        <div class="settings-panel-head">
            <span>SEO</span>
            <h2>Arama Motoru Bilgileri</h2>
        </div>
        <label>
            <span>Meta Title</span>
            <input type="text" name="meta_title" value="{{ old('meta_title', $settings->meta_title) }}">
        </label>
        <label>
            <span>Meta Description</span>
            <textarea name="meta_description" rows="4">{{ old('meta_description', $settings->meta_description) }}</textarea>
        </label>
        <label>
            <span>Meta Keywords</span>
            <textarea name="meta_keywords" rows="3">{{ old('meta_keywords', $settings->meta_keywords) }}</textarea>
        </label>
    </section>

    <section class="settings-panel">
        <div class="settings-panel-head">
            <span>İletişim</span>
            <h2>Telefon, GSM ve WhatsApp</h2>
        </div>
        <label>
            <span>E-posta</span>
            <input type="email" name="email" value="{{ old('email', $settings->email) }}">
        </label>
        <div class="settings-fields-two">
            <label>
                <span>Sabit Telefon</span>
                <input type="text" name="phone" value="{{ old('phone', $settings->phone) }}">
            </label>
            <label>
                <span>GSM</span>
                <input type="text" name="gsm" value="{{ old('gsm', $settings->gsm) }}">
            </label>
        </div>
        <label>
            <span>WhatsApp Numarası</span>
            <input type="text" name="whatsapp" value="{{ old('whatsapp', $settings->whatsapp) }}" placeholder="905xxxxxxxxx">
        </label>
    </section>

    <section class="settings-panel settings-panel-wide">
        <div class="settings-panel-head">
            <span>Adres</span>
            <h2>Mağaza Adresi ve Harita</h2>
        </div>
        <label>
            <span>Adres</span>
            <textarea name="address" rows="4">{{ old('address', $settings->address) }}</textarea>
        </label>
        <label>
            <span>Google Maps Embed / iframe</span>
            <textarea name="map_embed" rows="5">{{ old('map_embed', $settings->map_embed) }}</textarea>
        </label>
    </section>

    <section class="settings-panel">
        <div class="settings-panel-head">
            <span>Ödeme</span>
            <h2>PayTR ve Kredi Kartı</h2>
        </div>
        <div class="settings-toggle-row">
            <label>
                <input type="checkbox" name="paytr_enabled" value="1" @checked(old('paytr_enabled', $settings->paytr_enabled))>
                <span>PayTR aktif</span>
            </label>
            <label>
                <input type="checkbox" name="paytr_test_mode" value="1" @checked(old('paytr_test_mode', $settings->paytr_test_mode))>
                <span>Test modu</span>
            </label>
        </div>
        <label>
            <span>Kredi Kartı Sağlayıcısı</span>
            <input type="text" name="card_provider" value="{{ old('card_provider', $settings->card_provider) }}">
        </label>
        <label>
            <span>PayTR Merchant ID</span>
            <input type="text" name="paytr_merchant_id" value="{{ old('paytr_merchant_id', $settings->paytr_merchant_id) }}">
        </label>
        <label>
            <span>PayTR Merchant Key</span>
            <input type="password" name="paytr_merchant_key" value="{{ old('paytr_merchant_key', $settings->paytr_merchant_key) }}" autocomplete="new-password">
        </label>
        <label>
            <span>PayTR Merchant Salt</span>
            <input type="password" name="paytr_merchant_salt" value="{{ old('paytr_merchant_salt', $settings->paytr_merchant_salt) }}" autocomplete="new-password">
        </label>
    </section>

    <section class="settings-panel">
        <div class="settings-panel-head">
            <span>API</span>
            <h2>Entegrasyon Bilgileri</h2>
        </div>
        <label>
            <span>API Base URL</span>
            <input type="url" name="api_base_url" value="{{ old('api_base_url', $settings->api_base_url) }}">
        </label>
        <label>
            <span>API Key</span>
            <input type="text" name="api_key" value="{{ old('api_key', $settings->api_key) }}">
        </label>
        <label>
            <span>API Secret</span>
            <input type="password" name="api_secret" value="{{ old('api_secret', $settings->api_secret) }}" autocomplete="new-password">
        </label>
    </section>

    <section class="settings-panel settings-panel-wide">
        <div class="settings-panel-head">
            <span>Havale</span>
            <h2>Banka ve IBAN Bilgileri</h2>
        </div>
        <div class="settings-fields-two">
            <label>
                <span>Banka Adı</span>
                <input type="text" name="bank_name" value="{{ old('bank_name', $settings->bank_name) }}">
            </label>
            <label>
                <span>Şube</span>
                <input type="text" name="bank_branch" value="{{ old('bank_branch', $settings->bank_branch) }}">
            </label>
        </div>
        <div class="settings-fields-two">
            <label>
                <span>Hesap Sahibi</span>
                <input type="text" name="bank_account_holder" value="{{ old('bank_account_holder', $settings->bank_account_holder) }}">
            </label>
            <label>
                <span>IBAN</span>
                <input type="text" name="bank_iban" value="{{ old('bank_iban', $settings->bank_iban) }}" placeholder="TR00 0000 0000 0000 0000 0000 00">
            </label>
        </div>
        <label>
            <span>Havale Notu</span>
            <textarea name="bank_description" rows="4">{{ old('bank_description', $settings->bank_description) }}</textarea>
        </label>
    </section>

    <div class="settings-submit-row">
        <button type="submit">Ayarları Kaydet</button>
    </div>
</form>
@endsection

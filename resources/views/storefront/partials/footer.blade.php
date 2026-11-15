@php
    $logoUrl = $settings->logo_path ? Storage::url($settings->logo_path) : null;
    $brandName = $settings->site_title ?: 'Er Zeytin Yağı';
    $phone = $settings->phone ?: $settings->gsm;
    $phoneHref = $phone ? preg_replace('/\D+/', '', $phone) : null;
@endphp

<footer class="site-footer">
    <section class="footer-benefits container-wide" aria-label="Ürün değerleri">
        <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-4.8 7-12a7 7 0 0 0-14 0c0 7.2 7 12 7 12Z"></path><path d="M9 13c4-1 6-4 6-8"></path></svg>
            <span><strong>Erken Hasat</strong><small>En yüksek kalite ve lezzet için erken hasat.</small></span>
        </div>
        <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c4 4 6 8 6 12a6 6 0 0 1-12 0c0-4 2-8 6-12Z"></path><path d="M8.5 16.5h7"></path></svg>
            <span><strong>Soğuk Sıkım</strong><small>Doğal aromasını koruyan soğuk sıkım yöntemi.</small></span>
        </div>
        <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18"></path><path d="M12 9c-5-4-9-2-10 2 4 2 8 2 10-2Z"></path><path d="M12 15c5-4 9-2 10 2-4 2-8 2-10-2Z"></path></svg>
            <span><strong>Katkısız & Doğal</strong><small>Koruyucu, katkı maddesi ve kimyasal içermez.</small></span>
        </div>
        <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 14.4 5l3.8-.4.8 3.7 3 2.2-2 3.2.7 3.8-3.7 1.2L14.8 22 12 19.5 9.2 22 7 18.7l-3.7-1.2.7-3.8-2-3.2 3-2.2.8-3.7 3.8.4Z"></path><path d="m8.5 12 2.3 2.3 4.7-4.7"></path></svg>
            <span><strong>Mudanya'dan Sofranıza</strong><small>Bereketli topraklarımızdan doğal ürünler.</small></span>
        </div>
    </section>

    <div class="footer-main">
        <div class="container-wide footer-grid">
            <div class="footer-brand">
                <a href="{{ route('home') }}" class="footer-logo" aria-label="{{ $brandName }}">
                    @if ($logoUrl)
                        <img class="footer-logo-image" src="{{ $logoUrl }}" alt="{{ $brandName }}">
                    @endif
                    <span><strong>ER</strong><small>ZEYTİN YAĞI</small></span>
                </a>
                <p>Doğal, katkısız ve premium zeytin ürünlerini sofranıza ulaştırıyoruz.</p>
                <p class="footer-heart">Mudanya'dan sofranıza.</p>
                <div class="social-links" aria-label="Sosyal medya">
                    <a href="#" aria-label="Facebook">f</a>
                    <a href="#" aria-label="Instagram">◎</a>
                    <a href="#" aria-label="YouTube">▶</a>
                    <a href="#" aria-label="Pinterest">p</a>
                </div>
            </div>

            <nav class="footer-column" aria-label="Kurumsal">
                <h3>KURUMSAL</h3>
                <a href="{{ route('pages.show', 'hakkimizda') }}">Hakkımızda</a>
                <a href="{{ route('pages.show', 'vizyon-misyon') }}">Vizyon & Misyon</a>
                <a href="{{ route('pages.show', 'kalite-belgelerimiz') }}">Kalite Belgelerimiz</a>
                <a href="{{ route('pages.show', 'surdurulebilirlik') }}">Sürdürülebilirlik</a>
                <a href="{{ route('contact.show') }}">İletişim</a>
            </nav>

            <nav class="footer-column" aria-label="Alışveriş">
                <h3>ALIŞVERİŞ</h3>
                <a href="{{ route('home') }}#products-results">Tüm Ürünler</a>
                @foreach ($storefrontCategories as $category)
                    <a href="{{ route('categories.show', ['category' => $category->slug]) }}">{{ $category->name }}</a>
                @endforeach
            </nav>

            <nav class="footer-column" aria-label="Müşteri hizmetleri">
                <h3>MÜŞTERİ HİZMETLERİ</h3>
                <a href="{{ route('pages.show', 'sikca-sorulan-sorular') }}">Sıkça Sorulan Sorular</a>
                <a href="{{ route('pages.show', 'kargo-teslimat') }}">Kargo & Teslimat</a>
                <a href="{{ route('pages.show', 'iade-degisim') }}">İade & Değişim</a>
                <a href="{{ route('pages.show', 'gizlilik-politikasi') }}">Gizlilik Politikası</a>
                <a href="{{ route('pages.show', 'mesafeli-satis-sozlesmesi') }}">Mesafeli Satış Sözleşmesi</a>
            </nav>

            <div class="footer-contact">
                <h3>BİZE ULAŞIN</h3>
                <a href="{{ $phoneHref ? 'tel:+'.$phoneHref : '#' }}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"></path></svg>
                    <span>{{ $phone ?: '0530 516 54 98' }}</span>
                </a>
                <a href="mailto:{{ $settings->email ?: 'celalergida@gmail.com' }}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>
                    <span>{{ $settings->email ?: 'celalergida@gmail.com' }}</span>
                </a>
                <a href="#">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-4.8 7-12a7 7 0 0 0-14 0c0 7.2 7 12 7 12Z"></path><circle cx="12" cy="9" r="2.5"></circle></svg>
                    <span>{!! nl2br(e($settings->address ?: 'Çepni mahallesi Çepni 25. sokak no:3 Mudanya/Bursa')) !!}</span>
                </a>
            </div>
        </div>

        <div class="container-wide footer-bottom">
            <p>© 2024 {{ $brandName }} - Tüm hakları saklıdır.</p>
            <div class="payment-row" aria-label="Ödeme yöntemleri">
                <span>VISA</span>
                <span>mastercard</span>
                <span>troy</span>
                <span>paytr</span>
                <span class="secure-pay">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>
                    SSL SECURE
                </span>
            </div>
        </div>
    </div>
</footer>

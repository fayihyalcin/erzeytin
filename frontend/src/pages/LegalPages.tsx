import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { StorefrontWhatsAppButton } from '../components/StorefrontWhatsAppButton';
import './LegalPages.css';

const CONTACT_PHONE_DISPLAY = '0530 516 54 98';
const CONTACT_PHONE_LINK = 'tel:+905305165498';
const CONTACT_MAIL_ADDRESS = 'celalergida@gmail.com';
const CONTACT_ADDRESS = 'Cepni mahallesi Cepni 25.sokak no:3 MUDANYA/BURSA';
const CONTACT_WHATSAPP_LINK =
  'https://wa.me/905305165498?text=Merhaba%2C%20siparis%20ve%20odeme%20hakkinda%20bilgi%20almak%20istiyorum.';

function LegalLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="legal-page">
      <header className="legal-topbar">
        <div className="legal-topbar-inner">
          <Link to="/" className="legal-brand">
            Er Zeytin
          </Link>
          <nav className="legal-nav">
            <Link to="/">Magaza</Link>
            <Link to="/customer/login">Musteri Giris</Link>
            <Link to="/customer/register">Kayit Ol</Link>
            <Link to="/iletisim">Iletisim</Link>
          </nav>
        </div>
      </header>

      <section className="legal-hero">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>

      <section className="legal-content">{children}</section>
    </main>
  );
}

function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <article className="legal-section">
      <h2>{heading}</h2>
      <div>{children}</div>
    </article>
  );
}

export function KvkkPage() {
  return (
    <LegalLayout
      title="KVKK Aydinlatma Metni"
      subtitle="6698 sayili Kisisel Verilerin Korunmasi Kanunu kapsaminda veri isleme sureclerimiz."
    >
      <LegalSection heading="1. Veri Sorumlusu">
        <p>
          Bu aydinlatma metni, veri sorumlusu sifatiyla Er Zeytin Gida ve E-Ticaret
          Isletmesi tarafindan musterilerimizin kisisel verilerinin islenmesine iliskin
          olarak hazirlanmistir.
        </p>
      </LegalSection>

      <LegalSection heading="2. Islenen Kisisel Veriler">
        <p>
          Ad soyad, telefon, e-posta, teslimat ve fatura adresleri, siparis bilgileri,
          odeme durumu, islem kayitlari ve iletisim talepleri kanuni yukumlulukler
          kapsaminda islenmektedir.
        </p>
      </LegalSection>

      <LegalSection heading="3. Isleme Amaci ve Hukuki Sebep">
        <p>
          Veriler; siparisin alinmasi, odemenin dogrulanmasi, urunun teslimi, satis
          sonrasi destek, muhasebe ve yasal yukumluluklerin yerine getirilmesi amaclariyla
          KVKK madde 5/2 kapsamindaki hukuki sebeplere dayanilarak islenmektedir.
        </p>
      </LegalSection>

      <LegalSection heading="4. Aktarim ve Saklama">
        <p>
          Veriler, odeme ve kargo operasyonu icin gerekli oldugu olcude yetkili is ortaklari
          ve resmi kurumlarla paylasilabilir. Kayitlar, ilgili mevzuatta belirtilen yasal
          sureler boyunca saklanir ve sure sonunda imha edilir.
        </p>
      </LegalSection>

      <LegalSection heading="5. Haklariniz">
        <p>
          KVKK madde 11 kapsaminda; verilerinize erisim, duzeltme, silme, isleme itiraz ve
          aktarim taleplerinizi <strong>kvkk@erzeytin.com</strong> adresine iletebilirsiniz.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Gizlilik Politikasi"
      subtitle="Web sitemizi kullanirken paylastiginiz veriler icin gizlilik taahhudumuz."
    >
      <LegalSection heading="1. Genel Ilke">
        <p>
          Musteri verileri gizli kabul edilir. Veriler, sadece hizmetin sunulmasi ve yasal
          zorunluluklarin yerine getirilmesi amaciyla islenir.
        </p>
      </LegalSection>

      <LegalSection heading="2. Cerezler ve Teknik Veriler">
        <p>
          Site performansi, guvenlik ve alisveris deneyimini iyilestirmek amaciyla zorunlu
          cerezler ve teknik log kayitlari kullanilir. Tarayici ayarlarinizdan cerez
          tercihlerinizi yonetebilirsiniz.
        </p>
      </LegalSection>

      <LegalSection heading="3. Odeme Guvenligi">
        <p>
          Kart bilgileri tarafimizca saklanmaz; odeme sureci guvenli odeme altyapisi
          uzerinden yurutulur. Islem kayitlari yalnizca finansal mutabakat amaciyla tutulur.
        </p>
      </LegalSection>

      <LegalSection heading="4. Ucuncu Taraflar">
        <p>
          Kargo, odeme, muhasebe ve mevzuat kapsamindaki zorunlu islemler haricinde verileriniz
          izniniz olmadan pazarlama amacli ucuncu kisilerle paylasilmaz.
        </p>
      </LegalSection>

      <LegalSection heading="5. Iletisim">
        <p>
          Gizlilik ile ilgili talepleriniz icin <strong>destek@erzeytin.com</strong> adresine
          e-posta gonderebilirsiniz.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

export function SalesAgreementPage() {
  return (
    <LegalLayout
      title="Mesafeli Satis Sozlesmesi"
      subtitle="Site uzerinden olusturulan siparislerde taraflarin hak ve yukumlulukleri."
    >
      <LegalSection heading="1. Taraflar ve Konu">
        <p>
          Satici: Er Zeytin Gida ve E-Ticaret Isletmesi. Alici: Siparisi onaylayan son
          kullanici. Isbu sozlesme, internet uzerinden kurulan mesafeli satisa iliskin
          hak ve yukumlulukleri belirler.
        </p>
      </LegalSection>

      <LegalSection heading="2. Siparis ve Odeme">
        <p>
          Alici, siparis oncesinde urun nitelikleri, toplam tutar, kargo bedeli ve odeme
          sekline iliskin bilgileri gordugunu kabul eder. Odeme onayi alinmadan siparis
          kesinlesmez.
        </p>
      </LegalSection>

      <LegalSection heading="3. Teslimat">
        <p>
          Siparisler stok durumu ve operasyon yogunluguna gore en kisa surede kargoya
          teslim edilir. Teslimat suresi; resmi tatiller, olumsuz hava kosullari ve
          musteri kaynakli gecikmelerde farklilik gosterebilir.
        </p>
      </LegalSection>

      <LegalSection heading="4. Cayma Hakki ve Iade">
        <p>
          Mevzuat kapsaminda cayma hakki bulunan urunlerde alici, teslimattan itibaren
          14 gun icinde iade talebi olusturabilir. Hijyen, bozulabilir gida ve ambalaji
          acilmis urunlerde iade sinirlamalari uygulanir.
        </p>
      </LegalSection>

      <LegalSection heading="5. Uyusmazlik ve Yurum">
        <p>
          Uyusmazlik durumunda Tuketici Hakem Heyetleri ve Tuketici Mahkemeleri yetkilidir.
          Isbu sozlesme, alicinin siparisi onayladigi an yururluge girer.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

export function ContactPage() {
  return (
    <main className="contact-page">
      <header className="contact-header">
        <div className="contact-shell contact-header-inner">
          <Link to="/" className="contact-brand" aria-label="Er Zeyincilik anasayfa">
            <span className="contact-brand-mark">EZ</span>
            <span className="contact-brand-text">
              <strong>Er Zeyincilik</strong>
              <small>Ege'den sofraya dogal lezzet</small>
            </span>
          </Link>

          <nav className="contact-nav">
            <Link to="/">Ana Sayfa</Link>
            <Link to="/customer/login">Musteri Girisi</Link>
            <Link to="/customer/register">Kayit Ol</Link>
            <Link to="/cart">Sepetim</Link>
          </nav>

          <div className="contact-header-meta">
            <a href={CONTACT_PHONE_LINK}>{CONTACT_PHONE_DISPLAY}</a>
            <a href={`mailto:${CONTACT_MAIL_ADDRESS}`}>{CONTACT_MAIL_ADDRESS}</a>
          </div>
        </div>
      </header>

      <section className="contact-hero">
        <div className="contact-shell contact-hero-grid">
          <div className="contact-hero-content">
            <p className="contact-hero-badge">7/24 Hizli Iletisim</p>
            <h1>Iletisim Merkezi</h1>
            <p>
              Siparis, odeme, kargo, iade ve kurumsal talepleriniz icin bize telefon,
              WhatsApp veya e-posta uzerinden hemen ulasabilirsiniz.
            </p>
            <div className="contact-hero-actions">
              <a href={CONTACT_PHONE_LINK}>Telefonla Ara</a>
              <a href={CONTACT_WHATSAPP_LINK} target="_blank" rel="noreferrer">
                WhatsApp'tan Yaz
              </a>
            </div>
          </div>

          <article className="contact-hero-info">
            <h2>Hizli Erisim Bilgileri</h2>
            <ul>
              <li>
                <span>Telefon</span>
                <a href={CONTACT_PHONE_LINK}>{CONTACT_PHONE_DISPLAY}</a>
              </li>
              <li>
                <span>E-posta</span>
                <a href={`mailto:${CONTACT_MAIL_ADDRESS}`}>{CONTACT_MAIL_ADDRESS}</a>
              </li>
              <li>
                <span>Adres</span>
                <p>{CONTACT_ADDRESS}</p>
              </li>
              <li>
                <span>Calisma Saatleri</span>
                <p>Pazartesi - Cumartesi, 09:00 - 18:00</p>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section className="contact-main">
        <div className="contact-shell contact-main-grid">
          <article className="contact-map-card">
            <div className="contact-card-head">
              <h2>Magaza Konumu</h2>
              <p>Mudanya Bursa operasyon merkezimize haritadan ulasin.</p>
            </div>
            <div className="contact-map-frame">
              <iframe
                title="Er Zeyincilik konum haritasi"
                src="https://www.google.com/maps?q=Cepni%20mahallesi%20Cepni%2025.sokak%20no%3A3%20Mudanya%20Bursa&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </article>

          <article className="contact-form-card">
            <div className="contact-card-head">
              <h2>Hizli Mesaj Formu</h2>
              <p>Mesajinizi birakin, ekibimiz en kisa surede donus saglasin.</p>
            </div>

            <form
              className="contact-form"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <label>
                Ad Soyad
                <input type="text" placeholder="Adiniz Soyadiniz" />
              </label>
              <label>
                E-posta
                <input type="email" placeholder="ornek@site.com" />
              </label>
              <label>
                Telefon
                <input type="tel" placeholder="+90 5xx xxx xx xx" />
              </label>
              <label>
                Konu
                <input type="text" placeholder="Siparis / Odeme / Kargo / Iade" />
              </label>
              <label className="contact-form-message">
                Mesaj
                <textarea rows={5} placeholder="Mesajinizi yazin..." />
              </label>
              <button type="submit">Mesaji Gonder</button>
            </form>
          </article>
        </div>
      </section>

      <section className="contact-quick-access">
        <div className="contact-shell contact-quick-grid">
          <a href={CONTACT_PHONE_LINK} className="contact-quick-card phone">
            <span className="icon" aria-hidden="true">
              TL
            </span>
            <div>
              <strong>Telefon Destek</strong>
              <p>{CONTACT_PHONE_DISPLAY}</p>
            </div>
          </a>

          <a
            href={CONTACT_WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="contact-quick-card whatsapp"
          >
            <span className="icon" aria-hidden="true">
              WA
            </span>
            <div>
              <strong>WhatsApp Hizli Erisim</strong>
              <p>Tek tikla uzman destegine ulasin</p>
            </div>
          </a>

          <a href={`mailto:${CONTACT_MAIL_ADDRESS}`} className="contact-quick-card mail">
            <span className="icon" aria-hidden="true">
              EP
            </span>
            <div>
              <strong>E-posta Destegi</strong>
              <p>{CONTACT_MAIL_ADDRESS}</p>
            </div>
          </a>
        </div>
      </section>

      <footer className="contact-footer">
        <div className="contact-shell contact-footer-grid">
          <article className="contact-footer-brand">
            <h3>Er Zeyincilik</h3>
            <p>
              Dogal zeytin ve zeytinyagi urunlerinde guvenli odeme, hizli teslimat ve
              musteri odakli destek deneyimi.
            </p>
            <ul className="contact-footer-contact-list">
              <li>
                <a href={CONTACT_PHONE_LINK}>{CONTACT_PHONE_DISPLAY}</a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_MAIL_ADDRESS}`}>{CONTACT_MAIL_ADDRESS}</a>
              </li>
              <li>{CONTACT_ADDRESS}</li>
            </ul>
          </article>

          <nav className="contact-footer-links">
            <h4>Hizli Linkler</h4>
            <Link to="/">Ana Sayfa</Link>
            <Link to="/cart">Sepetim</Link>
            <Link to="/customer/login">Musteri Girisi</Link>
            <Link to="/customer/register">Kayit Ol</Link>
          </nav>

          <nav className="contact-footer-links">
            <h4>Yasal Sayfalar</h4>
            <Link to="/kvkk">KVKK Aydinlatma Metni</Link>
            <Link to="/gizlilik">Gizlilik Politikasi</Link>
            <Link to="/satis-sozlesmesi">Mesafeli Satis Sozlesmesi</Link>
            <Link to="/iletisim">Iletisim</Link>
          </nav>
        </div>

        <div className="contact-shell contact-footer-bottom">
          <span>Er Zeyincilik (c) {new Date().getFullYear()} - Tum haklari saklidir.</span>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Yukari Don
          </button>
        </div>
      </footer>

      <StorefrontWhatsAppButton />
    </main>
  );
}

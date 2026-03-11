import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PublicStorefrontLayout } from '../components/public/PublicStorefrontLayout';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { usePublicWebsiteConfig } from '../lib/usePublicWebsiteConfig';
import './CustomerAuthPage.css';

function resolveNextPath(search: string) {
  const params = new URLSearchParams(search);
  const next = params.get('next');
  if (!next || !next.startsWith('/')) {
    return '/customer/dashboard';
  }

  return next;
}

const REGISTER_HIGHLIGHTS = [
  {
    value: '1 dk',
    label: 'Hızlı hesap oluşturma',
  },
  {
    value: 'Tek panel',
    label: 'Sipariş ve adres yönetimi',
  },
  {
    value: '%100',
    label: 'Mobil uyumlu deneyim',
  },
];

const REGISTER_FEATURES = [
  {
    title: 'Siparişlerinizi tek alanda takip edin',
    description:
      'Onay, hazırlanıyor, kargoda ve teslim edildi adımlarını aynı panelden görün.',
  },
  {
    title: 'Adreslerinizi kaydedin',
    description: 'Tekrar alışverişlerde form doldurmadan hızlı checkout deneyimi yaşayın.',
  },
  {
    title: 'Ödeme ve destek kayıtları',
    description: 'Sipariş geçmişi, teslimat notları ve iletişim kanalları hep elinizin altında.',
  },
];

const REGISTER_ASSURANCES = [
  {
    title: 'Hızlı hesap kurulumu',
    description: 'Dakikalar içinde kayıt olup müşterilik alanınızı açabilirsiniz.',
  },
  {
    title: 'Esnek profil yönetimi',
    description: 'Telefon, adres ve tercihlerinizi sonradan rahatça güncelleyebilirsiniz.',
  },
  {
    title: 'Mobilde rahat kullanım',
    description: 'Telefon ekranına uygun kompakt bir hesap deneyimi sunulur.',
  },
];

export function CustomerRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useCustomerAuth();
  const { config, currency, loading: configLoading } = usePublicWebsiteConfig();

  const nextPath = useMemo(() => resolveNextPath(location.search), [location.search]);
  const loginHref = location.search ? `/customer/login${location.search}` : '/customer/login';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        fullName,
        email,
        phone,
        password,
      });
      navigate(nextPath, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kayıt tamamlanamadı.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicStorefrontLayout activePath={location.pathname} config={config} currency={currency}>
      <section className="customer-auth-screen">
        <div className="customer-auth-shell">
          <aside className="customer-auth-intro">
            <div className="customer-auth-intro-top">
              <span className="customer-auth-eyebrow">Müşteri Hesabı</span>
              <h1>Hızlı bir hesap oluşturun, siparişlerinizi tek panelden yönetin.</h1>
              <p>
                {config.theme.brandName} müşterileri için hazırlanan hesap alanı ile sipariş
                takibi, kayıtlı adresler ve destek geçmişi tek bir yerde toplanıyor.
              </p>
            </div>

            <div className="customer-auth-intro-actions">
              <Link className="customer-auth-primary-link" to="/urunler">
                Ürünleri İncele
              </Link>
              <a
                className="customer-auth-secondary-link"
                href={config.contact.whatsappLink}
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp Destek
              </a>
            </div>

            <div className="customer-auth-stat-grid">
              {REGISTER_HIGHLIGHTS.map((item) => (
                <article className="customer-auth-stat-card" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>

            <div className="customer-auth-feature-list">
              {REGISTER_FEATURES.map((item, index) => (
                <article className="customer-auth-feature-card" key={item.title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </aside>

          <div className="customer-auth-card">
            <div className="customer-auth-card-head">
              <div>
                <span className="customer-auth-badge">
                  {configLoading ? 'Site ayarları yükleniyor' : 'Yeni Müşteri Kaydı'}
                </span>
                <h2>Hesabınızı oluşturun</h2>
                <p>Birkaç bilgiyle kaydolun, siparişlerinizi panelden takip etmeye başlayın.</p>
              </div>

              <div className="customer-auth-security">
                <strong>Sipariş takibi hazır</strong>
                <span>Kayıt tamamlandıktan sonra hesap paneliniz otomatik açılır.</span>
              </div>
            </div>

            {nextPath !== '/customer/dashboard' ? (
              <div className="customer-auth-notice">
                Kayıt tamamlandığında sizi bıraktığınız akışa otomatik olarak geri döneceğiz.
              </div>
            ) : null}

            <form className="customer-auth-form" onSubmit={handleSubmit}>
              <label>
                <span>Ad soyad</span>
                <input
                  autoComplete="name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Ad Soyad"
                  required
                />
              </label>

              <label>
                <span>E-posta</span>
                <input
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ornek@site.com"
                  required
                />
              </label>

              <label>
                <span>Telefon</span>
                <input
                  autoComplete="tel"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="05xx xxx xx xx"
                />
              </label>

              <label>
                <span>Şifre</span>
                <input
                  autoComplete="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="En az 6 karakter"
                  minLength={6}
                  required
                />
              </label>

              {error ? <p className="customer-auth-error">{error}</p> : null}

              <button type="submit" disabled={loading}>
                {loading ? 'Kayıt oluşturuluyor...' : 'Hesap Oluştur'}
              </button>
            </form>

            <div className="customer-auth-assurance-grid">
              {REGISTER_ASSURANCES.map((item) => (
                <article className="customer-auth-assurance-item" key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </article>
              ))}
            </div>

            <div className="customer-auth-support-card">
              <div>
                <span>Yardım mı gerekli?</span>
                <strong>{config.contact.phoneDisplay}</strong>
                <small>{config.contact.workingHours}</small>
              </div>
              <a href={config.contact.phoneLink}>Hemen Ara</a>
            </div>

            <div className="customer-auth-bottom">
              <span>Zaten hesabınız var mı?</span>
              <Link to={loginHref}>Giriş Yap</Link>
            </div>
          </div>
        </div>
      </section>
    </PublicStorefrontLayout>
  );
}

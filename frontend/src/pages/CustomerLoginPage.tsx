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

const LOGIN_HIGHLIGHTS = [
  {
    value: '24/7',
    label: 'Sipariş ve teslimat görünümü',
  },
  {
    value: '3 adım',
    label: 'Tekrar sipariş akışı',
  },
  {
    value: '100%',
    label: 'Güvenli hesap alanı',
  },
];

const LOGIN_FEATURES = [
  {
    title: 'Siparişlerinizi hızla takip edin',
    description:
      'Onaylanan sipariş, kargo bilgisi ve teslimat adımlarını tek panelden görün.',
  },
  {
    title: 'Kayıtlı adres ve hesap bilgileri',
    description:
      'Bir sonraki alışverişte adres bilgilerinizi tekrar girmek zorunda kalmayın.',
  },
  {
    title: 'Destek ve ödeme geçmişi bir arada',
    description:
      'Makbuzlar, ödeme durumları ve destek kanallarına kolayca geri dönün.',
  },
];

const LOGIN_ASSURANCES = [
  {
    title: 'Güvenli ödeme geçmişi',
    description: 'İşlemleriniz panelde düzenli saklanır.',
  },
  {
    title: 'Hızlı destek',
    description: 'Telefon ve WhatsApp üzerinden anlık erişim.',
  },
  {
    title: 'Mobil uyumlu panel',
    description: 'Telefonunuzdan da rahatça yönetin.',
  },
];

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCustomerAuth();
  const { config, currency, loading: configLoading } = usePublicWebsiteConfig();

  const nextPath = useMemo(() => resolveNextPath(location.search), [location.search]);
  const registerHref = location.search
    ? `/customer/register${location.search}`
    : '/customer/register';
  const [email, setEmail] = useState('fatih@example.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(nextPath, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Giriş yapılamadı.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicStorefrontLayout
      activePath={location.pathname}
      config={config}
      currency={currency}
    >
      <section className="customer-auth-screen">
        <div className="customer-auth-shell">
          <aside className="customer-auth-intro">
            <div className="customer-auth-intro-top">
              <span className="customer-auth-eyebrow">Müşteri Paneli</span>
              <h1>Hesabınıza giriş yapın, sipariş akışını tek yerden yönetin.</h1>
              <p>
                {config.theme.brandName} müşterileri için hazırlanan bu alan sayesinde
                siparişlerinizi, teslimat sürecini ve hesap bilgilerinizi rahat bir panel
                deneyimiyle yönetebilirsiniz.
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
              {LOGIN_HIGHLIGHTS.map((item) => (
                <article className="customer-auth-stat-card" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>

            <div className="customer-auth-feature-list">
              {LOGIN_FEATURES.map((item, index) => (
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
                  {configLoading ? 'Site ayarları yükleniyor' : 'Güvenli Müşteri Girişi'}
                </span>
                <h2>Hesabınıza giriş yapın</h2>
                <p>E-posta ve şifrenizi girerek sipariş panelinize anında geçiş yapın.</p>
              </div>

              <div className="customer-auth-security">
                <strong>3D Secure uyumlu</strong>
                <span>Ödeme ve sipariş bilgileriniz hesap panelinizde güvenle listelenir.</span>
              </div>
            </div>

            {nextPath !== '/customer/dashboard' ? (
              <div className="customer-auth-notice">
                Giriş tamamlandığında sizi bıraktığınız sayfaya otomatik olarak
                yönlendireceğiz.
              </div>
            ) : null}

            <form className="customer-auth-form" onSubmit={handleSubmit}>
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
                <span>Şifre</span>
                <input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="******"
                  required
                />
              </label>

              {error ? <p className="customer-auth-error">{error}</p> : null}

              <button type="submit" disabled={loading}>
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>

            <p className="customer-auth-demo">Demo hesap: fatih@example.com / 123456</p>

            <div className="customer-auth-assurance-grid">
              {LOGIN_ASSURANCES.map((item) => (
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
              <span>Hesabın yok mu?</span>
              <Link to={registerHref}>Kayıt Ol</Link>
            </div>
          </div>
        </div>
      </section>
    </PublicStorefrontLayout>
  );
}

import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import './CustomerAuthPage.css';

function resolveNextPath(search: string) {
  const params = new URLSearchParams(search);
  const next = params.get('next');
  if (!next || !next.startsWith('/')) {
    return '/customer/dashboard';
  }

  return next;
}

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCustomerAuth();

  const nextPath = useMemo(() => resolveNextPath(location.search), [location.search]);
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
      const message = err instanceof Error ? err.message : 'Giris yapilamadi.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="customer-auth-screen">
      <section className="customer-auth-shell">
        <aside className="customer-auth-intro">
          <Link className="customer-auth-home" to="/">
            Ana Sayfa
          </Link>
          <h1>Musteri Giris</h1>
          <p>
            Siparisleriniz, kargo takip numaralariniz, makbuzlariniz ve kayitli odeme
            yontemlerinize tek panelden ulasin.
          </p>
          <ul>
            <li>Siparis gecmisi</li>
            <li>Kargo takip ve teslimat durumu</li>
            <li>Makbuz ve odeme kayitlari</li>
            <li>Adres ve hesap ayarlari</li>
          </ul>
        </aside>

        <div className="customer-auth-card">
          <h2>Hesabina Giris Yap</h2>
          <p>Hizli giris icin e-posta ve sifrenizi girin.</p>

          <form className="customer-auth-form" onSubmit={handleSubmit}>
            <label>
              E-posta
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ornek@site.com"
                required
              />
            </label>

            <label>
              Sifre
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="******"
                required
              />
            </label>

            {error ? <p className="customer-auth-error">{error}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
            </button>
          </form>

          <div className="customer-auth-bottom">
            <span>Hesabin yok mu?</span>
            <Link to="/customer/register">Kayit Ol</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

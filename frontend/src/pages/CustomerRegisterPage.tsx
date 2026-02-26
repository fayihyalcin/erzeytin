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

export function CustomerRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useCustomerAuth();

  const nextPath = useMemo(() => resolveNextPath(location.search), [location.search]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (password !== passwordAgain) {
      setError('Sifreler birbiriyle ayni degil.');
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName,
        phone,
        email,
        password,
      });
      navigate(nextPath, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kayit olusturulamadi.';
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
          <h1>Musteri Kayit</h1>
          <p>
            Kayit olduktan sonra siparislerinizi tek ekranda takip edebilir, adres ve
            odeme bilgilerinizi guvenle yonetebilirsiniz.
          </p>
          <ul>
            <li>Tek tikla tekrar siparis</li>
            <li>Makbuz ve odeme gecmisi</li>
            <li>Kayitli adres yonetimi</li>
            <li>PAYTR uyumlu hesap alani</li>
          </ul>
        </aside>

        <div className="customer-auth-card">
          <h2>Yeni Hesap Olustur</h2>
          <p>Zorunlu alanlari doldurup kaydi tamamlayin.</p>

          <form className="customer-auth-form" onSubmit={handleSubmit}>
            <label>
              Ad Soyad
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Fatih Yilmaz"
                minLength={2}
                required
              />
            </label>

            <label>
              Telefon
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+90 5xx xxx xx xx"
                required
              />
            </label>

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
                placeholder="en az 6 karakter"
                minLength={6}
                required
              />
            </label>

            <label>
              Sifre Tekrar
              <input
                type="password"
                value={passwordAgain}
                onChange={(event) => setPasswordAgain(event.target.value)}
                placeholder="sifre tekrari"
                minLength={6}
                required
              />
            </label>

            {error ? <p className="customer-auth-error">{error}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? 'Kayit olusturuluyor...' : 'Kayit Ol'}
            </button>
          </form>

          <div className="customer-auth-bottom">
            <span>Zaten hesabin var mi?</span>
            <Link to="/customer/login">Giris Yap</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

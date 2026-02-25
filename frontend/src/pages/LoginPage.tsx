import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard/website');
    } catch {
      setError('Giris basarisiz. Bilgileri kontrol et.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-panel">
        <h1>Zeytin Admin</h1>
        <p>Koyu tema e-ticaret yonetim paneli</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Kullanici Adi
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
            />
          </label>

          <label>
            Sifre
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="admin123"
            />
          </label>

          {error ? <div className="error-text">{error}</div> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Giris Yapiliyor...' : 'Giris Yap'}
          </button>
        </form>

        <div className="login-hint">
          Varsayilan: admin / admin123, temsilci / temsilci123
        </div>
      </div>
    </div>
  );
}


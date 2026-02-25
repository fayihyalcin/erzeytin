import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { AdminUser } from '../types/api';

interface RepresentativeFormState {
  username: string;
  fullName: string;
  password: string;
  isActive: boolean;
}

const defaultFormState: RepresentativeFormState = {
  username: '',
  fullName: '',
  password: '',
  isActive: true,
};

export function RepresentativesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [representatives, setRepresentatives] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<RepresentativeFormState>(defaultFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRepresentatives = async () => {
    const response = await api.get<AdminUser[]>('/users/representatives');
    setRepresentatives(response.data);
  };

  useEffect(() => {
    fetchRepresentatives()
      .catch(() => {
        setMessage('Temsilci listesi yuklenemedi.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      if (editingId) {
        await api.patch(`/users/representatives/${editingId}`, {
          fullName: form.fullName,
          password: form.password || undefined,
          isActive: form.isActive,
        });
        setMessage('Temsilci guncellendi.');
      } else {
        await api.post('/users/representatives', {
          username: form.username,
          fullName: form.fullName,
          password: form.password,
          isActive: form.isActive,
        });
        setMessage('Temsilci olusturuldu.');
      }

      setForm(defaultFormState);
      setEditingId(null);
      await fetchRepresentatives();
    } catch {
      setMessage('Temsilci kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="panel-card">Temsilci listesi yukleniyor...</section>;
  }

  return (
    <section className="panel-card">
      <div className="panel-title-row">
        <h3>Musteri Temsilcileri</h3>
        <span>{isAdmin ? 'Olustur / Duzenle' : 'Liste'}</span>
      </div>

      {isAdmin ? (
        <form className="grid-form wide-form" onSubmit={handleSubmit}>
          <label>
            Kullanici Adi
            <input
              value={form.username}
              disabled={Boolean(editingId)}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              required
            />
          </label>

          <label>
            Durum
            <select
              value={form.isActive ? '1' : '0'}
              onChange={(event) => setForm({ ...form, isActive: event.target.value === '1' })}
            >
              <option value="1">Aktif</option>
              <option value="0">Pasif</option>
            </select>
          </label>

          <label className="field-span-2">
            Ad Soyad
            <input
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </label>

          <label className="field-span-2">
            {editingId ? 'Yeni Sifre (bos birakirsan degismez)' : 'Sifre'}
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required={!editingId}
            />
          </label>

          <div className="form-actions field-span-2">
            <button type="submit" disabled={saving}>
              {saving
                ? 'Kaydediliyor...'
                : editingId
                  ? 'Temsilci Guncelle'
                  : 'Temsilci Olustur'}
            </button>
            {editingId ? (
              <button
                className="tiny secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(defaultFormState);
                }}
              >
                Iptal
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {message ? <p className="message">{message}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Kullanici</th>
              <th>Rol</th>
              <th>Durum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {representatives.length === 0 ? (
              <tr>
                <td colSpan={5}>Temsilci bulunamadi.</td>
              </tr>
            ) : (
              representatives.map((representative) => (
                <tr key={representative.id}>
                  <td>{representative.fullName}</td>
                  <td>{representative.username}</td>
                  <td>{representative.role}</td>
                  <td>{representative.isActive ? 'Aktif' : 'Pasif'}</td>
                  <td>
                    {isAdmin ? (
                      <button
                        className="tiny secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(representative.id);
                          setForm({
                            username: representative.username,
                            fullName: representative.fullName,
                            password: '',
                            isActive: representative.isActive,
                          });
                        }}
                      >
                        Duzenle
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { AdminPagination } from '../components/admin/AdminPagination';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { AdminUser, PaginatedResponse } from '../types/api';

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

const PAGE_SIZE = 10;

export function RepresentativesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [representatives, setRepresentatives] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<RepresentativeFormState>(defaultFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilterInput, setStatusFilterInput] = useState<'all' | 'active' | 'inactive'>('all');
  const [query, setQuery] = useState({
    page: 1,
    search: '',
    status: 'all' as 'all' | 'active' | 'inactive',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  });

  const fetchRepresentatives = async (nextQuery = query) => {
    const response = await api.get<PaginatedResponse<AdminUser>>('/users/representatives', {
      params: {
        page: nextQuery.page,
        pageSize: PAGE_SIZE,
        search: nextQuery.search || undefined,
        status: nextQuery.status !== 'all' ? nextQuery.status : undefined,
      },
    });

    setRepresentatives(response.data.items);
    setPagination({
      total: response.data.total,
      page: response.data.page,
      pageSize: response.data.pageSize,
      totalPages: response.data.totalPages,
    });
  };

  useEffect(() => {
    fetchRepresentatives(query)
      .catch(() => {
        setMessage('Temsilci listesi yuklenemedi.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query]);

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
      await fetchRepresentatives(query);
    } catch {
      setMessage('Temsilci kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setMessage(null);
    try {
      await api.delete(`/users/representatives/${id}`);
      await fetchRepresentatives(query);
      setMessage('Temsilci silindi.');
      if (editingId === id) {
        setEditingId(null);
        setForm(defaultFormState);
      }
    } catch {
      setMessage('Temsilci silinemedi.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery({
      page: 1,
      search: searchInput.trim(),
      status: statusFilterInput,
    });
  };

  if (loading) {
    return <section className="admin-panel">Temsilci listesi yukleniyor...</section>;
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Operasyon / Temsilciler</span>
          <h2>Musteri temsilcileri</h2>
          <p>Siparis zimmeti yapilacak ekip hesaplarini ve aktiflik durumlarini yonetin.</p>
        </div>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <section className="admin-overview-grid">
        {isAdmin ? (
          <article className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3>{editingId ? 'Temsilci duzenle' : 'Yeni temsilci'}</h3>
                <p>Yeni ekip hesabi olusturun veya mevcut kaydi duzenleyin.</p>
              </div>
            </div>

            <form className="admin-form-grid" onSubmit={handleSubmit}>
              <label className="admin-label">
                <span>Kullanici adi</span>
                <input
                  className="admin-input"
                  disabled={Boolean(editingId)}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  required
                  value={form.username}
                />
              </label>
              <label className="admin-label">
                <span>Durum</span>
                <select
                  className="admin-select"
                  onChange={(event) => setForm({ ...form, isActive: event.target.value === '1' })}
                  value={form.isActive ? '1' : '0'}
                >
                  <option value="1">Aktif</option>
                  <option value="0">Pasif</option>
                </select>
              </label>
              <label className="admin-label admin-span-full">
                <span>Ad soyad</span>
                <input
                  className="admin-input"
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                  required
                  value={form.fullName}
                />
              </label>
              <label className="admin-label admin-span-full">
                <span>{editingId ? 'Yeni sifre' : 'Sifre'}</span>
                <input
                  className="admin-input"
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required={!editingId}
                  type="password"
                  value={form.password}
                />
              </label>

              <div className="admin-form-actions admin-span-full">
                <button className="admin-primary-button" disabled={saving} type="submit">
                  {saving ? 'Kaydediliyor...' : editingId ? 'Guncelle' : 'Olustur'}
                </button>
                {editingId ? (
                  <button
                    className="admin-ghost-button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(defaultFormState);
                    }}
                    type="button"
                  >
                    Iptal
                  </button>
                ) : null}
              </div>
            </form>
          </article>
        ) : null}

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Ekip listesi</h3>
              <p>{pagination.total} temsilci kaydi bulundu.</p>
            </div>
          </div>

          <form className="admin-toolbar" onSubmit={handleFilterSubmit}>
            <input
              className="admin-input"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Ad soyad veya kullanici adi ara"
              value={searchInput}
            />
            <select
              className="admin-select"
              onChange={(event) => setStatusFilterInput(event.target.value as 'all' | 'active' | 'inactive')}
              value={statusFilterInput}
            >
              <option value="all">Tum durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
            <button className="admin-secondary-button" type="submit">
              Filtrele
            </button>
          </form>

          {representatives.length === 0 ? (
            <div className="admin-empty-state compact">
              <strong>Temsilci yok</strong>
              <p>Filtrelere uygun bir ekip hesabi bulunamadi.</p>
            </div>
          ) : (
            <div className="admin-stack-list">
              {representatives.map((representative) => (
                <article key={representative.id} className="admin-post-card">
                  <div>
                    <strong>{representative.fullName}</strong>
                    <span>{representative.username}</span>
                    <small>
                      {representative.isActive ? 'Aktif' : 'Pasif'} - {representative.role}
                    </small>
                  </div>
                  {isAdmin ? (
                    <div className="admin-form-actions">
                      <button
                        className="admin-secondary-button"
                        onClick={() => {
                          setEditingId(representative.id);
                          setForm({
                            username: representative.username,
                            fullName: representative.fullName,
                            password: '',
                            isActive: representative.isActive,
                          });
                        }}
                        type="button"
                      >
                        Duzenle
                      </button>
                      <button
                        className="admin-danger-button"
                        disabled={deletingId === representative.id}
                        onClick={() => void handleDelete(representative.id)}
                        type="button"
                      >
                        {deletingId === representative.id ? 'Siliniyor...' : 'Sil'}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}

          <AdminPagination
            onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
            page={pagination.page}
            total={pagination.total}
            totalPages={pagination.totalPages}
          />
        </article>
      </section>
    </div>
  );
}

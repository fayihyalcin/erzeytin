import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPagination } from '../components/admin/AdminPagination';
import { api, extractApiError } from '../lib/api';
import { resolveLandingPagePath } from '../lib/landing-pages';
import type { LandingPage, PaginatedResponse } from '../types/api';

const PAGE_SIZE = 12;

export function LandingPagesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [statusInput, setStatusInput] = useState<'all' | 'DRAFT' | 'PUBLISHED'>('all');
  const [query, setQuery] = useState({
    page: 1,
    search: '',
    status: 'all' as 'all' | 'DRAFT' | 'PUBLISHED',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const publishedCount = useMemo(
    () => items.filter((item) => item.status === 'PUBLISHED').length,
    [items],
  );

  const loadItems = async (nextQuery = query) => {
    const response = await api.get<PaginatedResponse<LandingPage>>('/landing-pages', {
      params: {
        page: nextQuery.page,
        pageSize: PAGE_SIZE,
        search: nextQuery.search || undefined,
        status: nextQuery.status !== 'all' ? nextQuery.status : undefined,
      },
    });

    setItems(response.data.items);
    setPagination({
      total: response.data.total,
      page: response.data.page,
      pageSize: response.data.pageSize,
      totalPages: response.data.totalPages,
    });
  };

  useEffect(() => {
    loadItems(query)
      .catch((error) => {
        setMessage(extractApiError(error, 'Landing page listesi yuklenemedi.'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery({
      page: 1,
      search: searchInput.trim(),
      status: statusInput,
    });
  };

  const handleDelete = async (landingPageId: string) => {
    const confirmed = window.confirm('Bu landing page kaydini silmek istediginize emin misiniz?');
    if (!confirmed) {
      return;
    }

    setDeletingId(landingPageId);
    setMessage(null);

    try {
      await api.delete(`/landing-pages/${landingPageId}`);
      await loadItems(query);
      setMessage('Landing page silindi.');
    } catch {
      setMessage('Landing page silinemedi.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <section className="admin-panel">Landing page listesi yukleniyor...</section>;
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Landing / Sayfalar</span>
          <h2>Landing page yonetimi</h2>
          <p>
            Reklam cikacaginiz tekil urun sayfalarini olusturun, onizleyin ve yayina alin.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            className="admin-primary-button"
            onClick={() => navigate('/dashboard/landing-pages/new')}
            type="button"
          >
            Yeni landing page
          </button>
        </div>
      </section>

      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <span>Toplam sayfa</span>
          <strong>{pagination.total}</strong>
          <small>Kayitli landing page sayisi</small>
        </article>
        <article className="admin-stat-card">
          <span>Bu sayfadaki yayinli</span>
          <strong>{publishedCount}</strong>
          <small>Listeye gelen yayinli kayitlar</small>
        </article>
        <article className="admin-stat-card">
          <span>Taslak</span>
          <strong>{items.filter((item) => item.status === 'DRAFT').length}</strong>
          <small>Duzenleme bekleyen sayfalar</small>
        </article>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <section className="admin-panel">
        <form className="admin-toolbar" onSubmit={handleSubmit}>
          <input
            className="admin-input"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Landing page ara"
            value={searchInput}
          />
          <select
            className="admin-select"
            onChange={(event) =>
              setStatusInput(event.target.value as 'all' | 'DRAFT' | 'PUBLISHED')
            }
            value={statusInput}
          >
            <option value="all">Tum durumlar</option>
            <option value="DRAFT">Taslak</option>
            <option value="PUBLISHED">Yayinda</option>
          </select>
          <button className="admin-secondary-button" type="submit">
            Filtrele
          </button>
          <div className="admin-pill">{pagination.total} kayit</div>
        </form>

        {items.length === 0 ? (
          <div className="admin-empty-state compact">
            <strong>Landing page bulunamadi</strong>
            <p>Yeni sayfa olusturabilir veya filtreleri degistirebilirsiniz.</p>
          </div>
        ) : (
          <div className="admin-media-grid">
            {items.map((item) => (
              <article key={item.id} className="admin-media-card">
                <div className="admin-media-preview">
                  {item.featuredImage ? (
                    <img alt={item.name} src={item.featuredImage} />
                  ) : (
                    <div className="admin-media-file-icon">LP</div>
                  )}
                </div>
                <div className="admin-media-meta">
                  <strong>{item.name}</strong>
                  <span>/{item.slug}</span>
                  <small>{item.status === 'PUBLISHED' ? 'Yayinda' : 'Taslak'}</small>
                </div>

                <ul className="admin-list" style={{ gap: 8 }}>
                  <li style={{ padding: 10 }}>
                    <div>
                      <strong>Paket sayisi</strong>
                      <span>{item.config.packages.length} adet</span>
                    </div>
                    <small>{item.config.reviews.length} yorum</small>
                  </li>
                  <li style={{ padding: 10 }}>
                    <div>
                      <strong>Canli URL</strong>
                      <span>{resolveLandingPagePath(item.slug)}</span>
                    </div>
                    <small>{item.updatedAt.slice(0, 10)}</small>
                  </li>
                </ul>

                <div className="admin-form-actions">
                  <button
                    className="admin-secondary-button"
                    onClick={() => navigate(`/dashboard/landing-pages/${item.id}/edit`)}
                    type="button"
                  >
                    Duzenle
                  </button>
                  <button
                    className="admin-ghost-button"
                    onClick={() => window.open(`/landing-preview/${item.id}`, '_blank', 'noopener,noreferrer')}
                    type="button"
                  >
                    Onizle
                  </button>
                  {item.status === 'PUBLISHED' ? (
                    <button
                      className="admin-ghost-button"
                      onClick={() =>
                        window.open(resolveLandingPagePath(item.slug), '_blank', 'noopener,noreferrer')
                      }
                      type="button"
                    >
                      Ac
                    </button>
                  ) : null}
                  <button
                    className="admin-danger-button"
                    disabled={deletingId === item.id}
                    onClick={() => void handleDelete(item.id)}
                    type="button"
                  >
                    {deletingId === item.id ? 'Siliniyor...' : 'Sil'}
                  </button>
                </div>
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
      </section>
    </div>
  );
}

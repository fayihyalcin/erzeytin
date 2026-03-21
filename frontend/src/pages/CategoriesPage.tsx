import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPagination } from '../components/admin/AdminPagination';
import { api } from '../lib/api';
import type { Category, CategoryCatalogSummary, PaginatedResponse } from '../types/api';

const PAGE_SIZE = 12;

const DEFAULT_SUMMARY: CategoryCatalogSummary = {
  totalCount: 0,
  activeCount: 0,
  imageCount: 0,
  seoConfiguredCount: 0,
};

export function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<CategoryCatalogSummary>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = async (nextQuery = query) => {
    const [categoriesResponse, summaryResponse] = await Promise.all([
      api.get<PaginatedResponse<Category>>('/catalog/categories', {
        params: {
          page: nextQuery.page,
          pageSize: PAGE_SIZE,
          search: nextQuery.search || undefined,
          status: nextQuery.status !== 'all' ? nextQuery.status : undefined,
        },
      }),
      api.get<CategoryCatalogSummary>('/catalog/categories/summary'),
    ]);

    setCategories(categoriesResponse.data.items);
    setSummary(summaryResponse.data);
    setPagination({
      total: categoriesResponse.data.total,
      page: categoriesResponse.data.page,
      pageSize: categoriesResponse.data.pageSize,
      totalPages: categoriesResponse.data.totalPages,
    });
  };

  useEffect(() => {
    loadCategories(query)
      .catch(() => {
        setMessage('Kategoriler yuklenemedi.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query]);

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery({
      page: 1,
      search: searchInput.trim(),
      status: statusFilterInput,
    });
  };

  const handleDelete = async (categoryId: string) => {
    setDeletingId(categoryId);
    setMessage(null);

    try {
      await api.delete(`/catalog/categories/${categoryId}`);
      await loadCategories(query);
      setMessage('Kategori silindi.');
    } catch {
      setMessage('Kategori silinemedi.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <section className="admin-panel">Kategoriler yukleniyor...</section>;
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Katalog / Kategoriler</span>
          <h2>Kategori yonetimi</h2>
          <p>Urun gruplari, SEO alanlari ve kategori gorsellerini tek ekranda yonetin.</p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-primary-button" onClick={() => navigate('/dashboard/categories/new')} type="button">
            Kategori ekle
          </button>
        </div>
      </section>

      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <span>Toplam kategori</span>
          <strong>{summary.totalCount}</strong>
          <small>Katalogda kayitli kategori sayisi</small>
        </article>
        <article className="admin-stat-card">
          <span>Aktif kategori</span>
          <strong>{summary.activeCount}</strong>
          <small>Storefront'ta gorunen kategori sayisi</small>
        </article>
        <article className="admin-stat-card">
          <span>Pasif kategori</span>
          <strong>{Math.max(summary.totalCount - summary.activeCount, 0)}</strong>
          <small>Taslak veya sakli kategoriler</small>
        </article>
        <article className="admin-stat-card">
          <span>SEO girisi</span>
          <strong>{summary.seoConfiguredCount}</strong>
          <small>SEO alani dolu kategori sayisi</small>
        </article>
        <article className="admin-stat-card">
          <span>Gorselli kategori</span>
          <strong>{summary.imageCount}</strong>
          <small>Kapak gorseli eklenmis kategoriler</small>
        </article>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <section className="admin-panel">
        <form className="admin-toolbar" onSubmit={handleFilterSubmit}>
          <input
            className="admin-input"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Kategori adi veya slug ara"
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
          <div className="admin-pill">{pagination.total} kayit</div>
        </form>

        {categories.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Eslesen kategori bulunamadi</strong>
            <p>Arama kelimesini veya durum filtresini degistirerek tekrar deneyin.</p>
          </div>
        ) : (
          <div className="admin-media-grid">
            {categories.map((category) => (
              <article key={category.id} className="admin-media-card">
                <div className="admin-media-preview">
                  {category.imageUrl ? (
                    <img alt={category.name} decoding="async" loading="lazy" src={category.imageUrl} />
                  ) : (
                    <div className="admin-post-placeholder">KT</div>
                  )}
                </div>
                <div className="admin-media-meta">
                  <strong>{category.name}</strong>
                  <span>{category.slug}</span>
                  <small>{category.isActive ? 'Aktif' : 'Pasif'}</small>
                </div>
                <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
                  {category.description || 'Aciklama girilmemis.'}
                </p>
                <div className="admin-form-actions">
                  <button
                    className="admin-secondary-button"
                    onClick={() => navigate(`/dashboard/categories/${category.id}/edit`)}
                    type="button"
                  >
                    Duzenle
                  </button>
                  <button
                    className="admin-danger-button"
                    disabled={deletingId === category.id}
                    onClick={() => void handleDelete(category.id)}
                    type="button"
                  >
                    {deletingId === category.id ? 'Siliniyor...' : 'Sil'}
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

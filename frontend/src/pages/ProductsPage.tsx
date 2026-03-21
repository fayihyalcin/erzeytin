import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPagination } from '../components/admin/AdminPagination';
import { api } from '../lib/api';
import { resolveProductImage } from '../lib/product-images';
import type { PaginatedResponse, Product, ProductCatalogSummary } from '../types/api';

function formatPrice(value: string) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

const DEFAULT_SUMMARY: ProductCatalogSummary = {
  totalCount: 0,
  activeCount: 0,
  totalStock: 0,
  lowStockCount: 0,
  variantCount: 0,
  lowStockProducts: [],
};

const PAGE_SIZE = 12;

export function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<ProductCatalogSummary>(DEFAULT_SUMMARY);
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

  const loadProducts = async (nextQuery = query) => {
    const [productsResponse, summaryResponse] = await Promise.all([
      api.get<PaginatedResponse<Product>>('/catalog/products', {
        params: {
          page: nextQuery.page,
          pageSize: PAGE_SIZE,
          search: nextQuery.search || undefined,
          status: nextQuery.status !== 'all' ? nextQuery.status : undefined,
        },
      }),
      api.get<ProductCatalogSummary>('/catalog/products/summary'),
    ]);

    setProducts(productsResponse.data.items);
    setSummary(summaryResponse.data);
    setPagination({
      total: productsResponse.data.total,
      page: productsResponse.data.page,
      pageSize: productsResponse.data.pageSize,
      totalPages: productsResponse.data.totalPages,
    });
  };

  useEffect(() => {
    loadProducts(query)
      .catch(() => {
        setMessage('Urunler yuklenemedi.');
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

  const handleDelete = async (productId: string) => {
    setDeletingId(productId);
    setMessage(null);

    try {
      await api.delete(`/catalog/products/${productId}`);
      await loadProducts(query);
      setMessage('Urun silindi.');
    } catch {
      setMessage('Urun silinemedi.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <section className="admin-panel">Urunler yukleniyor...</section>;
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Katalog / Urunler</span>
          <h2>Urun yonetimi</h2>
          <p>Urun kartlari, fiyatlandirma, stok, varyant ve gorselleri daha kullanisli bicimde yonetin.</p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-primary-button" onClick={() => navigate('/dashboard/products/new')} type="button">
            Yeni urun
          </button>
        </div>
      </section>

      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <span>Toplam urun</span>
          <strong>{summary.totalCount}</strong>
          <small>Katalogdaki tum urun kayitlari</small>
        </article>
        <article className="admin-stat-card">
          <span>Aktif urun</span>
          <strong>{summary.activeCount}</strong>
          <small>Storefront'ta gorunen urunler</small>
        </article>
        <article className="admin-stat-card">
          <span>Toplam stok</span>
          <strong>{summary.totalStock}</strong>
          <small>Varyantlar dahil toplam adet</small>
        </article>
        <article className="admin-stat-card">
          <span>Dusuk stok</span>
          <strong>{summary.lowStockCount}</strong>
          <small>Kontrol edilmesi gereken urun sayisi</small>
        </article>
        <article className="admin-stat-card">
          <span>Varyantli urun</span>
          <strong>{summary.variantCount}</strong>
          <small>Secenek bazli satilan urunler</small>
        </article>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <section className="admin-panel">
        <form className="admin-toolbar" onSubmit={handleFilterSubmit}>
          <input
            className="admin-input"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Urun, SKU veya etiket ara"
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

        {products.length === 0 ? (
          <div className="admin-empty-state compact">
            <strong>Eslesen urun bulunamadi</strong>
            <p>Arama kelimenizi veya filtreleri degistirerek tekrar deneyin.</p>
          </div>
        ) : (
          <div className="admin-media-grid">
            {products.map((product) => (
              <article key={product.id} className="admin-media-card">
                <div className="admin-media-preview">
                  <img
                    alt={product.name}
                    decoding="async"
                    loading="lazy"
                    src={resolveProductImage({
                      id: product.id,
                      name: product.name,
                      categoryName: product.category?.name,
                      featuredImage: product.featuredImage,
                      images: product.images,
                    })}
                  />
                </div>
                <div className="admin-media-meta">
                  <strong>{product.name}</strong>
                  <span>{product.category?.name ?? 'Kategori atanmamis'}</span>
                  <small>{product.isActive ? 'Aktif' : 'Pasif'}</small>
                </div>
                <ul className="admin-list" style={{ gap: 8 }}>
                  <li style={{ padding: 10 }}>
                    <div>
                      <strong>SKU</strong>
                      <span>{product.sku}</span>
                    </div>
                    <small>{formatPrice(product.price)}</small>
                  </li>
                  <li style={{ padding: 10 }}>
                    <div>
                      <strong>Stok</strong>
                      <span>Min: {product.minStock}</span>
                    </div>
                    <small>{product.stock}</small>
                  </li>
                </ul>
                <div className="admin-form-actions">
                  <button
                    className="admin-secondary-button"
                    onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}
                    type="button"
                  >
                    Duzenle
                  </button>
                  <button
                    className="admin-danger-button"
                    disabled={deletingId === product.id}
                    onClick={() => void handleDelete(product.id)}
                    type="button"
                  >
                    {deletingId === product.id ? 'Siliniyor...' : 'Sil'}
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

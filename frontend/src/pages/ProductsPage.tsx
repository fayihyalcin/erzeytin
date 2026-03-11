import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { resolveProductImage } from '../lib/product-images';
import type { Product } from '../types/api';

function formatPrice(value: string) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = async () => {
    const response = await api.get<Product[]>('/catalog/products');
    setProducts(response.data);
  };

  useEffect(() => {
    loadProducts()
      .catch(() => {
        setMessage('Urunler yuklenemedi.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('tr-TR');
    return products.filter((product) => {
      if (statusFilter === 'active' && !product.isActive) {
        return false;
      }

      if (statusFilter === 'inactive' && product.isActive) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [product.name, product.sku, product.category?.name ?? '', ...(product.tags ?? [])].some((value) =>
        value.toLocaleLowerCase('tr-TR').includes(keyword),
      );
    });
  }, [products, search, statusFilter]);

  const totalStock = useMemo(
    () => products.reduce((total, product) => total + Number(product.stock || 0), 0),
    [products],
  );

  const lowStockCount = useMemo(
    () => products.filter((product) => product.stock <= Math.max(product.minStock, 3)).length,
    [products],
  );

  const handleDelete = async (productId: string) => {
    setDeletingId(productId);
    setMessage(null);
    try {
      await api.delete(`/catalog/products/${productId}`);
      await loadProducts();
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
          <strong>{products.length}</strong>
          <small>Katalogdaki tum urun kayitlari</small>
        </article>
        <article className="admin-stat-card">
          <span>Aktif urun</span>
          <strong>{products.filter((product) => product.isActive).length}</strong>
          <small>Storefront'ta gorunen urunler</small>
        </article>
        <article className="admin-stat-card">
          <span>Toplam stok</span>
          <strong>{totalStock}</strong>
          <small>Varyantlar dahil toplam adet</small>
        </article>
        <article className="admin-stat-card">
          <span>Dusuk stok</span>
          <strong>{lowStockCount}</strong>
          <small>Kontrol edilmesi gereken urun sayisi</small>
        </article>
        <article className="admin-stat-card">
          <span>Varyantli urun</span>
          <strong>{products.filter((product) => product.hasVariants).length}</strong>
          <small>Secenek bazli satilan urunler</small>
        </article>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <section className="admin-panel">
        <div className="admin-toolbar">
          <input
            className="admin-input"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Urun, SKU veya etiket ara"
            value={search}
          />
          <select
            className="admin-select"
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
            value={statusFilter}
          >
            <option value="all">Tum durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
          <div className="admin-pill">{filteredProducts.length} kayit</div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="admin-empty-state compact">
            <strong>Eslesen urun bulunamadi</strong>
            <p>Arama kelimenizi veya filtreleri degistirerek tekrar deneyin.</p>
          </div>
        ) : (
          <div className="admin-media-grid">
            {filteredProducts.map((product) => (
              <article key={product.id} className="admin-media-card">
                <div className="admin-media-preview">
                  <img
                    alt={product.name}
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
      </section>
    </div>
  );
}

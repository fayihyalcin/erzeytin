import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchSettingsRecord } from '../lib/admin-settings';
import { parseBlogPosts, parseMediaLibrary } from '../lib/admin-content';
import { parseWebsiteConfig } from '../lib/website-config';
import type { Category, Order, OrdersSummary, Product } from '../types/api';

interface OverviewState {
  summary: OrdersSummary | null;
  products: Product[];
  categories: Category[];
  recentOrders: Order[];
  blogPostCount: number;
  mediaCount: number;
  websiteBrand: string;
}

const emptyOverview: OverviewState = {
  summary: null,
  products: [],
  categories: [],
  recentOrders: [],
  blogPostCount: 0,
  mediaCount: 0,
  websiteBrand: 'Magaza',
};

function formatCurrency(value: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DashboardOverviewPage() {
  const [data, setData] = useState<OverviewState>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setMessage(null);

      try {
        const [summaryResponse, productsResponse, categoriesResponse, ordersResponse, settings] =
          await Promise.all([
            api.get<OrdersSummary>('/orders/summary'),
            api.get<Product[]>('/catalog/products'),
            api.get<Category[]>('/catalog/categories'),
            api.get<Order[]>('/orders'),
            fetchSettingsRecord(),
          ]);

        if (!mounted) {
          return;
        }

        const websiteConfig = parseWebsiteConfig(settings.websiteConfig);
        const blogPosts = parseBlogPosts(settings.blogPosts);
        const mediaItems = parseMediaLibrary(settings.mediaLibrary);

        setData({
          summary: summaryResponse.data,
          products: productsResponse.data,
          categories: categoriesResponse.data,
          recentOrders: ordersResponse.data.slice(0, 6),
          blogPostCount: blogPosts.length,
          mediaCount: mediaItems.length,
          websiteBrand: websiteConfig.theme.brandName,
        });
      } catch {
        if (mounted) {
          setMessage('Yonetim ozeti yuklenemedi.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const lowStockProducts = useMemo(
    () => data.products.filter((product) => product.stock <= Math.max(product.minStock, 3)).slice(0, 5),
    [data.products],
  );

  const activeProducts = useMemo(
    () => data.products.filter((product) => product.isActive).length,
    [data.products],
  );

  const activeCategories = useMemo(
    () => data.categories.filter((category) => category.isActive).length,
    [data.categories],
  );

  if (loading) {
    return <section className="admin-panel">Panel verileri yukleniyor...</section>;
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-hero-card">
        <div>
          <span className="admin-eyebrow">E-Ticaret Kontrol Merkezi</span>
          <h2>{data.websiteBrand} admin paneli</h2>
          <p>
            Magaza icerigi, katalog, medya kutuphanesi ve siparis operasyonlarini tek
            yerden yonetin.
          </p>
        </div>

        <div className="admin-hero-actions">
          <Link className="admin-primary-button" to="/dashboard/website">
            Site icerigini duzenle
          </Link>
          <Link className="admin-secondary-button" to="/dashboard/products/new">
            Yeni urun ekle
          </Link>
        </div>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <span>Toplam ciro</span>
          <strong>{formatCurrency(data.summary?.totalRevenue ?? 0)}</strong>
          <small>Bugune kadar kayda giren siparisler</small>
        </article>
        <article className="admin-stat-card">
          <span>Siparisler</span>
          <strong>{data.summary?.orderCount ?? 0}</strong>
          <small>{data.summary?.byStatus?.NEW ?? 0} yeni siparis bekliyor</small>
        </article>
        <article className="admin-stat-card">
          <span>Urunler</span>
          <strong>{activeProducts}</strong>
          <small>{data.products.length} kayitli urun</small>
        </article>
        <article className="admin-stat-card">
          <span>Kategoriler</span>
          <strong>{activeCategories}</strong>
          <small>{data.categories.length} kategori</small>
        </article>
        <article className="admin-stat-card">
          <span>CMS Icerigi</span>
          <strong>{data.blogPostCount + data.mediaCount}</strong>
          <small>
            {data.blogPostCount} yazi, {data.mediaCount} medya
          </small>
        </article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Hizli erisim</h3>
              <p>Sik kullanilan yonetim ekranlarina tek tikla gecis.</p>
            </div>
          </div>

          <div className="admin-quick-grid">
            <Link className="admin-quick-card" to="/dashboard/media">
              <strong>Medya kutuphanesi</strong>
              <span>Resim, video ve dosyalari yonetin</span>
            </Link>
            <Link className="admin-quick-card" to="/dashboard/posts">
              <strong>Yazilar</strong>
              <span>Blog ve rehber iceriklerini yayinlayin</span>
            </Link>
            <Link className="admin-quick-card" to="/dashboard/categories">
              <strong>Kategoriler</strong>
              <span>Koleksiyon ve menu yapisini duzenleyin</span>
            </Link>
            <Link className="admin-quick-card" to="/dashboard/orders">
              <strong>Siparisler</strong>
              <span>Zimmet, odeme ve kargo surecini yonetin</span>
            </Link>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Dusuk stok takibi</h3>
              <p>Limit seviyesine inen urunleri kontrol edin.</p>
            </div>
            <Link className="admin-inline-link" to="/dashboard/products">
              Tum urunler
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="admin-empty-state compact">
              <strong>Dusuk stok yok</strong>
              <p>Su an kritik stok seviyesine inen bir urun bulunmuyor.</p>
            </div>
          ) : (
            <ul className="admin-list">
              {lowStockProducts.map((product) => (
                <li key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.category?.name ?? 'Kategori atanmamis'}</span>
                  </div>
                  <small>
                    {product.stock} / min {product.minStock}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Son siparisler</h3>
              <p>Son olusan siparislerin hizli ozet gorunumu.</p>
            </div>
            <Link className="admin-inline-link" to="/dashboard/orders">
              Tum siparisler
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <div className="admin-empty-state compact">
              <strong>Henuz siparis yok</strong>
              <p>Ilk siparis olustugunda burada listelenecek.</p>
            </div>
          ) : (
            <div className="admin-table-shell">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Siparis</th>
                    <th>Musteri</th>
                    <th>Durum</th>
                    <th>Tutar</th>
                    <th>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td data-label="Siparis">{order.orderNumber}</td>
                      <td data-label="Musteri">{order.customerName}</td>
                      <td data-label="Durum">{order.status}</td>
                      <td data-label="Tutar">
                        {formatCurrency(Number(order.grandTotal || 0), order.currency)}
                      </td>
                      <td data-label="Tarih">{formatDate(order.placedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Yayin sagligi</h3>
              <p>CMS alanlarinin son durumu.</p>
            </div>
          </div>

          <ul className="admin-list admin-list-highlighted">
            <li>
              <div>
                <strong>Anasayfa bolumleri</strong>
                <span>Hero, kampanya, footer, iletisim ve yasal metinler</span>
              </div>
              <small>Yonetilebilir</small>
            </li>
            <li>
              <div>
                <strong>Blog ve yazilar</strong>
                <span>{data.blogPostCount} yazi kaydi bulundu</span>
              </div>
              <small>{data.blogPostCount > 0 ? 'Hazir' : 'Bos'}</small>
            </li>
            <li>
              <div>
                <strong>Medya kutuphanesi</strong>
                <span>{data.mediaCount} medya ogesi secime hazir</span>
              </div>
              <small>{data.mediaCount > 0 ? 'Hazir' : 'Bos'}</small>
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}

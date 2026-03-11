import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Category } from '../types/api';

export function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = async () => {
    const response = await api.get<Category[]>('/catalog/categories');
    setCategories(response.data);
  };

  useEffect(() => {
    loadCategories()
      .catch(() => {
        setMessage('Kategoriler yuklenemedi.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const activeCount = useMemo(
    () => categories.filter((category) => category.isActive).length,
    [categories],
  );

  const handleDelete = async (categoryId: string) => {
    setDeletingId(categoryId);
    setMessage(null);
    try {
      await api.delete(`/catalog/categories/${categoryId}`);
      await loadCategories();
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
          <strong>{categories.length}</strong>
          <small>Katalogda kayitli kategori sayisi</small>
        </article>
        <article className="admin-stat-card">
          <span>Aktif kategori</span>
          <strong>{activeCount}</strong>
          <small>Storefront'ta gorunen kategori sayisi</small>
        </article>
        <article className="admin-stat-card">
          <span>Pasif kategori</span>
          <strong>{categories.length - activeCount}</strong>
          <small>Taslak veya sakli kategoriler</small>
        </article>
        <article className="admin-stat-card">
          <span>SEO girisi</span>
          <strong>{categories.filter((category) => category.seoTitle || category.seoDescription).length}</strong>
          <small>SEO alani dolu kategori sayisi</small>
        </article>
        <article className="admin-stat-card">
          <span>Gorselli kategori</span>
          <strong>{categories.filter((category) => category.imageUrl).length}</strong>
          <small>Kapak gorseli eklenmis kategoriler</small>
        </article>
      </section>

      {message ? <p className="message">{message}</p> : null}

      {categories.length === 0 ? (
        <section className="admin-panel">
          <div className="admin-empty-state">
            <strong>Henuz kategori yok</strong>
            <p>Ilk kategoriyi olusturarak katalog yapisini hazirlayin.</p>
          </div>
        </section>
      ) : (
        <section className="admin-media-grid">
          {categories.map((category) => (
            <article key={category.id} className="admin-media-card">
              <div className="admin-media-preview">
                {category.imageUrl ? (
                  <img alt={category.name} src={category.imageUrl} />
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
        </section>
      )}
    </div>
  );
}

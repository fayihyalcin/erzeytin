import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MediaPickerField } from '../components/admin/MediaPickerField';
import { parseMediaLibrary } from '../lib/admin-content';
import { fetchSettingsRecord } from '../lib/admin-settings';
import { api } from '../lib/api';
import type { Category, MediaItem } from '../types/api';

interface CategoryFormState {
  name: string;
  description: string;
  imageUrl: string;
  displayOrder: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywordsText: string;
  isActive: boolean;
}

const defaultCategoryForm: CategoryFormState = {
  name: '',
  description: '',
  imageUrl: '',
  displayOrder: '0',
  seoTitle: '',
  seoDescription: '',
  seoKeywordsText: '',
  isActive: true,
};

function toKeywordArray(raw: string) {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toCategoryFormState(category: Category): CategoryFormState {
  return {
    name: category.name,
    description: category.description ?? '',
    imageUrl: category.imageUrl ?? '',
    displayOrder: String(category.displayOrder),
    seoTitle: category.seoTitle ?? '',
    seoDescription: category.seoDescription ?? '',
    seoKeywordsText: category.seoKeywords.join(', '),
    isActive: category.isActive,
  };
}

export function CategoryFormPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const isEditMode = Boolean(categoryId);

  const [form, setForm] = useState<CategoryFormState>(defaultCategoryForm);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [categoryNotFound, setCategoryNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadForm = async () => {
      setLoading(true);
      setMessage(null);
      setCategoryNotFound(false);

      try {
        const [settings, categoriesResponse] = await Promise.all([
          fetchSettingsRecord(),
          api.get<Category[]>('/catalog/categories'),
        ]);

        if (!mounted) {
          return;
        }

        setMediaItems(parseMediaLibrary(settings.mediaLibrary));

        if (isEditMode && categoryId) {
          const category = categoriesResponse.data.find((item) => item.id === categoryId);
          if (!category) {
            setMessage('Kategori bulunamadı.');
            setCategoryNotFound(true);
            setEditingCategoryId(null);
            setForm(defaultCategoryForm);
            return;
          }

          setEditingCategoryId(category.id);
          setForm(toCategoryFormState(category));
          return;
        }

        setEditingCategoryId(null);
        setForm(defaultCategoryForm);
      } catch {
        if (mounted) {
          setMessage('Kategori formu yüklenemedi.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadForm();

    return () => {
      mounted = false;
    };
  }, [categoryId, isEditMode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description,
      imageUrl: form.imageUrl,
      displayOrder: Number(form.displayOrder || '0'),
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      seoKeywords: toKeywordArray(form.seoKeywordsText),
      isActive: form.isActive,
    };

    try {
      if (editingCategoryId) {
        await api.patch(`/catalog/categories/${editingCategoryId}`, payload);
      } else {
        await api.post('/catalog/categories', payload);
      }

      navigate('/dashboard/categories');
    } catch {
      setMessage('Kategori kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="admin-panel">Kategori formu yükleniyor...</section>;
  }

  if (categoryNotFound) {
    return (
      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Kategori bulunamadı</h3>
            <p>Düzenlemek istediğiniz kayıt silinmiş olabilir.</p>
          </div>
          <button className="admin-secondary-button" onClick={() => navigate('/dashboard/categories')} type="button">
            Kategori listesi
          </button>
        </div>
        {message ? <p className="message">{message}</p> : null}
      </section>
    );
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Katalog / Kategori formu</span>
          <h2>{editingCategoryId ? 'Kategori düzenle' : 'Yeni kategori ekle'}</h2>
          <p>Kategori görseli, sıralama ve SEO alanlarını eksiksiz yönetin.</p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-secondary-button" onClick={() => navigate('/dashboard/categories')} type="button">
            Listeye dön
          </button>
        </div>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <form className="admin-workbench" onSubmit={handleSubmit}>
        <div className="admin-workbench-main">
          <section className="admin-stage-intro">
            <span className="admin-eyebrow">Kompakt Form</span>
            <h3>Kategori vitrini</h3>
            <p>Kategori görseli, sıralama ve SEO alanlarını tek akışta tamamlayın.</p>
          </section>

          <section className="admin-panel">
            <div className="admin-form-grid">
              <label className="admin-label">
                <span>Kategori adi</span>
                <input
                  className="admin-input"
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                  value={form.name}
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
                <span>Açıklama</span>
                <textarea
                  className="admin-textarea"
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={4}
                  value={form.description}
                />
              </label>

              <MediaPickerField
                allowedTypes={['image']}
                helperText="Kategori kapak görseli storefront ve admin listesinde kullanılır."
                items={mediaItems}
                label="Kategori görseli"
                onChange={(value) => setForm({ ...form, imageUrl: value })}
                value={form.imageUrl}
              />

              <label className="admin-label">
                <span>Gösterim sırası</span>
                <input
                  className="admin-input"
                  min="0"
                  onChange={(event) => setForm({ ...form, displayOrder: event.target.value })}
                  type="number"
                  value={form.displayOrder}
                />
              </label>

              <label className="admin-label">
                <span>SEO başlık</span>
                <input
                  className="admin-input"
                  onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
                  value={form.seoTitle}
                />
              </label>

              <label className="admin-label admin-span-full">
                <span>SEO açıklama</span>
                <input
                  className="admin-input"
                  onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
                  value={form.seoDescription}
                />
              </label>

              <label className="admin-label admin-span-full">
                <span>SEO anahtar kelimeler</span>
                <input
                  className="admin-input"
                  onChange={(event) => setForm({ ...form, seoKeywordsText: event.target.value })}
                  placeholder="zeytin, naturel, soğuk sıkım"
                  value={form.seoKeywordsText}
                />
              </label>
            </div>

            <div className="admin-stage-actions">
              <div className="admin-stage-actions-group" />
              <div className="admin-stage-actions-group">
                <button className="admin-primary-button" disabled={saving} type="submit">
                  {saving ? 'Kaydediliyor...' : editingCategoryId ? 'Kategoriyi güncelle' : 'Kategoriyi oluştur'}
                </button>
                <button className="admin-ghost-button" onClick={() => navigate('/dashboard/categories')} type="button">
                  Vazgeç
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="admin-workbench-aside">
          <div className="admin-preview-card">
            <h3>Kategori özeti</h3>
            <p>Kayıt sırasında storefront tarafında nasıl görüneceğine dair hızlı kontrol.</p>

            <div className="admin-preview-media">
              {form.imageUrl ? (
                <img alt={form.name || 'Kategori görseli'} src={form.imageUrl} />
              ) : (
                <span className="admin-preview-empty">Kapak görseli seçilmedi</span>
              )}
            </div>

            <ul className="admin-preview-list">
              <li>
                <strong>Durum</strong>
                <small>{form.isActive ? 'Yayında' : 'Pasif'}</small>
              </li>
              <li>
                <strong>Sıra</strong>
                <small>{form.displayOrder || '0'}</small>
              </li>
              <li>
                <strong>SEO</strong>
                <small>{form.seoTitle || form.seoDescription ? 'Yapılandırıldı' : 'Boş'}</small>
              </li>
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
}

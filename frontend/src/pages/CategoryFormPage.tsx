import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AiSeoAssistant } from '../components/admin/AiSeoAssistant';
import { MediaPickerField } from '../components/admin/MediaPickerField';
import { parseMediaLibrary, slugify } from '../lib/admin-content';
import { fetchSettingsRecord } from '../lib/admin-settings';
import { createAiSeoSuggestions } from '../lib/ai-seo';
import { api } from '../lib/api';
import type { Category, MediaItem } from '../types/api';

interface CategoryFormState {
  name: string;
  slug: string;
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
  slug: '',
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
    slug: category.slug,
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
        const [settings, categoryResponse] = await Promise.all([
          fetchSettingsRecord(),
          categoryId
            ? api.get<Category>(`/catalog/categories/${categoryId}`)
            : Promise.resolve<{ data: Category | null }>({ data: null }),
        ]);

        if (!mounted) {
          return;
        }

        setMediaItems(parseMediaLibrary(settings.mediaLibrary));

        if (isEditMode && categoryId) {
          const category = categoryResponse.data;
          if (!category) {
            setMessage('Kategori bulunamadi.');
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
          setMessage('Kategori formu yuklenemedi.');
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
      slug: form.slug.trim() || undefined,
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

  const seoSuggestions = useMemo(
    () =>
      createAiSeoSuggestions({
        title: form.name,
        category: form.name,
        summary: form.description,
        content: form.description,
        existingKeywords: toKeywordArray(form.seoKeywordsText),
        fallbackSlug: form.slug || form.name,
      }),
    [form.description, form.name, form.seoKeywordsText, form.slug],
  );

  if (loading) {
    return <section className="admin-panel">Kategori formu yukleniyor...</section>;
  }

  if (categoryNotFound) {
    return (
      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Kategori bulunamadi</h3>
            <p>Duzenlemek istediginiz kayit silinmis olabilir.</p>
          </div>
          <button
            className="admin-secondary-button"
            onClick={() => navigate('/dashboard/categories')}
            type="button"
          >
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
          <h2>{editingCategoryId ? 'Kategori duzenle' : 'Yeni kategori ekle'}</h2>
          <p>Kategori gorseli, siralama ve SEO alanlarini eksiksiz yonetin.</p>
        </div>

        <div className="admin-header-actions">
          <button
            className="admin-secondary-button"
            onClick={() => navigate('/dashboard/categories')}
            type="button"
          >
            Listeye don
          </button>
        </div>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <form className="admin-workbench" onSubmit={handleSubmit}>
        <div className="admin-workbench-main">
          <section className="admin-stage-intro">
            <span className="admin-eyebrow">Kompakt Form</span>
            <h3>Kategori vitrini</h3>
            <p>Kategori gorseli, siralama ve SEO alanlarini tek akista tamamlayin.</p>
          </section>

          <section className="admin-panel">
            <div className="admin-form-grid">
              <label className="admin-label">
                <span>Kategori adi</span>
                <input
                  className="admin-input"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                      slug: current.slug ? current.slug : slugify(event.target.value, 'kategori'),
                    }))
                  }
                  required
                  value={form.name}
                />
              </label>

              <label className="admin-label">
                <span>Slug</span>
                <input
                  className="admin-input"
                  onChange={(event) =>
                    setForm({ ...form, slug: slugify(event.target.value, 'kategori') })
                  }
                  placeholder="kategori-slug"
                  value={form.slug}
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
                <span>Aciklama</span>
                <textarea
                  className="admin-textarea"
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={4}
                  value={form.description}
                />
              </label>

              <MediaPickerField
                allowedTypes={['image']}
                helperText="Kategori kapak gorseli storefront ve admin listesinde kullanilir."
                items={mediaItems}
                label="Kategori gorseli"
                onChange={(value) => setForm({ ...form, imageUrl: value })}
                value={form.imageUrl}
              />

              <label className="admin-label">
                <span>Gosterim sirasi</span>
                <input
                  className="admin-input"
                  min="0"
                  onChange={(event) => setForm({ ...form, displayOrder: event.target.value })}
                  type="number"
                  value={form.displayOrder}
                />
              </label>

              <label className="admin-label">
                <span>SEO baslik</span>
                <input
                  className="admin-input"
                  onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
                  value={form.seoTitle}
                />
              </label>

              <label className="admin-label">
                <span>SEO slug</span>
                <input
                  className="admin-input"
                  onChange={(event) =>
                    setForm({ ...form, slug: slugify(event.target.value, 'kategori') })
                  }
                  placeholder="kategori-slug"
                  value={form.slug}
                />
              </label>

              <label className="admin-label admin-span-full">
                <span>SEO aciklama</span>
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
                  placeholder="zeytin, naturel, soguk sikim"
                  value={form.seoKeywordsText}
                />
              </label>
            </div>

            <AiSeoAssistant
              descriptionSuggestion={seoSuggestions.description}
              keywordsSuggestion={seoSuggestions.keywords}
              onApplyDescription={() =>
                setForm((current) => ({
                  ...current,
                  seoDescription: seoSuggestions.description,
                }))
              }
              onApplyKeywords={() =>
                setForm((current) => ({
                  ...current,
                  seoKeywordsText: seoSuggestions.keywords.join(', '),
                }))
              }
              onApplySlug={() =>
                setForm((current) => ({
                  ...current,
                  slug: seoSuggestions.slug,
                }))
              }
              onApplySummary={() =>
                setForm((current) => ({
                  ...current,
                  description: seoSuggestions.summary,
                }))
              }
              onApplyTitle={() =>
                setForm((current) => ({
                  ...current,
                  seoTitle: seoSuggestions.title,
                }))
              }
              slugSuggestion={seoSuggestions.slug}
              summaryLabel="Kategori ozet onerisi"
              summarySuggestion={seoSuggestions.summary}
              titleSuggestion={seoSuggestions.title}
            />

            <div className="admin-stage-actions">
              <div className="admin-stage-actions-group" />
              <div className="admin-stage-actions-group">
                <button className="admin-primary-button" disabled={saving} type="submit">
                  {saving
                    ? 'Kaydediliyor...'
                    : editingCategoryId
                      ? 'Kategoriyi guncelle'
                      : 'Kategoriyi olustur'}
                </button>
                <button
                  className="admin-ghost-button"
                  onClick={() => navigate('/dashboard/categories')}
                  type="button"
                >
                  Vazgec
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="admin-workbench-aside">
          <div className="admin-preview-card">
            <h3>Kategori ozeti</h3>
            <p>Kayit sirasinda storefront tarafinda nasil gorunecegine dair hizli kontrol.</p>

            <div className="admin-preview-media">
              {form.imageUrl ? (
                <img alt={form.name || 'Kategori gorseli'} src={form.imageUrl} />
              ) : (
                <span className="admin-preview-empty">Kapak gorseli secilmedi</span>
              )}
            </div>

            <ul className="admin-preview-list">
              <li>
                <strong>Durum</strong>
                <small>{form.isActive ? 'Yayinda' : 'Pasif'}</small>
              </li>
              <li>
                <strong>Sira</strong>
                <small>{form.displayOrder || '0'}</small>
              </li>
              <li>
                <strong>SEO</strong>
                <small>{form.seoTitle || form.seoDescription ? 'Yapilandirildi' : 'Bos'}</small>
              </li>
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Category } from '../types/api';

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
        if (isEditMode && categoryId) {
          const response = await api.get<Category[]>('/catalog/categories');
          if (!mounted) {
            return;
          }

          const category = response.data.find((item) => item.id === categoryId);
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
      name: form.name,
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
    return <section className="panel-card">Kategori formu yukleniyor...</section>;
  }

  if (categoryNotFound) {
    return (
      <section className="panel-card">
        <div className="panel-title-row">
          <h3>Kategori Bulunamadi</h3>
          <button
            className="tiny secondary"
            type="button"
            onClick={() => navigate('/dashboard/categories')}
          >
            Kategori Listesi
          </button>
        </div>
        {message ? <p className="message">{message}</p> : null}
      </section>
    );
  }

  return (
    <section className="panel-card">
      <div className="panel-title-row">
        <h3>{editingCategoryId ? 'Kategori Duzenle' : 'Kategori Ekle'}</h3>
        <button
          className="tiny secondary"
          type="button"
          onClick={() => navigate('/dashboard/categories')}
        >
          Kategori Listesi
        </button>
      </div>

      <form className="grid-form wide-form" onSubmit={handleSubmit}>
        <label>
          Kategori Adi
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>

        <label>
          Durum
          <select
            value={form.isActive ? '1' : '0'}
            onChange={(event) =>
              setForm({
                ...form,
                isActive: event.target.value === '1',
              })
            }
          >
            <option value="1">Aktif</option>
            <option value="0">Pasif</option>
          </select>
        </label>

        <label className="field-span-2">
          Aciklama
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            rows={3}
          />
        </label>

        <label className="field-span-2">
          Kategori Gorsel URL
          <input
            value={form.imageUrl}
            onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
            placeholder="https://..."
          />
        </label>

        <label>
          Gosterim Sirasi
          <input
            type="number"
            min="0"
            value={form.displayOrder}
            onChange={(event) => setForm({ ...form, displayOrder: event.target.value })}
          />
        </label>

        <label>
          SEO Baslik
          <input
            value={form.seoTitle}
            onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
          />
        </label>

        <label className="field-span-2">
          SEO Aciklama
          <input
            value={form.seoDescription}
            onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
          />
        </label>

        <label className="field-span-2">
          SEO Anahtar Kelimeler (virgulle)
          <input
            value={form.seoKeywordsText}
            onChange={(event) => setForm({ ...form, seoKeywordsText: event.target.value })}
            placeholder="zeytin, naturel, soguk sikim"
          />
        </label>

        <div className="form-actions field-span-2">
          <button type="submit" disabled={saving}>
            {saving ? 'Kaydediliyor...' : editingCategoryId ? 'Kategori Guncelle' : 'Kategori Ekle'}
          </button>
          <button
            className="tiny secondary"
            type="button"
            onClick={() => navigate('/dashboard/categories')}
          >
            Vazgec
          </button>
        </div>
      </form>

      {message ? <p className="message">{message}</p> : null}
    </section>
  );
}

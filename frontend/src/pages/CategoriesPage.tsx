import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Category } from '../types/api';

export function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    api
      .get<Category[]>('/catalog/categories')
      .then((response) => {
        if (!mounted) {
          return;
        }

        setCategories(response.data);
      })
      .catch(() => {
        if (mounted) {
          setMessage('Kategoriler yuklenemedi.');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <section className="panel-card">Kategoriler yukleniyor...</section>;
  }

  return (
    <section className="panel-card">
      <div className="panel-title-row">
        <h3>Kategoriler</h3>
        <button
          className="tiny"
          type="button"
          onClick={() => navigate('/dashboard/categories/new')}
        >
          Kategori Ekle
        </button>
      </div>

      {message ? <p className="message">{message}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ad</th>
              <th>Slug</th>
              <th>Sira</th>
              <th>Durum</th>
              <th>SEO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.slug}</td>
                <td>{category.displayOrder}</td>
                <td>{category.isActive ? 'Aktif' : 'Pasif'}</td>
                <td>{category.seoKeywords.join(', ')}</td>
                <td>
                  <button
                    className="tiny secondary"
                    type="button"
                    onClick={() => navigate(`/dashboard/categories/${category.id}/edit`)}
                  >
                    Duzenle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
